import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { GAME_IDS } from "../../content/gameCatalog";
import type {
  AudioLine,
  LessonBase,
  VoiceLine,
  WordReference,
} from "../../content/types";
import sentierLessonsData from "../../content/fr/sentier-lessons.json";
import voiceLinesData from "../../content/fr/voice-lines.json";
import wordsData from "../../content/fr/words.json";
import { sitePath } from "../../utils/paths";
import { rememberLastGame } from "../home/onboardingState";
import { GameButton } from "../ui/GameButton";
import {
  GameDialogueOverlay,
  GameIntroOverlay,
} from "../ui/GameIntroOverlay";
import { JungleScene } from "./JungleScene";
import { SentierChallenge } from "./SentierChallenge";
import { useGameAudio } from "./gameAudio";
import {
  createInitialSentierState,
  rewardForErrors,
  sentierReducer,
} from "./sentierState";
import type { SentierDirection } from "./sentierState";
import {
  completeSentierLevel,
  createInitialSentierProgress,
  readSentierProgress,
  saveSentierProgress,
} from "./sentierProgress";
import type { SentierProgress } from "./sentierProgress";
import { useVoiceAudio } from "./useVoiceAudio";
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
    sentierCorrect2: AudioLine;
    sentierCorrect1: AudioLine;
    sentierCorrect0: AudioLine;
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
const PANA_PATH = sitePath("/assets/characters/pana.png");
const BACKDROP_PATH = sitePath("/assets/world/jungle/jungle-backdrop.png");
const GEM_PATH = sitePath("/assets/world/jungle/gem.png");
const MAX_GEMS = lesson.questions.length * 2;
const TRAVEL_DURATION = 660;

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

  const continueAfterReward = useCallback(
    async (score: number, token: number) => {
      await delay(380);

      if (runTokenRef.current !== token) {
        return;
      }

      if (state.questionIndex >= lesson.questions.length - 1) {
        await finishLevel(score, token);
      } else {
        await presentQuestion(state.questionIndex + 1);
      }
    },
    [finishLevel, presentQuestion, state.questionIndex],
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

      setSceneVersion((version) => version + 1);

      if (word === targetWord) {
        const reward = rewardForErrors(state.errors);
        dispatch({ type: "ARRIVE_CORRECT" });
        await playLine(feedbackForReward(reward));

        if (runTokenRef.current !== token) {
          return;
        }

        for (let index = 0; index < reward; index += 1) {
          void playEffect("gem");
          await delay(180);
        }

        dispatch({ type: "COLLECT_REWARD" });
        await continueAfterReward(state.gems + reward, token);
        return;
      }

      const remainingCount = state.remainingWords.filter((entry) => entry !== word).length;
      dispatch({ type: "ARRIVE_WRONG" });
      await playLine(remainingCount === 1 ? feedback.sentierUturn : feedback.sentierWrong);

      if (runTokenRef.current === token && remainingCount > 1) {
        dispatch({ type: "RETRY" });
      }
    },
    [
      continueAfterReward,
      playEffect,
      playLine,
      state.errors,
      state.gems,
      state.phase,
      state.remainingWords,
      target,
      targetWord,
      travel,
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

    setSceneVersion((version) => version + 1);
    dispatch({ type: "FINISH_UTURN" });
    await playLine(feedback.sentierCorrect0);
    await continueAfterReward(state.gems, token);
  }, [continueAfterReward, playEffect, playLine, state.gems, state.phase, travel]);

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

      if (params.get("state") === "intro") {
        return;
      } else if (params.get("state") === "dialogue") {
        dispatch({ type: "START_DIALOGUE" });
      } else if (params.get("state") === "result") {
        dispatch({
          type: "PRESENT_QUESTION",
          questionIndex: lesson.questions.length - 1,
          words: ["maison", "melon", "panda"],
        });
        dispatch({ type: "SHOW_RESULT" });
      } else if (params.get("choices") === "5") {
        dispatch({
          type: "PRESENT_QUESTION",
          questionIndex: 0,
          words: ["moto", "melon", "maison", "chaton", "bateau"],
          random: () => 0.99,
        });
        dispatch({ type: "ENABLE_CHOICES" });
      } else if (params.get("state") === "uturn") {
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
    switch (state.phase) {
      case "travelling":
      case "uturn-travelling":
        return "Regardons où mène ce chemin…";
      case "wrong-feedback":
        return feedback.sentierWrong.text;
      case "uturn-prompt":
        return feedback.sentierUturn.text;
      case "reward":
        return feedbackForReward(state.pendingGems).text;
      default:
        return "Écoute le mot et choisis le bon chemin.";
    }
  }, [state.pendingGems, state.phase]);

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

  return (
    <section className="sentier-game" data-testid="sentier-game">
      <header className="sentier-game__hud" data-testid="sentier-hud">
        <div>
          <strong>Niveau {lesson.level}</strong>
          <span> · Mot {Math.min(state.questionIndex + 1, lesson.questions.length)}/{lesson.questions.length}</span>
        </div>
        <div className="sentier-game__score">
          <img src={GEM_PATH} alt="" />
          <strong>{state.gems}</strong>
          <span>/{MAX_GEMS}</span>
        </div>
        <div className="sentier-game__progress" aria-hidden="true">
          <span style={{ width: `${((state.questionIndex + (resultVisible ? 1 : 0)) / lesson.questions.length) * 100}%` }} />
        </div>
      </header>

      <JungleScene
        choices={state.choices}
        lostness={state.errors}
        onSkipTravel={() => skipTravelRef.current?.()}
        phase={state.phase}
        rewardGems={state.pendingGems}
        sceneVersion={sceneVersion}
        selectedDirection={selectedDirection as SentierDirection | null}
      />

      {resultVisible ? (
        <section className="sentier-result" data-testid="sentier-result">
          <img src={PANA_PATH} alt="Pana" />
          <div>
            <p>Niveau {lesson.level} · {lesson.title}</p>
            <h2>Étape terminée !</h2>
            <strong>
              <img src={GEM_PATH} alt="" /> {state.gems} gemmes sur {MAX_GEMS}
            </strong>
            {bestScore > 0 ? <span>Meilleur score : {Math.max(bestScore, state.gems)}</span> : null}
          </div>
          <div className="sentier-result__actions">
            <GameButton onClick={replay}>Rejouer le niveau</GameButton>
            <a href={sitePath("/#jeux")}>Retour aux jeux</a>
          </div>
        </section>
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

      {localTools ? (
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
