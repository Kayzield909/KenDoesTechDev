import { useCallback, useRef } from 'react';
import {
  useSharedValue,
  withTiming,
  cancelAnimation,
  type SharedValue,
} from 'react-native-reanimated';
import {
  isNativeAudioAvailable,
  getMusicVolumeFraction,
  rampMusicVolume,
  stopPlayback,
} from '../audio/audioBridge';

/**
 * useAudioController — bridges the timer's wind-down to real media volume.
 *
 *  - fadeOut(durationMs): capture the user's current media volume once, then
 *    ramp it (and the on-screen bar) to zero across the window.
 *  - finish(): pause other media (audio focus), then RESTORE the captured volume
 *    so the user's slider isn't left at zero.
 *  - restore(clear): bring the volume back (used on pause/reset mid-run); keep
 *    the captured value when paused so a resume can re-fade.
 *
 * `volumeFraction` mirrors the commanded trajectory so VolumeBar shows real
 * values; in Expo Go (no native module) it animates the same curve as a sim.
 */

const RESTORE_MS = 250;

export type AudioController = {
  volumeFraction: SharedValue<number>;
  native: boolean;
  fadeOut: (durationMs: number) => void;
  finish: () => void;
  restore: (clear: boolean) => void;
};

export function useAudioController(): AudioController {
  const volumeFraction = useSharedValue(0);
  const capturedRef = useRef<number | null>(null);
  const restoredRef = useRef(true);

  const fadeOut = useCallback(
    (durationMs: number) => {
      const dur = Math.max(0, durationMs);
      const run = async () => {
        // Capture the original volume once (first wind-down entry).
        if (capturedRef.current == null) {
          let frac = 1;
          try {
            frac = await getMusicVolumeFraction();
          } catch {
            frac = 1;
          }
          capturedRef.current = frac;
        }
        restoredRef.current = false;

        // Mirror on screen: show current, then ramp to zero over the window.
        cancelAnimation(volumeFraction);
        volumeFraction.value = capturedRef.current ?? 1;
        volumeFraction.value = withTiming(0, { duration: dur });

        // Command the device to do the same.
        try {
          await rampMusicVolume(0, dur);
        } catch {
          // SecurityException (Do Not Disturb) etc. — keep the UI fade going.
        }
      };
      run();
    },
    [volumeFraction],
  );

  const finish = useCallback(() => {
    const run = async () => {
      cancelAnimation(volumeFraction);
      volumeFraction.value = 0;
      try {
        await stopPlayback(); // pause whatever was playing
      } catch {
        // ignore
      }
      // Do NOT raise the volume back now. The user has just fallen asleep and
      // media must stay silent — bumping the level here (while playback may
      // resume) is the "loud disturbance at the end". Leave it at zero; the
      // captured level is restored later via restore() on reset/idle, when the
      // user is awake and touching the phone. capturedRef is kept for that.
      restoredRef.current = false;
    };
    run();
  }, [volumeFraction]);

  const restore = useCallback(
    (clear: boolean) => {
      const captured = capturedRef.current;
      const run = async () => {
        if (captured != null && !restoredRef.current) {
          try {
            await rampMusicVolume(captured, 0);
          } catch {
            // ignore
          }
          cancelAnimation(volumeFraction);
          volumeFraction.value = withTiming(captured, { duration: RESTORE_MS });
          restoredRef.current = true;
        }
        if (clear) capturedRef.current = null;
      };
      run();
    },
    [volumeFraction],
  );

  return { volumeFraction, native: isNativeAudioAvailable, fadeOut, finish, restore };
}
