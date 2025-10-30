import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { externalClient } from '@/integrations/supabase/externalClient';
import { supabase } from '@/integrations/supabase/client';
import { dualInsert, dualUpdate, dualDeleteWhere } from '@/integrations/supabase/dualWrite';
import { 
  transformScheduleForExternalDB, 
  transformScheduleForCloudDB,
  parseScheduleFromExternalDB,
  parseScheduleFromCloudDB,
  WorkMode
} from '@/utils/databaseSchemaAdapters';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const WORK_MODES = ['WFH', 'In Office', 'Off'] as const;
export const ENERGY_LEVELS = ['High', 'Medium', 'Low', 'Recovery'] as const;
export const DEFAULT_FOCUS_AREAS: string[] = [];

export interface DaySchedule {
  id?: string;
  day_of_week: string;
  work_mode: WorkMode;
  focus_areas: string[];
}

export const useScheduleManager = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<Record<string, DaySchedule>>({});
  const [focusAreas, setFocusAreas] = useState<string[]>(DEFAULT_FOCUS_AREAS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await externalClient.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();

    const { data: { subscription } } = externalClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadSchedules();
    }
  }, [user]);

  const loadSchedules = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load focus areas from user_settings table
      let loadedFocusAreas = [...DEFAULT_FOCUS_AREAS];
      
      try {
        const { data: settingsData, error: settingsError } = await (externalClient as any)
          .from('user_preferences')
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_key', 'focus_areas')
          .maybeSingle();

        if (!settingsError && settingsData) {
          const settingsValue = settingsData.setting_value as { areas?: string[] } | null;
          loadedFocusAreas = settingsValue?.areas || [...DEFAULT_FOCUS_AREAS];
        }
      } catch (error) {
        console.log('Could not load user preferences, using defaults');
      }
      
      console.log('✅ Focus areas loaded:', loadedFocusAreas);
      setFocusAreas(loadedFocusAreas);

      // Load daily schedules from external DB (PRIMARY SOURCE)
      console.log('📥 Loading schedules from external DB...');
      
      const { data, error } = await externalClient
        .from('schedules')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Failed to load schedules:', error);
        throw error;
      }

      console.log('✅ Loaded', data?.length || 0, 'schedules from external DB');

      const scheduleMap: Record<string, DaySchedule> = {};
      
      // Detect schema format by checking first row
      let useNewSchema = false;
      if (data && data.length > 0) {
        const firstRow = data[0];
        useNewSchema = 'work_mode' in firstRow && firstRow.work_mode !== undefined;
        console.log('🔍 Schema detected:', useNewSchema ? 'NEW (work_mode column)' : 'OLD (work_mode in tags)');
      }
      
      // Parse schedules using appropriate adapter based on detected schema
      data?.forEach((schedule: any) => {
        const parsed = useNewSchema 
          ? parseScheduleFromExternalDB(schedule)
          : parseScheduleFromCloudDB(schedule);
        
        scheduleMap[schedule.day_of_week] = {
          id: schedule.id,
          ...parsed,
        };
        
        console.log(`📋 Parsed ${schedule.day_of_week}:`, {
          work_mode: parsed.work_mode,
          focus_areas: parsed.focus_areas.length
        });
      });

      // Initialize empty schedules for days without data
      DAYS.forEach((day) => {
        if (!scheduleMap[day]) {
          scheduleMap[day] = {
            day_of_week: day,
            work_mode: 'WFH',
            focus_areas: [],
          };
        }
      });

      setSchedules(scheduleMap);
    } catch (error: any) {
      console.error('Error loading schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSchedule = (day: string, field: keyof DaySchedule, value: any) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const toggleFocusArea = (day: string, area: string) => {
    setSchedules((prev) => {
      const current = prev[day].focus_areas;
      const updated = current.includes(area)
        ? current.filter((a) => a !== area)
        : [...current, area];
      return {
        ...prev,
        [day]: { ...prev[day], focus_areas: updated },
      };
    });
  };

  const addFocusArea = async (area: string) => {
    const trimmed = area.trim();
    if (!trimmed || focusAreas.includes(trimmed)) {
      toast.error(trimmed ? 'Focus area already exists' : 'Focus area cannot be empty');
      return;
    }
    
    const updatedAreas = [...focusAreas, trimmed];
    setFocusAreas(updatedAreas);
    
    // Save to user_settings table (upsert: update if exists, insert if not)
    try {
      console.log('Adding focus area:', trimmed);
      
      // Check if preference exists
      const { data: existing } = await (externalClient as any)
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .eq('setting_key', 'focus_areas')
        .maybeSingle();
      
      if (existing) {
        // Update existing
        const { error: updateError } = await (externalClient as any)
          .from('user_preferences')
          .update({ setting_value: { areas: updatedAreas } })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await (externalClient as any)
          .from('user_preferences')
          .insert({
            user_id: user.id,
            setting_key: 'focus_areas',
            setting_value: { areas: updatedAreas },
          });
        if (insertError) throw insertError;
      }
      
      console.log('Focus area saved successfully:', trimmed);
      toast.success(`Added "${trimmed}"`);
    } catch (error: any) {
      console.error('Error saving focus area:', error);
      toast.error(`Failed to save: ${error.message}`);
      setFocusAreas(focusAreas); // Revert on error
    }
  };

  const removeFocusArea = async (area: string) => {
    if (DEFAULT_FOCUS_AREAS.includes(area)) {
      toast.error('Cannot remove default focus areas');
      return;
    }
    
    const updatedAreas = focusAreas.filter((a) => a !== area);
    setFocusAreas(updatedAreas);
    
    // Remove from all schedules
    setSchedules((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((day) => {
        updated[day].focus_areas = updated[day].focus_areas.filter((a) => a !== area);
      });
      return updated;
    });
    
    // Update user_preferences table
    try {
      console.log('Removing focus area:', area);
      
      const { data: existing } = await (externalClient as any)
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .eq('setting_key', 'focus_areas')
        .maybeSingle();
      
      if (existing) {
        const { error: updateError } = await (externalClient as any)
          .from('user_preferences')
          .update({ setting_value: { areas: updatedAreas } })
          .eq('id', existing.id);
        
        if (updateError) throw updateError;
      }
      
      console.log('Focus area removed successfully:', area);
      toast.success(`Removed "${area}"`);
    } catch (error: any) {
      console.error('Error removing focus area:', error);
      toast.error(`Failed to remove: ${error.message}`);
    }
  };

  const saveSchedules = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      console.log('💾 Starting schedule save...');
      
      // ============================================================
      // PHASE 1: Save to External Database (PRIMARY)
      // Schema: work_mode as separate column, tags for focus areas only
      // ============================================================
      
      // 1a. Delete existing schedules from external DB
      const { error: extDeleteError } = await externalClient
        .from('schedules')
        .delete()
        .eq('user_id', user.id);
      
      if (extDeleteError) {
        console.error('❌ External DB delete failed:', extDeleteError);
        throw new Error(`External DB delete failed: ${extDeleteError.message}`);
      }
      
      console.log('✅ External DB: Old schedules deleted');
      
      // 1b. Transform schedules for external DB format
      const externalData = Object.values(schedules).map((schedule) => 
        transformScheduleForExternalDB(schedule, user.id)
      );
      
      console.log('📦 External DB data prepared:', externalData.length, 'schedules');
      console.log('🔍 Sample external data:', externalData[0]);
      
      // 1c. Insert new schedules into external DB
      const { error: extInsertError } = await externalClient
        .from('schedules')
        .insert(externalData);
      
      if (extInsertError) {
        console.error('❌ External DB insert failed:', extInsertError);
        throw new Error(`External DB insert failed: ${extInsertError.message}`);
      }
      
      console.log('✅ External DB: Schedules saved successfully');
      
      // ============================================================
      // PHASE 2: Save to Lovable Cloud Database (SECONDARY, BEST-EFFORT)
      // Schema: NO work_mode column, everything in tags array
      // ============================================================
      
      try {
        // 2a. Delete existing schedules from Cloud DB
        const { error: cloudDeleteError } = await supabase
          .from('schedules')
          .delete()
          .eq('user_id', user.id);
        
        if (cloudDeleteError) {
          console.warn('⚠️ Cloud DB delete warning:', cloudDeleteError.message);
          // Don't throw - best effort only
        } else {
          console.log('✅ Cloud DB: Old schedules deleted');
        }
        
        // 2b. Transform schedules for Cloud DB format
        const cloudData = Object.values(schedules).map((schedule) => 
          transformScheduleForCloudDB(schedule, user.id)
        );
        
        console.log('📦 Cloud DB data prepared:', cloudData.length, 'schedules');
        console.log('🔍 Sample cloud data:', cloudData[0]);
        
        // 2c. Insert new schedules into Cloud DB
        const { error: cloudInsertError } = await supabase
          .from('schedules')
          .insert(cloudData);
        
        if (cloudInsertError) {
          console.warn('⚠️ Cloud DB insert warning:', cloudInsertError.message);
          // Don't throw - best effort only
        } else {
          console.log('✅ Cloud DB: Schedules synced successfully');
        }
      } catch (cloudError: any) {
        // Cloud DB sync is best-effort, log but don't fail
        console.warn('⚠️ Cloud DB sync failed (non-critical):', cloudError.message);
      }
      
      console.log('✅ All operations complete');
      toast.success('Schedule saved!');
      
    } catch (error: any) {
      console.error('❌ Critical error saving schedules:', error);
      toast.error(`Failed to save schedules: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    DAYS,
    WORK_MODES,
    ENERGY_LEVELS,
    focusAreas,
    schedules,
    isLoading,
    isSaving,
    updateSchedule,
    toggleFocusArea,
    addFocusArea,
    removeFocusArea,
    saveSchedules,
    navigate,
  };
};
