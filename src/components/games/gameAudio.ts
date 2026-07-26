import { useCallback, useEffect, useRef } from "react";
import { sitePath } from "../../utils/paths";

const EFFECT_LOAD_MAX_WAIT = 10_000;

export type AudioLoopConfig = {
  source: string;
  volume: number;
};

export type AudioEffectConfig = AudioLoopConfig & {
  maxPlaybackMs: number;
};

type LoopPlaybackOptions = {
  playbackRate?: number;
  volume?: number;
};

export function sfxPath(filename: string) {
  return sitePath(`/assets/audio/sfx/${filename}`);
}

function createAudio(source: string, loop = false) {
  const audio = new Audio(source);
  audio.preload = "auto";
  audio.loop = loop;
  return audio;
}

function playOptional(audio: HTMLAudioElement | undefined) {
  if (audio) {
    void audio.play().catch(() => undefined);
  }
}

function playEffectAudio(
  source: HTMLAudioElement,
  config: AudioEffectConfig,
  activeEffects: Set<HTMLAudioElement>,
  maxPlaybackMs?: number,
) {
  const audio = source.cloneNode(true) as HTMLAudioElement;
  audio.volume = config.volume;
  activeEffects.add(audio);

  return new Promise<void>((resolve) => {
    let completed = false;
    let playbackTimeoutId: number | undefined;
    const loadTimeoutId = window.setTimeout(stop, EFFECT_LOAD_MAX_WAIT);

    function complete() {
      if (completed) {
        return;
      }

      completed = true;
      window.clearTimeout(loadTimeoutId);

      if (playbackTimeoutId !== undefined) {
        window.clearTimeout(playbackTimeoutId);
      }

      audio.onended = null;
      audio.onerror = null;
      activeEffects.delete(audio);
      resolve();
    }

    function stop() {
      audio.pause();
      complete();
    }

    function startPlaybackTimeout() {
      if (completed) {
        return;
      }

      window.clearTimeout(loadTimeoutId);
      playbackTimeoutId = window.setTimeout(
        stop,
        maxPlaybackMs ?? config.maxPlaybackMs,
      );
    }

    audio.onended = complete;
    audio.onerror = complete;
    void audio.play().then(startPlaybackTimeout).catch(complete);
  });
}

export function useAudioEngine<
  const Loops extends Record<string, AudioLoopConfig>,
  const Effects extends Record<string, AudioEffectConfig>,
>(loopConfig: Loops, effectConfig: Effects) {
  type LoopName = keyof Loops & string;
  type EffectName = keyof Effects & string;

  const enabledRef = useRef(false);
  const loopsRef = useRef<Partial<Record<LoopName, HTMLAudioElement>>>({});
  const effectSourcesRef = useRef<
    Partial<Record<EffectName, HTMLAudioElement>>
  >({});
  const activeEffectsRef = useRef(new Set<HTMLAudioElement>());

  const getLoop = useCallback(
    (name: LoopName) => {
      if (typeof window === "undefined") {
        return undefined;
      }

      loopsRef.current[name] ??= createAudio(loopConfig[name].source, true);
      return loopsRef.current[name];
    },
    [loopConfig],
  );

  const getEffectSource = useCallback(
    (name: EffectName) => {
      if (typeof window === "undefined") {
        return undefined;
      }

      effectSourcesRef.current[name] ??= createAudio(effectConfig[name].source);
      return effectSourcesRef.current[name];
    },
    [effectConfig],
  );

  const enableAudio = useCallback(() => {
    enabledRef.current = true;
  }, []);

  const isAudioEnabled = useCallback(() => enabledRef.current, []);

  const playLoop = useCallback(
    (name: LoopName, options: LoopPlaybackOptions = {}) => {
      enabledRef.current = true;
      const audio = getLoop(name);

      if (!audio) {
        return;
      }

      audio.volume = options.volume ?? loopConfig[name].volume;

      if (options.playbackRate !== undefined) {
        audio.playbackRate = options.playbackRate;
      }

      playOptional(audio);
    },
    [getLoop, loopConfig],
  );

  const pauseLoop = useCallback(
    (name: LoopName, rewind = false) => {
      const audio = loopsRef.current[name];

      if (!audio) {
        return;
      }

      audio.pause();

      if (rewind) {
        audio.currentTime = 0;
      }
    },
    [],
  );

  const setLoopVolume = useCallback((name: LoopName, volume: number) => {
    const audio = loopsRef.current[name];

    if (audio) {
      audio.volume = volume;
    }
  }, []);

  const preloadEffect = useCallback(
    (name: EffectName) => {
      const audio = getEffectSource(name);

      if (audio?.networkState === HTMLMediaElement.NETWORK_EMPTY) {
        audio.load();
      }
    },
    [getEffectSource],
  );

  const playEffect = useCallback(
    (name: EffectName, maxPlaybackMs?: number) => {
      const source = getEffectSource(name);

      if (!source) {
        return Promise.resolve();
      }

      enabledRef.current = true;

      return playEffectAudio(
        source,
        effectConfig[name],
        activeEffectsRef.current,
        maxPlaybackMs,
      );
    },
    [effectConfig, getEffectSource],
  );

  useEffect(
    () => () => {
      for (const audio of Object.values(loopsRef.current)) {
        audio?.pause();
      }

      for (const audio of activeEffectsRef.current) {
        audio.pause();
      }

      activeEffectsRef.current.clear();
    },
    [],
  );

  return {
    enableAudio,
    isAudioEnabled,
    pauseLoop,
    preloadEffect,
    playEffect,
    playLoop,
    setLoopVolume,
  };
}
