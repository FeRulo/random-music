import { useEffect, useRef } from 'react';
import { getAudioContext, scheduleMetronomeClick } from '../utils/audio';
import { RITMO_LATE_WINDOW_FRACTION } from '../constants';

const SCHEDULE_AHEAD_S = 0.1;
const SCHEDULER_INTERVAL_MS = 25;

interface MetronomeCallbacks {
  onBeat: (beatWallTime: number, beatIndex: number) => void;
}

export function useMetronome(
  active: boolean,
  bpm: number,
  callbacks: MetronomeCallbacks,
) {
  const bpmRef = useRef(bpm);
  const onBeatRef = useRef(callbacks.onBeat);

  bpmRef.current = bpm;
  onBeatRef.current = callbacks.onBeat;

  useEffect(() => {
    if (!active) return;

    const ctx = getAudioContext();
    // Resume AudioContext if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') ctx.resume();

    let cancelled = false;
    const wallOffset = performance.now() - ctx.currentTime * 1000;
    let nextBeatTime = ctx.currentTime + 0.05;
    let beatIndex = 0;

    const tick = () => {
      while (nextBeatTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
        const beatAudioTime = nextBeatTime;
        const beatWallTime = beatAudioTime * 1000 + wallOffset;
        const isDownbeat = beatIndex % 4 === 0;

        scheduleMetronomeClick(beatAudioTime, isDownbeat);

        const beatWindowMs = (60 / bpmRef.current) * 1000;
        const lateWindowMs = beatWindowMs * RITMO_LATE_WINDOW_FRACTION;
        const delay = beatWallTime - performance.now();
        const capturedOnBeat = onBeatRef.current;
        const capturedIndex = beatIndex;
        setTimeout(() => {
          if (cancelled) return;
          capturedOnBeat(beatWallTime, capturedIndex);
        }, Math.max(0, delay) + lateWindowMs);

        nextBeatTime += 60 / bpmRef.current;
        beatIndex++;
      }
    };

    const intervalId = setInterval(tick, SCHEDULER_INTERVAL_MS);
    tick();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [active]);
}
