// Dual-write utilities for syncing data between external and Cloud databases
import { supabase } from './client'; // Lovable Cloud
import { externalClient } from './externalClient'; // External shared DB (primary auth)

// Known columns for each table - used for graceful schema mismatch handling
const EXTERNAL_DB_COLUMNS: Record<string, string[]> = {
  daily_logs: [
    'id', 'user_id', 'date', 'situation', 'work_mode', 'energy_level',
    'morning_insight', 'morning_follow_up', 'morning_complete',
    'midday_insight', 'midday_adjustment', 'midday_follow_up', 'midday_complete',
    'evening_insight', 'evening_follow_up', 'evening_complete',
    'win', 'weakness', 'tomorrows_prep', 'completed_action_items',
    'created_at', 'updated_at'
  ],
  schedules: [
    'id', 'user_id', 'day_of_week', 'description', 'tags',
    'created_at', 'updated_at'
  ],
  challenges: [
    'id', 'user_id', 'name', 'description', 'is_active',
    'created_at', 'updated_at'
  ],
  wisdom_library: [
    'id', 'user_id', 'name', 'description', 'tag', 'is_active',
    'created_at', 'updated_at'
  ],
  user_settings: [
    'id', 'user_id', 'setting_key', 'setting_value',
    'created_at', 'updated_at'
  ]
};

// Strip unknown columns for a database to prevent schema mismatch errors
function stripUnknownColumns(table: string, data: any): any {
  const knownColumns = EXTERNAL_DB_COLUMNS[table];
  if (!knownColumns) return data; // Unknown table, pass through
  
  const result: any = {};
  for (const key of Object.keys(data)) {
    if (knownColumns.includes(key)) {
      result[key] = data[key];
    }
  }
  return result;
}

// Generic dual-write insert - External first (has auth session), Cloud second (best-effort)
export async function dualInsert(
  table: string,
  data: any | any[]
) {
  const dataArray = Array.isArray(data) ? data : [data];
  
  try {
    // Write to external DB (primary - has auth session)
    const strippedData = dataArray.map(item => stripUnknownColumns(table, item));
    const { data: externalData, error: externalError } = await (externalClient as any)
      .from(table)
      .insert(strippedData)
      .select();
    
    if (externalError) {
      console.error(`External DB insert error (${table}):`, externalError);
      throw externalError;
    }
    
    // Write to Cloud DB (secondary, best-effort - may fail due to RLS with no auth)
    try {
      await (supabase as any).from(table).insert(dataArray);
    } catch (cloudError) {
      console.warn(`Cloud DB insert warning (${table}):`, cloudError);
      // Don't throw - Cloud is secondary and may not have matching auth session
    }
    
    return { data: externalData, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Generic dual-write update - External first (has auth session), Cloud second (best-effort)
export async function dualUpdate(
  table: string,
  updates: any,
  match: { column: string; value: any }
) {
  try {
    // Update external DB (primary - has auth session)
    const strippedUpdates = stripUnknownColumns(table, updates);
    const { data: externalData, error: externalError } = await (externalClient as any)
      .from(table)
      .update(strippedUpdates)
      .eq(match.column, match.value)
      .select();
    
    if (externalError) {
      console.error(`External DB update error (${table}):`, externalError);
      throw externalError;
    }
    
    // Update Cloud DB (secondary, best-effort)
    try {
      await (supabase as any)
        .from(table)
        .update(updates)
        .eq(match.column, match.value);
    } catch (cloudError) {
      console.warn(`Cloud DB update warning (${table}):`, cloudError);
    }
    
    return { data: externalData, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Generic dual-write delete
export async function dualDelete(
  table: string,
  match: { column: string; value: any }
) {
  try {
    // Delete from external DB (primary)
    const { error: externalError } = await (externalClient as any)
      .from(table)
      .delete()
      .eq(match.column, match.value);
    
    if (externalError) {
      console.error(`External DB delete error (${table}):`, externalError);
      throw externalError;
    }
    
    // Delete from Cloud DB (secondary, best-effort)
    try {
      await (supabase as any)
        .from(table)
        .delete()
        .eq(match.column, match.value);
    } catch (cloudError) {
      console.warn(`Cloud DB delete warning (${table}):`, cloudError);
    }
    
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// Dual-write delete with multiple conditions
export async function dualDeleteWhere(
  table: string,
  conditions: Array<{ column: string; value: any; operator?: string }>
) {
  try {
    // Build query for external DB (primary)
    let externalQuery = (externalClient as any).from(table).delete();
    conditions.forEach(({ column, value, operator = 'eq' }) => {
      if (operator === 'neq') {
        externalQuery = externalQuery.neq(column, value);
      } else {
        externalQuery = externalQuery.eq(column, value);
      }
    });
    
    const { error: externalError } = await externalQuery;
    if (externalError) {
      console.error(`External DB delete error (${table}):`, externalError);
      throw externalError;
    }
    
    // Build query for Cloud DB (best-effort)
    try {
      let cloudQuery = (supabase as any).from(table).delete();
      conditions.forEach(({ column, value, operator = 'eq' }) => {
        if (operator === 'neq') {
          cloudQuery = cloudQuery.neq(column, value);
        } else {
          cloudQuery = cloudQuery.eq(column, value);
        }
      });
      await cloudQuery;
    } catch (cloudError) {
      console.warn(`Cloud DB delete warning (${table}):`, cloudError);
    }
    
    return { error: null };
  } catch (error) {
    return { error };
  }
}
