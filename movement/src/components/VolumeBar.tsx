import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import theme from '../theme';
import { SC } from '../hooks/useTimerEngine';

/**
 * VolumeBar — shows the real media-volume level the audio controller is driving.
 *
 * Holds at the captured level while running, ramps to zero across wind-down,
 * and reflects the restored level afterwards. Hidden when idle. In Expo Go
 * (no native module) the same value animates as a simulation.
 */

const TRACK_W = 160;

type VolumeBarProps = {
  /** 0..1 media volume, driven by useAudioController. */
  volumeFraction: SharedValue<number>;
  statusCode: SharedValue<number>;
  /** Whether the native audio module is present. */
  native: boolean;
};

export default function VolumeBar({ volumeFraction, statusCode, native }: VolumeBarProps) {
  const containerStyle = useAnimatedStyle(() => ({
    opacity: statusCode.value === SC.idle ? 0 : 1,
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: TRACK_W * Math.max(0, Math.min(1, volumeFraction.value)),
  }));

  return (
    <Animated.View style={[{ alignItems: 'center', gap: theme.space.sm }, containerStyle]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
        {/* speaker glyph */}
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill={theme.colors.text.muted} />
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
              { height: 4, borderRadius: theme.radius.full, backgroundColor: theme.colors.lume.rest },
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
        {native ? 'MEDIA VOLUME' : 'MEDIA VOLUME · SIM'}
      </Text>
    </Animated.View>
  );
}
