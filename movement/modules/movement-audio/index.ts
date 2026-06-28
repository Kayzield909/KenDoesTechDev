import MovementAudio, { type MusicVolume } from './MovementAudioModule';

export type { MusicVolume };

/**
 * movement-audio — tiny typed wrapper over the native Android AudioManager module.
 *
 * Only works in a custom dev/native build (Phase B), never in Expo Go.
 */

/** Read the current STREAM_MUSIC volume and its max (integer steps). */
export function getMusicVolume(): Promise<MusicVolume> {
  return MovementAudio.getMusicVolume();
}

/** Read the current volume as a 0..1 fraction (convenience over getMusicVolume). */
export async function getMusicVolumeFraction(): Promise<number> {
  const { volume, max } = await MovementAudio.getMusicVolume();
  return max > 0 ? volume / max : 0;
}

/**
 * Smoothly ramp STREAM_MUSIC toward `targetFraction` (0..1) over `durationMs`.
 * Resolves when the ramp finishes; starting a new ramp supersedes any in-flight one.
 */
export function rampMusicVolume(targetFraction: number, durationMs: number): Promise<void> {
  return MovementAudio.rampMusicVolume(targetFraction, durationMs);
}

/**
 * Request AUDIOFOCUS_GAIN so other media apps pause, then immediately abandon
 * focus. This is the "stop whatever is playing" action.
 */
export function stopPlayback(): Promise<void> {
  return MovementAudio.stopPlayback();
}

export default { getMusicVolume, getMusicVolumeFraction, rampMusicVolume, stopPlayback };
