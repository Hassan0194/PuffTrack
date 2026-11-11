import { triggerOption } from '../constants/triggers';
import { countWord, type CountUnit } from './consumption';
import {
  allPuffs,
  averageDailyPuffs,
  highestConsumptionDay,
  totalPuffs,
  triggerShares,
  type RecordedDay,
} from './insights';
import type { Streaks } from './streaks';

export type ReportInput = {
  generatedAt: Date;
  unit: CountUnit;
  dailyLimit: number;
  personalTarget: number | null;
  /** Recorded days, oldest first. */
  days: readonly RecordedDay[];
  streaks: Streaks;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDay(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return dayKey;
  }

  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatAverage(value: number | null): string {
  if (value == null) {
    return '--';
  }

  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function amount(unit: CountUnit, count: number): string {
  return `${count} ${countWord(unit, count)}`;
}

/** A self-contained HTML page for the PDF report. All values are escaped. */
export function buildReportHtml(input: ReportInput): string {
  const { unit, dailyLimit, personalTarget, days, streaks } = input;
  const word = countWord(unit, 2);
  const newestFirst = [...days].reverse();
  const highest = highestConsumptionDay(days);
  const shares = triggerShares(allPuffs(days));
  const overLimitDays = days.filter((day) => day.count > dailyLimit).length;

  const generated = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeStyle: 'short' }).format(
    input.generatedAt,
  );

  const dayRows = newestFirst
    .map((day) => {
      const over = day.count > dailyLimit;
      return `<tr><td>${escapeHtml(formatDay(day.date))}</td><td class="num">${day.count}</td><td class="${over ? 'over' : 'ok'}">${over ? 'Over limit' : 'Within limit'}</td></tr>`;
    })
    .join('');

  const triggerRows = shares.rows
    .map((row) => {
      const option = triggerOption(row.type);
      return `<tr><td>${escapeHtml(option.label)}</td><td class="num">${row.count}</td><td class="num">${Math.round(row.percent)}%</td></tr>`;
    })
    .join('');

  const highestText =
    highest == null ? '--' : `${amount(unit, highest.count)} on ${formatDay(highest.date)}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #0b1f1a; margin: 32px; }
  h1 { margin: 0 0 4px; font-size: 26px; color: #0f8f6f; }
  h2 { font-size: 15px; letter-spacing: 1px; text-transform: uppercase; color: #4a6a62; margin: 28px 0 8px; }
  .sub { color: #5d7a72; font-size: 13px; margin-bottom: 20px; }
  .cards { display: flex; gap: 12px; flex-wrap: wrap; }
  .card { flex: 1; min-width: 120px; border: 1px solid #d3e4de; border-radius: 10px; padding: 12px; }
  .card .v { font-size: 26px; font-weight: 700; }
  .card .l { font-size: 12px; color: #5d7a72; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #e3eeea; }
  th { color: #4a6a62; font-weight: 600; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .over { color: #c93a3a; font-weight: 600; }
  .ok { color: #0f8f6f; }
  .note { margin-top: 28px; font-size: 11px; color: #6b8780; line-height: 1.5; }
</style>
</head>
<body>
  <h1>PuffTrack report</h1>
  <div class="sub">Generated ${escapeHtml(generated)} · Tracking ${escapeHtml(word)}</div>

  <div class="cards">
    <div class="card"><div class="v">${totalPuffs(days)}</div><div class="l">Total ${escapeHtml(word)}</div></div>
    <div class="card"><div class="v">${escapeHtml(formatAverage(averageDailyPuffs(days)))}</div><div class="l">Average per recorded day</div></div>
    <div class="card"><div class="v">${days.length}</div><div class="l">Recorded days</div></div>
    <div class="card"><div class="v">${streaks.current}</div><div class="l">Current streak (best ${streaks.best})</div></div>
  </div>

  <h2>Limits</h2>
  <table>
    <tr><td>Daily limit</td><td class="num">${escapeHtml(amount(unit, dailyLimit))}</td></tr>
    <tr><td>Personal target</td><td class="num">${personalTarget == null ? 'Not set' : escapeHtml(amount(unit, personalTarget))}</td></tr>
    <tr><td>Days over the daily limit</td><td class="num">${overLimitDays} of ${days.length}</td></tr>
    <tr><td>Highest day</td><td class="num">${escapeHtml(highestText)}</td></tr>
  </table>

  <h2>Daily history</h2>
  ${days.length === 0 ? '<p>No days recorded yet.</p>' : `<table><tr><th>Day</th><th class="num">Count</th><th>Status</th></tr>${dayRows}</table>`}

  <h2>Triggers</h2>
  ${shares.rows.length === 0 ? '<p>No tagged entries yet.</p>' : `<table><tr><th>Trigger</th><th class="num">Count</th><th class="num">Share</th></tr>${triggerRows}</table>`}

  <div class="note">
    Generated from data stored on this device. The daily limit is a tracking boundary you set, not a medical
    recommendation. PuffTrack does not provide medical advice.
  </div>
</body>
</html>`;
}
