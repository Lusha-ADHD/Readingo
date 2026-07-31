import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GAME_IDS } from "../../../content/gameCatalog";
import type {
  AudioLine,
  VoiceLine,
  WordReference,
} from "../../../content/types";
import letterEntriesData from "../../../content/fr/letters.json";
import letterLessonsData from "../../../content/fr/letter-lessons.json";
import voiceLinesData from "../../../content/fr/voice-lines.json";
import wordsData from "../../../content/fr/words.json";
import { rememberLastGame, shouldResumeFromUrl } from "../../home/onboardingState";
import {
  GameDialogueOverlay,
  GameIntroOverlay,
} from "../../ui/GameIntroOverlay";
import { useVoiceAudio } from "../useVoiceAudio";
import { ConstellationScene } from "./ConstellationScene";
import { LettersChallenge } from "./LettersChallenge";
import { LettersLevelMap } from "./LettersLevelMap";
import { LettersResult } from "./LettersResult";
import {
  buildLetterChoices,
  shuffleLetterChoices,
} from "./letterGame";
import type {
  LetterEntry,
  LetterLesson,
} from "./letterGame";
import { getLettersConstellation } from "./lettersConstellations";
import {
  completeLettersLevel,
  createInitialLettersProgress,
  readLettersProgress,
  saveLettersProgress,
} from "./lettersProgress";
import type { LettersProgress } from "./lettersProgress";
import { useLettersAudio } from "./lettersAudio";
import "./LettersGame.css";

type VoiceLines = {
  dialogue: {
    lettersIntro: VoiceLine[];
  };
  feedback: {
    tryAgain: AudioLine;
    bravo: AudioLine;
  };
};

type GamePhase =
  | "intro"
  | "dialog"
  | "map"
  | "question"
  | "wrong"
  | "correct"
  | "star"
  | "result";

const letters = letterEntriesData as LetterEntry[];
const lessons = (letterLessonsData as LetterLesson[])
  .filter((lesson) => lesson.gameIds.includes(GAME_IDS.LETTERS))
  .sort((left, right) => left.level - right.level);
const letterById = new Map(letters.map((letter) => [letter.id, letter]));
const wordById = new Map((wordsData as WordReference[]).map((word) => [word.id, word]));
const voiceLines = voiceLinesData as VoiceLines;
const lettersIntroLines = voiceLines.dialogue.lettersIntro;
const feedback = voiceLines.feedback;
const NEXT_QUESTION_DELAY_MS = 480;

function speakFrench(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve();
  }

  window.speechSynthesis.cancel();
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

function wait(duration: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, duration));
}

function isLocalTestHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function LettersGame() {
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [dialogLineIndex, setDialogLineIndex] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState<LetterLesson>(() => lessons[0]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [litStars, setLitStars] = useState(0);
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const [choiceVersion, setChoiceVersion] = useState(0);
  const [progress, setProgress] = useState<LettersProgress>(createInitialLettersProgress);
  const [newlyUnlockedLevel, setNewlyUnlockedLevel] = useState<number | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [localToolsAvailable, setLocalToolsAvailable] = useState(false);
  const actionTokenRef = useRef(0);
  const dialogRunRef = useRef(0);
  const { cancelVoice, playVoice } = useVoiceAudio();
  const { enableEffects, playEffect, startNightAmbience } = useLettersAudio();

  const lesson = selectedLesson;
  const constellation = getLettersConstellation(lesson?.level ?? 1);
  const question = lesson?.questions[questionIndex];
  const targetLetter = question ? letterById.get(question.targetLetterId) : undefined;
  const anchorWord = targetLetter ? wordById.get(targetLetter.anchorWordId) : undefined;
  const choiceOptions = useMemo(
    () => (question ? shuffleLetterChoices(buildLetterChoices(question)) : []),
    [choiceVersion, question],
  );
  const inputLocked = phase !== "question";

  const playLine = useCallback(
    async (audioPath: string, fallbackText: string) => {
      const result = await playVoice(audioPath);

      if (result === "failed") {
        await speakFrench(fallbackText);
      }
    },
    [playVoice],
  );

  const playPrompt = useCallback(
    async (entry: LetterEntry | undefined) => {
      if (entry) {
        await playLine(entry.promptAudio, entry.promptSpeechText);
      }
    },
    [playLine],
  );

  const loadQuestion = useCallback(
    (targetLesson: LetterLesson, index: number, stars: number, asTest: boolean) => {
      const safeIndex = Math.min(
        targetLesson.questions.length - 1,
        Math.max(0, index),
      );
      actionTokenRef.current += 1;
      cancelVoice();
      window.speechSynthesis?.cancel();
      setSelectedLesson(targetLesson);
      setTestMode(asTest);
      setQuestionIndex(safeIndex);
      setLitStars(Math.min(stars, targetLesson.questions.length - 1));
      setSelectedLetterId(null);
      setChoiceVersion((version) => version + 1);
      setPhase("question");
      void playPrompt(
        letterById.get(targetLesson.questions[safeIndex]?.targetLetterId ?? ""),
      );
    },
    [cancelVoice, playPrompt],
  );

  const startLevel = useCallback(
    (targetLesson: LetterLesson, asTest = false) => {
      if (!asTest && targetLesson.level > progress.unlockedLevel) {
        return;
      }

      enableEffects();
      startNightAmbience();
      setNewlyUnlockedLevel(null);
      loadQuestion(targetLesson, 0, 0, asTest);
    },
    [enableEffects, loadQuestion, progress.unlockedLevel, startNightAmbience],
  );

  const finishLevel = useCallback(
    async (token: number) => {
      setLitStars(lesson.questions.length);
      setPhase("result");

      if (!testMode) {
        const unlocksNext =
          lesson.level === progress.unlockedLevel &&
          !progress.completedLevels.includes(lesson.level) &&
          lesson.level < lessons.length;
        const completed = completeLettersLevel(
          progress,
          lesson.level,
          lessons.length,
        );
        setProgress(completed);
        saveLettersProgress(window.localStorage, completed);
        setNewlyUnlockedLevel(unlocksNext ? lesson.level + 1 : null);
      }

      await playEffect("levelComplete");

      if (token !== actionTokenRef.current) {
        return;
      }

      await playLine(feedback.bravo.audio, feedback.bravo.text);
    },
    [lesson, playEffect, playLine, progress, testMode],
  );

  const handleChoice = useCallback(
    async (letterId: string) => {
      if (inputLocked || !question || !targetLetter || !anchorWord) {
        return;
      }

      const chosenLetter = letterById.get(letterId);

      if (!chosenLetter) {
        return;
      }

      const token = actionTokenRef.current + 1;
      actionTokenRef.current = token;
      startNightAmbience();
      setSelectedLetterId(letterId);

      if (letterId !== targetLetter.id) {
        setPhase("wrong");
        await playLine(chosenLetter.nameAudio, chosenLetter.nameSpeechText);

        if (token !== actionTokenRef.current) {
          return;
        }

        await playLine(feedback.tryAgain.audio, feedback.tryAgain.text);

        if (token === actionTokenRef.current) {
          setSelectedLetterId(null);
          setPhase("question");
        }
        return;
      }

      setPhase("correct");
      void playEffect("place");
      await playLine(anchorWord.audioWord, anchorWord.displayWord);

      if (token !== actionTokenRef.current) {
        return;
      }

      setLitStars((stars) => stars + 1);
      setPhase("star");
      void playEffect("star");
      await wait(NEXT_QUESTION_DELAY_MS);

      if (token !== actionTokenRef.current) {
        return;
      }

      if (questionIndex >= lesson.questions.length - 1) {
        await finishLevel(token);
        return;
      }

      const nextIndex = questionIndex + 1;
      setQuestionIndex(nextIndex);
      setSelectedLetterId(null);
      setChoiceVersion((version) => version + 1);
      setPhase("question");
      await playPrompt(
        letterById.get(lesson.questions[nextIndex]?.targetLetterId ?? ""),
      );
    },
    [
      anchorWord,
      finishLevel,
      inputLocked,
      lesson,
      playEffect,
      playLine,
      playPrompt,
      question,
      questionIndex,
      startNightAmbience,
      targetLetter,
    ],
  );

  const showMap = useCallback(() => {
    actionTokenRef.current += 1;
    cancelVoice();
    window.speechSynthesis?.cancel();
    setTestMode(false);
    setPhase("map");
  }, [cancelVoice]);

  const startIntroDialog = useCallback(async () => {
    const runId = dialogRunRef.current + 1;
    dialogRunRef.current = runId;
    enableEffects();
    startNightAmbience();
    setDialogLineIndex(0);
    setPhase("dialog");

    for (const [index, line] of lettersIntroLines.entries()) {
      if (dialogRunRef.current !== runId) {
        return;
      }

      setDialogLineIndex(index);
      await playLine(line.audio, line.text);

      if (dialogRunRef.current !== runId) {
        return;
      }
    }

    setPhase("map");
  }, [enableEffects, playLine, startNightAmbience]);

  const skipIntroDialog = useCallback(() => {
    dialogRunRef.current += 1;
    showMap();
  }, [showMap]);

  const replayLevel = useCallback(() => {
    startLevel(lesson, testMode);
  }, [lesson, startLevel, testMode]);

  const finishUnlockAnimation = useCallback(() => {
    setNewlyUnlockedLevel(null);
  }, []);

  useEffect(() => {
    const savedProgress = readLettersProgress(window.localStorage, lessons.length);
    setProgress(savedProgress);
    rememberLastGame(window.localStorage, "letters");
    const local = isLocalTestHost(window.location.hostname);
    setLocalToolsAvailable(local);
    const parameters = new URLSearchParams(window.location.search);
    const resumeRequested =
      shouldResumeFromUrl(window.location.search) &&
      (savedProgress.sessions > 0 || savedProgress.completedLevels.length > 0);

    if (!local) {
      if (resumeRequested) {
        setPhase("map");
      }
      return;
    }

    const requestedLevelNumber = Number.parseInt(parameters.get("niveau") ?? "1", 10);
    const requestedLesson =
      lessons.find((candidate) => candidate.level === requestedLevelNumber) ?? lessons[0];
    const questionParameter = parameters.get("question");
    const starsParameter = parameters.get("etoiles");
    const requestedQuestion = Number(questionParameter);
    const requestedStars = Number(starsParameter);
    const requestedState = parameters.get("etat");
    const requestedResult = requestedState === "resultat";
    const requestedMap = requestedState === "carte" || parameters.get("carte") === "1";
    const hasRequestedLevel = parameters.has("niveau") && requestedLesson.level === requestedLevelNumber;
    const hasRequestedQuestion =
      questionParameter !== null &&
      Number.isInteger(requestedQuestion) &&
      requestedQuestion >= 1 &&
      requestedQuestion <= requestedLesson.questions.length;
    const hasRequestedStars =
      starsParameter !== null &&
      Number.isInteger(requestedStars) &&
      requestedStars >= 0;

    if (requestedMap) {
      setPhase("map");
      return;
    }

    if (requestedResult) {
      setSelectedLesson(requestedLesson);
      setTestMode(true);
      setLitStars(requestedLesson.questions.length);
      setPhase("result");
      return;
    }

    if (hasRequestedLevel || hasRequestedQuestion || hasRequestedStars) {
      enableEffects();
      const stars = Math.min(
        requestedLesson.questions.length - 1,
        Math.max(0, hasRequestedStars ? requestedStars : requestedQuestion - 1),
      );
      const index = Math.min(
        requestedLesson.questions.length - 1,
        Math.max(0, hasRequestedQuestion ? requestedQuestion - 1 : stars),
      );
      loadQuestion(requestedLesson, index, stars, true);
      return;
    }

    if (resumeRequested) {
      setPhase("map");
    }
  }, [enableEffects, loadQuestion]);

  useEffect(
    () => () => {
      actionTokenRef.current += 1;
      dialogRunRef.current += 1;
      cancelVoice();
      window.speechSynthesis?.cancel();
    },
    [cancelVoice],
  );

  if (!lesson || !question || !targetLetter || !anchorWord) {
    return (
      <div className="letters-game letters-game--error" role="alert">
        Le contenu de L’Observatoire des lettres est incomplet.
      </div>
    );
  }

  const revealWord = phase === "correct" || phase === "star";
  const pendingLetter = revealWord
    ? targetLetter[question.displayCase]
    : undefined;
  const panaMessage =
    phase === "wrong"
      ? "Essaie encore !"
      : revealWord
        ? `Bravo ! ${targetLetter.uppercase} comme dans ${anchorWord.displayWord}.`
        : "Écoute bien, puis choisis la bonne lettre.";
  const choiceEntries = choiceOptions.flatMap((choice) => {
    const entry = letterById.get(choice.letterId);
    return entry ? [{ entry, displayCase: choice.displayCase }] : [];
  });
  const showScene = phase !== "map";
  const showHud = !["intro", "dialog", "map"].includes(phase);
  const showChallenge = ["question", "wrong", "correct", "star"].includes(phase);

  return (
    <section
      className={`letters-game letters-game--${phase}`}
      aria-label="L’Observatoire des lettres"
    >
      {showScene ? (
        <ConstellationScene
          constellation={constellation}
          complete={phase === "result"}
          litStars={litStars}
          pendingLetter={pendingLetter}
          pendingStarIndex={questionIndex}
        />
      ) : null}

      {showHud ? (
        <header className="letters-game__hud">
          <div>
            <span>Niveau {lesson.level}</span>
            <strong>{lesson.title}</strong>
          </div>
          <div
            className="letters-game__star-progress"
            aria-label={`${litStars} étoiles sur ${lesson.questions.length}`}
          >
            <span aria-hidden="true">★</span>
            <strong>{litStars}/{lesson.questions.length}</strong>
          </div>
        </header>
      ) : null}

      {phase === "intro" ? (
        <GameIntroOverlay
          title="L’Observatoire des lettres"
          onStart={() => void startIntroDialog()}
        />
      ) : null}

      {phase === "dialog" ? (
        <GameDialogueOverlay
          text={lettersIntroLines[dialogLineIndex]?.text ?? ""}
          onSkip={skipIntroDialog}
        />
      ) : null}

      {phase === "map" ? (
        <LettersLevelMap
          lessons={lessons}
          progress={progress}
          newlyUnlockedLevel={newlyUnlockedLevel}
          onSelectLevel={(targetLesson) => startLevel(targetLesson)}
          onUnlockAnimationComplete={finishUnlockAnimation}
        />
      ) : null}

      {showChallenge ? (
        <LettersChallenge
          anchorWord={anchorWord}
          targetLetter={targetLetter}
          wordDisplayCase={lesson.level <= 4 ? "uppercase" : "lowercase"}
          choices={choiceEntries}
          selectedLetterId={selectedLetterId}
          revealWord={revealWord}
          inputLocked={inputLocked}
          panaMessage={panaMessage}
          onListenPrompt={() => void playPrompt(targetLetter)}
          onListenWord={() =>
            void playLine(anchorWord.audioWord, anchorWord.displayWord)
          }
          onListenLetter={(entry) =>
            void playLine(entry.nameAudio, entry.nameSpeechText)
          }
          onChoose={(letterId) => void handleChoice(letterId)}
        />
      ) : null}

      {phase === "result" ? (
        <LettersResult
          starCount={lesson.questions.length}
          onContinue={showMap}
          onReplay={replayLevel}
        />
      ) : null}

      {localToolsAvailable ? (
        <details className="letters-game__test-tools">
          <summary>🧪 {testMode ? "Test actif" : "Tester"}</summary>
          <div>
            <button onClick={showMap} type="button">Carte</button>
            {lessons.map((targetLesson) => (
              <button
                key={targetLesson.id}
                onClick={() => startLevel(targetLesson, true)}
                type="button"
              >
                N{targetLesson.level}
              </button>
            ))}
            {lesson.questions.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  enableEffects();
                  startNightAmbience();
                  loadQuestion(lesson, index, index, true);
                }}
                type="button"
              >
                Q{index + 1}
              </button>
            ))}
            <button
              onClick={() => {
                actionTokenRef.current += 1;
                setTestMode(true);
                setLitStars(lesson.questions.length);
                setPhase("result");
              }}
              type="button"
            >
              Fin
            </button>
          </div>
        </details>
      ) : null}
    </section>
  );
}
