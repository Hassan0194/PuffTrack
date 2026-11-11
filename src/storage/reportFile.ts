import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { resolveDailyLimit, unitForProfile } from '../domain/consumption';
import { todayKey } from '../domain/date';
import { recordedDaysFromHistory, savedDayTotals } from '../domain/insights';
import { buildReportHtml } from '../domain/report';
import { withinLimitStreaks } from '../domain/streaks';
import { loadGoalSettings } from './goals';
import { loadConsumptionProfile } from './profile';
import { loadPuffHistory } from './puffHistory';
import { loadTodayRecord } from './todayPuffs';

export type ReportResult = 'shared' | 'unavailable' | 'failed';

function reportFileName(now: Date): string {
  return `pufftrack-report-${todayKey(now)}.pdf`;
}

/** Builds a PDF from the stored history and opens the share sheet. Storage is only read. */
export async function exportReportPdf(now = new Date()): Promise<ReportResult> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      return 'unavailable';
    }

    const [profile, goals, today, archived] = await Promise.all([
      loadConsumptionProfile(),
      loadGoalSettings(),
      loadTodayRecord(now),
      loadPuffHistory(now),
    ]);

    const unit = unitForProfile(profile);
    const dailyLimit = resolveDailyLimit(unit, profile?.dailyBaseline ?? null, goals.dailyLimit);
    const days = recordedDaysFromHistory(archived, today, now);
    const streaks = withinLimitStreaks(
      savedDayTotals(archived, today, now),
      goals.dailyTarget ?? dailyLimit,
      todayKey(now),
    );

    const html = buildReportHtml({
      generatedAt: now,
      unit,
      dailyLimit,
      personalTarget: goals.dailyTarget,
      days,
      streaks,
    });

    const printed = await Print.printToFileAsync({ html });
    const named = new File(Paths.cache, reportFileName(now));
    if (named.exists) {
      named.delete();
    }

    new File(printed.uri).move(named);

    await Sharing.shareAsync(named.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share PuffTrack report',
      UTI: 'com.adobe.pdf',
    });

    return 'shared';
  } catch {
    return 'failed';
  }
}
