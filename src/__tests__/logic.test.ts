import { defaultLimitFor, resolveDailyLimit, countWord, unitForProfile } from '../domain/consumption';
import { parseDailyLimit, withDailyLimit, EMPTY_GOALS } from '../domain/goals';
import type { ConsumptionProfile } from '../domain/profile';
import { buildReportHtml, escapeHtml } from '../domain/report';
import { withinLimitStreaks } from '../domain/streaks';

const pouchProfile: ConsumptionProfile = {
  completed: true,
  productType: 'pouch',
  dailyBaseline: 14,
  nicotineStrength: null,
  nicotineUnit: null,
  vapeType: null,
  usagePattern: null,
  duration: '1-to-3-years',
  lastUsedAt: null,
  goal: 'track',
  pouchNicotineStrength: 6,
  pouchNicotineUnit: 'mg-per-pouch',
};

describe('daily limits', () => {
  it('defaults per product and ignores pouch baseline and strength', () => {
    expect(defaultLimitFor('puff', null)).toBe(100);
    expect(defaultLimitFor('cigarette', 12)).toBe(12);
    expect(defaultLimitFor('pouch', 14)).toBe(10);
  });

  it('prefers the custom limit when valid', () => {
    expect(resolveDailyLimit('pouch', 14, 15)).toBe(15);
    expect(resolveDailyLimit('pouch', 14, null)).toBe(10);
    expect(resolveDailyLimit('puff', null, 0)).toBe(100);
  });

  it('accepts only whole numbers from 1 to 9999', () => {
    expect(parseDailyLimit('1')).toBe(1);
    expect(parseDailyLimit('9999')).toBe(9999);
    for (const bad of ['0', '-3', '2.5', 'abc', '', '10000', ' ']) {
      expect(parseDailyLimit(bad)).toBeNull();
    }
  });

  it('keeps the limit independent from the personal target', () => {
    const withTarget = { ...EMPTY_GOALS, dailyTarget: 12 };
    const next = withDailyLimit(withTarget, 15);
    expect(next.dailyLimit).toBe(15);
    expect(next.dailyTarget).toBe(12);
    expect(withDailyLimit(next, null).dailyLimit).toBeNull();
  });
});

describe('units', () => {
  it('detects the pouch profile and names the unit', () => {
    expect(unitForProfile(pouchProfile)).toBe('pouch');
    expect(unitForProfile(null)).toBe('puff');
    expect(countWord('pouch', 1)).toBe('pouch');
    expect(countWord('pouch', 2)).toBe('pouches');
    expect(countWord(true, 2)).toBe('cigarettes');
    expect(countWord(false, 1)).toBe('puff');
  });
});

describe('within-limit streaks', () => {
  const day = (date: string, count: number) => ({ date, count });

  it('counts consecutive days at or under the limit up to today', () => {
    const days = [day('2026-01-01', 5), day('2026-01-02', 10), day('2026-01-03', 0)];
    expect(withinLimitStreaks(days, 10, '2026-01-03')).toEqual({ current: 3, best: 3 });
  });

  it('ends the current streak when today is over the limit', () => {
    const days = [day('2026-01-01', 5), day('2026-01-02', 5), day('2026-01-03', 11)];
    expect(withinLimitStreaks(days, 10, '2026-01-03')).toEqual({ current: 0, best: 2 });
  });

  it('keeps a streak alive when today has no record yet', () => {
    const days = [day('2026-01-01', 5), day('2026-01-02', 5)];
    expect(withinLimitStreaks(days, 10, '2026-01-03').current).toBe(2);
  });

  it('breaks on a missing day and tracks the best run', () => {
    const days = [
      day('2026-01-01', 1),
      day('2026-01-02', 1),
      day('2026-01-03', 1),
      day('2026-01-05', 1),
    ];
    expect(withinLimitStreaks(days, 10, '2026-01-05')).toEqual({ current: 1, best: 3 });
  });

  it('handles an empty history', () => {
    expect(withinLimitStreaks([], 10, '2026-01-03')).toEqual({ current: 0, best: 0 });
  });
});

describe('report html', () => {
  it('escapes markup', () => {
    expect(escapeHtml('<b>"x" & \'y\'</b>')).toBe('&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;');
  });

  it('uses the pouch unit and flags days over the limit', () => {
    const html = buildReportHtml({
      generatedAt: new Date(2026, 0, 4, 12, 0),
      unit: 'pouch',
      dailyLimit: 10,
      personalTarget: null,
      days: [
        { date: '2026-01-02', count: 12, puffs: [{ atMs: 1, trigger: 'stress' }] },
        { date: '2026-01-03', count: 4, puffs: [{ atMs: 2, trigger: null }] },
      ],
      streaks: { current: 1, best: 1 },
    });

    expect(html).toContain('pouches');
    expect(html).toContain('Over limit');
    expect(html).toContain('Within limit');
    expect(html).toContain('Stress');
    expect(html).not.toContain('puffs');
  });
});
