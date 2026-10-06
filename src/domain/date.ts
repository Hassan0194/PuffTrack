/** Local calendar date as YYYY-MM-DD. Not UTC, so the day matches the phone. */
export function todayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidDayKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function dateFromDayKey(dayKey: string): Date | null {
  if (!isValidDayKey(dayKey)) {
    return null;
  }

  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Shifts a local calendar day. Returns null when the key is not a real date. */
export function addCalendarDays(dayKey: string, delta: number): string | null {
  const date = dateFromDayKey(dayKey);
  if (!date || !Number.isInteger(delta)) {
    return null;
  }

  date.setDate(date.getDate() + delta);
  return todayKey(date);
}
