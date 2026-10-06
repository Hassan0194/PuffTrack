import { triggerOption } from '../constants/triggers';
import type { TriggerCount } from '../domain/triggers';

export function formatTriggerSummary(counts: readonly TriggerCount[]): string | null {
  if (counts.length === 0) {
    return null;
  }

  return counts
    .map((item) => `${triggerOption(item.type).label} ${item.count}`)
    .join(' · ');
}
