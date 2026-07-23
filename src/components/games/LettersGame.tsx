import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import letterEntriesData from "../../content/fr/letters.json";
import letterLessonsData from "../../content/fr/letter-lessons.json";
import voiceLinesData from "../../content/fr/voice-lines.json";
import wordsData from "../../content/fr/words.json";
import { sitePath } from "../../utils/paths";
import { AudioButton } from "../ui/AudioButton";
import { GameButton } from "../ui/GameButton";
import { LetterTile } from "../ui/LetterTile";
import { ConstellationScene } from "./ConstellationScene";
import {
  isTargetCharacter,
  shuffleLetterIds,
} from "./letterGame";
import type {
  LetterEntry,
  LetterLesson,
} from "./letterGame";
import {
  completeLettersLevel,
  createInitialLettersProgress,
  readLettersProgress,
  saveLettersProgress,
} from "./lettersProgress";
import type { LettersProgress } from "./lettersProgress";
import { useGameAudio } from "./gameAudio";
import { useVoiceAudio } from "./useVoiceAudio";
import "./LettersGame.css";

type WordEntry = {
  id: string;
  displayWord: string;
  image: string;
  audioWord: string;
};

type VoiceLine = {
  text: string;
  audio: string;
};

type VoiceLines = {
  dialogue: {
    lettersIntro: VoiceLine[];
  };
  feedback: {
    tryAgain: VoiceLine;
    bravo: VoiceLine;
  };
};

type GamePhase = "intro" | "dialog" | "question" | "wrong" | "correct" | "star" | "result";

const PANA_ASSET_PATH = sitePath("/assets/characters/pana.png");
const letters = letterEntriesData as LetterEntry[];
const lessons = (letterLessonsData as LetterLesson[])
  .filter((lesson) => lesson.gameIds.includes("lettres"))
  .sort((left, right) => left.level - right.level);
