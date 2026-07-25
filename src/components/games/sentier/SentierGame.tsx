import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { GAME_IDS } from "../../../content/gameCatalog";
import type {
  AudioLine,
  LessonBase,
  VoiceLine,
  WordReference,
} from "../../../content/types";
import sentierLessonsData from "../../../content/fr/sentier-lessons.json";
import voiceLinesData from "../../../content/fr/voice-lines.json";
import wordsData from "../../../content/fr/words.json";
import { sitePath } from "../../../utils/paths";
import { rememberLastGame } from "../../home/onboardingState";
import {
  GameDialogueOverlay,
  GameIntroOverlay,
} from "../../ui/GameIntroOverlay";
import { GemFlightLayer } from "./GemFlightLayer";
import type { GemFlightBatch } from "./GemFlightLayer";
import { JungleScene } from "./JungleScene";
import { SentierChallenge } from "./SentierChallenge";
import { SentierResult } from "./SentierResult";
import { SentierTreasurePrompt } from "./SentierTreasurePrompt";
import { useGameAudio } from "../gameAudio";
import {
  createInitialSentierState,
  rewardForErrors,
  sentierReducer,
  TREASURE_BONUS_GEMS,
} from "./sentierState";
import type { SentierDirection } from "./sentierState";
import {
  completeSentierLevel,
  createInitialSentierProgress,
  readSentierProgress,
  saveSentierProgress,
} from "./sentierProgress";
import type { SentierProgress } from "./sentierProgress";
import { useVoiceAudio } from "../useVoiceAudio";
import "./SentierGame.css";

type SentierQuestion = {
  id: string;
  targetWordId: string;
  distractors: string[];
};

type SentierLesson = LessonBase & {
  questions: SentierQuestion[];
};

type VoiceLines = {
  dialogue: {
    sentierIntro: VoiceLine[];
  };
  feedback: {
    sentierWrong: AudioLine;
    sentierUturn: AudioLine;
    sentierRecovered: AudioLine;
    sentierCorrect2: AudioLine;
    sentierCorrect1: AudioLine;
    sentierCorrect0: AudioLine;
    sentierTreasureHint: AudioLine;
    sentierTreasureChest: AudioLine;
    sentierTreasureOpened: AudioLine;
    sentierComplete: AudioLine;
  };
};

const lessons = (sentierLessonsData as SentierLesson[])
  .filter((entry) => entry.gameIds.includes(GAME_IDS.SENTIER))
  .sort((left, right) => left.level - right.level);
const lesson = lessons[0];
const wordById = new Map((wordsData as WordReference[]).map((word) => [word.id, word]));
const voiceLines = voiceLinesData as VoiceLines;
const introLines = voiceLines.dialogue.sentierIntro;
const feedback = voiceLines.feedback;
const BACKDROP_PATH = sitePath("/assets/world/jungle/jungle-backdrop.png");
const GEM_PATH = sitePath("/assets/world/jungle/gem.png");
const TRAVEL_DURATION = 660;
const DESTINATION_DURATION = TRAVEL_DURATION;
const GEM_FLIGHT_DURATION = 620;
const GEM_FLIGHT_STAGGER = 130;
const GEM_COLLECTION_SETTLE_DURATION = 180;

