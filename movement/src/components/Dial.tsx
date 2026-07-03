import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Line, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import theme from '../theme';
import type { TimerStatus } from '../hooks/useTimerEngine';
import BalanceWheel from './BalanceWheel';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Dial — the watch face. Display-only (all control moved to explicit buttons).
 *
 * Layers (react-native-svg):
 *  - recessed warm face + brass bezel rings,
 *  - 90 minute ticks (every 5th longer/heavier),
 *  - a lume "mainspring" arc that unwinds as time drains, with a leading pip
 *    that sweeps in the tick band (never crossing the number),
 *  - the balance wheel beating beneath the number while active,
 *  - the hero minutes number (no seconds).
 */

type DialProps = {
  /** Set duration in minutes (drives the marker while idle). */
  minutes: number;
  /** Number to display (remaining minutes while running). */
  numberValue: number;
  status: TimerStatus;
  elapsedMs: SharedValue<number>;
  totalMs: SharedValue<number>;
  maxMinutes?: number;
  size?: number;
};

const VB = 300;
const C = VB / 2;
const BEZEL_R = 142;
const TICK_OUTER_R = 134;
const ARC_R = 118; // lume mainspring band, in the tick zone (clear of the number)
const BALANCE_CY = C + 70;
const BALANCE_R = 14;

/** Polar → cartesian, 0° at 12 o'clock, clockwise. (Worklet-safe.) */
function pointOnDial(radius: number, angleDeg: number) {
  'worklet';
  const rad = (angleDeg * Math.PI) / 180;
  return { x: C + radius * Math.sin(rad), y: C - radius * Math.cos(rad) };
}

/** SVG arc path, startDeg → endDeg clockwise. (Worklet-safe.) */
function arcPath(radius: number, startDeg: number, endDeg: number) {
  'worklet';
  const start = pointOnDial(radius, startDeg);
  const end = pointOnDial(radius, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export default function Dial({
  minutes,
  numberValue,
  status,
  elapsedMs,
  totalMs,
  maxMinutes = theme.dial.maxMinutes,
  size = 320,
}: DialProps) {
  const idle = status === 'idle';
  const ticks = theme.dial.ticks;
  const numberSize = size * 0.34;

  // Unwinding lume arc: fraction of remaining time over the full 90-min scale.
  const arcAnimatedProps = useAnimatedProps(() => {
    const maxMs = maxMinutes * 60000;
    const remaining = totalMs.value - elapsedMs.value;
    const f = Math.max(0, Math.min(1, remaining / maxMs));
    const sweep = f * 360;
    if (sweep <= 0.001) return { d: '' };
    return { d: arcPath(ARC_R, 0, Math.min(sweep, 359.999)) };
  });

  // Leading pip rides the arc's end (the remaining-time marker).
  const pipAnimatedProps = useAnimatedProps(() => {
    const maxMs = maxMinutes * 60000;
    const remaining = totalMs.value - elapsedMs.value;
    const f = Math.max(0, Math.min(1, remaining / maxMs));
    const p = pointOnDial(ARC_R, f * 360);
    return { cx: p.x, cy: p.y };
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
        <Defs>
          <RadialGradient id="face" cx="50%" cy="42%" r="62%">
            <Stop offset="0%" stopColor={theme.colors.bg[3]} />
            <Stop offset="68%" stopColor={theme.colors.bg[2]} />
            <Stop offset="100%" stopColor={theme.colors.bg[1]} />
          </RadialGradient>
        </Defs>

        {/* Recessed face + bezel rings */}
        <Circle cx={C} cy={C} r={BEZEL_R - 2} fill="url(#face)" />
        <Circle cx={C} cy={C} r={BEZEL_R} stroke={theme.colors.brass.base} strokeWidth={2} fill="none" />
        <Circle cx={C} cy={C} r={BEZEL_R - 8} stroke={theme.colors.brass.dim} strokeWidth={1} fill="none" />

        {/* Minute ticks */}
        <G>
          {Array.from({ length: ticks }, (_, i) => {
            const angle = (i / ticks) * 360;
            const isMajor = i % 5 === 0;
            const len = isMajor ? 15 : 7;
            const outer = pointOnDial(TICK_OUTER_R, angle);
            const inner = pointOnDial(TICK_OUTER_R - len, angle);
            return (
              <Line
                key={i}
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke={isMajor ? theme.colors.brass.base : theme.colors.brass.dim}
                strokeWidth={isMajor ? 2.5 : 1.25}
                strokeLinecap="round"
              />
            );
          })}
        </G>

        {/* Mainspring track + unwinding lume arc */}
        <Circle cx={C} cy={C} r={ARC_R} stroke={theme.colors.bg.line} strokeWidth={4} fill="none" />
        <AnimatedPath
          animatedProps={arcAnimatedProps}
          stroke={theme.colors.lume.glow}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />

        {/* Leading pip on the arc */}
        <AnimatedCircle animatedProps={pipAnimatedProps} r={5} fill={theme.colors.lume.glow} />

        {/* Balance wheel beneath the number (running states) */}
        {!idle && <BalanceWheel cx={C} cy={BALANCE_CY} r={BALANCE_R} status={status} />}
      </Svg>

      {/* Hero minutes number — overlaid RN text, nudged up to clear the balance. */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -size * 0.05 }] },
        ]}
      >
        <Text
          style={{
            color: theme.colors.text.primary,
            fontFamily: theme.fonts.display,
            fontSize: numberSize,
            fontWeight: theme.fontWeight.bold,
            lineHeight: numberSize * 1.02,
            letterSpacing: -1,
            fontVariant: ['tabular-nums'],
          }}
        >
          {numberValue}
        </Text>
        <Text
          style={{
            color: theme.colors.text.muted,
            fontFamily: theme.fonts.mono,
            fontSize: theme.fontSize.caption,
            letterSpacing: 6,
            marginTop: -size * 0.005,
          }}
        >
          MIN
        </Text>
      </View>
    </View>
  );
}
