import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { countLabel, countWord, toCountUnit, type UnitInput } from '../domain/consumption';
import { formatGroupedNumber } from '../format/puffCopy';
import { colors } from '../theme/colors';

type PuffGaugeProps = {
  count: number;
  limit: number;
  progress: number;
  exceeded: boolean;
  size: number;
  unit?: UnitInput;
};

const TICK_COUNT = 61;
const START_DEG = 135;
const SWEEP_DEG = 270;

type Tick = {
  t: number;
  deg: number;
  length: number;
  width: number;
  x: number;
  y: number;
};

function buildTicks(size: number): Tick[] {
  const center = size / 2;
  const outer = size / 2 - 2;
  const ticks: Tick[] = [];

  for (let index = 0; index < TICK_COUNT; index += 1) {
    const t = index / (TICK_COUNT - 1);
    const deg = START_DEG + t * SWEEP_DEG;
    const rad = (deg * Math.PI) / 180;
    const major = index % 5 === 0;
    const length = major ? size * 0.062 : size * 0.036;
    const radius = outer - length / 2;

    ticks.push({
      t,
      deg,
      length,
      width: major ? 2 : 1.5,
      x: center + Math.cos(rad) * radius,
      y: center + Math.sin(rad) * radius,
    });
  }

  return ticks;
}

function pointOnScale(size: number, progress: number, length: number) {
  const center = size / 2;
  const outer = size / 2 - 2;
  const clamped = Math.min(1, Math.max(0, progress));
  const deg = START_DEG + clamped * SWEEP_DEG;
  const rad = (deg * Math.PI) / 180;
  const radius = outer - length / 2;

  return {
    deg,
    x: center + Math.cos(rad) * radius,
    y: center + Math.sin(rad) * radius,
  };
}

export function PuffGauge({ count, limit, progress, exceeded, size, unit = false }: PuffGaugeProps) {
  const target = Math.min(1, Math.max(0, progress));
  const ticks = useMemo(() => buildTicks(size), [size]);
  const motion = useRef(new Animated.Value(target)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const mounted = useRef(false);
  const [shown, setShown] = useState(target);

  useEffect(() => {
    const id = motion.addListener(({ value }) => setShown(value));
    return () => motion.removeListener(id);
  }, [motion]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      motion.setValue(target);
      setShown(target);
      return;
    }

    Animated.timing(motion, {
      toValue: target,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.018,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [motion, scale, target]);

  const activeColor = exceeded ? colors.exceeded : colors.accent;
  const indicatorLength = size * 0.078;
  const indicator = pointOnScale(size, shown, indicatorLength);
  const numberSize = Math.round(size * (count >= 1000 ? 0.2 : 0.25));
  const label = countLabel(unit, count);
  const unitWord = countWord(unit, count);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel={
        toCountUnit(unit) === 'cigarette'
          ? exceeded
            ? `${formatGroupedNumber(count)} ${unitWord}, baseline exceeded`
            : `${formatGroupedNumber(count)} ${unitWord} of ${formatGroupedNumber(limit)}`
          : exceeded
            ? `${formatGroupedNumber(count)} ${unitWord}, daily limit exceeded`
            : `${formatGroupedNumber(count)} ${unitWord} of ${formatGroupedNumber(limit)}`
      }
      accessibilityValue={{ min: 0, max: limit, now: count }}
      style={[styles.frame, { width: size, height: size, transform: [{ scale }] }]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            width: size * 0.62,
            height: size * 0.62,
            borderRadius: size * 0.31,
            left: size * 0.19,
            top: size * 0.19,
            backgroundColor: exceeded ? 'rgba(255, 92, 92, 0.08)' : colors.glow,
          },
        ]}
      />
      {ticks.map((tick) => {
        const active = tick.t <= shown + 0.0001;
        return (
          <View
            key={tick.t}
            pointerEvents="none"
            style={[
              styles.tick,
              {
                width: tick.width,
                height: tick.length,
                left: tick.x - tick.width / 2,
                top: tick.y - tick.length / 2,
                backgroundColor: active ? activeColor : 'rgba(183, 201, 194, 0.28)',
                opacity: active ? 1 : 0.9,
                transform: [{ rotate: `${tick.deg + 90}deg` }],
              },
            ]}
          />
        );
      })}
      <View
        pointerEvents="none"
        style={[
          styles.indicatorGlow,
          {
            width: indicatorLength,
            height: indicatorLength,
            borderRadius: indicatorLength / 2,
            left: indicator.x - indicatorLength / 2,
            top: indicator.y - indicatorLength / 2,
            backgroundColor: activeColor,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.tick,
          {
            width: 2.5,
            height: indicatorLength,
            left: indicator.x - 1.25,
            top: indicator.y - indicatorLength / 2,
            backgroundColor: activeColor,
            transform: [{ rotate: `${indicator.deg + 90}deg` }],
          },
        ]}
      />
      <View pointerEvents="none" style={styles.center}>
        <Text
          maxFontSizeMultiplier={1.2}
          style={[styles.count, { fontSize: numberSize, lineHeight: numberSize + 2 }]}
        >
          {formatGroupedNumber(count)}
        </Text>
        <Text style={styles.unit}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
  },
  glow: {
    position: 'absolute',
  },
  tick: {
    position: 'absolute',
    borderRadius: 2,
  },
  indicatorGlow: {
    position: 'absolute',
    opacity: 0.28,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    color: colors.text,
    fontWeight: '700',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
  },
});
