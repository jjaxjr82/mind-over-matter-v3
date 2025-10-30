import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { externalClient } from '@/integrations/supabase/externalClient';
import { dualInsert, dualUpdate, dualDeleteWhere } from '@/integrations/supabase/dualWrite';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const WORK_MODES = ['WFH', 'In Office', 'Off'] as const;
export const ENERGY_LEVELS = ['High', 'Medium', 'Low', 'Recovery'] as const;
export const DEFAULT_FOCUS_AREAS: string[] = [];

export interface DaySchedule {
  id?: string;
  day_of_week: string;
  work_mode: string;
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
      // Try to load from external DB first, fall back to default if table doesn't exist
      let loadedFocusAreas = [...DEFAULT_FOCUS_AREAS];
      
      try {
        const { data: settingsData, error: settingsError } = await externalClient
          .from('user_settings')
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_key', 'focus_areas')
          .maybeSingle();

        if (!settingsError && settingsData) {
          const settingsValue = settingsData.setting_value as { areas?: string[] } | null;
          loadedFocusAreas = settingsValue?.areas || [...DEFAULT_FOCUS_AREAS];
        }
      } catch (error) {
        console.log('Could not load user settings, using defaults');
      }
      
      console.log('✅ Focus areas loaded:', loadedFocusAreas);
      setFocusAreas(loadedFocusAreas);

      // Load daily schedules
      const { data, error } = await externalClient
        .from('schedules')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const scheduleMap: Record<string, DaySchedule> = {};
      
      // Load daily schedules
      data?.forEach((schedule) => {
        const tags = schedule.tags || [];
        const workMode = tags.find((t: string) => WORK_MODES.includes(t as any)) || 'WFH';
        
        // Focus areas are stored in separate tags for each day
        const focusAreasForDay = tags.filter((t: string) => 
          !WORK_MODES.includes(t as any) && !ENERGY_LEVELS.includes(t as any)
        );
        
        scheduleMap[schedule.day_of_week] = {
          id: schedule.id,
          day_of_week: schedule.day_of_week,
          work_mode: workMode,
          focus_areas: focusAreasForDay,
        };
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
      
      // Check if setting exists
      const { data: existing } = await externalClient
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('setting_key', 'focus_areas')
        .maybeSingle();
      
      if (existing) {
        // Update existing
        const { error: updateError } = await dualUpdate('user_settings',
          { setting_value: { areas: updatedAreas } },
          { column: 'id', value: existing.id }
        );
        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await dualInsert('user_settings', {
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
    
    // Update user_settings table
    try {
      console.log('Removing focus area:', area);
      
      const { data: existing } = await externalClient
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('setting_key', 'focus_areas')
        .maybeSingle();
      
      if (existing) {
        const { error: updateError } = await dualUpdate('user_settings',
          { setting_value: { areas: updatedAreas } },
          { column: 'id', value: existing.id }
        );
        
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
      // Delete all existing schedules for this user
      await dualDeleteWhere('schedules', [
        { column: 'user_id', value: user.id, operator: 'eq' }
      ]);
      
      // Insert all schedules with valid data only
      const insertData = Object.values(schedules).map((schedule) => ({
        day_of_week: schedule.day_of_week,
        work_mode: schedule.work_mode,
        tags: [schedule.work_mode, ...schedule.focus_areas],
        description: '',
        user_id: user.id,
      }));

      const { error } = await dualInsert('schedules', insertData);

      if (error) {
        console.error('Save error:', error);
        throw error;
      }

      toast.success('Schedule saved!');
    } catch (error: any) {
      console.error('Error saving schedules:', error);
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
