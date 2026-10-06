import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type TextActionProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function TextAction({ label, onPress, accessibilityLabel }: TextActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={styles.hit}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
  label: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
});
