// Dual-write utilities for syncing data between external and Cloud databases
import { supabase } from './client'; // Lovable Cloud
import { externalClient } from './externalClient'; // External shared DB

// Known columns for each table in the EXTERNAL database
// When external DB is missing columns, we strip them before writing
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

// Strip unknown columns for external DB to prevent schema mismatch errors
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

// Generic dual-write insert - Cloud first (primary), External second (best-effort)
export async function dualInsert(
  table: string,
  data: any | any[]
) {
  const dataArray = Array.isArray(data) ? data : [data];
  
  try {
    // Write to Cloud DB (primary - has latest schema)
    const { data: cloudData, error: cloudError } = await (supabase as any)
      .from(table)
      .insert(dataArray)
      .select();
    
    if (cloudError) {
      console.error(`Cloud DB insert error (${table}):`, cloudError);
      throw cloudError;
    }
    
    // Write to external DB (secondary, best-effort with column stripping)
    try {
      const strippedData = dataArray.map(item => stripUnknownColumns(table, item));
      await (externalClient as any).from(table).insert(strippedData);
    } catch (externalError) {
      console.warn(`External DB insert warning (${table}):`, externalError);
      // Don't throw - External is secondary
    }
    
    return { data: cloudData, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Generic dual-write update - Cloud first (primary), External second (best-effort)
export async function dualUpdate(
  table: string,
  updates: any,
  match: { column: string; value: any }
) {
  try {
    // Update Cloud DB (primary - has latest schema)
    const { data: cloudData, error: cloudError } = await (supabase as any)
      .from(table)
      .update(updates)
      .eq(match.column, match.value)
      .select();
    
    if (cloudError) {
      console.error(`Cloud DB update error (${table}):`, cloudError);
      throw cloudError;
    }
    
    // Update external DB (secondary, best-effort with column stripping)
    try {
      const strippedUpdates = stripUnknownColumns(table, updates);
      await (externalClient as any)
        .from(table)
        .update(strippedUpdates)
        .eq(match.column, match.value);
    } catch (externalError) {
      console.warn(`External DB update warning (${table}):`, externalError);
    }
    
    return { data: cloudData, error: null };
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
    // Delete from Cloud DB (primary)
    const { error: cloudError } = await (supabase as any)
      .from(table)
      .delete()
      .eq(match.column, match.value);
    
    if (cloudError) {
      console.error(`Cloud DB delete error (${table}):`, cloudError);
      throw cloudError;
    }
    
    // Delete from external DB (secondary, best-effort)
    try {
      await (externalClient as any)
        .from(table)
        .delete()
        .eq(match.column, match.value);
    } catch (externalError) {
      console.warn(`External DB delete warning (${table}):`, externalError);
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
    // Build query for Cloud DB (primary)
    let cloudQuery = (supabase as any).from(table).delete();
    conditions.forEach(({ column, value, operator = 'eq' }) => {
      if (operator === 'neq') {
        cloudQuery = cloudQuery.neq(column, value);
      } else {
        cloudQuery = cloudQuery.eq(column, value);
      }
    });
    
    const { error: cloudError } = await cloudQuery;
    if (cloudError) {
      console.error(`Cloud DB delete error (${table}):`, cloudError);
      throw cloudError;
    }
    
    // Build query for external DB (best-effort)
    try {
      let externalQuery = (externalClient as any).from(table).delete();
      conditions.forEach(({ column, value, operator = 'eq' }) => {
        if (operator === 'neq') {
          externalQuery = externalQuery.neq(column, value);
        } else {
          externalQuery = externalQuery.eq(column, value);
        }
      });
      await externalQuery;
    } catch (externalError) {
      console.warn(`External DB delete warning (${table}):`, externalError);
    }
    
    return { error: null };
  } catch (error) {
    return { error };
  }
}
