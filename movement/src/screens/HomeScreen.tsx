import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import theme from '../theme';

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg[0],
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.space.sm,
      }}
    >
      <StatusBar style="light" />

      {/* Placeholder dial ring */}
      <View
        style={{
          width: 280,
          height: 280,
          borderRadius: 140,
          borderWidth: 2,
          borderColor: theme.colors.brass.base,
          backgroundColor: theme.colors.bg[2],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: theme.colors.lume.glow,
            fontSize: theme.fontSize.xl,
            fontWeight: theme.fontWeight.bold,
            letterSpacing: 2,
          }}
        >
          MOVEMENT
        </Text>
        <Text
          style={{
            color: theme.colors.text.muted,
            fontSize: theme.fontSize.caption,
            letterSpacing: 3,
            marginTop: theme.space.xs,
          }}
        >
          SLEEP TIMER
        </Text>
      </View>

      {/* Token smoke-test strip */}
      <View style={{ flexDirection: 'row', gap: theme.space.sm, marginTop: theme.space.xl }}>
        {[
          theme.colors.bg[3],
          theme.colors.brass.dim,
          theme.colors.brass.base,
          theme.colors.brass.hi,
          theme.colors.lume.rest,
          theme.colors.lume.glow,
        ].map((color) => (
          <View
            key={color}
            style={{
              width: 32,
              height: 32,
              borderRadius: theme.radius.sm,
              backgroundColor: color,
            }}
          />
        ))}
      </View>

      <Text
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.fontSize.sm,
          marginTop: theme.space.md,
        }}
      >
        A0 scaffold — theme tokens ✓
      </Text>
    </View>
  );
}
