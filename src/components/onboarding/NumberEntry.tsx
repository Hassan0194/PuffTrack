import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

type NumberEntryProps = {
  value: string;
  onChangeText: (value: string) => void;
  accessibilityLabel: string;
  keyboard: 'number-pad' | 'decimal-pad';
  hint?: string | null;
};

export function NumberEntry({ value, onChangeText, accessibilityLabel, keyboard, hint }: NumberEntryProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        keyboardType={keyboard}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor="rgba(183, 201, 194, 0.35)"
        style={styles.input}
        value={value}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 112,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    color: colors.text,
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -1.5,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
});
