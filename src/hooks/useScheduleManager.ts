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
      const { data, error } = await externalClient
        .from('schedules')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const scheduleMap: Record<string, DaySchedule> = {};
      
      // Load master focus areas ONLY from master record
      const masterRecord = data?.find(d => d.day_of_week === '_focus_areas_');
      console.log('🎯 Master record found:', masterRecord);
      
      const masterFocusAreas = masterRecord?.tags || [...DEFAULT_FOCUS_AREAS];
      console.log('✅ Focus areas loaded from master record:', masterFocusAreas);
      
      // Create master record if it doesn't exist
      if (!masterRecord) {
        console.log('📝 Creating master record with defaults');
        const { error: insertError } = await dualInsert('schedules', {
          day_of_week: '_focus_areas_',
          work_mode: '_master_',
          tags: DEFAULT_FOCUS_AREAS,
          description: 'Master focus areas list',
          user_id: user.id,
        });
        
        if (insertError) {
          console.error('❌ Error creating master record:', insertError);
        } else {
          console.log('✅ Master record created successfully');
        }
      }
      
      // Load daily schedules - focus areas stored in description field
      data?.forEach((schedule) => {
        if (schedule.day_of_week === '_focus_areas_') return; // Skip master record
        
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
      setFocusAreas(masterFocusAreas);
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
    
    // Save immediately to master record
    try {
      console.log('Adding focus area:', trimmed);
      const { data: existing, error: selectError } = await externalClient
        .from('schedules')
        .select('id')
        .eq('day_of_week', '_focus_areas_')
        .maybeSingle();

      console.log('Existing master record:', existing);
      
      if (selectError) {
        console.error('Error checking master record:', selectError);
        throw selectError;
      }

      if (existing) {
        console.log('Updating existing master record');
        const { error: updateError } = await dualUpdate('schedules', 
          { tags: updatedAreas },
          { column: 'id', value: existing.id }
        );
        
        if (updateError) throw updateError;
      } else {
        console.log('Creating new master record');
        const { error: insertError } = await dualInsert('schedules', {
          day_of_week: '_focus_areas_',
          work_mode: '_master_',
          tags: updatedAreas,
          description: 'Master focus areas list',
          user_id: user.id,
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
    
    // Update master record immediately
    try {
      console.log('Removing focus area:', area);
      const { data: existing, error: selectError } = await externalClient
        .from('schedules')
        .select('id')
        .eq('day_of_week', '_focus_areas_')
        .maybeSingle();

      if (selectError) {
        console.error('Error checking master record:', selectError);
        throw selectError;
      }

      if (existing) {
        console.log('Updating master record after removal');
        const { error: updateError } = await dualUpdate('schedules',
          { tags: updatedAreas },
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
      // Delete all day schedules (keep master focus areas record)
      await dualDeleteWhere('schedules', [
        { column: 'day_of_week', value: '_focus_areas_', operator: 'neq' }
      ]);
      
      const insertData = Object.values(schedules).map((schedule) => ({
        day_of_week: schedule.day_of_week,
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
