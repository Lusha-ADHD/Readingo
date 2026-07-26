import { useCallback } from "react";
import {
  sfxPath,
  useAudioEngine,
} from "../gameAudio";
import type {
  AudioEffectConfig,
  AudioLoopConfig,
} from "../gameAudio";

const JUNGLE_VOLUME = 0.23;
const JUNGLE_DUCKED_VOLUME = 0.055;

const LOOPS = {
  jungle: {
    source: sfxPath("jungle-loop.mp3"),
    volume: JUNGLE_VOLUME,
  },
} satisfies Record<string, AudioLoopConfig>;

const EFFECTS = {
  star: {
    source: sfxPath("star-shine.mp3"),
    volume: 0.24,
    maxPlaybackMs: 900,
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
  jungleStep: {
    source: sfxPath("jungle-step.mp3"),
    volume: 0.26,
    maxPlaybackMs: 2_300,
  },
  gem: {
    source: sfxPath("gem-collect.mp3"),
    volume: 0.34,
    maxPlaybackMs: 950,
  },
  dig: {
    source: sfxPath("digging.mp3"),
    volume: 0.99,
    maxPlaybackMs: 1_450,
  },
} satisfies Record<string, AudioEffectConfig>;

export function useSentierAudio() {
  const {
    enableAudio,
    preloadEffect,
    playEffect,
    playLoop,
    setLoopVolume,
  } = useAudioEngine(LOOPS, EFFECTS);

  const startJungleAmbience = useCallback(() => {
    preloadEffect("jungleStep");
    playLoop("jungle");
  }, [playLoop, preloadEffect]);

  const playMovement = useCallback(() => {
    return playEffect("jungleStep");
  }, [playEffect]);

  const setJungleDucked = useCallback(
    (ducked: boolean) => {
      setLoopVolume(
        "jungle",
        ducked ? JUNGLE_DUCKED_VOLUME : JUNGLE_VOLUME,
      );
    },
    [setLoopVolume],
  );

  return {
    enableEffects: enableAudio,
    playEffect,
    playMovement,
    setJungleDucked,
    startJungleAmbience,
  };
}
