import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionCard } from '../components/SectionCard';
import { WeekChart } from '../components/WeekChart';
import { countWord } from '../domain/consumption';
import { todayKey } from '../domain/date';
import { formatBudgetRatio, formatDailyLimit, formatGroupedNumber, formatHistoryDate, formatLimitUsed } from '../format/puffCopy';
import { formatTriggerSummary } from '../format/triggers';
import { useConsumptionMode } from '../hooks/useConsumptionMode';
import { usePuffHistory } from '../hooks/usePuffHistory';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { ui } from '../theme/ui';

type HistoryScreenProps = {
  onBack: () => void;
};

export function HistoryScreen({ onBack }: HistoryScreenProps) {
  const consumption = useConsumptionMode();
  const history = usePuffHistory(consumption.referenceLimit);
  const cigarette = consumption.cigarette;
  const unit = consumption.unit;
  const today = todayKey(new Date());
  const triggerRows = history.days.flatMap((day) => {
    const summary = formatTriggerSummary(day.triggerCounts);
    if (!summary) {
      return [];
    }

    return [{ date: day.date, label: formatHistoryDate(day.date), summary, isToday: day.date === today }];
  });

  return (
    <Screen>
      <ScreenHeader onBack={onBack} title="History" />

      {history.ready && consumption.ready ? (
        <>
          <SectionCard title="TODAY">
            <Text style={styles.total}>{formatGroupedNumber(history.todayCount)}</Text>
            <Text style={ui.secondary}>
              {history.todayCount === 1 ? `${countWord(unit, 1)} today` : `${countWord(unit, 2)} today`}
            </Text>
            {cigarette ? (
              <Text style={ui.body}>{formatBudgetRatio(history.todayCount, history.todayLimit)}</Text>
            ) : (
              <>
                <Text style={ui.body}>Daily limit {formatGroupedNumber(history.todayLimit)}</Text>
                <Text style={ui.secondary}>{formatLimitUsed(history.todayPercent)}</Text>
              </>
            )}
          </SectionCard>

          {history.hasHistory ? (
            <SectionCard title="LAST 7 DAYS">
              <Text style={ui.secondary}>
                {`Not recorded is a missing day. 0 is a saved day with no ${countWord(unit, 2)}.`}
              </Text>
              <WeekChart
                unit={unit}
                rows={history.days.map((day) => ({
                  date: day.date,
                  label: formatHistoryDate(day.date),
                  count: day.count,
                  countLabel: day.count == null ? '—' : formatGroupedNumber(day.count),
                  limitLabel: cigarette || day.limit == null ? null : formatDailyLimit(day.limit),
                  barPercent: day.barPercent,
                  isToday: day.date === today,
                  triggerSummary: formatTriggerSummary(day.triggerCounts),
                }))}
              />
            </SectionCard>
          ) : triggerRows.length > 0 ? (
            <SectionCard title="LAST 7 DAYS">
              {triggerRows.map((row) => (
                <View key={row.date} style={styles.triggerDay}>
                  <Text style={styles.triggerDate}>{row.isToday ? `Today · ${row.label}` : row.label}</Text>
                  <Text style={ui.secondary}>{row.summary}</Text>
                </View>
              ))}
            </SectionCard>
          ) : (
            <EmptyState body="Your daily activity will appear here." title="No history yet" />
          )}
        </>
      ) : (
        <Text style={ui.secondary}>Loading history...</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  total: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  triggerDay: {
    gap: spacing.xs,
  },
  triggerDate: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
