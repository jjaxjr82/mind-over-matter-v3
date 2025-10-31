import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

const TIMEZONE = 'America/New_York';

/**
 * Get the current date/time in Eastern Time
 */
export const getEasternDate = (): Date => {
  return toZonedTime(new Date(), TIMEZONE);
};

/**
 * Convert a Date object to YYYY-MM-DD string in Eastern Time
 */
export const formatDateForDB = (date: Date): string => {
  const etDate = toZonedTime(date, TIMEZONE);
  return format(etDate, 'yyyy-MM-dd');
};

/**
 * Parse a YYYY-MM-DD string from the database as Eastern Time midnight
 */
export const parseDateFromDB = (dateStr: string): Date => {
  // Create a date at midnight ET, then convert back to user's local time
  const [year, month, day] = dateStr.split('-').map(Number);
  const etMidnight = new Date(year, month - 1, day, 0, 0, 0);
  return fromZonedTime(etMidnight, TIMEZONE);
};

/**
 * Get week boundaries (Monday start) in Eastern Time
 */
export const getWeekBoundaries = (date: Date) => {
  const etDate = toZonedTime(date, TIMEZONE);
  const weekStart = startOfWeek(etDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(etDate, { weekStartsOn: 1 }); // Sunday
  
  return {
    start: fromZonedTime(weekStart, TIMEZONE),
    end: fromZonedTime(weekEnd, TIMEZONE),
  };
};

/**
 * Get day of week (0=Monday, 6=Sunday) in Eastern Time
 */
export const getEasternDayOfWeek = (date: Date): number => {
  const etDate = toZonedTime(date, TIMEZONE);
  const day = etDate.getDay();
  // Convert Sunday (0) to 6, and shift Monday from 1 to 0
  return day === 0 ? 6 : day - 1;
};

/**
 * Get day name from Eastern Time date
 */
export const getEasternDayName = (date: Date): string => {
  const dayIndex = getEasternDayOfWeek(date);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days[dayIndex];
};

/**
 * Start of week in Eastern Time (Monday)
 */
export const getEasternWeekStart = (date: Date): Date => {
  const etDate = toZonedTime(date, TIMEZONE);
  const weekStart = startOfWeek(etDate, { weekStartsOn: 1 });
  return fromZonedTime(weekStart, TIMEZONE);
};

/**
 * Add days to a date in Eastern Time context
 */
export const addDaysET = (date: Date, days: number): Date => {
  const etDate = toZonedTime(date, TIMEZONE);
  const newDate = addDays(etDate, days);
  return fromZonedTime(newDate, TIMEZONE);
};
