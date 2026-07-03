import React from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import theme from '../theme';
import type { TimerStatus } from '../hooks/useTimerEngine';

/**
 * Controls — explicit transport buttons (no gestures).
 *  - idle:            [ Start ▸ ]
 *  - running/winding: [ ↺ ] [ Pause ⏸ ]
 *  - paused:          [ ↺ ] [ Resume ▸ ]
 *  - done:            [ ↺ Reset ]
 *
 * Buttons are large and clearly separated so half-asleep taps don't misfire —
 * checking the timer no longer risks pausing it.
 */

type ControlsProps = {
  status: TimerStatus;
  onToggle: () => void; // start / pause / resume / (reset when done)
  onReset: () => void;
};

const PLAY = 'M8 5 L8 19 L19 12 Z';

function PlayIcon({ color, size = 30 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={PLAY} fill={color} />
    </Svg>
  );
}

function PauseIcon({ color, size = 30 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={6} y={5} width={4} height={14} rx={1.5} fill={color} />
      <Rect x={14} y={5} width={4} height={14} rx={1.5} fill={color} />
    </Svg>
  );
}

function ResetIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* circular arrow (restart) */}
      <Path
        d="M18.4 7.5 A8 8 0 1 0 20 12"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M20 4 L20 8 L16 8"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RoundButton({
  onPress,
  diameter,
  filled,
  children,
  label,
}: {
  onPress: () => void;
  diameter: number;
  filled: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: filled ? theme.colors.brass.hi : theme.colors.bg[2],
        borderWidth: filled ? 0 : 1,
        borderColor: theme.colors.bg.line,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

export default function Controls({ status, onToggle, onReset }: ControlsProps) {
  const running = status === 'running' || status === 'windingDown';
  const done = status === 'done';

  const handleToggle = () => {
    Haptics.impactAsync(running ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };
  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReset();
  };

  // Completion: a single, obvious Reset.
  if (done) {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <RoundButton onPress={handleReset} diameter={72} filled label="Reset">
          <ResetIcon color={theme.colors.bg[0]} size={30} />
        </RoundButton>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.space['2xl'] }}>
      {status !== 'idle' && (
        <RoundButton onPress={handleReset} diameter={52} filled={false} label="Reset">
          <ResetIcon color={theme.colors.brass.base} size={22} />
        </RoundButton>
      )}
      <RoundButton onPress={handleToggle} diameter={72} filled label={running ? 'Pause' : 'Start'}>
        {running ? (
          <PauseIcon color={theme.colors.bg[0]} />
        ) : (
          <PlayIcon color={theme.colors.bg[0]} />
        )}
      </RoundButton>
    </View>
  );
}
