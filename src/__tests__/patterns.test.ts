import { milestones, timeOfDayBuckets, weekOverWeek } from '../domain/patterns';

function at(hour: number): { atMs: number } {
  return { atMs: new Date(2026, 0, 5, hour, 30).getTime() };
}

describe('time of day', () => {
  it('buckets entries by local hour', () => {
    const buckets = timeOfDayBuckets([at(6), at(11), at(13), at(18), at(18), at(23), at(2)]);
    const counts = Object.fromEntries(buckets.map((b) => [b.key, b.count]));
    expect(counts).toEqual({ morning: 2, afternoon: 1, evening: 2, night: 2 });
    expect(Math.max(...buckets.map((b) => b.barPercent))).toBe(100);
  });

  it('returns empty bars with no entries', () => {
    expect(timeOfDayBuckets([]).every((b) => b.count === 0 && b.barPercent === 0)).toBe(true);
  });
});

describe('week over week', () => {
  const day = (date: string, count: number) => ({ date, count });

  it('compares the last 7 days with the 7 before', () => {
    const days = [
      day('2026-01-01', 10),
      day('2026-01-02', 10),
      day('2026-01-08', 5),
      day('2026-01-09', 5),
    ];
    const change = weekOverWeek(days, '2026-01-09');
    expect(change).toEqual({ thisWeekAverage: 5, lastWeekAverage: 10, changePercent: -50 });
  });

  it('is null when either week has no saved day', () => {
    expect(weekOverWeek([day('2026-01-09', 5)], '2026-01-09')).toBeNull();
  });

  it('has no percentage when last week averaged zero', () => {
    const change = weekOverWeek([day('2026-01-02', 0), day('2026-01-09', 4)], '2026-01-09');
    expect(change?.changePercent).toBeNull();
  });
});

describe('milestones', () => {
  it('derives earned items from saved days', () => {
    const days = [
      { date: '2026-01-01', count: 0 },
      { date: '2026-01-02', count: 20 },
    ];
    const list = milestones(days, { current: 0, best: 3 }, 10, {
      thisWeekAverage: 1,
      lastWeekAverage: 2,
      changePercent: -50,
    });
    const earned = Object.fromEntries(list.map((m) => [m.id, m.earned]));
    expect(earned['first-day']).toBe(true);
    expect(earned['quiet-day']).toBe(true);
    expect(earned['streak-3']).toBe(true);
    expect(earned['streak-7']).toBe(false);
    expect(earned['down-on-last-week']).toBe(true);
  });
});
