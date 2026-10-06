export type ProductType = 'cigarette' | 'vape' | 'pouch';

export type NicotineUnit = 'mg/ml' | 'mg';

/** Pouch strength is always per pouch. */
export type PouchNicotineUnit = 'mg-per-pouch';

export type VapeType = 'disposable' | 'pod' | 'tank' | 'unsure';

export type UsagePattern = 'throughout-day' | 'certain-times' | 'occasionally';

export type UseDuration = 'under-6-months' | '6-months-to-1-year' | '1-to-3-years' | '3-plus-years';

export type ProfileGoal = 'track' | 'stay-within' | 'reduce' | 'understand';

export type LastUsedMode = 'now' | 'earlier-today' | 'yesterday' | 'other';

/** Local profile. Separate from puff history. */
export type ConsumptionProfile = {
  completed: true;
  productType: ProductType;
  dailyBaseline: number;
  nicotineStrength: number | null;
  nicotineUnit: NicotineUnit | null;
  vapeType: VapeType | null;
  usagePattern: UsagePattern | null;
  duration: UseDuration | null;
  lastUsedAt: string | null;
  goal: ProfileGoal;
  /** Pouch profiles only. Missing on profiles saved before pouch support. */
  pouchNicotineStrength?: number | null;
  pouchNicotineUnit?: PouchNicotineUnit | null;
};

export type LastUsedInput = {
  mode: LastUsedMode | null;
  hour: string;
  minute: string;
  day: string;
  month: string;
  year: string;
};

const MAX_BASELINE = 9999;
const MAX_STRENGTH = 999;

export function parseBaselineCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 1 || value > MAX_BASELINE) {
    return null;
  }

  return value;
}

export function parseNicotineStrength(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > MAX_STRENGTH) {
    return null;
  }

  return value;
}

function parsePart(raw: string, min: number, max: number): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < min || value > max) {
    return null;
  }

  return value;
}

/** Local date and time. Future moments are rejected. */
export function resolveLastUsedAt(input: LastUsedInput, now = new Date()): string | null {
  if (input.mode == null) {
    return null;
  }

  if (input.mode === 'now') {
    return now.toISOString();
  }

  const hour = parsePart(input.hour, 0, 23);
  const minute = parsePart(input.minute, 0, 59);
  if (hour == null || minute == null) {
    return null;
  }

  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  let day = now.getDate();

  if (input.mode === 'yesterday') {
    const previous = new Date(year, now.getMonth(), day - 1);
    year = previous.getFullYear();
    month = previous.getMonth() + 1;
    day = previous.getDate();
  }

  if (input.mode === 'other') {
    const pickedDay = parsePart(input.day, 1, 31);
    const pickedMonth = parsePart(input.month, 1, 12);
    const pickedYear = parsePart(input.year, 1970, year);
    if (pickedDay == null || pickedMonth == null || pickedYear == null) {
      return null;
    }

    day = pickedDay;
    month = pickedMonth;
    year = pickedYear;
  }

  const stamp = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    stamp.getFullYear() !== year ||
    stamp.getMonth() !== month - 1 ||
    stamp.getDate() !== day ||
    stamp.getTime() > now.getTime()
  ) {
    return null;
  }

  return stamp.toISOString();
}

export function nicotineUnitLabel(unit: NicotineUnit): string {
  return unit === 'mg/ml' ? 'mg/mL' : 'mg';
}

export function pouchUnitLabel(_unit: PouchNicotineUnit): string {
  return 'mg per pouch';
}
