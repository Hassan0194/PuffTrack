/** Longest interval between consecutive puffs. Null until two timestamps exist. */
export function longestGapMs(timestamps: readonly number[]): number | null {
  if (timestamps.length < 2) {
    return null;
  }

  const sorted = [...timestamps].sort((a, b) => a - b);
  let longest = 0;

  for (let index = 1; index < sorted.length; index += 1) {
    const gap = sorted[index] - sorted[index - 1];
    if (gap > longest) {
      longest = gap;
    }
  }

  return longest;
}
