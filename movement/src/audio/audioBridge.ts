import { requireOptionalNativeModule } from 'expo-modules-core';
// Type-only import: erased at runtime, so the throwing requireNativeModule()
// default export in that file is never evaluated here (keeps Expo Go happy).
import type { MovementAudioNativeModule, MusicVolume } from '../../modules/movement-audio/MovementAudioModule';

/**
 * audioBridge — safe access to the native MovementAudio module.
 *
 * `requireOptionalNativeModule` returns null when the native module isn't
 * present (Expo Go, web), so the whole app keeps running without a dev build —
 * the audio calls simply become no-ops and the UI falls back to a simulated
 * volume trajectory.
 */
const Native = requireOptionalNativeModule<MovementAudioNativeModule>('MovementAudio');

export const isNativeAudioAvailable = Native != null;
export type { MusicVolume };

/** Current media volume as a 0..1 fraction. Returns 1 when no native module. */
export async function getMusicVolumeFraction(): Promise<number> {
  if (!Native) return 1;
  const { volume, max } = await Native.getMusicVolume();
  return max > 0 ? volume / max : 0;
}

/** Ramp media volume toward `fraction` (0..1) over `durationMs`. No-op without native. */
export async function rampMusicVolume(fraction: number, durationMs: number): Promise<void> {
  if (!Native) return;
  await Native.rampMusicVolume(fraction, durationMs);
}

/** Request+abandon audio focus so other media apps pause. No-op without native. */
export async function stopPlayback(): Promise<void> {
  if (!Native) return;
  await Native.stopPlayback();
}
