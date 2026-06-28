import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G, Line, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import theme from '../theme';

/**
 * Dial — the static watch face.
 *
 * A centered mechanical dial drawn in react-native-svg:
 *  - an outer brass bezel ring,
 *  - 90 minute ticks (every 5th longer + heavier),
 *  - a lume "mainspring" arc showing the set duration out of maxMinutes,
 *  - the hero minutes number in the display type (no seconds, ever).
 *
 * A1 is static: `minutes` is hardcoded by the caller, no interaction yet.
 */

type DialProps = {
  /** Set duration in minutes. */
  minutes: number;
  /** Full-scale of the dial. */
  maxMinutes?: number;
  /** Rendered width/height in px. */
  size?: number;
};

const VB = 300; // SVG viewBox is square; all geometry is in viewBox units
const C = VB / 2; // center

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

export default function Dial({ minutes, maxMinutes = theme.dial.maxMinutes, size = 320 }: DialProps) {
  const ticks = theme.dial.ticks; // 90, one per minute
  const fraction = Math.max(0, Math.min(1, minutes / maxMinutes));
  const sweep = fraction * 360;

  // Radii in viewBox units
  const bezelR = 142;
  const tickOuterR = 134;
  const tickLenShort = 7;
  const tickLenLong = 15;
  const arcR = 116; // lume mainspring band sits inside the ticks

  const numberSize = size * 0.4; // hero figure scales with the dial

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
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
      </Svg>

      {/* Hero minutes number — overlaid RN text in the display type, no seconds */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
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
