import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import theme from '../theme';

/**
 * PresetChips — the fast path to a duration.
 *
 * One-tap whole-minute presets (20/25/30/45/60/90). A tap commits the value
 * with a medium haptic. The active preset is lit in lume; the rest are quiet
 * brass on a raised surface. Targets are ≥44pt for half-asleep one-handed taps.
 */

type PresetChipsProps = {
  value: number;
  onSelect: (minutes: number) => void;
  presets?: readonly number[];
};

export default function PresetChips({
  value,
  onSelect,
  presets = theme.dial.presets,
}: PresetChipsProps) {
  const handlePress = (m: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(m);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: theme.space.sm,
        paddingHorizontal: theme.space.lg,
      }}
    >
      {presets.map((m) => {
        const active = m === value;
        return (
          <Pressable
            key={m}
            onPress={() => handlePress(m)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${m} minutes`}
            style={({ pressed }) => ({
              minWidth: 64,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: theme.space.lg,
              borderRadius: theme.radius.full,
              borderWidth: 1,
              borderColor: active ? theme.colors.lume.rest : theme.colors.bg.line,
              backgroundColor: active ? theme.colors.bg[3] : theme.colors.bg[1],
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                color: active ? theme.colors.lume.glow : theme.colors.text.secondary,
                fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.preset,
                fontWeight: active ? theme.fontWeight.bold : theme.fontWeight.medium,
                fontVariant: ['tabular-nums'],
              }}
            >
              {m}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
