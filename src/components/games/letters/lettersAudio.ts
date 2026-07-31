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
  night: { source: sfxPath("night-loop.mp3"), volume: 0.2 },
} satisfies Record<string, AudioLoopConfig>;

const EFFECTS = {
  place: {
    source: sfxPath("syllable-drop.mp3"),
    volume: 0.34,
    maxPlaybackMs: 350,
  },
  star: {
    source: sfxPath("star-shine.mp3"),
    volume: 0.24,
    maxPlaybackMs: 900,
  },
  levelComplete: {
    source: sfxPath("level-complete.mp3"),
    volume: 0.52,
    maxPlaybackMs: 3_200,
  },
} satisfies Record<string, AudioEffectConfig>;

export function useLettersAudio() {
  const { enableAudio, playEffect, playLoop } = useAudioEngine(LOOPS, EFFECTS);
  const startNightAmbience = useCallback(() => {
    playLoop("night");
  }, [playLoop]);

  return {
    enableEffects: enableAudio,
    playEffect,
    startNightAmbience,
  };
}
