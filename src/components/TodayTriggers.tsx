import { StyleSheet, Text, View } from 'react-native';

import { countWord, type UnitInput } from '../domain/consumption';
import { triggerOption } from '../constants/triggers';
import type { TriggerCount } from '../domain/triggers';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type TodayTriggersProps = {
  counts: readonly TriggerCount[];
  unit?: UnitInput;
};

export function TodayTriggers({ counts, unit = false }: TodayTriggersProps) {
  if (counts.length === 0) {
    return null;
  }

  return (
    <View style={styles.block}>
      <Text style={styles.title}>Today&apos;s triggers</Text>
      {counts.map((item) => {
        const option = triggerOption(item.type);
        return (
          <View key={item.type} style={styles.row}>
            <Text style={styles.icon}>{option.icon}</Text>
            <Text style={styles.label}>{option.label}</Text>
            <Text style={styles.count}>
              {item.count} {countWord(unit, item.count)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.xs,
  },
  title: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: 28,
    fontSize: 18,
    textAlign: 'center',
  },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  count: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
});
