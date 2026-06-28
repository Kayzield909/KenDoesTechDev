import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useSharedValue,
  useFrameCallback,
  useAnimatedReaction,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * useTimerEngine — the single source of truth for the timer.
 *
 * State machine: idle → running → windingDown → done, plus paused.
 * Everything is driven off ONE elapsed-millisecond value advanced on the UI
 * thread by a frame callback (smooth 60fps, no per-second setState jank).
 * The JS side only hears about *transitions* (via runOnJS) and the whole-minute
 * number (via an animated reaction that fires only when the minute changes).
 */

export type TimerStatus = 'idle' | 'running' | 'windingDown' | 'paused' | 'done';

// Worklet-friendly numeric mirror of the status (shared values can't hold strings cheaply).
export const SC = { idle: 0, running: 1, windingDown: 2, paused: 3, done: 4 } as const;

type EngineOpts = {
  durationMs: number;
  windDownMs: number;
  onComplete?: () => void;
  onEnterWindDown?: () => void;
};

export type TimerEngine = {
  status: TimerStatus;
  displayMinutes: number;
  /** Shared values for the animated UI (hand, arc, dim, volume, balance). */
  elapsedMs: SharedValue<number>;
  totalMs: SharedValue<number>;
  windDownMs: SharedValue<number>;
  statusCode: SharedValue<number>;
  /** Center tap: start / pause / resume / (reset when done). */
  toggle: () => void;
  /** Long-press: back to idle. */
  reset: () => void;
};

export function useTimerEngine({
  durationMs,
  windDownMs,
  onComplete,
  onEnterWindDown,
}: EngineOpts): TimerEngine {
  const elapsedMs = useSharedValue(0);
  const totalMs = useSharedValue(durationMs);
  const windDownSV = useSharedValue(windDownMs);
  const statusCode = useSharedValue<number>(SC.idle);

  const [status, setStatus] = useState<TimerStatus>('idle');
  const [displayMinutes, setDisplayMinutes] = useState(Math.ceil(durationMs / 60000));

  const statusRef = useRef<TimerStatus>('idle');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onWindDownRef = useRef(onEnterWindDown);
  onWindDownRef.current = onEnterWindDown;

  const setStatusBoth = useCallback((s: TimerStatus) => {
    statusRef.current = s;
    statusCode.value = SC[s];
    setStatus(s);
  }, [statusCode]);

  // Keep the wind-down threshold in sync with settings.
  useEffect(() => {
    windDownSV.value = windDownMs;
  }, [windDownMs, windDownSV]);

  // While idle, reflect the set duration (bezel/presets) into the dial.
  useEffect(() => {
    if (statusRef.current === 'idle') {
      totalMs.value = durationMs;
      elapsedMs.value = 0;
      setDisplayMinutes(Math.ceil(durationMs / 60000));
    }
  }, [durationMs, totalMs, elapsedMs]);

  // --- JS-side transition handlers (called from the UI thread via runOnJS) ---
  const handleWindDown = useCallback(() => {
    if (statusRef.current === 'running') {
      setStatusBoth('windingDown');
      onWindDownRef.current?.();
    }
  }, [setStatusBoth]);

  const handleDone = useCallback(() => {
    setStatusBoth('done');
    onCompleteRef.current?.();
  }, [setStatusBoth]);

  // --- The clock: one elapsed value, advanced every frame while active. ---
  useFrameCallback((frame) => {
    'worklet';
    const sc = statusCode.value;
    if (sc !== SC.running && sc !== SC.windingDown) return;

    const dt = frame.timeSincePreviousFrame ?? 16;
    let e = elapsedMs.value + dt;

    if (e >= totalMs.value) {
      elapsedMs.value = totalMs.value;
      statusCode.value = SC.done;
      runOnJS(handleDone)();
      return;
    }

    elapsedMs.value = e;
    const remaining = totalMs.value - e;
    if (sc === SC.running && remaining <= windDownSV.value) {
      statusCode.value = SC.windingDown;
      runOnJS(handleWindDown)();
    }
  });

  // Whole-minute number — fires only when the displayed minute actually changes.
  useAnimatedReaction(
    () => Math.max(0, Math.ceil((totalMs.value - elapsedMs.value) / 60000)),
    (cur, prev) => {
      if (cur !== prev) runOnJS(setDisplayMinutes)(cur);
    },
  );

  // --- Actions ---
  const start = useCallback(() => {
    elapsedMs.value = 0;
    totalMs.value = durationMs;
    const startInWindDown = durationMs <= windDownSV.value;
    setStatusBoth(startInWindDown ? 'windingDown' : 'running');
    if (startInWindDown) onWindDownRef.current?.();
  }, [durationMs, elapsedMs, totalMs, windDownSV, setStatusBoth]);

  const resume = useCallback(() => {
    const remaining = totalMs.value - elapsedMs.value;
    setStatusBoth(remaining <= windDownSV.value ? 'windingDown' : 'running');
  }, [totalMs, elapsedMs, windDownSV, setStatusBoth]);

  const pause = useCallback(() => {
    setStatusBoth('paused');
  }, [setStatusBoth]);

  const reset = useCallback(() => {
    elapsedMs.value = 0;
    totalMs.value = durationMs;
    setStatusBoth('idle');
    setDisplayMinutes(Math.ceil(durationMs / 60000));
  }, [durationMs, elapsedMs, totalMs, setStatusBoth]);

  const toggle = useCallback(() => {
    switch (statusRef.current) {
      case 'idle':
        start();
        break;
      case 'running':
      case 'windingDown':
        pause();
        break;
      case 'paused':
        resume();
        break;
      case 'done':
        reset();
        break;
    }
  }, [start, pause, resume, reset]);

  return {
    status,
    displayMinutes,
    elapsedMs,
    totalMs,
    windDownMs: windDownSV,
    statusCode,
    toggle,
    reset,
  };
}
