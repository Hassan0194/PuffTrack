import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LastUsedMode } from '../../domain/profile';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

type ClockParts = {
  hour: string;
  minute: string;
  day: string;
  month: string;
  year: string;
};

type WhenUsedPickerProps = {
  mode: LastUsedMode;
  hour: string;
  minute: string;
  day: string;
  month: string;
  year: string;
  future: boolean;
  onChange: (next: Partial<ClockParts>) => void;
};

function pad(value: number): string {
  return String(value);
}

function suggestedDate(mode: LastUsedMode, now: Date): Date {
  if (mode === 'earlier-today') {
    const earlier = new Date(now.getTime() - 60 * 60 * 1000);
    if (earlier.getDate() !== now.getDate() || earlier.getMonth() !== now.getMonth()) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }
    return earlier;
  }

  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, now.getHours(), now.getMinutes(), 0, 0);
}

function readDate(mode: LastUsedMode, parts: ClockParts, now: Date): Date | null {
  if (parts.hour.trim() === '' || parts.minute.trim() === '') {
    return null;
  }

  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }

  if (mode === 'other') {
    if (parts.day.trim() === '' || parts.month.trim() === '' || parts.year.trim() === '') {
      return null;
    }
    const day = Number(parts.day);
    const month = Number(parts.month);
    const year = Number(parts.year);
    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
      return null;
    }
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }

  if (mode === 'yesterday') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, hour, minute, 0, 0);
  }

  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
}

function toParts(date: Date): ClockParts {
  return {
    hour: pad(date.getHours()),
    minute: pad(date.getMinutes()),
    day: pad(date.getDate()),
    month: pad(date.getMonth() + 1),
    year: pad(date.getFullYear()),
  };
}

function formatClock(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function WhenUsedPicker({ mode, hour, minute, day, month, year, future, onChange }: WhenUsedPickerProps) {
  if (mode === 'now') {
    return null;
  }

  const now = new Date();
  const parts = { hour, minute, day, month, year };
  const selected = readDate(mode, parts, now);
  const shown = selected ?? suggestedDate(mode, now);
  const committed = selected != null;

  function commit(next: Date) {
    const today = new Date();
    if (next.getFullYear() < 1970 || next.getTime() > today.getTime()) {
      return;
    }

    if (mode === 'earlier-today') {
      if (
        next.getFullYear() !== today.getFullYear() ||
        next.getMonth() !== today.getMonth() ||
        next.getDate() !== today.getDate()
      ) {
        return;
      }
    }

    if (mode === 'yesterday') {
      const previous = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      if (
        next.getFullYear() !== previous.getFullYear() ||
        next.getMonth() !== previous.getMonth() ||
        next.getDate() !== previous.getDate()
      ) {
        return;
      }
    }

    const nextParts = toParts(next);
    if (mode === 'other') {
      onChange(nextParts);
      return;
    }

    onChange({ hour: nextParts.hour, minute: nextParts.minute });
  }

  function shift(minutes: number) {
    const base = new Date(shown);
    base.setMinutes(base.getMinutes() + minutes);
    commit(base);
  }

  function shiftDay(days: number) {
    const base = new Date(shown);
    base.setDate(base.getDate() + days);
    commit(base);
  }

  return (
    <View style={styles.wrap}>
      {mode === 'other' ? (
        <View style={styles.block}>
          <Text style={styles.label}>Day</Text>
          <View style={styles.row}>
            <StepButton label="Previous day" onPress={() => shiftDay(-1)} symbol="−" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={committed ? formatDay(shown) : `Use ${formatDay(shown)}`}
              onPress={() => commit(shown)}
              style={({ pressed }) => [styles.readout, pressed ? styles.pressed : null]}
            >
              <Text style={styles.readoutText}>{formatDay(shown)}</Text>
            </Pressable>
            <StepButton label="Next day" onPress={() => shiftDay(1)} symbol="+" />
          </View>
        </View>
      ) : null}
      <View style={styles.block}>
        <Text style={styles.label}>Time</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={committed ? formatClock(shown) : `Use ${formatClock(shown)}`}
          onPress={() => commit(shown)}
          style={({ pressed }) => [styles.readout, pressed ? styles.pressed : null]}
        >
          <Text style={styles.readoutText}>{formatClock(shown)}</Text>
          {committed ? null : <Text style={styles.tap}>Tap to use this time</Text>}
        </Pressable>
        <View style={styles.row}>
          <StepButton label="Earlier hour" onPress={() => shift(-60)} symbol="−" />
          <Text style={styles.stepCaption}>Hour</Text>
          <StepButton label="Later hour" onPress={() => shift(60)} symbol="+" />
        </View>
        <View style={styles.row}>
          <StepButton label="Earlier minute" onPress={() => shift(-1)} symbol="−" />
          <Text style={styles.stepCaption}>Minute</Text>
          <StepButton label="Later minute" onPress={() => shift(1)} symbol="+" />
        </View>
      </View>
      {future ? <Text style={styles.hint}>Choose a time that has already happened.</Text> : null}
    </View>
  );
}

function StepButton({ label, symbol, onPress }: { label: string; symbol: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.step, pressed ? styles.pressed : null]}
    >
      <Text style={styles.stepLabel}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  block: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  step: {
    width: 56,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '600',
  },
  readout: {
    alignSelf: 'stretch',
    minHeight: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.track,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    gap: 2,
  },
  readoutText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  tap: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  stepCaption: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
});
