import { externalClient } from '@/integrations/supabase/externalClient';

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
