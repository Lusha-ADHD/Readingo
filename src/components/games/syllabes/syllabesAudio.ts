import { useCallback } from "react";
import {
  sfxPath,
  useAudioEngine,
} from "../gameAudio";
import type {
  AudioEffectConfig,
  AudioLoopConfig,
} from "../gameAudio";

const LOOPS = {
  sea: { source: sfxPath("sea-loop.mp3"), volume: 0.2 },
  wind: { source: sfxPath("wind-loop.mp3"), volume: 0.4 },
  boat: { source: sfxPath("boat-loop.mp3"), volume: 0.2 },
} satisfies Record<string, AudioLoopConfig>;

const EFFECTS = {
  select: {
    source: sfxPath("syllable-select.mp3"),
    volume: 0.28,
    maxPlaybackMs: 500,
  },
  place: {
    source: sfxPath("syllable-drop.mp3"),
    volume: 0.34,
    maxPlaybackMs: 350,
  },
  chest: {
    source: sfxPath("chest-collect.mp3"),
    volume: 0.48,
    maxPlaybackMs: 1_500,
  },
  levelComplete: {
    source: sfxPath("level-complete.mp3"),
    volume: 0.52,
    maxPlaybackMs: 3_200,
  },
} satisfies Record<string, AudioEffectConfig>;

export function useSyllabesAudio() {
  const {
    isAudioEnabled,
    pauseLoop,
    playEffect,
    playLoop,
  } = useAudioEngine(LOOPS, EFFECTS);

  const startAmbience = useCallback(() => {
    playLoop("sea");
  }, [playLoop]);

  const setTravelAudio = useCallback(
    (active: boolean, wind: 1 | 2 | 3, paused: boolean) => {
      if (!isAudioEnabled()) {
        return;
      }

      if (!active) {
        pauseLoop("wind", true);
        pauseLoop("boat", true);
        return;
      }

      if (paused) {
        pauseLoop("boat");
        playLoop("wind", {
          playbackRate: 0.88 + wind * 0.08,
          volume: 0.2 + wind * 0.1,
        });
        return;
      }

      playLoop("wind", {
        playbackRate: 0.88 + wind * 0.08,
        volume: 0.4 + wind * 0.2,
      });
      playLoop("boat", {
        playbackRate: 0.94 + wind * 0.04,
      });
    },
    [isAudioEnabled, pauseLoop, playLoop],
  );

  return { playEffect, setTravelAudio, startAmbience };
}
