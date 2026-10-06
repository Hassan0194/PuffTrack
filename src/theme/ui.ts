import { StyleSheet } from 'react-native';

import { colors } from './colors';
import { radius, spacing } from './spacing';

export const ui = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  column: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  hero: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  body: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  secondary: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
});
