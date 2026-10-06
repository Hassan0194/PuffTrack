import { DAILY_PUFF_LIMIT } from '../constants/limits';
import { resolveDailyLimit, unitForProfile } from '../domain/consumption';
import { loadGoalSettings } from './goals';
import { loadConsumptionProfile } from './profile';

/** The daily limit in force now: the user's own limit, else the product default. */
export async function loadEffectiveDailyLimit(): Promise<number> {
  try {
    const [profile, goals] = await Promise.all([loadConsumptionProfile(), loadGoalSettings()]);
    const baseline = profile?.dailyBaseline ?? null;
    return resolveDailyLimit(unitForProfile(profile), baseline, goals.dailyLimit);
  } catch {
    return DAILY_PUFF_LIMIT;
  }
}