const lesson = lessons[0];
const letterById = new Map(letters.map((letter) => [letter.id, letter]));
const wordById = new Map((wordsData as WordEntry[]).map((word) => [word.id, word]));
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
  const [questionIndex, setQuestionIndex] = useState(0);
  const [litStars, setLitStars] = useState(0);
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const [choiceVersion, setChoiceVersion] = useState(0);
  const [, setProgress] = useState<LettersProgress>(createInitialLettersProgress);
  const [testMode, setTestMode] = useState(false);
  const [localToolsAvailable, setLocalToolsAvailable] = useState(false);
  const actionTokenRef = useRef(0);
  const dialogRunRef = useRef(0);
  const { cancelVoice, playVoice } = useVoiceAudio();
  const { enableEffects, playEffect, startNightAmbience } = useGameAudio();

  const question = lesson?.questions[questionIndex];
  const targetLetter = question ? letterById.get(question.targetLetterId) : undefined;
  const anchorWord = targetLetter ? wordById.get(targetLetter.anchorWordId) : undefined;
  const choiceIds = useMemo(
    () => (question ? shuffleLetterIds(question.choiceLetterIds) : []),
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
      if (!entry) {
        return;
      }

      await playLine(entry.promptAudio, entry.promptSpeechText);
    },
    [playLine],
  );

  const loadQuestion = useCallback(
    (index: number, stars: number, asTest: boolean) => {
      actionTokenRef.current += 1;
      cancelVoice();
      window.speechSynthesis?.cancel();
      setTestMode(asTest);
      setQuestionIndex(index);
      setLitStars(stars);
      setSelectedLetterId(null);
      setChoiceVersion((version) => version + 1);
      setPhase("question");
      void playPrompt(letterById.get(lesson.questions[index]?.targetLetterId ?? ""));
    },
    [cancelVoice, playPrompt],
  );

  const finishLevel = useCallback(
    async (token: number) => {
      setLitStars(lesson.questions.length);
      setPhase("result");
      await playEffect("levelComplete");

      if (token !== actionTokenRef.current) {
        return;
      }

      await playLine(feedback.bravo.audio, feedback.bravo.text);

      if (!testMode) {
        setProgress((current) => {
          const completed = completeLettersLevel(current, lesson.level, lessons.length);
          saveLettersProgress(window.localStorage, completed);
          return completed;
        });
      }
    },
    [playEffect, playLine, testMode],
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
      await playPrompt(letterById.get(lesson.questions[nextIndex]?.targetLetterId ?? ""));
    },
    [
      anchorWord,
      finishLevel,
      inputLocked,
      playEffect,
      playLine,
      playPrompt,
      question,
      questionIndex,
      targetLetter,
    ],
  );

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

    loadQuestion(0, 0, false);
  }, [enableEffects, loadQuestion, playLine, startNightAmbience]);

  const skipIntroDialog = useCallback(() => {
    dialogRunRef.current += 1;
    cancelVoice();
    window.speechSynthesis?.cancel();
    loadQuestion(0, 0, false);
  }, [cancelVoice, loadQuestion]);

  const replayLevel = useCallback(() => {
    enableEffects();
    startNightAmbience();
    loadQuestion(0, 0, testMode);
  }, [enableEffects, loadQuestion, startNightAmbience, testMode]);

  useEffect(() => {
    setProgress(readLettersProgress(window.localStorage, lessons.length));
    const local = isLocalTestHost(window.location.hostname);
    setLocalToolsAvailable(local);

    if (!local) {
      return;
    }

    const parameters = new URLSearchParams(window.location.search);
    const questionParameter = parameters.get("question");
    const starsParameter = parameters.get("etoiles");
    const requestedQuestion = Number(questionParameter);
    const requestedStars = Number(starsParameter);
    const requestedResult = parameters.get("etat") === "resultat";
    const hasRequestedQuestion =
      questionParameter !== null &&
      Number.isInteger(requestedQuestion) &&
      requestedQuestion >= 1 &&
      requestedQuestion <= lesson.questions.length;
    const hasRequestedStars =
      starsParameter !== null &&
      Number.isInteger(requestedStars) &&
      requestedStars >= 0;
    const hasTestParameter = requestedResult || hasRequestedQuestion || hasRequestedStars;

    if (!hasTestParameter) {
      return;
    }

    enableEffects();
    setTestMode(true);

    if (requestedResult) {
      setLitStars(lesson.questions.length);
      setPhase("result");
      return;
    }

    const stars = Math.min(
      lesson.questions.length - 1,
      Math.max(0, hasRequestedStars ? requestedStars : requestedQuestion - 1),
    );
    const index = Math.min(
      lesson.questions.length - 1,
      Math.max(0, hasRequestedQuestion ? requestedQuestion - 1 : stars),
    );
    loadQuestion(index, stars, true);
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
        Le contenu du jeu des lettres est incomplet.
      </div>
    );
  }

  const revealWord = phase === "correct" || phase === "star";
  const pendingLetter =
    phase === "correct" || phase === "star"
      ? targetLetter[question.displayCase]
      : undefined;
  const panaMessage =
    phase === "wrong"
      ? "Essaie encore !"
      : phase === "correct" || phase === "star"
        ? `Bravo ! ${targetLetter.uppercase} comme dans ${anchorWord.displayWord}.`
        : "Écoute bien, puis choisis la bonne lettre.";

  return (
    <section className={`letters-game letters-game--${phase}`} aria-label="L’Observatoire des lettres">
      <ConstellationScene
        complete={phase === "result"}
        litStars={litStars}
        pendingLetter={pendingLetter}
        pendingStarIndex={questionIndex}
      />

      {phase !== "intro" && phase !== "dialog" && (
        <header className="letters-game__hud">
          <div>
            <span>Niveau {lesson.level}</span>
            <strong>{lesson.title}</strong>
          </div>
          <div className="letters-game__star-progress" aria-label={`${litStars} étoiles sur ${lesson.questions.length}`}>
            <span aria-hidden="true">★</span>
            <strong>{litStars}/{lesson.questions.length}</strong>
          </div>
        </header>
      )}

      {phase === "intro" && (
        <div className="letters-game__intro">
          <h2 className="letters-game__intro-title">Découvrir les lettres avec Pana</h2>
          <img className="letters-game__pana letters-game__pana--intro" src={PANA_ASSET_PATH} alt="Pana" />
          <GameButton onClick={() => void startIntroDialog()}>Commencer</GameButton>
        </div>
      )}

      {phase === "dialog" && (
        <div className="letters-game__intro letters-game__intro--dialog">
          <img className="letters-game__pana letters-game__pana--dialog" src={PANA_ASSET_PATH} alt="Pana" />
          <div className="letters-game__speech" aria-live="polite">
            {lettersIntroLines[dialogLineIndex]?.text}
          </div>
          <GameButton onClick={skipIntroDialog} variant="secondary">
            Passer
          </GameButton>
        </div>
      )}

      {phase !== "intro" && phase !== "dialog" && phase !== "result" && (
        <main className="letters-game__exercise">
          <div className="letters-game__bottom-panels">
            <div className="letters-game__pana-prompt">
              <img className="letters-game__pana" src={PANA_ASSET_PATH} alt="" />
              <p role="status" aria-live="polite">{panaMessage}</p>
              <AudioButton
                className="letters-game__prompt-audio"
                disabled={inputLocked}
                label="Réécouter la consigne de Pana"
                onClick={() => void playPrompt(targetLetter)}
              />
            </div>

            <div className="letters-game__challenge">
              <div className="letters-game__anchor">
                <img
                  src={sitePath(anchorWord.image)}
                  alt={revealWord ? anchorWord.displayWord : "Illustration indice"}
                  draggable={false}
                />
                <AudioButton
                  className="letters-game__anchor-audio"
                  disabled={inputLocked}
                  label={`Écouter le mot ${anchorWord.displayWord}`}
                  onClick={() => void playLine(anchorWord.audioWord, anchorWord.displayWord)}
                />
              </div>

              <div className="letters-game__word-reveal" aria-live="polite">
                {revealWord ? (
                  <>
                    <span className="sr-only">{anchorWord.displayWord}</span>
                    <span aria-hidden="true">
                      {Array.from(anchorWord.displayWord).map((character, index) =>
                        isTargetCharacter(character, targetLetter) ? (
                          <mark key={`${character}-${index}`}>{character}</mark>
                        ) : (
                          <span key={`${character}-${index}`}>{character}</span>
                        ),
                      )}
                    </span>
                    <small>
                      {targetLetter.uppercase} fait {targetLetter.soundText}
                    </small>
                  </>
                ) : (
                  <span className="letters-game__listen-hint">Quelle lettre Pana demande-t-elle ?</span>
                )}
              </div>

              <div className="letters-game__choices">
                {choiceIds.map((letterId) => {
                  const entry = letterById.get(letterId);

                  if (!entry) {
                    return null;
                  }

                  const state =
                    selectedLetterId !== letterId
                      ? "idle"
                      : letterId === targetLetter.id
                        ? "correct"
                        : "wrong";

                  return (
                    <LetterTile
                      disabled={inputLocked}
                      key={entry.id}
                      letter={entry[question.displayCase]}
                      letterName={entry.nameText}
                      onChoose={() => void handleChoice(entry.id)}
                      onListen={() => void playLine(entry.nameAudio, entry.nameSpeechText)}
                      state={state}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      )}

      {phase === "result" && (
        <div className="letters-game__result">
          <img className="letters-game__pana letters-game__pana--result" src={PANA_ASSET_PATH} alt="Pana" />
          <div className="letters-game__result-panel">
            <p className="letters-game__eyebrow">8 étoiles allumées</p>
            <h2>Constellation terminée !</h2>
            <p>Tu as retrouvé toutes les lettres demandées par Pana.</p>
            <GameButton onClick={replayLevel}>Rejouer</GameButton>
          </div>
        </div>
      )}

      {localToolsAvailable && (
        <details className="letters-game__test-tools">
          <summary>🧪 {testMode ? "Test actif" : "Tester"}</summary>
          <div>
            {lesson.questions.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  enableEffects();
                  startNightAmbience();
                  loadQuestion(index, index, true);
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
      )}
    </section>
  );
}
