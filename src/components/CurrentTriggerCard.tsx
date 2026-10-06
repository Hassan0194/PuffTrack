import { Pressable, StyleSheet, Text, View } from 'react-native';

import { triggerOption, type TriggerType } from '../constants/triggers';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type CurrentTriggerCardProps = {
  trigger: TriggerType | null;
  onChange: () => void;
};

export function CurrentTriggerCard({ trigger, onChange }: CurrentTriggerCardProps) {
  const option = trigger ? triggerOption(trigger) : null;
  const action = option ? 'Change' : 'Choose';

  return (
    <View accessibilityLabel={option ? `Current trigger ${option.label}` : 'Current trigger none'}>
      <Text style={styles.label}>Current Trigger</Text>
      <View style={styles.row}>
        <View style={styles.valueWrap}>
          {option ? <Text style={styles.icon}>{option.icon}</Text> : null}
          <Text numberOfLines={1} style={[styles.value, option ? null : styles.valueNone]}>
            {option ? option.label : 'None'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={option ? 'Change current trigger' : 'Choose a trigger'}
          onPress={onChange}
          style={({ pressed }) => [styles.action, pressed ? styles.actionPressed : null]}
        >
          <Text style={styles.actionLabel}>{action}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  valueWrap: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  value: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  valueNone: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  action: {
    minHeight: 44,
    minWidth: 72,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: spacing.sm,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionLabel: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
});
