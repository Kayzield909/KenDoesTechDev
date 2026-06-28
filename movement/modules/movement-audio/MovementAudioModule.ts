import { requireNativeModule } from 'expo-modules-core';

/** Current STREAM_MUSIC volume and its maximum, in integer steps. */
export type MusicVolume = {
  /** Current volume index (0..max). */
  volume: number;
  /** Maximum volume index for STREAM_MUSIC on this device. */
  max: number;
};

export interface MovementAudioNativeModule {
  getMusicVolume(): Promise<MusicVolume>;
  rampMusicVolume(targetFraction: number, durationMs: number): Promise<void>;
  stopPlayback(): Promise<void>;
}

/**
 * The native module. Resolved from the custom dev/native build — it is NOT
 * present in Expo Go, so this file (and anything importing it) must only run
 * inside a development build.
 */
export default requireNativeModule<MovementAudioNativeModule>('MovementAudio');
