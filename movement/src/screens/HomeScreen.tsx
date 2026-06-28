import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import theme from '../theme';
import Dial from '../components/Dial';
import PresetChips from '../components/PresetChips';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  // Generous side margins; cap so it never dominates large screens.
  const dialSize = Math.min(width - theme.space['3xl'] * 2, 340);

  const [minutes, setMinutes] = useState(25);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg[0], alignItems: 'center' }}>
      <StatusBar style="light" />

      {/* Top spacer larger than bottom → content sits below center, thumb-reachable. */}
      <View style={{ flex: 1 }} />

      {/* A2: bezel-drag sets the minutes (1–90) with per-minute detent haptics. */}
      <Dial minutes={minutes} onChange={setMinutes} interactive size={dialSize} />

      <View style={{ height: theme.space['3xl'] }} />

      {/* One-tap presets, medium haptic on commit. */}
      <PresetChips value={minutes} onSelect={setMinutes} />

      <View style={{ flex: 0.6 }} />
    </View>
  );
}
