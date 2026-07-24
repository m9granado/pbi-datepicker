// DateX - Date Helper Utilities
// Centralized date formatting and manipulation functions

/**
 * Convert a Date to ISO string format suitable for date inputs (YYYY-MM-DD)
 */
export const toISOInput = (d?: Date): string => {
  if (!d) return "";
  return d.toISOString().split('T')[0];
};

/**
 * Format a date as D/M/YYYY (e.g., 15/2/2024)
 */
export const formatDateDMY = (d: Date): string => {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

/**
 * Format a date with locale support
 */
export const formatDate = (
  d: Date, 
  locale: string = 'es-CL', 
  options?: Intl.DateTimeFormatOptions
): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  };
  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(d);
};

/**
 * Format month and year (e.g., "Jan-24")
 */
export const formatMonthYear = (date: Date, locale: string = 'es-CL'): string => {
  const month = new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);
  const year = date.getFullYear().toString().slice(-2);
  return `${month}-${year}`;
};

/**
 * Get the display date for the "to" field.
 * If the date is today or in the future, returns today.
 * This is useful for preset filters that include "today".
 */
export const getDisplayToDate = (to?: Date, presetId?: string): Date | undefined => {
  if (!to) return to;
  if (presetId) return to;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const toDate = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  if (toDate >= today) return today;
  return to;
};

/**
 * Get start of day (midnight)
 */
export const toStartOfDay = (d: Date): Date => {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
};

/**
 * Get end of day (23:59:59.999)
 */
export const toEndOfDay = (d: Date): Date => {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
};

/**
 * Add days to a date
 */
export const addDays = (d: Date, n: number): Date => {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
};

/**
 * Get start of week (assuming Sunday is first day)
 * TODO: Make configurable for different locales (Monday start)
 */
export const toStartOfWeek = (d: Date): Date => {
  const day = d.getDay();
  const diff = d.getDate() - day;
  return toStartOfDay(new Date(new Date(d).setDate(diff)));
};

/**
 * Check if a date range represents a single complete month
 */
export const isSingleCompleteMonth = (from?: Date, to?: Date): boolean => {
  if (!from || !to) return false;
  
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  // Must be same month and year
  if (fromDate.getMonth() !== toDate.getMonth() || 
      fromDate.getFullYear() !== toDate.getFullYear()) {
    return false;
  }
  
  // Must span complete month (1st to last day)
  const firstOfMonth = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const lastOfMonth = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
  
  return fromDate.getDate() === firstOfMonth.getDate() && 
         toDate.getDate() === lastOfMonth.getDate();
};

/**
 * Get last day of month
 */
export const getLastDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Count days between two dates (inclusive)
 */
export const countDaysBetween = (start: Date, end: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((end.getTime() - start.getTime()) / oneDay)) + 1;
};

/**
 * Generate array of available months for selection
 * @param monthsBack Number of months to generate going back from today
 * @param monthsForward Number of months to generate going forward from today
 */
export const generateAvailableMonths = (
  monthsBack: number = 24,
  monthsForward: number = 0,
  locale: string = 'es-CL'
): { value: string; label: string }[] => {
  const months: { value: string; label: string }[] = [];
  const today = new Date();
  
  // Generate months going back
  for (let i = 0; i >= -monthsBack; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const label = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
    months.push({ value, label });
  }
  
  // Generate months going forward (if needed)
  for (let i = 1; i <= monthsForward; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const label = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
    months.push({ value, label });
  }
  
  return months;
};

/**
 * Parse year-month string (YYYY-MM) to Date object
 */
export const parseYearMonth = (yearMonth: string): { year: number; month: number } => {
  const [year, month] = yearMonth.split('-').map(Number);
  return { year, month };
};

/**
 * Get first and last day of a month from year-month string
 */
export const getMonthDateRange = (yearMonth: string): { from: Date; to: Date } => {
  const { year, month } = parseYearMonth(yearMonth);
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59, 999);
  return { from, to };
};

/**
 * Swap two dates if from > to
 * Returns the corrected date range
 */
export const ensureValidDateRange = (
  from?: Date, 
  to?: Date
): { from?: Date; to?: Date; wasSwapped: boolean } => {
  if (!from || !to) return { from, to, wasSwapped: false };
  
  if (from > to) {
    return { from: to, to: from, wasSwapped: true };
  }
  
  return { from, to, wasSwapped: false };
};
