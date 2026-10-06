import { StyleSheet, Text, View } from 'react-native';

import { formatGroupedNumber } from '../format/puffCopy';
import { colors } from '../theme/colors';
import { ui } from '../theme/ui';
import { DailyProgress } from './DailyProgress';
import { StatGrid } from './StatGrid';

type PuffBudgetCardProps = {
  count: number;
  limit: number;
  remaining: number;
  progress: number;
  budgetReached: boolean;
  paceLabel: string | null;
};

export function PuffBudgetCard({
  count,
  limit,
  remaining,
  progress,
  budgetReached,
  paceLabel,
}: PuffBudgetCardProps) {
  const over = count > limit;
  const overBy = over ? count - limit : 0;
  const summary = [
    `Puff budget. Consumed ${count}. Remaining ${remaining}. Daily limit ${limit}.`,
    budgetReached ? 'Daily budget reached.' : null,
    over ? `${overBy} over the daily limit.` : null,
    paceLabel,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View accessibilityLabel={summary} style={ui.card}>
      <Text style={ui.kicker}>PUFF BUDGET</Text>
      <StatGrid
        items={[
          { label: 'Consumed', value: formatGroupedNumber(count) },
          { label: 'Remaining', value: formatGroupedNumber(remaining) },
          { label: 'Daily limit', value: formatGroupedNumber(limit) },
        ]}
      />
      <DailyProgress count={count} exceeded={over} limit={limit} progress={progress} />
      {budgetReached ? <Text style={styles.status}>Daily budget reached</Text> : null}
      {over ? (
        <Text style={styles.over}>
          {formatGroupedNumber(overBy)} over the daily limit
        </Text>
      ) : null}
      {!budgetReached && paceLabel ? <Text style={styles.pace}>{paceLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  status: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  over: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  pace: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
