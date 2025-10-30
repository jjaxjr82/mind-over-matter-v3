// Dual-write utilities for syncing data between external and Cloud databases
import { supabase } from './client'; // Lovable Cloud
import { externalClient } from './externalClient'; // External shared DB

// Generic dual-write insert
export async function dualInsert(
  table: string,
  data: any | any[]
) {
  const dataArray = Array.isArray(data) ? data : [data];
  
  try {
    // Write to external DB (primary)
    const { data: externalData, error: externalError } = await (externalClient as any)
      .from(table)
      .insert(dataArray)
      .select();
    
    if (externalError) {
      console.error(`External DB insert error (${table}):`, externalError);
      throw externalError;
    }
    
    // Write to Cloud DB (secondary, best-effort)
    try {
      await (supabase as any).from(table).insert(dataArray);
    } catch (cloudError) {
      console.warn(`Cloud DB insert warning (${table}):`, cloudError);
      // Don't throw - Cloud is secondary
    }
    
    return { data: externalData, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Generic dual-write update
export async function dualUpdate(
  table: string,
  updates: any,
  match: { column: string; value: any }
) {
  try {
    // Update external DB (primary)
    const { data: externalData, error: externalError } = await (externalClient as any)
      .from(table)
      .update(updates)
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
    // Build query for external DB
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
