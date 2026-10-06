import type { PuffPace } from '../domain/budget';
import { countWord, toCountUnit, type UnitInput } from '../domain/consumption';
import { sanitizeCount } from '../domain/count';
import { dateFromDayKey } from '../domain/date';

export function formatGroupedNumber(value: number): string {
  return new Intl.NumberFormat(undefined).format(sanitizeCount(value));
}

export function formatPuffCount(count: number, unit: UnitInput = false): string {
  const safe = sanitizeCount(count);
  return `${formatGroupedNumber(safe)} ${countWord(unit, safe)}`;
}

export function formatPuffsRemaining(remaining: number, unit: UnitInput = false): string {
  const safe = sanitizeCount(remaining);
  return `${safe} ${countWord(unit, safe)} remaining`;
}

export function formatDailyLimit(limit: number): string {
  return `Limit: ${sanitizeCount(limit)}`;
}

export function formatBudgetRatio(consumed: number, limit: number): string {
  return `${sanitizeCount(consumed)} / ${sanitizeCount(limit)}`;
}

export function formatLimitUsed(percent: number): string {
  if (!Number.isFinite(percent) || percent < 0) {
    return '0% of limit used';
  }

  return `${Math.round(percent)}% of limit used`;
}

export function formatHistoryDate(dayKey: string): string {
  const date = dateFromDayKey(dayKey);
  if (!date) {
    return dayKey;
  }

  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
  const month = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date);
  return `${weekday}, ${month} ${date.getDate()}`;
}

export function formatBudgetPercent(percentConsumed: number): string {
  if (!Number.isFinite(percentConsumed) || percentConsumed < 0) {
    return '0% of daily budget';
  }

  return `${Math.round(percentConsumed)}% of daily budget`;
}

export function formatBudgetPace(pace: PuffPace, unit: UnitInput = false): string | null {
  if (pace.kind === 'hourly') {
    const shown = roundToTenth(pace.perHour);
    const word = countWord(unit, shown);
    return `~${formatTenth(shown)} ${word}/hour until midnight`;
  }

  if (pace.kind === 'soon') {
    const word = countWord(unit, pace.remaining);
    if (pace.minutes <= 1) {
      return `~${pace.remaining} ${word} in the next minute`;
    }

    return `~${pace.remaining} ${word} in the next ${pace.minutes} min`;
  }

  if (pace.kind === 'closing') {
    return 'Under a minute until midnight';
  }

  return null;
}

function roundToTenth(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 10) / 10;
}

function formatTenth(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1);
}

export function formatToday(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatLastPuff(date: Date | null, unit: UnitInput = false): string {
  if (!date) {
    return `No ${countWord(toCountUnit(unit), 2)} recorded yet`;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** Null, or an unusable gap, stays on the empty-state dash. */
export function formatLongestGap(gapMs: number | null): string {
  if (gapMs == null || !Number.isFinite(gapMs) || gapMs < 0) {
    return '--';
  }

  if (gapMs < MINUTE_MS) {
    const seconds = Math.floor(gapMs / 1000);
    return `${seconds} sec`;
  }

  const totalMinutes = Math.floor(gapMs / MINUTE_MS);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(gapMs / HOUR_MS);
  const minutes = Math.floor((gapMs % HOUR_MS) / MINUTE_MS);
  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}
