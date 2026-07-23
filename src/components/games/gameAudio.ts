import { useCallback, useEffect, useRef } from "react";
import { sitePath } from "../../utils/paths";

type LoopName = "sea" | "wind" | "boat" | "night" | "jungle";
type EffectName =
  | "select"
  | "place"
  | "star"
  | "chest"
  | "levelComplete"
  | "jungleStep"
  | "gem";

const LOOP_PATHS: Record<LoopName, string> = {
  sea: sitePath("/assets/audio/sfx/sea-loop.mp3"),
  wind: sitePath("/assets/audio/sfx/wind-loop.mp3"),
  boat: sitePath("/assets/audio/sfx/boat-loop.mp3"),
  night: sitePath("/assets/audio/sfx/night-loop.mp3"),
  jungle: sitePath("/assets/audio/sfx/jungle-loop.mp3"),
};

const EFFECT_PATHS: Record<EffectName, string> = {
  select: sitePath("/assets/audio/sfx/syllable-select.mp3"),
  place: sitePath("/assets/audio/sfx/syllable-drop.mp3"),
  star: sitePath("/assets/audio/sfx/star-shine.mp3"),
  chest: sitePath("/assets/audio/sfx/chest-collect.mp3"),
  levelComplete: sitePath("/assets/audio/sfx/level-complete.mp3"),
  jungleStep: sitePath("/assets/audio/sfx/jungle-step.mp3"),
  gem: sitePath("/assets/audio/sfx/gem-collect.mp3"),
};

const EFFECT_VOLUMES: Record<EffectName, number> = {
  select: 0.28,
  place: 0.34,
  star: 0.24,
  chest: 0.48,
  levelComplete: 0.52,
  jungleStep: 0.26,
  gem: 0.34,
};

const EFFECT_MAX_WAIT: Record<EffectName, number> = {
  select: 500,
  place: 350,
  star: 900,
  chest: 1500,
  levelComplete: 3200,
  jungleStep: 850,
  gem: 950,
};

function createAudio(source: string, loop = false) {
  const audio = new Audio(source);
  audio.preload = "auto";
  audio.loop = loop;
  return audio;
}

export function useGameAudio() {
  const enabledRef = useRef(false);
  const loopsRef = useRef<Partial<Record<LoopName, HTMLAudioElement>>>({});
  const effectSourcesRef = useRef<Partial<Record<EffectName, HTMLAudioElement>>>({});
  const activeEffectsRef = useRef(new Set<HTMLAudioElement>());

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    for (const [name, source] of Object.entries(LOOP_PATHS) as Array<[LoopName, string]>) {
      loopsRef.current[name] ??= createAudio(source, true);
    }

    for (const [name, source] of Object.entries(EFFECT_PATHS) as Array<[EffectName, string]>) {
      effectSourcesRef.current[name] ??= createAudio(source);
    }
  }, []);

  const playEffect = useCallback(
    (name: EffectName, maxPlaybackMs?: number) => {
      if (!enabledRef.current || typeof window === "undefined") {
        return Promise.resolve();
      }

      ensureAudio();
      const source = effectSourcesRef.current[name];

      if (!source) {
        return Promise.resolve();
      }

      const audio = source.cloneNode(true) as HTMLAudioElement;
      audio.volume = EFFECT_VOLUMES[name];
      activeEffectsRef.current.add(audio);

      return new Promise<void>((resolve) => {
        let completed = false;
        const timeoutId = window.setTimeout(() => {
          audio.pause();
          complete();
        }, maxPlaybackMs ?? EFFECT_MAX_WAIT[name]);

        function complete() {
          if (completed) {
            return;
          }

          completed = true;
          window.clearTimeout(timeoutId);
          audio.onended = null;
          audio.onerror = null;
          activeEffectsRef.current.delete(audio);
          resolve();
        }

        audio.onended = complete;
        audio.onerror = complete;
        void audio.play().catch(complete);
      });
    },
    [ensureAudio],
  );

  const startAmbience = useCallback(() => {
    enabledRef.current = true;
    ensureAudio();
    const sea = loopsRef.current.sea;

    if (!sea) {
      return;
    }

    sea.volume = 0.15;
    void sea.play().catch(() => undefined);
  }, [ensureAudio]);

  const enableEffects = useCallback(() => {
    enabledRef.current = true;
    ensureAudio();
  }, [ensureAudio]);

  const startNightAmbience = useCallback(() => {
    enabledRef.current = true;
    ensureAudio();
    const night = loopsRef.current.night;

    if (!night) {
      return;
    }

    night.volume = 0.165;
    void night.play().catch(() => undefined);
  }, [ensureAudio]);

  const startJungleAmbience = useCallback(() => {
    enabledRef.current = true;
    ensureAudio();
    const jungle = loopsRef.current.jungle;

    if (!jungle) {
      return;
    }

    jungle.volume = 0.13;
    void jungle.play().catch(() => undefined);
  }, [ensureAudio]);

  const setJungleDucked = useCallback((ducked: boolean) => {
    const jungle = loopsRef.current.jungle;

    if (jungle) {
      jungle.volume = ducked ? 0.055 : 0.13;
    }
  }, []);

  const setTravelAudio = useCallback(
    (active: boolean, wind: 1 | 2 | 3, paused: boolean) => {
      if (!enabledRef.current) {
        return;
      }

      ensureAudio();
      const windAudio = loopsRef.current.wind;
      const boatAudio = loopsRef.current.boat;

      if (!windAudio || !boatAudio) {
        return;
      }

      if (!active) {
        windAudio.pause();
        boatAudio.pause();
        windAudio.currentTime = 0;
        boatAudio.currentTime = 0;
        return;
      }

      windAudio.playbackRate = 0.88 + wind * 0.08;
      boatAudio.playbackRate = 0.94 + wind * 0.04;

      if (paused) {
        boatAudio.pause();
        windAudio.volume = 0.2 + wind * 0.1;
        void windAudio.play().catch(() => undefined);
        return;
      }

      windAudio.volume = 0.4 + wind * 0.2;
      boatAudio.volume = 0.2;
      void windAudio.play().catch(() => undefined);
      void boatAudio.play().catch(() => undefined);
    },
    [ensureAudio],
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
    enableEffects,
    playEffect,
    setJungleDucked,
    setTravelAudio,
    startAmbience,
    startJungleAmbience,
    startNightAmbience,
  };
}
