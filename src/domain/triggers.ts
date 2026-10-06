import { TRIGGER_OPTIONS, type TriggerType } from '../constants/triggers';

export type TriggerCount = {
  type: TriggerType;
  count: number;
};

/** Counts puffs that were tagged. Untagged puffs are left out. */
export function countPuffTriggers(
  puffs: readonly { trigger: TriggerType | null }[],
): TriggerCount[] {
  const totals = new Map<TriggerType, number>();

  for (const puff of puffs) {
    if (!puff.trigger) {
      continue;
    }

    totals.set(puff.trigger, (totals.get(puff.trigger) ?? 0) + 1);
  }

  return TRIGGER_OPTIONS.map((option) => ({
    type: option.type,
    count: totals.get(option.type) ?? 0,
  }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}
