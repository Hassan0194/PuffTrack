import { useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';

import { toCountUnit, type UnitInput } from '../domain/consumption';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';

type PuffButtonProps = {
  onPress: () => void;
  unit?: UnitInput;
};

export function PuffButton({ onPress, unit = false }: PuffButtonProps) {
  const kind = toCountUnit(unit);
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.timing(scale, {
      toValue: value,
      duration: value === 1 ? 120 : 60,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${kind}`}
        android_ripple={{ color: 'rgba(4, 36, 28, 0.18)' }}
        onPress={onPress}
        onPressIn={() => animateTo(0.965)}
        onPressOut={() => animateTo(1)}
        style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
      >
        <Text style={styles.label}>{`+ ${kind.toUpperCase()}`}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  button: {
    minHeight: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: {
    backgroundColor: colors.accentPressed,
  },
  label: {
    color: colors.onAccent,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});
