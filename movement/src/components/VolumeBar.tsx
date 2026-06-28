import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import theme from '../theme';
import { SC } from '../hooks/useTimerEngine';

/**
 * VolumeBar — Phase A stand-in for the real media fade (Phase B / AudioManager).
 *
 * Shows a "media volume" level that holds full while running and ramps to zero
 * across the wind-down window, mirroring what the native audio fade will do.
 * Hidden when idle. Driven entirely off shared values on the UI thread.
 */

const TRACK_W = 160;

type VolumeBarProps = {
  statusCode: SharedValue<number>;
  elapsedMs: SharedValue<number>;
  totalMs: SharedValue<number>;
  windDownMs: SharedValue<number>;
};

export default function VolumeBar({ statusCode, elapsedMs, totalMs, windDownMs }: VolumeBarProps) {
  const fraction = (sc: number, remaining: number, wd: number) => {
    'worklet';
    if (sc === SC.running) return 1;
    // windingDown or paused-mid-winddown: track the remaining fraction of the window
    if (sc === SC.windingDown || sc === SC.paused) {
      return Math.max(0, Math.min(1, remaining / wd));
    }
    return 0; // done / idle
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: statusCode.value === SC.idle ? 0 : 1,
  }));

  const fillStyle = useAnimatedStyle(() => {
    const remaining = totalMs.value - elapsedMs.value;
    const f = fraction(statusCode.value, remaining, windDownMs.value);
    return { width: TRACK_W * f };
  });

  return (
    <Animated.View style={[{ alignItems: 'center', gap: theme.space.sm }, containerStyle]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
        {/* speaker glyph */}
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path
            d="M4 9 H8 L13 5 V19 L8 15 H4 Z"
            fill={theme.colors.text.muted}
          />
          <Path
            d="M16 8 Q19 12 16 16"
            stroke={theme.colors.text.muted}
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
        <View
          style={{
            width: TRACK_W,
            height: 4,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.bg.line,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={[
              {
                height: 4,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.lume.rest,
              },
              fillStyle,
            ]}
          />
        </View>
      </View>
      <Text
        style={{
          color: theme.colors.text.muted,
          fontFamily: theme.fonts.mono,
          fontSize: theme.fontSize.caption,
          letterSpacing: 4,
        }}
      >
        MEDIA · SIMULATED
      </Text>
    </Animated.View>
  );
}
