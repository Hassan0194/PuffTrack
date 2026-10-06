export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  md: 16,
  lg: 18,
  pill: 999,
} as const;

export function horizontalPadding(width: number): number {
  if (width < 360) {
    return spacing.md;
  }

  if (width >= 768) {
    return spacing.xl;
  }

  return spacing.lg;
}
