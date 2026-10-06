import { DAILY_PUFF_LIMIT, DAILY_POUCH_LIMIT } from '../constants/limits';
import type { ConsumptionProfile } from './profile';

/** What one logged event counts as. */
export type CountUnit = 'puff' | 'cigarette' | 'pouch';

/** Older callers pass a boolean: true is cigarettes, false is puffs. */
export type UnitInput = CountUnit | boolean;

export function toCountUnit(unit: UnitInput): CountUnit {
  if (unit === true) {
    return 'cigarette';
  }

  if (unit === false) {
    return 'puff';
  }

  return unit;
}

/** Whole-number baseline accepted from the consumption profile. */
export function isCigaretteBaseline(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 9999;
}

export function isCigaretteProfile(profile: ConsumptionProfile | null): boolean {
  return profile?.productType === 'cigarette' && isCigaretteBaseline(profile.dailyBaseline);
}

export function isPouchProfile(profile: ConsumptionProfile | null): boolean {
  return profile?.productType === 'pouch' && isCigaretteBaseline(profile.dailyBaseline);
}

export function unitForProfile(profile: ConsumptionProfile | null): CountUnit {
  if (isCigaretteProfile(profile)) {
    return 'cigarette';
  }

  return isPouchProfile(profile) ? 'pouch' : 'puff';
}

export function countWord(unit: UnitInput, count: number): string {
  const kind = toCountUnit(unit);
  const single = count === 1;

  if (kind === 'cigarette') {
    return single ? 'cigarette' : 'cigarettes';
  }

  if (kind === 'pouch') {
    return single ? 'pouch' : 'pouches';
  }

  return single ? 'puff' : 'puffs';
}

export function countLabel(unit: UnitInput, count: number): string {
  return countWord(unit, count).toUpperCase();
}

/** Vape keeps the app limit. Cigarettes use the reported baseline. */
export function referenceLimitFor(cigarette: boolean, baseline: number | null): number {
  if (cigarette && baseline != null && isCigaretteBaseline(baseline)) {
    return baseline;
  }

  return DAILY_PUFF_LIMIT;
}

/** The limit used before the user sets one. Pouches never derive it from nicotine strength. */
export function defaultLimitFor(unit: UnitInput, baseline: number | null): number {
  const kind = toCountUnit(unit);

  if (kind === 'pouch') {
    return DAILY_POUCH_LIMIT;
  }

  return referenceLimitFor(kind === 'cigarette', baseline);
}

/** The user's own daily limit when set, otherwise the default for the product. */
export function resolveDailyLimit(
  unit: UnitInput,
  baseline: number | null,
  customLimit: number | null,
): number {
  if (customLimit != null && isCigaretteBaseline(customLimit)) {
    return customLimit;
  }

  return defaultLimitFor(unit, baseline);
}
