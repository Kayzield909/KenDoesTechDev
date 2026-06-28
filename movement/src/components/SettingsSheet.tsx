import React from 'react';
import { View, Text, Pressable, Modal, Switch } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import theme from '../theme';

/**
 * SettingsSheet — a small bottom sheet for the two MVP settings:
 *  - wind-down length (30 / 60 / 90s)
 *  - keep-awake toggle
 *
 * Uses a transparent Modal with a Moti slide-up panel (both run in Expo Go).
 */

const WIND_DOWN_OPTIONS = [30, 60, 90] as const;

type SettingsSheetProps = {
  visible: boolean;
  onClose: () => void;
  windDownSec: number;
  onChangeWindDown: (sec: number) => void;
  keepAwake: boolean;
  onToggleKeepAwake: (v: boolean) => void;
};

export default function SettingsSheet({
  visible,
  onClose,
  windDownSec,
  onChangeWindDown,
  keepAwake,
  onToggleKeepAwake,
}: SettingsSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
      >
        {/* Stop propagation so taps inside the sheet don't close it */}
        <Pressable onPress={() => {}}>
          <MotiView
            from={{ translateY: 360 }}
            animate={{ translateY: 0 }}
            transition={{ type: 'timing', duration: 280 }}
            style={{
              backgroundColor: theme.colors.bg[2],
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              borderTopWidth: 1,
              borderColor: theme.colors.bg.line,
              paddingHorizontal: theme.space.xl,
              paddingTop: theme.space.lg,
              paddingBottom: theme.space['3xl'],
              gap: theme.space.xl,
            }}
          >
            {/* grab handle */}
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.bg.line,
              }}
            />

            <Text
              style={{
                color: theme.colors.text.secondary,
                fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.caption,
                letterSpacing: 4,
              }}
            >
              SETTINGS
            </Text>

            {/* Wind-down length */}
            <View style={{ gap: theme.space.md }}>
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontFamily: theme.fonts.display,
                  fontSize: theme.fontSize.base,
                }}
              >
                Wind-down length
              </Text>
              <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
                {WIND_DOWN_OPTIONS.map((sec) => {
                  const active = sec === windDownSec;
                  return (
                    <Pressable
                      key={sec}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onChangeWindDown(sec);
                      }}
                      style={{
                        flex: 1,
                        minHeight: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: theme.radius.md,
                        borderWidth: 1,
                        borderColor: active ? theme.colors.lume.rest : theme.colors.bg.line,
                        backgroundColor: active ? theme.colors.bg[3] : theme.colors.bg[1],
                      }}
                    >
                      <Text
                        style={{
                          color: active ? theme.colors.lume.glow : theme.colors.text.secondary,
                          fontFamily: theme.fonts.mono,
                          fontSize: theme.fontSize.preset,
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {sec}s
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Keep-awake */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, paddingRight: theme.space.lg }}>
                <Text
                  style={{
                    color: theme.colors.text.primary,
                    fontFamily: theme.fonts.display,
                    fontSize: theme.fontSize.base,
                  }}
                >
                  Keep screen awake
                </Text>
                <Text
                  style={{
                    color: theme.colors.text.muted,
                    fontFamily: theme.fonts.mono,
                    fontSize: theme.fontSize.caption,
                    marginTop: theme.space.xs,
                  }}
                >
                  while the timer runs
                </Text>
              </View>
              <Switch
                value={keepAwake}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onToggleKeepAwake(v);
                }}
                trackColor={{ false: theme.colors.bg.line, true: theme.colors.brass.dim }}
                thumbColor={keepAwake ? theme.colors.lume.glow : theme.colors.text.muted}
              />
            </View>
          </MotiView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
