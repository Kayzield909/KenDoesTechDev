import React, { useRef } from 'react';
import { View, Text, PanResponder, GestureResponderEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import theme from '../theme';

/**
 * Dial — the watch face.
 *
 * Static layers drawn in react-native-svg:
 *  - an outer brass bezel ring,
 *  - 90 minute ticks (every 5th longer + heavier),
 *  - a lume "mainspring" arc showing the set duration out of maxMinutes,
 *  - a draggable bezel pip at the arc's leading edge,
 *  - the hero minutes number in the display type (no seconds, ever).
 *
 * Interaction (A2): when `interactive`, dragging a finger around the bezel
 * rotates it. We accumulate *relative* angle change so crossing 12 o'clock
 * never wraps 90→1, snap to whole minutes, and fire a light haptic on each
 * minute change to mimic a mechanical crown detent.
 */

type DialProps = {
  /** Set duration in minutes (controlled). */
  minutes: number;
  /** Called with the new whole-minute value while dragging. */
  onChange?: (minutes: number) => void;
  /** Enable bezel-drag. */
  interactive?: boolean;
  /** Full-scale of the dial. */
  maxMinutes?: number;
  /** Rendered width/height in px. */
  size?: number;
};

const VB = 300; // SVG viewBox is square; all geometry is in viewBox units
const C = VB / 2; // center
const MIN_MINUTES = 1;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Polar → cartesian with 0° at 12 o'clock, increasing clockwise.
 * (SVG y grows downward, so cos drives -y and sin drives +x.)
 */
function pointOnDial(radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: C + radius * Math.sin(rad),
    y: C - radius * Math.cos(rad),
  };
}

/** Build an SVG arc path along a circle of `radius`, from `startDeg` to `endDeg` clockwise. */
function arcPath(radius: number, startDeg: number, endDeg: number) {
  const start = pointOnDial(radius, startDeg);
  const end = pointOnDial(radius, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  // sweep-flag 1 = clockwise in SVG's y-down coordinate space
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export default function Dial({
  minutes,
  onChange,
  interactive = false,
  maxMinutes = theme.dial.maxMinutes,
  size = 320,
}: DialProps) {
  const ticks = theme.dial.ticks; // 90, one per minute
  const fraction = clamp(minutes / maxMinutes, 0, 1);
  const sweep = fraction * 360;

  // Radii in viewBox units
  const bezelR = 142;
  const tickOuterR = 134;
  const tickLenShort = 7;
  const tickLenLong = 15;
  const arcR = 116; // lume mainspring band sits inside the ticks

  const numberSize = size * 0.4; // hero figure scales with the dial

  // --- Bezel-drag state (refs so PanResponder handlers never go stale) ---
  const minutesRef = useRef(minutes);
  minutesRef.current = minutes;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const accRef = useRef(minutes); // continuous (float) minutes during a drag
  const lastAngleRef = useRef(0); // last touch angle, for relative deltas
  const lastRoundedRef = useRef(minutes);

  // Touch angle: 0° at 12 o'clock, clockwise. locationX/Y are relative to the
  // gesture view (size × size), so center is (size/2, size/2).
  const angleFromTouch = (e: GestureResponderEvent) => {
    const dx = e.nativeEvent.locationX - size / 2;
    const dy = e.nativeEvent.locationY - size / 2;
    let a = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (a < 0) a += 360;
    return a;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        accRef.current = minutesRef.current; // anchor to the current value
        lastRoundedRef.current = minutesRef.current;
        lastAngleRef.current = angleFromTouch(e);
      },
      onPanResponderMove: (e) => {
        const a = angleFromTouch(e);
        let diff = a - lastAngleRef.current;
        // shortest signed delta so a drag never "jumps" across the seam
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
          // mechanical crown detent per minute
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChangeRef.current?.(rounded);
        }
      },
    }),
  ).current;

  const pip = pointOnDial(arcR, sweep);

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      {...(interactive ? panResponder.panHandlers : {})}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
        <Defs>
          {/* Subtle warm vignette so the face reads as a recessed plate */}
          <RadialGradient id="face" cx="50%" cy="44%" r="60%">
            <Stop offset="0%" stopColor={theme.colors.bg[3]} />
            <Stop offset="70%" stopColor={theme.colors.bg[2]} />
            <Stop offset="100%" stopColor={theme.colors.bg[1]} />
          </RadialGradient>
        </Defs>

        {/* Recessed dial face */}
        <Circle cx={C} cy={C} r={bezelR - 2} fill="url(#face)" />

        {/* Outer + inner bezel rings (brass) */}
        <Circle cx={C} cy={C} r={bezelR} stroke={theme.colors.brass.base} strokeWidth={2} fill="none" />
        <Circle cx={C} cy={C} r={bezelR - 8} stroke={theme.colors.brass.dim} strokeWidth={1} fill="none" />

        {/* Minute ticks */}
        <G>
          {Array.from({ length: ticks }, (_, i) => {
            const angle = (i / ticks) * 360;
            const isMajor = i % 5 === 0;
            const len = isMajor ? tickLenLong : tickLenShort;
            const outer = pointOnDial(tickOuterR, angle);
            const inner = pointOnDial(tickOuterR - len, angle);
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

        {/* Mainspring track (full, dim) + lit arc for the set duration */}
        <Circle cx={C} cy={C} r={arcR} stroke={theme.colors.bg.line} strokeWidth={5} fill="none" />
        {sweep > 0 && (
          <Path
            d={arcPath(arcR, 0, Math.min(sweep, 359.999))}
            stroke={theme.colors.lume.glow}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Draggable bezel pip at the arc's leading edge */}
        <Circle cx={pip.x} cy={pip.y} r={9} fill={theme.colors.lume.rest} opacity={0.25} />
        <Circle cx={pip.x} cy={pip.y} r={5} fill={theme.colors.lume.glow} />
      </Svg>

      {/* Hero minutes number — overlaid RN text in the display type, no seconds */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text
          style={{
            color: theme.colors.text.primary,
            fontFamily: theme.fonts.display,
            fontSize: numberSize,
            fontWeight: theme.fontWeight.bold,
            lineHeight: numberSize * 1.02,
            letterSpacing: -2,
            // tabular figures so digits don't jump as the value changes
            fontVariant: ['tabular-nums'],
          }}
        >
          {minutes}
        </Text>
        <Text
          style={{
            color: theme.colors.text.muted,
            fontFamily: theme.fonts.mono,
            fontSize: theme.fontSize.caption,
            letterSpacing: 6,
            marginTop: -size * 0.02,
          }}
        >
          MIN
        </Text>
      </View>
    </View>
  );
}
