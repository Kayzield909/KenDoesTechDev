import React, { useEffect } from 'react';
import { G, Circle, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSpring,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import theme from '../theme';
import type { TimerStatus } from '../hooks/useTimerEngine';

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * BalanceWheel — the signature mechanical motion.
 *
 * A small spoked wheel that oscillates back and forth on a looping spring.
 * It only swings while the timer is active; during wind-down the beat softens
 * and slows, and on completion it coasts to rest at center.
 *
 * Rendered inside the Dial's <Svg>, so coordinates are in viewBox units.
 */

type BalanceWheelProps = {
  cx: number;
  cy: number;
  r: number;
  status: TimerStatus;
};

const REST_AMP = 16; // peak swing in degrees

// Spring beats — underdamped so the wheel overshoots like a real escapement.
const BEAT_RUNNING = { damping: 6, stiffness: 95, mass: 0.6 };
const BEAT_WINDDOWN = { damping: 9, stiffness: 34, mass: 1 }; // slower, calmer

export default function BalanceWheel({ cx, cy, r, status }: BalanceWheelProps) {
  const tilt = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(tilt);

    if (status === 'running') {
      tilt.value = -REST_AMP;
      tilt.value = withRepeat(withSpring(REST_AMP, BEAT_RUNNING), -1, true);
    } else if (status === 'windingDown') {
      tilt.value = -REST_AMP * 0.7;
      tilt.value = withRepeat(withSpring(REST_AMP * 0.7, BEAT_WINDDOWN), -1, true);
    } else if (status === 'done') {
      // coast to a stop, settling at center
      tilt.value = withTiming(0, { duration: 2400, easing: Easing.out(Easing.cubic) });
    } else {
      // idle / paused — settle quietly to center
      tilt.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) });
    }

    return () => cancelAnimation(tilt);
  }, [status, tilt]);

  const animatedProps = useAnimatedProps(() => ({ rotation: tilt.value }));

  const rim = theme.colors.brass.base;
  const spoke = theme.colors.brass.dim;
  const lit = status === 'running' || status === 'windingDown';

  return (
    <AnimatedG origin={`${cx}, ${cy}`} animatedProps={animatedProps}>
      {/* rim */}
      <Circle cx={cx} cy={cy} r={r} stroke={rim} strokeWidth={2} fill="none" />
      {/* spokes */}
      <Line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={spoke} strokeWidth={1.5} />
      <Line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={spoke} strokeWidth={1.5} />
      <Line
        x1={cx - r * 0.707}
        y1={cy - r * 0.707}
        x2={cx + r * 0.707}
        y2={cy + r * 0.707}
        stroke={spoke}
        strokeWidth={1.25}
      />
      <Line
        x1={cx - r * 0.707}
        y1={cy + r * 0.707}
        x2={cx + r * 0.707}
        y2={cy - r * 0.707}
        stroke={spoke}
        strokeWidth={1.25}
      />
      {/* hub — lume when beating */}
      <Circle cx={cx} cy={cy} r={3.5} fill={lit ? theme.colors.lume.glow : theme.colors.brass.hi} />
    </AnimatedG>
  );
}
