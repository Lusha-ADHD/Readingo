import { useEffect, useMemo, useRef, useState } from "react";
import { GAME_IDS } from "../../../content/gameCatalog";
import type {
  AudioLine,
  SyllableEntry,
  VoiceLine,
  WordEntry,
} from "../../../content/types";
import syllableEntries from "../../../content/fr/syllables.json";
import lessonEntries from "../../../content/fr/lessons.json";
import voiceLinesData from "../../../content/fr/voice-lines.json";
import words from "../../../content/fr/words.json";
import { rememberLastGame, shouldResumeFromUrl } from "../../home/onboardingState";
import {
  GameDialogueOverlay,
  GameIntroOverlay,
} from "../../ui/GameIntroOverlay";
import { ProgressBar } from "../../ui/ProgressBar";
import { BateauChallenge } from "./BateauChallenge";
import { BateauResult } from "./BateauResult";
import { BateauScene } from "./BateauScene";
import { LevelMap } from "./LevelMap";
import type { BateauLevel } from "./LevelMap";
import {
  buildJourney,
  SAILING_DURATIONS,
} from "./bateauJourney";
import type { BateauPhase, Journey } from "./bateauJourney";
import {
  completeBateauLevel,
  readBateauProgress,
  saveBateauProgress,
} from "./bateauProgress";
import type { BateauProgress } from "./bateauProgress";
import { createBateauTiles } from "./bateauTiles";
import type { BateauTile } from "./bateauTiles";
import { useGameAudio } from "../gameAudio";
import { useVoiceAudio } from "../useVoiceAudio";
import type { VoicePlaybackResult } from "../useVoiceAudio";
import "./BateauGame.css";

type Tile = BateauTile;

type VoiceLines = {
  dialogue: { intro: VoiceLine[] };
  feedback: { tryAgain: AudioLine; bravo: AudioLine };
};

const CHEST_COLLECT_PAUSE_MS = 620;
const CHEST_COLLECT_SEGMENT_RATIO = 0.58;
const WORD_SUCCESS_SOUND_MS = 600;
const wordChallenges = words as WordEntry[];
const wordById = new Map(wordChallenges.map((word) => [word.id, word]));
const bateauLevels = (lessonEntries as BateauLevel[])
  .filter((level) => level.gameIds.includes(GAME_IDS.BATEAU))
  .sort((left, right) => left.level - right.level);
const firstLevelWordIds = bateauLevels[0]?.wordIds ?? [];
const syllableByText = new Map((syllableEntries as SyllableEntry[]).map((entry) => [entry.text, entry]));
const voiceLines = voiceLinesData as VoiceLines;
const introLines = voiceLines.dialogue.intro;

function shuffleSessionWords(previousOrder: WordEntry[]) {
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
  return level.wordIds.map((id) => wordById.get(id)).filter((word): word is WordEntry => Boolean(word));
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

function getChallengeSyllableSpeechText(challenge: WordEntry, text: string) {
  const syllableIndex = challenge.syllables.indexOf(text);
  return syllableIndex >= 0 ? (challenge.spokenSyllables?.[syllableIndex] ?? getSyllableSpeechText(text)) : getSyllableSpeechText(text);
}

function getChallengeSyllableAudioPath(challenge: WordEntry, text: string) {
  return challenge.audioSyllables[text] ?? getSyllableAudioPath(text);
}

function getPlacedSyllableSpeechText(challenge: WordEntry, tile: Tile, slotIndex: number) {
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

export function BateauGame() {
  const [phase, setPhase] = useState<BateauPhase>("intro");
  const [dialogLineIndex, setDialogLineIndex] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<BateauLevel>(() => bateauLevels[0]);
  const [sessionWords, setSessionWords] = useState<WordEntry[]>(() => wordsForLevel(bateauLevels[0]));
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

  return (
    <section
      className={`bateau-game bateau-game--${phase} ${isCollectingChest ? "bateau-game--collecting" : ""}`}
      aria-label="Jeu Bateau"
    >
      <BateauScene
        phase={phase}
        collectingChest={isCollectingChest}
        sailingMotionActive={isSailingMotionActive}
        journey={journey}
        islandStartIndex={islandStartIndex}
        chestBursts={chestBursts}
        onSailingMotionComplete={() => setIsSailingMotionActive(false)}
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

      {showGamePanel ? (
        <BateauChallenge
          key={challenge.id}
          challenge={challenge}
          tiles={tiles}
          placed={placed}
          usedTileIds={usedTileIds}
          wrongTileId={wrongTileId}
          lastTreasuresFound={lastTreasuresFound}
          onListenWord={() =>
            void playRecordedVoice(challenge.audioWord, challenge.displayWord)
          }
          onListenSyllable={(tile) =>
            void playRecordedVoice(
              getChallengeSyllableAudioPath(challenge, tile.text),
              getChallengeSyllableSpeechText(challenge, tile.text),
            )
          }
          onSelectTile={handleTileClick}
        />
      ) : null}

      {phase === "done" ? (
        <BateauResult
          level={selectedLevel.level}
          levelCount={bateauLevels.length}
          wordCount={sessionWords.length}
          treasures={treasures}
          leaving={isResultLeaving}
          onContinue={continueAdventure}
          onReplay={restartSession}
        />
      ) : null}
    </section>
  );
}
