import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { InsightBars } from '../components/InsightBars';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionCard } from '../components/SectionCard';
import { triggerOption } from '../constants/triggers';
import { countWord } from '../domain/consumption';
import { todayKey } from '../domain/date';
import { formatGroupedNumber, formatHistoryDate, formatLongestGap, formatPuffCount } from '../format/puffCopy';
import { useConsumptionMode } from '../hooks/useConsumptionMode';
import { useInsights } from '../hooks/useInsights';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { ui } from '../theme/ui';

type InsightsScreenProps = {
  onBack: () => void;
};

function formatAverage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatGapDates(startMs: number, endMs: number): string {
  const start = formatHistoryDate(todayKey(new Date(startMs)));
  const end = formatHistoryDate(todayKey(new Date(endMs)));
  return start === end ? start : `${start} – ${end}`;
}

export function InsightsScreen({ onBack }: InsightsScreenProps) {
  const consumption = useConsumptionMode();
  const { ready, insights } = useInsights();
  const unit = consumption.unit;
  const plural = countWord(unit, 2);
  const singular = countWord(unit, 1);
  const hasData = insights.recordedDayCount > 0;
  const today = todayKey(new Date());
  const common = insights.mostCommon;
  const commonOption = common ? triggerOption(common.type) : null;

  return (
    <Screen>
      <ScreenHeader onBack={onBack} title="Insights" />

      {!ready || !consumption.ready ? (
        <Text style={ui.secondary}>Loading insights...</Text>
      ) : !hasData ? (
        <EmptyState body="Keep tracking to see your insights." title="Not enough data yet" />
      ) : (
        <>
          <SectionCard title="OVERVIEW">
            <Text style={styles.hero}>{insights.average == null ? '--' : formatAverage(insights.average)}</Text>
            <Text style={ui.secondary}>
              {`Average ${plural} per recorded day`}
            </Text>
            <Text style={ui.body}>{formatPuffCount(insights.total, unit)} in saved history</Text>
            <Text style={ui.secondary}>Missing days are not counted as zero.</Text>
          </SectionCard>

          {common && commonOption ? (
            <SectionCard title="MOST COMMON CONTEXT">
              <Text style={styles.contextName}>
                {commonOption.icon}  {commonOption.label}
              </Text>
              <Text style={ui.body}>
                You recorded {formatPuffCount(common.count, unit)} while {commonOption.label}.
              </Text>
            </SectionCard>
          ) : null}

          <SectionCard title="LAST 7 DAYS">
            {insights.weekDays.length === 0 ? (
              <EmptyState
                body={`No ${plural} were recorded in the last 7 days.`}
                plain
                title="Not enough data yet"
              />
            ) : (
              <>
                <Text style={styles.hero}>{formatGroupedNumber(insights.weekTotal)}</Text>
                <Text style={ui.secondary}>
                  {insights.weekAverage == null
                    ? 'Recorded this week'
                    : `Average ${formatAverage(insights.weekAverage)} on recorded days`}
                </Text>
                <InsightBars
                  unit={unit}
                  rows={insights.weekDays.map((day) => ({
                    date: day.date,
                    label: formatHistoryDate(day.date),
                    count: day.count,
                    barPercent: day.barPercent,
                    isToday: day.date === today,
                  }))}
                />
              </>
            )}
          </SectionCard>

          <SectionCard title={`${plural.toUpperCase()} BY CONTEXT`}>
            {insights.triggerRows.length === 0 ? (
              <EmptyState
                body={`Tag a ${singular} with a context and it will show up here.`}
                plain
                title="Not enough data yet"
              />
            ) : (
              <>
                <Text style={ui.secondary}>
                  {`Percentages use tagged ${plural} only.`}
                </Text>
                {insights.triggerRows.map((row) => {
                  const option = triggerOption(row.type);
                  return (
                    <View key={row.type} style={styles.triggerRow}>
                      <Text style={styles.triggerName}>
                        {option.icon}  {option.label}
                      </Text>
                      <Text style={ui.secondary}>
                        {formatPuffCount(row.count, unit)} · {formatPercent(row.percent)} of tagged{' '}
                        {plural}
                      </Text>
                    </View>
                  );
                })}
              </>
            )}
          </SectionCard>

          <SectionCard title="LONGEST GAP">
            {insights.longestGap ? (
              <>
                <Text style={styles.hero}>{formatLongestGap(insights.longestGap.gapMs)}</Text>
                <Text style={ui.secondary}>
                  {formatGapDates(insights.longestGap.startMs, insights.longestGap.endMs)}
                </Text>
              </>
            ) : (
              <EmptyState
                body={`A gap needs at least two recorded ${plural}.`}
                plain
                title="Not enough data yet"
              />
            )}
          </SectionCard>

          <SectionCard title="RECORDS">
            {insights.highest ? (
              <Text style={ui.body}>
                Your highest recorded day was {formatPuffCount(insights.highest.count, unit)} on{' '}
                {formatHistoryDate(insights.highest.date)}.
              </Text>
            ) : null}
            {insights.lowest ? (
              <Text style={ui.body}>
                Your lowest recorded day was {formatPuffCount(insights.lowest.count, unit)} on{' '}
                {formatHistoryDate(insights.lowest.date)}.
              </Text>
            ) : null}
            {insights.longestGap ? (
              <Text style={ui.body}>
                Your longest gap between {plural} was {formatLongestGap(insights.longestGap.gapMs)}.
              </Text>
            ) : null}
            {common && commonOption ? (
              <Text style={ui.body}>
                {commonOption.label} accounts for {formatPercent(common.percent)} of your tagged {plural}.
              </Text>
            ) : null}
          </SectionCard>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  contextName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  triggerRow: {
    gap: spacing.xs,
  },
  triggerName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
});
