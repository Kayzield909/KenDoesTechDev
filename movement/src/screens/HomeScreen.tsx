import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import theme from '../theme';
import Dial from '../components/Dial';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  // Generous side margins; cap so it never dominates large screens.
  const dialSize = Math.min(width - theme.space['3xl'] * 2, 340);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg[0],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <StatusBar style="light" />

      {/* A1: static dial, 25 minutes hardcoded, no interaction yet. */}
      <Dial minutes={25} size={dialSize} />
    </View>
  );
}
