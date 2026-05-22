/**
 * Formats a date string or Date object to strictly dd/mm/yyyy
 * using UTC to avoid timezone shifts (BUG-03 fix).
 */
export const formatDateDDMMYYYY = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dan = String(d.getUTCDate()).padStart(2, "0");
  
  return `${dan}/${m}/${y}`;
};

/**
 * Converts a UTC Date or ISO string into YYYY-MM-DD for <input type="date" />
 */
export const toYMD = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dan = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dan}`;
};
