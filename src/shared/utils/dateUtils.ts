/**
 * Utility to safely parse UTC date strings from the API, adding 'Z' suffix if missing,
 * avoiding timezone offset misinterpretations where ISO strings without 'Z' are parsed as local time.
 */
export const parseUtcDate = (dateInput?: string | Date | null): Date | null => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  let str = String(dateInput).trim();
  if (!str) return null;

  // If string is an ISO date without timezone indicator (no 'Z' and no offset like '+00:00' or '-05:00')
  if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    str += 'Z';
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Formats a UTC date string to local time (HH:mm format)
 */
export const formatTime = (dateInput?: string | Date | null, fallback = '--'): string => {
  const date = parseUtcDate(dateInput);
  if (!date) return fallback;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formats a UTC date string to short local date & time
 */
export const formatDateTime = (dateInput?: string | Date | null, fallback = '--'): string => {
  const date = parseUtcDate(dateInput);
  if (!date) return fallback;
  return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
};

/**
 * Calculates human-readable duration (e.g., "45 min" or "2h 15m") between entry date and now/exit.
 */
export const calculateDuration = (entryDateInput?: string | Date | null, exitDateInput?: string | Date | null): string => {
  const entryDate = parseUtcDate(entryDateInput);
  if (!entryDate) return '0 min';

  const exitDate = parseUtcDate(exitDateInput) || new Date();
  const diffMs = Math.max(0, exitDate.getTime() - entryDate.getTime());
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
};
