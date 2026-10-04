import { useRef, useEffect, useCallback } from 'react';
import type { PlaybackState } from '@watchly/shared';

const DRIFT_THRESHOLD = 2.0;
const SOFT_THRESHOLD = 0.5;
const CHECK_INTERVAL = 5000;

interface UsePlaybackSyncOptions {
  playback: PlaybackState | null;
  clockOffset: number;
  getPlayerTime: () => number;
  seekPlayer: (time: number) => void;
  setPlaybackRate?: (rate: number) => void;
  isReady: boolean;
}

export function usePlaybackSync({
  playback,
  clockOffset,
  getPlayerTime,
  seekPlayer,
  setPlaybackRate,
  isReady,
}: UsePlaybackSyncOptions) {
  const rateResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getExpectedPosition = useCallback((): number => {
    if (!playback) return 0;
    if (!playback.isPlaying) return playback.positionAtLastUpdate;

    const serverNow = Date.now() + clockOffset;
    const elapsed = (serverNow - playback.updatedAtServerTime) / 1000;
    return playback.positionAtLastUpdate + Math.max(0, elapsed);
  }, [playback, clockOffset]);

  useEffect(() => {
    if (!playback || !isReady) return;

    const interval = setInterval(() => {
      if (!playback.isPlaying) return;

      const actual = getPlayerTime();
      const expected = getExpectedPosition();
      const drift = Math.abs(actual - expected);

      if (drift > DRIFT_THRESHOLD) {
        seekPlayer(expected);
      } else if (drift > SOFT_THRESHOLD && setPlaybackRate) {
        const rate = actual < expected ? 1.05 : 0.95;
        setPlaybackRate(rate);

        if (rateResetTimer.current) clearTimeout(rateResetTimer.current);
        rateResetTimer.current = setTimeout(() => {
          setPlaybackRate(1.0);
        }, 3000);
      }
    }, CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
      if (rateResetTimer.current) clearTimeout(rateResetTimer.current);
    };
  }, [playback, isReady, getPlayerTime, seekPlayer, setPlaybackRate, getExpectedPosition]);

  return { getExpectedPosition };
}
