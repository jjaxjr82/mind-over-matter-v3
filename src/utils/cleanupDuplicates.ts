import { externalClient } from '@/integrations/supabase/externalClient';
import { supabase } from '@/integrations/supabase/client';

interface ScheduleRecord {
  id: string;
  user_id: string;
  day_of_week: string;
  created_at: string;
  updated_at: string;
}

export async function cleanupDuplicateChallenges(userId: string) {
  try {
    // Fetch all challenges for the user
    const { data: challenges, error } = await externalClient
      .from('challenges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!challenges || challenges.length === 0) return { success: true, removed: 0 };

    // Group by name, keep the oldest, delete the rest
    const seenNames = new Set<string>();
    const toDelete: string[] = [];

    challenges.forEach(challenge => {
      if (seenNames.has(challenge.name)) {
        toDelete.push(challenge.id);
      } else {
        seenNames.add(challenge.name);
      }
    });

    // Delete duplicates
    if (toDelete.length > 0) {
      const { error: deleteError } = await externalClient
        .from('challenges')
        .delete()
        .in('id', toDelete);

      if (deleteError) throw deleteError;
    }

    return { success: true, removed: toDelete.length };
  } catch (error) {
    console.error('Error cleaning up challenges:', error);
    return { success: false, error };
  }
}

export async function cleanupDuplicateWisdom(userId: string) {
  try {
    // Fetch all wisdom entries for the user
    const { data: wisdom, error } = await externalClient
      .from('wisdom_library')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!wisdom || wisdom.length === 0) return { success: true, removed: 0 };

    // Group by name, keep the oldest, delete the rest
    const seenNames = new Set<string>();
    const toDelete: string[] = [];

    wisdom.forEach(entry => {
      if (seenNames.has(entry.name)) {
        toDelete.push(entry.id);
      } else {
        seenNames.add(entry.name);
      }
    });

    // Delete duplicates
    if (toDelete.length > 0) {
      const { error: deleteError } = await externalClient
        .from('wisdom_library')
        .delete()
        .in('id', toDelete);

      if (deleteError) throw deleteError;
    }

    return { success: true, removed: toDelete.length };
  } catch (error) {
    console.error('Error cleaning up wisdom:', error);
    return { success: false, error };
  }
}

/**
 * Find duplicate schedules in a database
 * Groups by (user_id, day_of_week) and finds entries with multiple records
 */
async function findDuplicateSchedules(client: typeof externalClient, userId?: string) {
  let query = client
    .from('schedules')
    .select('id, user_id, day_of_week, created_at, updated_at')
    .order('user_id')
    .order('day_of_week')
    .order('updated_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }

  // Group by user_id + day_of_week
  const groups = new Map<string, ScheduleRecord[]>();
  
  data?.forEach((record: any) => {
    const key = `${record.user_id}:${record.day_of_week}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  });

  // Find groups with duplicates
  const duplicates: Array<{
    user_id: string;
    day_of_week: string;
    records: ScheduleRecord[];
    keep: ScheduleRecord;
    remove: ScheduleRecord[];
  }> = [];

  groups.forEach((records, key) => {
    if (records.length > 1) {
      const [user_id, day_of_week] = key.split(':');
      // Keep most recently updated
      const keep = records[0];
      const remove = records.slice(1);
      
      duplicates.push({
        user_id,
        day_of_week,
        records,
        keep,
        remove,
      });
    }
  });

  return duplicates;
}

/**
 * Remove duplicate schedules from external database
 * Keeps the most recently updated record for each (user_id, day_of_week) pair
 */
export async function cleanupExternalDuplicateSchedules(userId?: string) {
  console.log('🔍 Scanning external DB for duplicate schedules...');
  
  const duplicates = await findDuplicateSchedules(externalClient, userId);
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate schedules found in external DB');
    return { success: true, removed: 0 };
  }

  console.log(`⚠️ Found ${duplicates.length} duplicate schedule groups in external DB`);
  
  let removed = 0;
  const errors: any[] = [];

  for (const dup of duplicates) {
    console.log(`📋 ${dup.user_id} - ${dup.day_of_week}: Keeping newest, removing ${dup.remove.length} old records`);
    
    const idsToRemove = dup.remove.map(r => r.id);
    
    const { error } = await externalClient
      .from('schedules')
      .delete()
      .in('id', idsToRemove);
    
    if (error) {
      console.error(`❌ Failed to remove duplicates:`, error);
      errors.push(error);
    } else {
      removed += idsToRemove.length;
    }
  }

  console.log(`✅ Cleanup complete: ${removed} records removed, ${errors.length} errors`);
  return { success: errors.length === 0, removed, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Remove duplicate schedules from Cloud database
 * Keeps the most recently updated record for each (user_id, day_of_week) pair
 */
export async function cleanupCloudDuplicateSchedules(userId?: string) {
  console.log('🔍 Scanning Cloud DB for duplicate schedules...');
  
  const duplicates = await findDuplicateSchedules(supabase, userId);
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate schedules found in Cloud DB');
    return { success: true, removed: 0 };
  }

  console.log(`⚠️ Found ${duplicates.length} duplicate schedule groups in Cloud DB`);
  
  let removed = 0;
  const errors: any[] = [];

  for (const dup of duplicates) {
    console.log(`📋 ${dup.user_id} - ${dup.day_of_week}: Keeping newest, removing ${dup.remove.length} old records`);
    
    const idsToRemove = dup.remove.map(r => r.id);
    
    const { error } = await supabase
      .from('schedules')
      .delete()
      .in('id', idsToRemove);
    
    if (error) {
      console.error(`❌ Failed to remove duplicates:`, error);
      errors.push(error);
    } else {
      removed += idsToRemove.length;
    }
  }

  console.log(`✅ Cleanup complete: ${removed} records removed, ${errors.length} errors`);
  return { success: errors.length === 0, removed, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Clean up duplicate schedules in both databases
 */
export async function cleanupAllDuplicateSchedules(userId?: string) {
  console.log('🧹 Starting schedule cleanup in all databases...');
  
  const externalResult = await cleanupExternalDuplicateSchedules(userId);
  const cloudResult = await cleanupCloudDuplicateSchedules(userId);
  
  console.log('✅ All schedule cleanup operations complete');
  console.log(`   External DB: ${externalResult.removed} removed`);
  console.log(`   Cloud DB: ${cloudResult.removed} removed`);
  
  return {
    success: externalResult.success && cloudResult.success,
    external: externalResult,
    cloud: cloudResult,
  };
}
