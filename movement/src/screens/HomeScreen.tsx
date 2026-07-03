import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Line, Circle } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import theme from '../theme';
import Dial from '../components/Dial';
import TimeControls from '../components/TimeControls';
import Controls from '../components/Controls';
import VolumeBar from '../components/VolumeBar';
import SettingsSheet from '../components/SettingsSheet';
import { useTimerEngine, SC } from '../hooks/useTimerEngine';
import { useAudioController } from '../hooks/useAudioController';

const KEEP_AWAKE_TAG = 'movement-timer';
const MAX_DIM = 0.92;

function GearButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button" accessibilityLabel="Settings" style={{ padding: theme.space.sm }}>
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Line x1={3} y1={8} x2={21} y2={8} stroke={theme.colors.brass.base} strokeWidth={1.5} />
        <Circle cx={9} cy={8} r={3.2} fill={theme.colors.bg[0]} stroke={theme.colors.brass.hi} strokeWidth={1.5} />
        <Line x1={3} y1={16} x2={21} y2={16} stroke={theme.colors.brass.base} strokeWidth={1.5} />
        <Circle cx={15} cy={16} r={3.2} fill={theme.colors.bg[0]} stroke={theme.colors.brass.hi} strokeWidth={1.5} />
      </Svg>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const dialSize = Math.min(width - theme.space.xl * 2, 360);

  const [minutes, setMinutes] = useState(25);
  const [windDownSec, setWindDownSec] = useState(60);
  const [keepAwake, setKeepAwake] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const engine = useTimerEngine({
    durationMs: minutes * 60000,
    windDownMs: windDownSec * 1000,
    onComplete: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  });
  const { status, statusCode, elapsedMs, totalMs, windDownMs, displayMinutes, toggle, reset } = engine;

  const audio = useAudioController();

  // Wire wind-down → real media volume.
  useEffect(() => {
    switch (status) {
      case 'windingDown':
        audio.fadeOut(Math.max(0, totalMs.value - elapsedMs.value));
        break;
      case 'done':
        audio.finish();
        break;
      case 'paused':
        audio.restore(false);
        break;
      case 'idle':
        audio.restore(true);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Safety: never leave the device muted if the screen unmounts mid-fade.
  useEffect(() => {
    return () => {
      audio.restore(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep-awake only while running.
  useEffect(() => {
    const active = keepAwake && (status === 'running' || status === 'windingDown');
    if (active) activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    else deactivateKeepAwake(KEEP_AWAKE_TAG);
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [keepAwake, status]);

  // Dial fades out on completion, restores otherwise.
  const dialOpacity = useSharedValue(1);
  useEffect(() => {
    dialOpacity.value =
      status === 'done'
        ? withTiming(0, { duration: theme.duration.completeFade })
        : withTiming(1, { duration: theme.duration.dim });
  }, [status, dialOpacity]);
  const dialFadeStyle = useAnimatedStyle(() => ({ opacity: dialOpacity.value }));

  // Wind-down dim overlay.
  const dimStyle = useAnimatedStyle(() => {
    const sc = statusCode.value;
    if (sc === SC.idle) return { opacity: 0 };
    if (sc === SC.done) return { opacity: MAX_DIM };
    const remaining = totalMs.value - elapsedMs.value;
    const wd = windDownMs.value;
    const f = remaining < wd ? 1 - remaining / wd : 0;
    return { opacity: Math.max(0, Math.min(1, f)) * MAX_DIM };
  });

  const numberValue = status === 'idle' ? minutes : displayMinutes;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg[0] }}>
      <StatusBar style="light" />

      {/* Dial layer — dims under the overlay and fades on completion. */}
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, dialFadeStyle]}>
        <Dial
          minutes={minutes}
          numberValue={numberValue}
          status={status}
          elapsedMs={elapsedMs}
          totalMs={totalMs}
          size={dialSize}
        />
      </Animated.View>

      {/* Wind-down dim toward black. Pass-through. */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, dimStyle]} />

      {/* Foreground UI. */}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View
          pointerEvents="box-none"
          style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: theme.space['3xl'], paddingHorizontal: theme.space.lg }}
        >
          <GearButton onPress={() => setSettingsVisible(true)} />
        </View>

        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: theme.space['3xl'], alignItems: 'center', gap: theme.space.xl }}
        >
          {status === 'idle' ? (
            <TimeControls value={minutes} onChange={setMinutes} />
          ) : (
            <VolumeBar volumeFraction={audio.volumeFraction} statusCode={statusCode} native={audio.native} />
          )}

          <Controls status={status} onToggle={toggle} onReset={reset} />
        </View>
      </View>

      <SettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        windDownSec={windDownSec}
        onChangeWindDown={setWindDownSec}
        keepAwake={keepAwake}
        onToggleKeepAwake={setKeepAwake}
      />
    </View>
  );
}
