import { StyleSheet, Text, View } from 'react-native';

import { countWord, type UnitInput } from '../domain/consumption';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

export type InsightBar = {
  date: string;
  label: string;
  count: number;
  barPercent: number;
  isToday?: boolean;
};

type InsightBarsProps = {
  rows: InsightBar[];
  unit?: UnitInput;
};

export function InsightBars({ rows, unit = false }: InsightBarsProps) {
  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <View
          key={row.date}
          accessibilityLabel={`${row.isToday ? 'Today, ' : ''}${row.label}, ${row.count} ${countWord(unit, row.count)}`}
          style={[styles.row, row.isToday ? styles.today : null]}
        >
          <View style={styles.heading}>
            <View style={styles.dateWrap}>
              {row.isToday ? <Text style={styles.todayBadge}>Today</Text> : null}
              <Text style={styles.date}>{row.label}</Text>
            </View>
            <Text style={styles.count}>{row.count}</Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.min(100, Math.max(0, row.barPercent))}%` },
                row.count > 0 ? styles.fillVisible : null,
              ]}
            />
          </View>
        </View>
      ))}
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
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  fillVisible: {
    minWidth: 8,
  },
});
