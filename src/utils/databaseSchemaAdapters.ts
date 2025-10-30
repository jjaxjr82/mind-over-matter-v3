/**
 * Database Schema Adapter Utilities
 * 
 * These utilities handle the transformation of schedule data between:
 * 1. Internal application format (used in React state)
 * 2. External Database schema (work_mode as separate column)
 * 3. Lovable Cloud Database schema (work_mode stored in tags array)
 * 
 * This solves the schema mismatch issue where the two databases have
 * fundamentally different structures for storing the same data.
 */

// Work mode options - must match database constraints
export const WORK_MODES = ['WFH', 'In Office', 'Off'] as const;
export type WorkMode = typeof WORK_MODES[number];

/**
 * Internal schedule format used in the application
 */
export interface InternalSchedule {
  id?: string;
  day_of_week: string;
  work_mode: WorkMode;
  focus_areas: string[];
}

/**
 * External database row format (work_mode as column)
 */
export interface ExternalDBSchedule {
  day_of_week: string;
  work_mode: WorkMode;
  tags: string[];
  description: string;
  user_id: string;
}

/**
 * Lovable Cloud database row format (work_mode in tags)
 */
export interface CloudDBSchedule {
  day_of_week: string;
  tags: string[];
  description: string;
  user_id: string;
}

/**
 * Transform internal schedule to External Database format
 * 
 * External DB Schema:
 * - work_mode: separate column with NOT NULL and CHECK constraints
 * - tags: array containing ONLY focus areas (not work_mode)
 * 
 * @param schedule - Internal schedule object
 * @param userId - User ID to attach to the record
 * @returns External DB formatted object
 */
export function transformScheduleForExternalDB(
  schedule: InternalSchedule,
  userId: string
): ExternalDBSchedule {
  return {
    day_of_week: schedule.day_of_week,
    work_mode: schedule.work_mode,
    tags: schedule.focus_areas, // Only focus areas, NOT work_mode
    description: '',
    user_id: userId,
  };
}

/**
 * Transform internal schedule to Lovable Cloud Database format
 * 
 * Cloud DB Schema:
 * - NO work_mode column
 * - tags: array containing work_mode + focus areas combined
 * 
 * @param schedule - Internal schedule object
 * @param userId - User ID to attach to the record
 * @returns Cloud DB formatted object
 */
export function transformScheduleForCloudDB(
  schedule: InternalSchedule,
  userId: string
): CloudDBSchedule {
  return {
    day_of_week: schedule.day_of_week,
    tags: [schedule.work_mode, ...schedule.focus_areas], // Combined
    description: '',
    user_id: userId,
  };
}

/**
 * Parse External Database row to internal format
 * 
 * External DB has work_mode as a separate column,
 * so we extract it directly along with focus areas from tags.
 * 
 * @param dbSchedule - Raw database row from external DB
 * @returns Internal schedule format
 */
export function parseScheduleFromExternalDB(
  dbSchedule: any
): Omit<InternalSchedule, 'id'> {
  return {
    day_of_week: dbSchedule.day_of_week,
    work_mode: dbSchedule.work_mode || 'WFH',
    focus_areas: dbSchedule.tags || [],
  };
}

/**
 * Parse Lovable Cloud Database row to internal format
 * 
 * Cloud DB stores work_mode inside the tags array,
 * so we need to extract it by checking against WORK_MODES.
 * 
 * @param dbSchedule - Raw database row from Cloud DB
 * @returns Internal schedule format
 */
export function parseScheduleFromCloudDB(
  dbSchedule: any
): Omit<InternalSchedule, 'id'> {
  const tags = dbSchedule.tags || [];
  
  // Find work_mode by checking if any tag matches WORK_MODES
  const workMode = tags.find((t: string) => 
    WORK_MODES.includes(t as WorkMode)
  ) as WorkMode || 'WFH';
  
  // Focus areas are all tags that are NOT work modes
  const focusAreas = tags.filter((t: string) => 
    !WORK_MODES.includes(t as WorkMode)
  );
  
  return {
    day_of_week: dbSchedule.day_of_week,
    work_mode: workMode,
    focus_areas: focusAreas,
  };
}
