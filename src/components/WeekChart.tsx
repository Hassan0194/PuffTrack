import { StyleSheet, Text, View } from 'react-native';

import { countWord, type UnitInput } from '../domain/consumption';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

export type WeekChartRow = {
  date: string;
  label: string;
  countLabel: string;
  limitLabel: string | null;
  count: number | null;
  barPercent: number;
  isToday?: boolean;
  triggerSummary?: string | null;
};

type WeekChartProps = {
  rows: WeekChartRow[];
  unit?: UnitInput;
};

export function WeekChart({ rows, unit = false }: WeekChartProps) {
  return (
    <View style={styles.list}>
      {rows.map((row) => {
        const missing = row.count == null;
        const recordedZero = row.count === 0;
        const spoken = countWord(unit, row.count == null ? 2 : row.count);

        return (
          <View
            key={row.date}
            accessibilityLabel={
              [
                row.isToday ? 'Today' : null,
                missing
                  ? `${row.label}, not recorded`
                  : recordedZero
                    ? `${row.label}, 0 ${spoken} recorded`
                    : row.limitLabel
                      ? `${row.label}, ${row.count} ${spoken}, ${row.limitLabel}`
                      : `${row.label}, ${row.count} ${spoken}`,
                row.triggerSummary ? `Triggers ${row.triggerSummary}` : null,
              ]
                .filter(Boolean)
                .join('. ')
            }
            style={[styles.row, row.isToday ? styles.today : null]}
          >
            <View style={styles.heading}>
              <View style={styles.dateWrap}>
                {row.isToday ? <Text style={styles.todayBadge}>Today</Text> : null}
                <Text style={[styles.date, missing ? styles.missingText : null]}>{row.label}</Text>
              </View>
              <Text style={[styles.count, missing ? styles.missingText : null]}>
                {missing ? 'Not recorded' : row.countLabel}
              </Text>
            </View>
            <View style={[styles.track, missing ? styles.trackMissing : null]}>
              {missing ? null : (
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.min(100, Math.max(0, row.barPercent))}%` },
                    row.count != null && row.count > 0 ? styles.fillVisible : null,
                  ]}
                />
              )}
            </View>
            {recordedZero ? <Text style={styles.note}>0 recorded</Text> : null}
            {row.limitLabel ? <Text style={styles.limit}>{row.limitLabel}</Text> : null}
            {row.triggerSummary ? (
              <Text style={styles.triggerSummary}>{row.triggerSummary}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    gap: spacing.xs + 2,
  },
  today: {
    backgroundColor: colors.track,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dateWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  todayBadge: {
    alignSelf: 'flex-start',
    color: colors.onAccent,
    backgroundColor: colors.accent,
    overflow: 'hidden',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    fontSize: 13,
    fontWeight: '800',
  },
  date: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  count: {
    flexShrink: 0,
    maxWidth: '46%',
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  missingText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  trackMissing: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  fillVisible: {
    minWidth: 8,
  },
  note: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  limit: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  triggerSummary: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
