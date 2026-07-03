import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import theme from '../theme';
import PresetChips from './PresetChips';

/**
 * TimeControls — set the duration with buttons only (no bezel drag).
 *  - a −/+ stepper for fine adjustment (1 min),
 *  - preset chips for the common durations.
 */

const MIN = 1;
const MAX = theme.dial.maxMinutes;

function StepButton({ label, onPress, hint }: { label: string; onPress: () => void; hint: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={hint}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 1,
        borderColor: theme.colors.bg.line,
        backgroundColor: theme.colors.bg[2],
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text
        style={{
          color: theme.colors.brass.hi,
          fontFamily: theme.fonts.display,
          fontSize: 26,
          lineHeight: 30,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type TimeControlsProps = {
  value: number;
  onChange: (minutes: number) => void;
};

export default function TimeControls({ value, onChange }: TimeControlsProps) {
  const step = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(Math.max(MIN, Math.min(MAX, value + delta)));
  };

  return (
    <View style={{ alignItems: 'center', gap: theme.space.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space['2xl'] }}>
        <StepButton label="−" onPress={() => step(-1)} hint="Minus one minute" />
        <StepButton label="+" onPress={() => step(1)} hint="Plus one minute" />
      </View>
      <PresetChips value={value} onSelect={onChange} />
    </View>
  );
}
