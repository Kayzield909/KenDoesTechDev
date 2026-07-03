import React, { useRef } from 'react';
import { View, Text, Pressable, PanResponder, StyleSheet, GestureResponderEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import theme from '../theme';
import type { TimerStatus } from '../hooks/useTimerEngine';
import BalanceWheel from './BalanceWheel';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Dial — the watch face and the primary control surface.
 *
 *  - Idle: drag the bezel to set minutes (per-minute detent haptics); a lume pip
 *    marks the set value; tap the center to start.
 *  - Running / windingDown: a sweeping hand crosses the dial over the full
 *    duration, the lume mainspring arc unwinds as time drains, and the balance
 *    wheel beats beneath the number. Tap center to pause, long-press to reset.
 *
 * All motion is driven off the engine's shared elapsed/total values, on the UI
 * thread, so it stays smooth at 60fps with no per-second jank.
 */

type DialProps = {
  /** Set duration in minutes (idle pip + drag target). */
  minutes: number;
  /** Number to display (remaining minutes while running). */
  numberValue: number;
  onChangeMinutes?: (minutes: number) => void;
  onCenterPress?: () => void;
  onCenterLongPress?: () => void;
  status: TimerStatus;
  elapsedMs: SharedValue<number>;
  totalMs: SharedValue<number>;
  maxMinutes?: number;
  size?: number;
};

const VB = 300; // square viewBox; all geometry is in viewBox units
const C = VB / 2;
const MIN_MINUTES = 1;

// Radii
const BEZEL_R = 142;
const TICK_OUTER_R = 134;
const ARC_R = 116; // lume mainspring band, inside the ticks
const HAND_TIP_R = 124;
const HAND_TAIL_R = 22;
const BALANCE_CY = C + 62;
const BALANCE_R = 18;

// Min finger travel (px) before a touch counts as a bezel drag rather than a tap.
const DRAG_THRESHOLD = 8;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Polar → cartesian, 0° at 12 o'clock, clockwise. (Worklet-safe.) */
function pointOnDial(radius: number, angleDeg: number) {
  'worklet';
  const rad = (angleDeg * Math.PI) / 180;
  return { x: C + radius * Math.sin(rad), y: C - radius * Math.cos(rad) };
}

/** SVG arc path along `radius`, startDeg → endDeg clockwise. (Worklet-safe.) */
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
  onChangeMinutes,
  onCenterPress,
  onCenterLongPress,
  status,
  elapsedMs,
  totalMs,
  maxMinutes = theme.dial.maxMinutes,
  size = 320,
}: DialProps) {
  const ticks = theme.dial.ticks;
  const idle = status === 'idle';
  const numberSize = size * 0.38;

  // --- Bezel-drag (idle only). Refs keep PanResponder handlers fresh. ---
  const minutesRef = useRef(minutes);
  minutesRef.current = minutes;
  const onChangeRef = useRef(onChangeMinutes);
  onChangeRef.current = onChangeMinutes;

  const accRef = useRef(minutes);
  const lastAngleRef = useRef(0);
  const lastRoundedRef = useRef(minutes);

  const angleFromTouch = (e: GestureResponderEvent) => {
    const dx = e.nativeEvent.locationX - size / 2;
    const dy = e.nativeEvent.locationY - size / 2;
    let a = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (a < 0) a += 360;
    return a;
  };

  const panResponder = useRef(
    PanResponder.create({
      // Claim only once the finger has really moved (a drag), and only while
      // idle — so a thumb tap/long-press (which always jitters a few px) falls
      // through to the center start/pause button instead of being eaten as a
      // micro bezel-drag.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        idleRef.current && Math.hypot(gestureState.dx, gestureState.dy) > DRAG_THRESHOLD,
      onPanResponderGrant: (e) => {
        accRef.current = minutesRef.current;
        lastRoundedRef.current = minutesRef.current;
        lastAngleRef.current = angleFromTouch(e);
      },
      onPanResponderMove: (e) => {
        const a = angleFromTouch(e);
        let diff = a - lastAngleRef.current;
        if (diff > 180) diff -= 360;
        else if (diff < -180) diff += 360;
        lastAngleRef.current = a;

        accRef.current = clamp(
          accRef.current + (diff / 360) * maxMinutes,
          MIN_MINUTES,
          maxMinutes,
        );
        const rounded = Math.round(accRef.current);
        if (rounded !== lastRoundedRef.current) {
          lastRoundedRef.current = rounded;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // crown detent
          onChangeRef.current?.(rounded);
        }
      },
    }),
  ).current;
  // Keep an `idle` snapshot for the responder predicate without rebuilding it.
  const idleRef = useRef(idle);
  idleRef.current = idle;

  // --- Animated mainspring arc: unwinds as remaining time drains. ---
  const arcAnimatedProps = useAnimatedProps(() => {
    const maxMs = maxMinutes * 60000;
    const remaining = totalMs.value - elapsedMs.value;
    const f = Math.max(0, Math.min(1, remaining / maxMs));
    const sweep = f * 360;
    if (sweep <= 0.001) return { d: '' };
    return { d: arcPath(ARC_R, 0, Math.min(sweep, 359.999)) };
  });

  // --- Sweeping hand: elapsed fraction → rotation. ---
  const handAnimatedProps = useAnimatedProps(() => {
    const frac = totalMs.value > 0 ? elapsedMs.value / totalMs.value : 0;
    return { rotation: frac * 360 };
  });

  // Idle pip at the set-value arc end.
  const pipAngle = (clamp(minutes, 0, maxMinutes) / maxMinutes) * 360;
  const pip = pointOnDial(ARC_R, pipAngle);

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      {...panResponder.panHandlers}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
        <Defs>
          <RadialGradient id="face" cx="50%" cy="44%" r="60%">
            <Stop offset="0%" stopColor={theme.colors.bg[3]} />
            <Stop offset="70%" stopColor={theme.colors.bg[2]} />
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
        <Circle cx={C} cy={C} r={ARC_R} stroke={theme.colors.bg.line} strokeWidth={5} fill="none" />
        <AnimatedPath
          animatedProps={arcAnimatedProps}
          stroke={theme.colors.lume.glow}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />

        {/* Sweeping hand (running states only) */}
        {!idle && (
          <AnimatedG origin={`${C}, ${C}`} animatedProps={handAnimatedProps}>
            <Line
              x1={C}
              y1={C + HAND_TAIL_R}
              x2={C}
              y2={C - HAND_TIP_R}
              stroke={theme.colors.brass.hi}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <Circle cx={C} cy={C - HAND_TIP_R} r={4} fill={theme.colors.lume.glow} />
          </AnimatedG>
        )}

        {/* Center cap */}
        <Circle cx={C} cy={C} r={5} fill={theme.colors.brass.hi} />

        {/* Idle grab pip */}
        {idle && (
          <>
            <Circle cx={pip.x} cy={pip.y} r={9} fill={theme.colors.lume.rest} opacity={0.25} />
            <Circle cx={pip.x} cy={pip.y} r={5} fill={theme.colors.lume.glow} />
          </>
        )}

        {/* Balance wheel beneath the number (running states only) */}
        {!idle && <BalanceWheel cx={C} cy={BALANCE_CY} r={BALANCE_R} status={status} />}
      </Svg>

      {/* Hero minutes number — overlaid RN text, nudged up to clear the balance. */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ translateY: -size * 0.06 }],
          },
        ]}
      >
        <Text
          style={{
            color: theme.colors.text.primary,
            fontFamily: theme.fonts.display,
            fontSize: numberSize,
            fontWeight: theme.fontWeight.bold,
            lineHeight: numberSize * 1.02,
            letterSpacing: -2,
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
            marginTop: -size * 0.01,
          }}
        >
          MIN
        </Text>
      </View>

      {/* Center control: tap = start/pause/resume, long-press = reset. */}
      <Pressable
        onPress={onCenterPress}
        onLongPress={onCenterLongPress}
        delayLongPress={450}
        accessibilityRole="button"
        accessibilityLabel="Start, pause, or reset the timer"
        style={{
          position: 'absolute',
          top: size * 0.25,
          left: size * 0.25,
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size * 0.25,
          // transparent — the number/balance are the visible affordance
        }}
      />
    </View>
  );
}
