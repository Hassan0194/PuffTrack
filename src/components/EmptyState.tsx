import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { ui } from '../theme/ui';

type EmptyStateProps = {
  title: string;
  body: string;
  plain?: boolean;
};

export function EmptyState({ title, body, plain = false }: EmptyStateProps) {
  return (
    <View style={plain ? styles.plain : ui.card}>
      <View accessibilityElementsHidden importantForAccessibility="no" style={styles.mark}>
        <View style={styles.ring}>
          <View style={styles.dash} />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={ui.secondary}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plain: {
    gap: spacing.sm,
  },
  mark: {
    marginBottom: spacing.xs,
  },
  ring: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dash: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.textMuted,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
