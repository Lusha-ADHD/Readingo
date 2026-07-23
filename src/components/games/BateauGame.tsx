import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { GAME_IDS } from "../../content/gameCatalog";
import syllableEntries from "../../content/fr/syllables.json";
import lessonEntries from "../../content/fr/lessons.json";
import voiceLinesData from "../../content/fr/voice-lines.json";
import words from "../../content/fr/words.json";
import { sitePath } from "../../utils/paths";
import { rememberLastGame, shouldResumeFromUrl } from "../home/onboardingState";
import { AudioButton } from "../ui/AudioButton";
import {
  GameDialogueOverlay,
  GameIntroOverlay,
} from "../ui/GameIntroOverlay";
import { SyllableSlot } from "../ui/SyllableSlot";
import { GameButton } from "../ui/GameButton";
import { PanaMascot } from "../ui/PanaMascot";
import { ProgressBar } from "../ui/ProgressBar";
import { RewardBurst } from "../ui/RewardBurst";
import { SyllableTile } from "../ui/SyllableTile";
import { OceanCanvas } from "./OceanCanvas";
import { LevelMap } from "./LevelMap";
import type { BateauLevel } from "./LevelMap";
import {
  completeBateauLevel,
  readBateauProgress,
  saveBateauProgress,
} from "./bateauProgress";
import type { BateauProgress } from "./bateauProgress";
import { createBateauTiles } from "./bateauTiles";
import type { BateauTile } from "./bateauTiles";
import { useGameAudio } from "./gameAudio";
import { useVoiceAudio } from "./useVoiceAudio";
import type { VoicePlaybackResult } from "./useVoiceAudio";
import "./BateauGame.css";

type WordChallenge = {
  id: string;
  locale: string;
  word: string;
  displayWord: string;
  syllables: string[];
  spokenSyllables?: string[];
  distractors: string[];
  image: string;
  audioWord: string;
  audioSyllables: Partial<Record<string, string>>;
  difficulty: number;
  tags: string[];
};

type Tile = BateauTile;

type SyllableEntry = {
  id: string;
  text: string;
  speechText?: string;
  audio: string;
};

type VoiceLine = {
  text: string;
  audio: string;
};

type VoiceLines = {
  dialogue: { intro: VoiceLine[] };
  feedback: { tryAgain: VoiceLine; bravo: VoiceLine };
};

type GamePhase = "intro" | "dialog" | "map" | "playing" | "validating" | "sailing" | "done";

type SailingIsland = {
  id: string;
  globalIndex: number;
  hasTreasure: boolean;
  size: "small" | "large";
  sailingOrder: number | null;
};

type Journey = {
  wind: 1 | 2 | 3;
  islands: SailingIsland[];
  treasuresFound: number;
};

const BOAT_ASSET_PATH = sitePath("/assets/world/boat.png");
const ISLAND_WITH_CHEST_ASSET_PATH = sitePath("/assets/world/IslandWithChest.png");
const ISLAND_WITHOUT_CHEST_ASSET_PATH = sitePath("/assets/world/IslandWithoutChest.png");
const CHEST_ICON_ASSET_PATH = sitePath("/assets/world/Chest.png");
const CHEST_COLLECT_PAUSE_MS = 620;
const CHEST_COLLECT_SEGMENT_RATIO = 0.58;
const WORD_SUCCESS_SOUND_MS = 600;
const SAILING_DURATIONS: Record<Journey["wind"], number> = {
  1: 1700,
  2: 2200,
  3: 2700,
};
const SCENE_CLOUDS = Array.from({ length: 18 }, (_, index) => ({
  id: `cloud-${index}`,
  left: -18 + index * 38,
  top: 42 + (index % 4) * 25,
  scale: 0.72 + (index % 3) * 0.17,
  duration: 8200 + (index % 5) * 1300,
  delay: -1100 * (index % 7),
}));
const wordChallenges = words as WordChallenge[];
const wordById = new Map(wordChallenges.map((word) => [word.id, word]));
const bateauLevels = (lessonEntries as BateauLevel[])
  .filter((level) => level.gameIds.includes(GAME_IDS.BATEAU))
  .sort((left, right) => left.level - right.level);