function speakFrench(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve();
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.88;
  utterance.pitch = 1.04;

  return new Promise<void>((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

function delay(duration: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, duration));
}

function isLocalTestHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function feedbackForReward(gems: number) {
  if (gems === 2) {
    return feedback.sentierCorrect2;
  }

  if (gems === 1) {
    return feedback.sentierCorrect1;
  }

  return feedback.sentierCorrect0;
}

export function SentierGame() {
  const [state, dispatch] = useReducer(sentierReducer, undefined, createInitialSentierState);
  const [dialogLineIndex, setDialogLineIndex] = useState(0);
  const [sceneVersion, setSceneVersion] = useState(0);
  const [progress, setProgress] = useState<SentierProgress>(createInitialSentierProgress);
  const [localTools, setLocalTools] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [panaMessageOverride, setPanaMessageOverride] = useState<string | null>(null);
  const [gemFlightBatch, setGemFlightBatch] = useState<GemFlightBatch | null>(null);
  const gameRef = useRef<HTMLElement | null>(null);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const gemFlightIdRef = useRef(0);
  const runTokenRef = useRef(0);
  const skipTravelRef = useRef<(() => void) | null>(null);
  const { cancelVoice, playVoice } = useVoiceAudio();
  const {
    enableEffects,
    playEffect,
    setJungleDucked,
    startJungleAmbience,
  } = useGameAudio();

  const question = lesson.questions[state.questionIndex];
  const target = wordById.get(question?.targetWordId ?? "") ?? wordById.values().next().value;
  const targetWord = target?.displayWord.toLocaleLowerCase("fr") ?? "";
  const selectedDirection =
    state.choices.find((choice) => choice.word === state.selectedWord)?.direction ?? null;
  const bestScore = progress.bestGemsByLevel[String(lesson.level)] ?? 0;

  const playLine = useCallback(
    async (line: AudioLine) => {
      setJungleDucked(true);
      const result = await playVoice(line.audio);

      if (result === "failed") {
        await speakFrench(line.text);
      }

      setJungleDucked(false);
    },
    [playVoice, setJungleDucked],
  );

  const playTarget = useCallback(
    async (entry: WordReference) => {
      await playLine({ text: entry.displayWord, audio: entry.audioWord });
    },
    [playLine],
  );

  const travel = useCallback(() => {
    return new Promise<void>((resolve) => {
      let completed = false;
      const timer = window.setTimeout(finish, TRAVEL_DURATION);

      function finish() {
        if (completed) {
          return;
        }

        completed = true;
        window.clearTimeout(timer);
        skipTravelRef.current = null;
        resolve();
      }

      skipTravelRef.current = finish;
    });
  }, []);

  const collectGemBatch = useCallback(
    async (count: number, source: HTMLElement, token: number) => {
      const game = gameRef.current;
      const score = scoreRef.current;

      if (!game || !score || count <= 0) {
        return count <= 0;
      }

      const gameBox = game.getBoundingClientRect();
      const sourceBox = source.getBoundingClientRect();
      const scoreBox = score.getBoundingClientRect();
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const durationMs = reducedMotion ? 140 : GEM_FLIGHT_DURATION;
      const staggerMs = reducedMotion ? 30 : GEM_FLIGHT_STAGGER;
      const batchId = gemFlightIdRef.current + 1;
      gemFlightIdRef.current = batchId;

      setGemFlightBatch({
        id: batchId,
        count,
        originX: sourceBox.left - gameBox.left + sourceBox.width / 2,
        originY: sourceBox.top - gameBox.top + sourceBox.height / 2,
        targetX: scoreBox.left - gameBox.left + scoreBox.width / 2,
        targetY: scoreBox.top - gameBox.top + scoreBox.height / 2,
        durationMs,
        staggerMs,
      });
      const gemEffects: Promise<void>[] = [];

      for (let index = 0; index < count; index += 1) {
        await delay(index === 0 ? durationMs : staggerMs);

        if (runTokenRef.current !== token) {
          setGemFlightBatch(null);
          return false;
        }

        dispatch({ type: "GEM_ARRIVED" });
        gemEffects.push(playEffect("gem"));
      }

      setGemFlightBatch(null);
      await Promise.all(gemEffects);
      await delay(reducedMotion ? 80 : GEM_COLLECTION_SETTLE_DURATION);
      return runTokenRef.current === token;
    },
    [playEffect],
  );

  const presentQuestion = useCallback(
    async (index: number) => {
      const nextQuestion = lesson.questions[index];
      const nextTarget = wordById.get(nextQuestion?.targetWordId ?? "");

      if (!nextQuestion || !nextTarget) {
        return;
      }

      const token = runTokenRef.current + 1;
      runTokenRef.current = token;
      cancelVoice();
      dispatch({
        type: "PRESENT_QUESTION",
        questionIndex: index,
        words: [nextTarget.displayWord.toLocaleLowerCase("fr"), ...nextQuestion.distractors],
      });
      setSceneVersion((version) => version + 1);
      await playTarget(nextTarget);

      if (runTokenRef.current === token) {
        dispatch({ type: "ENABLE_CHOICES" });
      }
    },
    [cancelVoice, playTarget],
  );

  const prepareRewardQuestion = useCallback(
    (index: number, rewardGems: number) => {
      const nextQuestion = lesson.questions[index];
      const nextTarget = wordById.get(nextQuestion?.targetWordId ?? "");

      if (!nextQuestion || !nextTarget) {
        return null;
      }

      cancelVoice();
      dispatch({
        type: "PRESENT_QUESTION",
        questionIndex: index,
        words: [nextTarget.displayWord.toLocaleLowerCase("fr"), ...nextQuestion.distractors],
        rewardGems,
      });
      setSceneVersion((version) => version + 1);
      return nextTarget;
    },
    [cancelVoice],
  );

  const finishLevel = useCallback(
    async (score: number, token: number) => {
      dispatch({ type: "SHOW_RESULT" });

      if (!testMode) {
        setProgress((current) => {
          const completed = completeSentierLevel(current, lesson.level, score, lessons.length);
          saveSentierProgress(window.localStorage, completed);
          return completed;
        });
      }

      await playEffect("levelComplete");

      if (runTokenRef.current !== token) {
        return;
      }

      await playLine(feedback.sentierComplete);
    },
    [playEffect, playLine, testMode],
  );

  const startDestination = useCallback(
    async (token: number) => {
      dispatch({ type: "START_DESTINATION" });
      setSceneVersion((version) => version + 1);
      void playEffect("jungleStep");
      await delay(DESTINATION_DURATION);

      if (runTokenRef.current !== token) {
        return;
      }

      dispatch({ type: "ARRIVE_DESTINATION" });
      void playEffect("star");
      void playLine(feedback.sentierTreasureHint);
    },
    [playEffect, playLine],
  );

  const handleChoice = useCallback(
    async (word: string) => {
      if (state.phase !== "choosing" || !target) {
        return;
      }

      const token = runTokenRef.current + 1;
      runTokenRef.current = token;
      dispatch({ type: "SELECT", word });
      void playEffect("jungleStep");
      await travel();

      if (runTokenRef.current !== token) {
        return;
      }

      if (word === targetWord) {
        const reward = rewardForErrors(state.errors);
        const completesLevel = state.questionIndex >= lesson.questions.length - 1;
        const nextTarget =
          !completesLevel
            ? prepareRewardQuestion(state.questionIndex + 1, reward)
            : null;

        if (!nextTarget) {
          setSceneVersion((version) => version + 1);
          dispatch({ type: "ARRIVE_CORRECT" });
        }

        await playLine(feedbackForReward(reward));

        if (runTokenRef.current !== token) {
          return;
        }

        if (reward > 0) {
          return;
        }

        if (nextTarget) {
          dispatch({ type: "FINISH_REWARD" });
          await playTarget(nextTarget);

          if (runTokenRef.current === token) {
            dispatch({ type: "ENABLE_CHOICES" });
          }
        } else {
          await startDestination(token);
        }

        return;
      }

      setSceneVersion((version) => version + 1);
      const remainingCount = state.remainingWords.filter((entry) => entry !== word).length;
      dispatch({ type: "ARRIVE_WRONG" });
      await playLine(remainingCount === 1 ? feedback.sentierUturn : feedback.sentierWrong);

      if (runTokenRef.current === token && remainingCount > 1) {
        dispatch({ type: "RETRY" });
      }
    },
    [
      playEffect,
      playLine,
      playTarget,
      prepareRewardQuestion,
      state.errors,
      state.phase,
      state.questionIndex,
      state.remainingWords,
      startDestination,
      target,
      targetWord,
      travel,
    ],
  );

  const handleRewardMound = useCallback(
    async (source: HTMLElement) => {
      if (state.phase !== "reward" || state.pendingGems <= 0) {
        return;
      }

      const token = runTokenRef.current + 1;
      runTokenRef.current = token;
      const rewardCount = state.pendingGems;
      dispatch({ type: "START_REWARD_COLLECTION" });
      const [collected] = await Promise.all([
        collectGemBatch(rewardCount, source, token),
        playEffect("star"),
      ]);

      if (!collected || runTokenRef.current !== token) {
        return;
      }

      if (state.rewardCompletesLevel) {
        await startDestination(token);
        return;
      }

      dispatch({ type: "FINISH_REWARD" });
      if (target) {
        await playTarget(target);
      }

      if (runTokenRef.current === token) {
        dispatch({ type: "ENABLE_CHOICES" });
      }
    },
    [
      collectGemBatch,
      playEffect,
      playTarget,
      startDestination,
      state.pendingGems,
      state.phase,
      state.rewardCompletesLevel,
      target,
    ],
  );

  const handleUturn = useCallback(async () => {
    if (state.phase !== "uturn-prompt") {
      return;
    }

    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    dispatch({ type: "START_UTURN" });
    void playEffect("jungleStep");
    await travel();

    if (runTokenRef.current !== token) {
      return;
    }

    if (state.questionIndex >= lesson.questions.length - 1) {
      dispatch({ type: "FINISH_UTURN" });
      await startDestination(token);
    } else {
      const nextQuestion = lesson.questions[state.questionIndex + 1];
      const nextTarget = wordById.get(nextQuestion?.targetWordId ?? "");

      if (!nextQuestion || !nextTarget) {
        return;
      }

      cancelVoice();
      dispatch({
        type: "PRESENT_QUESTION",
        questionIndex: state.questionIndex + 1,
        words: [nextTarget.displayWord.toLocaleLowerCase("fr"), ...nextQuestion.distractors],
      });
      setSceneVersion((version) => version + 1);
      setPanaMessageOverride(feedback.sentierRecovered.text);
      await Promise.all([playLine(feedback.sentierRecovered), delay(1_000)]);

      if (runTokenRef.current !== token) {
        setPanaMessageOverride(null);
        return;
      }

      setPanaMessageOverride(null);
      await playTarget(nextTarget);

      if (runTokenRef.current === token) {
        dispatch({ type: "ENABLE_CHOICES" });
      }
    }
  }, [
    cancelVoice,
    playEffect,
    playLine,
    playTarget,
    state.phase,
    state.questionIndex,
    startDestination,
    travel,
  ]);

  const handleDigTreasure = useCallback(
    (source: HTMLElement) => {
      if (state.phase !== "treasure-buried") {
        return;
      }

      runTokenRef.current += 1;
      dispatch({ type: "DIG_TREASURE" });
      void playEffect("star");
      void playLine(feedback.sentierTreasureChest);
      source.blur();
    },
    [playEffect, playLine, state.phase],
  );

  const handleOpenTreasure = useCallback(
    async (source: HTMLElement) => {
      if (state.phase !== "treasure-revealed") {
        return;
      }

      const token = runTokenRef.current + 1;
      runTokenRef.current = token;
      const finalScore = state.gems + TREASURE_BONUS_GEMS;
      dispatch({ type: "OPEN_TREASURE" });
      void playEffect("chest");
      void playLine(feedback.sentierTreasureOpened);
      await delay(180);

      if (runTokenRef.current !== token) {
        return;
      }

      const openChest =
        gameRef.current?.querySelector<HTMLElement>('[data-testid="sentier-open-chest"]') ??
        source;
      const collected = await collectGemBatch(TREASURE_BONUS_GEMS, openChest, token);

      if (!collected || runTokenRef.current !== token) {
        return;
      }

      await finishLevel(finalScore, token);
    },
    [
      collectGemBatch,
      finishLevel,
      playEffect,
      playLine,
      state.gems,
      state.phase,
    ],
  );

  const startIntro = useCallback(async () => {
    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    enableEffects();
    startJungleAmbience();
    rememberLastGame(window.localStorage, "sentier");
    dispatch({ type: "START_DIALOGUE" });

    for (const [index, line] of introLines.entries()) {
      if (runTokenRef.current !== token) {
        return;
      }

      setDialogLineIndex(index);
      await playLine(line);
    }

    if (runTokenRef.current === token) {
      await presentQuestion(0);
    }
  }, [enableEffects, playLine, presentQuestion, startJungleAmbience]);

  const skipIntro = useCallback(() => {
    runTokenRef.current += 1;
    cancelVoice();
    window.speechSynthesis?.cancel();
    void presentQuestion(0);
  }, [cancelVoice, presentQuestion]);

  const replay = useCallback(() => {
    runTokenRef.current += 1;
    void presentQuestion(0);
  }, [presentQuestion]);

  useEffect(() => {
    setProgress(readSentierProgress(window.localStorage, lessons.length));
    const local = isLocalTestHost(window.location.hostname);
    setLocalTools(local);
    const params = new URLSearchParams(window.location.search);

    if (local && params.get("test") === "1") {
      setTestMode(true);
      enableEffects();
      startJungleAmbience();
      const requestedState = params.get("state");

      const prepareTreasureState = (
        stage: "buried" | "revealed" | "collecting" | "result",
      ) => {
        dispatch({
          type: "PRESENT_QUESTION",
          questionIndex: lesson.questions.length - 1,
          words: ["maison", "melon", "panda"],
          random: () => 0.99,
        });
        dispatch({ type: "ENABLE_CHOICES" });
        dispatch({ type: "SELECT", word: "maison" });
        dispatch({ type: "ARRIVE_CORRECT" });
        dispatch({ type: "START_REWARD_COLLECTION" });
        dispatch({ type: "GEM_ARRIVED" });
        dispatch({ type: "GEM_ARRIVED" });
        dispatch({ type: "START_DESTINATION" });
        dispatch({ type: "ARRIVE_DESTINATION" });

        if (stage === "revealed" || stage === "collecting" || stage === "result") {
          dispatch({ type: "DIG_TREASURE" });
        }

        if (stage === "collecting" || stage === "result") {
          dispatch({ type: "OPEN_TREASURE" });
        }

        if (stage === "result") {
          for (let index = 0; index < TREASURE_BONUS_GEMS; index += 1) {
            dispatch({ type: "GEM_ARRIVED" });
          }
          dispatch({ type: "SHOW_RESULT" });
        }
      };

      if (requestedState === "intro") {
        return;
      } else if (requestedState === "dialogue") {
        dispatch({ type: "START_DIALOGUE" });
      } else if (requestedState === "result") {
        prepareTreasureState("result");
      } else if (requestedState === "treasure") {
        prepareTreasureState("buried");
      } else if (requestedState === "treasure-revealed") {
        prepareTreasureState("revealed");
      } else if (requestedState === "treasure-open") {
        prepareTreasureState("collecting");
      } else if (params.get("choices") === "5") {
        dispatch({
          type: "PRESENT_QUESTION",
          questionIndex: 0,
          words: ["moto", "melon", "maison", "chaton", "bateau"],
          random: () => 0.99,
        });
        dispatch({ type: "ENABLE_CHOICES" });
      } else if (requestedState === "uturn") {
        dispatch({
          type: "PRESENT_QUESTION",
          questionIndex: 0,
          words: ["moto", "melon", "maison"],
          random: () => 0.99,
        });
        dispatch({ type: "ENABLE_CHOICES" });
        dispatch({ type: "SELECT", word: "melon" });
        dispatch({ type: "ARRIVE_WRONG", random: () => 0.99 });
        dispatch({ type: "RETRY" });
        dispatch({ type: "SELECT", word: "maison" });
        dispatch({ type: "ARRIVE_WRONG", random: () => 0.99 });
      } else if (params.get("errors") === "1") {
        dispatch({
          type: "PRESENT_QUESTION",
          questionIndex: 0,
          words: ["moto", "melon", "maison"],
          random: () => 0.99,
        });
        dispatch({ type: "ENABLE_CHOICES" });
        dispatch({ type: "SELECT", word: "melon" });
        dispatch({ type: "ARRIVE_WRONG", random: () => 0.99 });
        dispatch({ type: "RETRY" });
      } else {
        const index = Math.min(
          lesson.questions.length - 1,
          Math.max(0, Number(params.get("question")) || 0),
        );
        const testQuestion = lesson.questions[index];
        const testTarget = wordById.get(testQuestion.targetWordId);

        dispatch({
          type: "PRESENT_QUESTION",
          questionIndex: index,
          words: [
            testTarget?.displayWord.toLocaleLowerCase("fr") ?? testQuestion.targetWordId,
            ...testQuestion.distractors,
          ],
          random: () => 0.99,
        });
        dispatch({ type: "ENABLE_CHOICES" });
      }
    }
  }, [enableEffects, presentQuestion, startJungleAmbience]);

  useEffect(
    () => () => {
      runTokenRef.current += 1;
      skipTravelRef.current?.();
    },
    [],
  );

  const message = useMemo(() => {
    if (panaMessageOverride) {
      return panaMessageOverride;
    }

    switch (state.phase) {
      case "travelling":
      case "uturn-travelling":
        return "Regardons où mène ce chemin…";
      case "destination-travelling":
        return "Nous y sommes presque…";
      case "wrong-feedback":
        return feedback.sentierWrong.text;
      case "uturn-prompt":
        return feedback.sentierUturn.text;
      case "reward":
      case "reward-collecting":
        return feedbackForReward(state.rewardTotal).text;
      case "treasure-buried":
        return feedback.sentierTreasureHint.text;
      case "treasure-revealed":
        return feedback.sentierTreasureChest.text;
      case "treasure-collecting":
        return feedback.sentierTreasureOpened.text;
      default:
        return "Écoute le mot et choisis le bon chemin.";
    }
  }, [panaMessageOverride, state.phase, state.rewardTotal]);

  if (!target) {
    return <div className="sentier-game sentier-game--error">Le niveau est indisponible.</div>;
  }

  if (state.phase === "intro") {
    return (
      <section className="sentier-game sentier-game--opening" data-testid="sentier-game">
        <img className="sentier-opening__backdrop" src={BACKDROP_PATH} alt="" />
        <div className="sentier-opening__shade" />
        <GameIntroOverlay
          title="Le Sentier des mots"
          subtitle="Lis les mots et guide Pana jusqu’au trésor."
          onStart={() => void startIntro()}
        />
        {localTools ? (
          <button
            className="sentier-game__test sentier-game__test--opening"
            type="button"
            onClick={() => void presentQuestion(0)}
          >
            🧪 Tester
          </button>
        ) : null}
      </section>
    );
  }

  if (state.phase === "dialogue") {
    const line = introLines[dialogLineIndex] ?? introLines[0];

    return (
      <section className="sentier-game sentier-game--opening" data-testid="sentier-game">
        <img className="sentier-opening__backdrop" src={BACKDROP_PATH} alt="" />
        <div className="sentier-opening__shade" />
        <GameDialogueOverlay text={line.text} onSkip={skipIntro} />
      </section>
    );
  }

  const resultVisible = state.phase === "result";
  const treasureMode = state.destinationReached;
  const showSinglePath =
    state.rewardCompletesLevel &&
    state.rewardTotal > 0 &&
    (state.phase === "reward" ||
      state.phase === "reward-collecting" ||
      state.phase === "destination-travelling");
  const completedQuestionCount =
    state.destinationReached || resultVisible
      ? state.questionIndex + 1
      : state.questionIndex;

  return (
    <section
      className={`sentier-game ${treasureMode ? "sentier-game--treasure" : ""}`}
      data-testid="sentier-game"
      ref={gameRef}
    >
      <header className="sentier-game__hud" data-testid="sentier-hud">
        <div>
          <strong>Niveau {lesson.level}</strong>
          {treasureMode ? (
            <span> · Trésor</span>
          ) : (
            <span>
              {" "}
              · Mot {Math.min(state.questionIndex + 1, lesson.questions.length)}/
              {lesson.questions.length}
            </span>
          )}
        </div>
        <div
          className="sentier-game__score"
          ref={scoreRef}
          aria-label={`${state.gems} gemme${state.gems > 1 ? "s" : ""} collectée${
            state.gems > 1 ? "s" : ""
          }`}
        >
          <img src={GEM_PATH} alt="" />
          <strong data-testid="sentier-gem-count">{state.gems}</strong>
        </div>
        <div className="sentier-game__progress" aria-hidden="true">
          <span
            style={{
              width: `${(completedQuestionCount / lesson.questions.length) * 100}%`,
            }}
          />
        </div>
      </header>

      <JungleScene
        choiceCount={state.choices.length}
        destinationReached={state.destinationReached}
        lostness={state.destinationReached ? 0 : state.errors}
        onDigTreasure={handleDigTreasure}
        onOpenTreasure={handleOpenTreasure}
        onRewardMound={handleRewardMound}
        onSkipTravel={() => skipTravelRef.current?.()}
        phase={state.phase}
        preloadTreasureAssets={
          state.destinationReached ||
          state.questionIndex >= Math.max(0, lesson.questions.length - 2)
        }
        rewardGems={state.pendingGems}
        sceneVersion={sceneVersion}
        selectedDirection={selectedDirection as SentierDirection | null}
        showSinglePath={showSinglePath}
      />

      {resultVisible ? (
        <SentierResult
          level={lesson.level}
          title={lesson.title}
          gems={state.gems}
          bestScore={bestScore}
          onReplay={replay}
        />
      ) : treasureMode ? (
        <SentierTreasurePrompt message={message} />
      ) : (
        <SentierChallenge
          choices={state.choices}
          message={message}
          onChoose={(word) => void handleChoice(word)}
          onListen={() => void playTarget(target)}
          onUturn={() => void handleUturn()}
          phase={state.phase}
          selectedWord={state.selectedWord}
          target={target}
        />
      )}

      <GemFlightLayer batch={gemFlightBatch} />

      {localTools && !treasureMode && !state.rewardCompletesLevel ? (
        <button
          className="sentier-game__test"
          type="button"
          onClick={() => {
            setTestMode(true);
            runTokenRef.current += 1;
            rememberLastGame(window.localStorage, "sentier");
            void presentQuestion((state.questionIndex + 1) % lesson.questions.length);
          }}
        >
          🧪 Mot suivant
        </button>
      ) : null}
    </section>
  );
}