const firstLevelWordIds = bateauLevels[0]?.wordIds ?? [];
const syllableByText = new Map((syllableEntries as SyllableEntry[]).map((entry) => [entry.text, entry]));
const voiceLines = voiceLinesData as VoiceLines;
const introLines = voiceLines.dialogue.intro;

function shuffleSessionWords(previousOrder: WordChallenge[]) {
  const shuffled = [...previousOrder];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  if (shuffled.length > 1 && shuffled.every((word, index) => word.id === previousOrder[index]?.id)) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  return shuffled;
}

function wordsForLevel(level: BateauLevel) {
  return level.wordIds.map((id) => wordById.get(id)).filter((word): word is WordChallenge => Boolean(word));
}

function getInitialProgress(): BateauProgress {
  return readBateauProgress(typeof window === "undefined" ? null : window.localStorage, firstLevelWordIds, bateauLevels.length);
}

function speak(text: string, options: { cancel?: boolean } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve();
  }

  if (options.cancel ?? true) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.82;
  utterance.pitch = 1.05;

  return new Promise<void>((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

function getSyllableSpeechText(text: string) {
  return syllableByText.get(text)?.speechText ?? text;
}

function getSyllableAudioPath(text: string) {
  return syllableByText.get(text)?.audio;
}

function getChallengeSyllableSpeechText(challenge: WordChallenge, text: string) {
  const syllableIndex = challenge.syllables.indexOf(text);
  return syllableIndex >= 0 ? (challenge.spokenSyllables?.[syllableIndex] ?? getSyllableSpeechText(text)) : getSyllableSpeechText(text);
}

function getChallengeSyllableAudioPath(challenge: WordChallenge, text: string) {
  return challenge.audioSyllables[text] ?? getSyllableAudioPath(text);
}

function getPlacedSyllableSpeechText(challenge: WordChallenge, tile: Tile, slotIndex: number) {
  return challenge.spokenSyllables?.[slotIndex] ?? getSyllableSpeechText(tile.text);
}

function calculateWind(startedAt: number, mistakes: number): 1 | 2 | 3 {
  const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

  if (seconds <= 8 && mistakes === 0) {
    return 3;
  }

  if (seconds <= 16 && mistakes <= 1) {
    return 2;
  }

  return 1;
}

function buildSceneIslands(startIndex: number, visibleCount: number, sailingCount = 0): SailingIsland[] {
  return Array.from({ length: visibleCount }, (_, index) => ({
    id: `scene-island-${startIndex + index}`,
    globalIndex: startIndex + index,
    hasTreasure: (startIndex + index) % 2 === 1,
    size: (startIndex + index) % 2 === 0 ? "small" : "large",
    sailingOrder: index > 0 && index <= sailingCount ? index - 1 : null,
  }));
}

function buildJourney(startIndex: number, wind: 1 | 2 | 3): Journey {
  const islands = buildSceneIslands(startIndex, 2 + wind, wind);

  return {
    wind,
    islands,
    treasuresFound: islands.filter((island) => island.sailingOrder != null && island.hasTreasure).length,
  };
}

function getWindLabel(wind: 1 | 2 | 3) {
  if (wind === 3) {
    return "Vent très fort";
  }

  if (wind === 2) {
    return "Vent moyen";
  }

  return "Vent faible";
}

function BoatAsset() {
  const [assetFailed, setAssetFailed] = useState(false);

  return (
    <div className={`bateau-game__boat ${assetFailed ? "bateau-game__boat--asset-failed" : ""}`}>
      <img
        className="bateau-game__boat-asset"
        src={BOAT_ASSET_PATH}
        alt=""
        draggable={false}
        hidden={assetFailed}
        onError={(event) => {
          event.currentTarget.hidden = true;
          setAssetFailed(true);
        }}
      />
      <div className="bateau-game__boat-fallback" aria-hidden="true">
        <div className="bateau-game__sail" />
      </div>
    </div>
  );
}

export function BateauGame() {
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [dialogLineIndex, setDialogLineIndex] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<BateauLevel>(() => bateauLevels[0]);
  const [sessionWords, setSessionWords] = useState<WordChallenge[]>(() => wordsForLevel(bateauLevels[0]));
  const [wordIndex, setWordIndex] = useState(0);
  const [placed, setPlaced] = useState<Array<Tile | null>>([]);
  const [usedTileIds, setUsedTileIds] = useState<string[]>([]);
  const [wrongTileId, setWrongTileId] = useState<string | null>(null);
  const [treasures, setTreasures] = useState(0);
  const [lastTreasuresFound, setLastTreasuresFound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [islandStartIndex, setIslandStartIndex] = useState(0);
  const [isCollectingChest, setIsCollectingChest] = useState(false);
  const [isSailingMotionActive, setIsSailingMotionActive] = useState(false);
  const [chestBursts, setChestBursts] = useState<number[]>([]);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [wordImageFailed, setWordImageFailed] = useState(false);
  const [progress, setProgress] = useState<BateauProgress>(() => getInitialProgress());
  const [newlyUnlockedLevel, setNewlyUnlockedLevel] = useState<number | null>(null);
  const [lastCompletedLevel, setLastCompletedLevel] = useState<number | null>(null);
  const [isResultLeaving, setIsResultLeaving] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testToolsEnabled, setTestToolsEnabled] = useState(false);
  const dialogRunRef = useRef(0);
  const chestBurstIdRef = useRef(0);
  const savedSessionRef = useRef(false);
  const directTestStartedRef = useRef(false);
  const { playEffect, setTravelAudio, startAmbience } = useGameAudio();
  const { cancelVoice, playVoice } = useVoiceAudio();

  const challenge = sessionWords[wordIndex];
  const tiles = useMemo(() => createBateauTiles(challenge), [challenge]);
  const completedCount = phase === "done" ? sessionWords.length : wordIndex;
  const displayedTotalTreasures = progress.totalTreasures + (phase === "done" || phase === "map" ? 0 : treasures);

  useEffect(() => {
    rememberLastGame(window.localStorage, "bateau");

    if (
      shouldResumeFromUrl(window.location.search) &&
      (progress.sessions > 0 || progress.unlockedLevel > 1 || progress.completedLevels.length > 0)
    ) {
      setPhase("map");
    }
  }, []);

  useEffect(() => {
    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

    if (!isLocalHost) {
      return;
    }

    setTestToolsEnabled(true);

    if (directTestStartedRef.current) {
      return;
    }

    const requestedLevel = Number.parseInt(new URLSearchParams(window.location.search).get("niveau") ?? "", 10);
    const level = bateauLevels.find((candidate) => candidate.level === requestedLevel);

    if (level) {
      directTestStartedRef.current = true;
      startLevel(level, true);
    }
  }, []);

  useEffect(() => {
    setPlaced(Array.from({ length: challenge.syllables.length }, () => null));
    setUsedTileIds([]);
    setWrongTileId(null);
    setLastTreasuresFound(0);
    setMistakes(0);
    setIsCollectingChest(false);
    setIsSailingMotionActive(false);
    setChestBursts([]);
    setJourney(null);
    setWordImageFailed(false);
    setStartedAt(Date.now());
  }, [challenge]);

  useEffect(() => {
    const isMapTravel = phase === "map" && newlyUnlockedLevel !== null;
    setTravelAudio((phase === "sailing" && isSailingMotionActive) || isMapTravel, journey?.wind ?? 1, isCollectingChest || isMapTravel);
  }, [isCollectingChest, isSailingMotionActive, journey?.wind, newlyUnlockedLevel, phase, setTravelAudio]);

  useEffect(() => {
    if (phase !== "map" || newlyUnlockedLevel !== bateauLevels.length + 1) {
      return;
    }

    const timeout = window.setTimeout(() => void playEffect("chest"), 900);
    return () => window.clearTimeout(timeout);
  }, [newlyUnlockedLevel, phase, playEffect]);

  useEffect(() => {
    if (phase === "done") {
      saveCompletedLevel();
    }
  }, [phase]);

  function findTile(tileId: string) {
    return tiles.find((tile) => tile.id === tileId);
  }

  async function playRecordedVoice(audioPath: string | undefined, fallbackText: string): Promise<VoicePlaybackResult> {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (audioPath) {
      const result = await playVoice(audioPath);

      if (result !== "failed") {
        return result;
      }
    }

    await speak(fallbackText);
    return "played";
  }

  async function playRecordedSequence(lines: VoiceLine[], onLine?: (index: number) => void, shouldContinue = () => true) {
    cancelVoice();

    for (const [index, line] of lines.entries()) {
      if (!shouldContinue()) {
        return;
      }

      onLine?.(index);
      const result = await playRecordedVoice(line.audio, line.text);

      if (result === "cancelled" || !shouldContinue()) {
        return;
      }
    }
  }

  async function startIntroDialog() {
    const runId = dialogRunRef.current + 1;
    dialogRunRef.current = runId;
    setPhase("dialog");
    setDialogLineIndex(0);

    try {
      startAmbience();
    } catch {
      // Audio is optional: a browser restriction must not block the game.
    }

    await playRecordedSequence(introLines, setDialogLineIndex, () => dialogRunRef.current === runId);

    if (dialogRunRef.current !== runId) {
      return;
    }

    setPhase("map");
  }

  function skipIntroDialog() {
    dialogRunRef.current += 1;
    cancelVoice();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setPhase("map");
  }

  function startLevel(level: BateauLevel, testMode = false) {
    if (!testMode && level.level > progress.unlockedLevel) {
      return;
    }

    cancelVoice();
    savedSessionRef.current = false;
    setSelectedLevel(level);
    setSessionWords(shuffleSessionWords(wordsForLevel(level)));
    setWordIndex(0);
    setTreasures(0);
    setIslandStartIndex(0);
    setIsCollectingChest(false);
    setIsSailingMotionActive(false);
    setChestBursts([]);
    setJourney(null);
    setNewlyUnlockedLevel(null);
    setLastCompletedLevel(null);
    setIsResultLeaving(false);
    setIsTestMode(testMode);

    if (testMode && testToolsEnabled) {
      const url = new URL(window.location.href);
      url.searchParams.set("niveau", String(level.level));
      window.history.replaceState({}, "", url);
    }

    setPhase("playing");
    setStartedAt(Date.now());
  }

  function saveCompletedLevel() {
    if (savedSessionRef.current) {
      return;
    }

    savedSessionRef.current = true;

    if (isTestMode) {
      return;
    }

    const isFirstFrontierCompletion =
      selectedLevel.level === progress.unlockedLevel && !progress.completedLevels.includes(selectedLevel.level);
    const nextProgress = completeBateauLevel(
      progress,
      selectedLevel.level,
      treasures,
      sessionWords.map((item) => item.id),
      bateauLevels.length,
    );

    setProgress(nextProgress);
    saveBateauProgress(typeof window === "undefined" ? null : window.localStorage, nextProgress);
    setLastCompletedLevel(selectedLevel.level);

    if (isFirstFrontierCompletion) {
      setNewlyUnlockedLevel(selectedLevel.level < bateauLevels.length ? selectedLevel.level + 1 : bateauLevels.length + 1);
    }
  }

  function placeTile(tileId: string, slotIndex: number) {
    if (phase !== "playing" || usedTileIds.includes(tileId) || placed[slotIndex]) {
      return;
    }

    const tile = findTile(tileId);

    if (!tile) {
      return;
    }

    const expected = challenge.syllables[slotIndex];

    if (tile.text !== expected) {
      setMistakes((value) => value + 1);
      setWrongTileId(tileId);
      void playEffect("place").then(async () => {
        const syllableResult = await playRecordedVoice(
          getChallengeSyllableAudioPath(challenge, tile.text),
          getChallengeSyllableSpeechText(challenge, tile.text),
        );

        if (syllableResult !== "cancelled") {
          await playRecordedVoice(voiceLines.feedback.tryAgain.audio, voiceLines.feedback.tryAgain.text);
        }
      });
      window.setTimeout(() => setWrongTileId(null), 320);
      return;
    }

    const nextPlaced = [...placed];
    nextPlaced[slotIndex] = tile;
    setPlaced(nextPlaced);
    setUsedTileIds((value) => [...value, tileId]);
    void playEffect("place").then(async () => {
      await playRecordedVoice(
        getChallengeSyllableAudioPath(challenge, tile.text),
        getPlacedSyllableSpeechText(challenge, tile, slotIndex),
      );

      if (nextPlaced.every(Boolean)) {
        await finishWord();
      }
    });
  }

  async function finishWord() {
    const wind = calculateWind(startedAt, mistakes);
    setPhase("validating");
    await playEffect("levelComplete", WORD_SUCCESS_SOUND_MS);
    await playRecordedVoice(challenge.audioWord, challenge.displayWord);

    const nextJourney = buildJourney(islandStartIndex, wind);
    const sailingDuration = SAILING_DURATIONS[wind];
    const segmentDuration = Math.round(sailingDuration / wind);
    setJourney(nextJourney);
    setLastTreasuresFound(nextJourney.treasuresFound);
    setIsSailingMotionActive(true);
    setPhase("sailing");

    let collectedBefore = 0;
    nextJourney.islands.forEach((island) => {
      if (!island.hasTreasure || island.sailingOrder == null) {
        return;
      }

      const collectAt = Math.round(
        island.sailingOrder * segmentDuration + segmentDuration * CHEST_COLLECT_SEGMENT_RATIO + collectedBefore * CHEST_COLLECT_PAUSE_MS,
      );
      collectedBefore += 1;

      window.setTimeout(() => {
        const burstId = chestBurstIdRef.current + 1;
        chestBurstIdRef.current = burstId;

        setIsCollectingChest(true);
        setChestBursts((value) => [...value, burstId]);
        setTreasures((value) => value + 1);
        void playEffect("chest");

        window.setTimeout(() => {
          setIsCollectingChest(false);
        }, CHEST_COLLECT_PAUSE_MS);

        window.setTimeout(() => {
          setChestBursts((value) => value.filter((id) => id !== burstId));
        }, 980);
      }, collectAt);
    });

    window.setTimeout(() => {
      if (wordIndex + 1 >= sessionWords.length) {
        setIslandStartIndex((value) => value + nextJourney.wind);
        setPhase("done");
        void playEffect("levelComplete").then(() =>
          playRecordedVoice(voiceLines.feedback.bravo.audio, voiceLines.feedback.bravo.text),
        );
      } else {
        setIslandStartIndex((value) => value + nextJourney.wind);
        setWordIndex((value) => value + 1);
        setPhase("playing");
      }
    }, sailingDuration + nextJourney.treasuresFound * CHEST_COLLECT_PAUSE_MS + 260);
  }

  function handleTileClick(tileId: string) {
    const firstEmptySlot = placed.findIndex((slot) => slot === null);

    if (phase !== "playing" || usedTileIds.includes(tileId) || firstEmptySlot < 0) {
      return;
    }

    void playEffect("select");
    placeTile(tileId, firstEmptySlot);
  }

  function restartSession() {
    startLevel(selectedLevel, isTestMode);
  }

  function showTestMap() {
    dialogRunRef.current += 1;
    cancelVoice();
    setIsTestMode(false);
    setPhase("map");

    const url = new URL(window.location.href);
    url.searchParams.delete("niveau");
    window.history.replaceState({}, "", url);
  }

  function continueAdventure() {
    setIsResultLeaving(true);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    window.setTimeout(() => {
      setIsResultLeaving(false);
      setPhase("map");
    }, reduceMotion ? 0 : 220);
  }

  const showGamePanel = phase === "playing" || phase === "validating";
  const showHud = phase === "playing" || phase === "validating" || phase === "sailing" || phase === "done";
  const visibleIslands = phase === "sailing" && journey ? journey.islands : buildSceneIslands(islandStartIndex, 2);
  const sailingDuration = journey ? SAILING_DURATIONS[journey.wind] : 0;
  const cloudStartDistance = islandStartIndex * -13;
  const cloudEndDistance = (islandStartIndex + (phase === "sailing" ? (journey?.wind ?? 0) : 0)) * -13;

  return (
    <section
      className={`bateau-game bateau-game--${phase} ${isCollectingChest ? "bateau-game--collecting" : ""}`}
      aria-label="Jeu Bateau"
    >
      <OceanCanvas
        paused={isCollectingChest}
        sailing={phase === "sailing" && isSailingMotionActive}
        sailingDuration={sailingDuration}
        wind={journey?.wind ?? 1}
      />

      {testToolsEnabled ? (
        <details className="bateau-game__test-tools">
          <summary>🧪 {isTestMode ? `Test N${selectedLevel.level}` : "Tester"}</summary>
          <div>
            {bateauLevels.map((level) => (
              <button key={level.id} onClick={() => startLevel(level, true)} type="button">
                N{level.level}
              </button>
            ))}
            <button onClick={showTestMap} type="button">Carte</button>
          </div>
        </details>
      ) : null}

      {phase === "map" ? (
        <LevelMap
          levels={bateauLevels}
          progress={progress}
          newlyUnlockedLevel={newlyUnlockedLevel}
          recentlyCompletedLevel={lastCompletedLevel}
          onSelectLevel={startLevel}
          onClose={lastCompletedLevel ? () => setPhase("done") : undefined}
          onUnlockAnimationComplete={() => setNewlyUnlockedLevel(null)}
        />
      ) : null}

      {showHud ? (
        <div className="bateau-game__hud">
          <ProgressBar
            current={completedCount}
            total={sessionWords.length}
            score={treasures}
            level={selectedLevel.level}
            levelTotal={bateauLevels.length}
            totalTreasures={displayedTotalTreasures}
          />
        </div>
      ) : null}

      <div className="bateau-game__world" aria-hidden="true">
        <div
          className={`bateau-game__cloud-track ${phase === "sailing" ? "bateau-game__cloud-track--sailing" : ""}`}
          style={
            {
              "--cloud-start-distance": `${cloudStartDistance}vw`,
              "--cloud-end-distance": `${cloudEndDistance}vw`,
              "--cloud-sailing-duration": `${sailingDuration}ms`,
            } as CSSProperties
          }
        >
          {SCENE_CLOUDS.map((cloud) => (
            <span
              className="bateau-game__cloud"
              key={cloud.id}
              style={
                {
                  left: `${cloud.left}vw`,
                  top: `${cloud.top}px`,
                  "--cloud-scale": cloud.scale,
                  "--cloud-drift-duration": `${cloud.duration}ms`,
                  "--cloud-drift-delay": `${cloud.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        {phase !== "map" ? (
          <>
            <div
              className={`bateau-game__island-track ${phase === "sailing" ? "bateau-game__island-track--sailing" : ""}`}
              onAnimationEnd={(event) => {
                if (event.target === event.currentTarget) {
                  setIsSailingMotionActive(false);
                }
              }}
              style={
                {
                  "--sailing-duration": `${sailingDuration}ms`,
                  "--sailing-distance-desktop": `${journey ? journey.wind * -48 : 0}vw`,
                  "--sailing-distance-mobile": `${journey ? journey.wind * -58 : 0}vw`,
                } as CSSProperties
              }
            >
              {visibleIslands.map((island, index) => (
                <div
                  className={["bateau-game__island", `bateau-game__island--${island.size}`, island.hasTreasure ? "bateau-game__island--treasure" : ""]
                    .filter(Boolean)
                    .join(" ")}
                  key={island.id}
                  style={
                    {
                      "--island-left-desktop": `calc(7% + ${index * 48}vw)`,
                      "--island-left-mobile": `calc(-24px + ${index * 58}vw)`,
                    } as CSSProperties
                  }
                >
                  <img
                    className="bateau-game__island-asset"
                    src={island.hasTreasure ? ISLAND_WITH_CHEST_ASSET_PATH : ISLAND_WITHOUT_CHEST_ASSET_PATH}
                    alt=""
                    draggable={false}
                  />
                </div>
              ))}
            </div>
            {phase === "sailing"
              ? Array.from({ length: 6 + (journey?.wind ?? 1) * 3 }, (_, index) => (
                  <span
                    className="bateau-game__wind"
                    key={`wind-${index}`}
                    style={
                      {
                        "--wind-top": `${166 + (index % 6) * 24}px`,
                        "--wind-width": `${74 + (index % 6) * 7}px`,
                        "--wind-delay": `${index * -180}ms`,
                        "--wind-duration": `${2700 - (journey?.wind ?? 1) * 300}ms`,
                      } as CSSProperties
                    }
                  />
                ))
              : null}
            <BoatAsset />
            {chestBursts.map((burstId) => (
              <div className="bateau-game__collect-burst" key={burstId}>
                <span className="bateau-game__collect-spark bateau-game__collect-spark--one" />
                <span className="bateau-game__collect-spark bateau-game__collect-spark--two" />
                <img src={CHEST_ICON_ASSET_PATH} alt="" draggable={false} />
                <strong>+1</strong>
              </div>
            ))}
          </>
        ) : null}
      </div>

      {phase === "intro" ? (
        <GameIntroOverlay
          title="Maîtriser les syllabes avec Pana"
          onStart={() => void startIntroDialog()}
        />
      ) : null}

      {phase === "dialog" ? (
        <GameDialogueOverlay
          text={introLines[dialogLineIndex].text}
          onSkip={skipIntroDialog}
        />
      ) : null}

      {phase === "sailing" && journey ? (
        <div className="bateau-game__sailing-panel">
          <div className="bateau-game__sailing-status" aria-live="polite">
            <PanaMascot compact />
            <div>
              <strong>{getWindLabel(journey.wind)}</strong>
              <span>
                {journey.treasuresFound > 0
                  ? `${journey.treasuresFound} coffre${journey.treasuresFound > 1 ? "s" : ""} collecté${journey.treasuresFound > 1 ? "s" : ""}`
                  : "On file vers la prochaine île"}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {showGamePanel ? (
        <div className="bateau-game__panel">
          <div className="bateau-game__image-card">
            <div className="bateau-game__picture" aria-hidden="true">
              {!wordImageFailed ? (
                <img
                  className="bateau-game__word-image"
                  src={sitePath(challenge.image)}
                  alt=""
                  draggable={false}
                  onError={() => setWordImageFailed(true)}
                />
              ) : (
                <span className="bateau-game__picture-fallback" />
              )}
              <AudioButton
                className="bateau-game__audio"
                label={`Écouter ${challenge.displayWord}`}
                onClick={() => void playRecordedVoice(challenge.audioWord, challenge.displayWord)}
              />
            </div>
          </div>

          <div className="bateau-game__challenge">
            <div className="bateau-game__challenge-header">
              <p className="bateau-game__eyebrow" id="bateau-title">
                Compose le mot
              </p>
              {lastTreasuresFound > 0 ? <RewardBurst points={lastTreasuresFound} /> : null}
            </div>
            <div
              className="bateau-game__slots"
              aria-label="Emplacements des syllabes"
              data-count={challenge.syllables.length}
              style={{ "--slot-count": challenge.syllables.length } as CSSProperties}
            >
              {placed.map((slot, index) => (
                <SyllableSlot
                  index={index}
                  key={`${challenge.id}-slot-${index}`}
                  value={slot?.text}
                />
              ))}
            </div>
          </div>

          <div
            className="bateau-game__syllables"
            aria-label="Syllabes disponibles"
          >
            {tiles.map((tile) => (
              <div className="bateau-game__tile-wrap" key={tile.id}>
                <SyllableTile
                  id={tile.id}
                  onClick={() => handleTileClick(tile.id)}
                  state={wrongTileId === tile.id ? "wrong" : "default"}
                  text={tile.text}
                  used={usedTileIds.includes(tile.id)}
                />
                <AudioButton
                  className="bateau-game__tile-audio"
                  label={`Écouter ${tile.text}`}
                  onClick={() =>
                    void playRecordedVoice(
                      getChallengeSyllableAudioPath(challenge, tile.text),
                      getChallengeSyllableSpeechText(challenge, tile.text),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className={`bateau-game__panel bateau-game__panel--end ${isResultLeaving ? "bateau-game__panel--leaving" : ""}`}>
          <div className="bateau-game__end" aria-live="polite">
            <p className="bateau-game__eyebrow">Niveau {selectedLevel.level} terminé</p>
            <h2>{selectedLevel.level === bateauLevels.length ? "Cap sur le trésor !" : "Bravo !"}</h2>
            <p>
              {sessionWords.length} mots réussis, {treasures} coffre{treasures > 1 ? "s" : ""} collecté{treasures > 1 ? "s" : ""}.
            </p>
            <div className="bateau-game__end-actions">
              <GameButton onClick={continueAdventure} variant="success">
                Continuer l’aventure
              </GameButton>
              <GameButton onClick={restartSession} variant="secondary">Rejouer</GameButton>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
