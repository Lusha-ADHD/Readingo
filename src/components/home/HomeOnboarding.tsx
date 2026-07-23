import { useEffect, useRef, useState } from "react";
import { GAME_BY_ID } from "../../content/gameCatalog";
import type { VoiceLine } from "../../content/types";
import voiceLinesData from "../../content/fr/voice-lines.json";
import { sitePath } from "../../utils/paths";
import { useVoiceAudio } from "../games/useVoiceAudio";
import {
  readResumeState,
  recommendHomeGame,
  rememberLastGame,
} from "./onboardingState";
import type {
  AgeChoice,
  HomeGameId,
  ResumeState,
  SkillChoice,
} from "./onboardingState";
import {
  OnboardingQuestion,
  OnboardingSpeakerIcon,
} from "./OnboardingQuestion";
import { OnboardingResult } from "./OnboardingResult";
import { OnboardingScene } from "./OnboardingScene";
import "./HomeOnboarding.css";

type OnboardingPhase = "entry" | "intro" | "age" | "skill" | "result" | "resume";

type HomeVoiceLines = {
  dialogue: {
    homeOnboarding: VoiceLine[];
    homeAnswers: VoiceLine[];
  };
};

const homeVoiceLines = voiceLinesData as HomeVoiceLines;
const voiceLines = [
  ...homeVoiceLines.dialogue.homeOnboarding,
  ...homeVoiceLines.dialogue.homeAnswers,
];
const voiceLineById = new Map(voiceLines.map((line) => [line.id, line]));
const PANA_PATH = sitePath("/assets/characters/pana-home.png");

function speakFrench(text: string) {
  if (!("speechSynthesis" in window)) {
    return Promise.resolve();
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.88;
  utterance.pitch = 1.05;

  return new Promise<void>((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export function HomeOnboarding() {
  const [phase, setPhase] = useState<OnboardingPhase>("entry");
  const [age, setAge] = useState<AgeChoice | null>(null);
  const [skill, setSkill] = useState<SkillChoice | null>(null);
  const [resumeState, setResumeState] = useState<ResumeState>({
    progressGames: [],
    resumeGames: [],
    lastGame: null,
  });
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);
  const playbackIdRef = useRef(0);
  const { cancelVoice, playVoice } = useVoiceAudio();

  useEffect(() => {
    setResumeState(readResumeState(window.localStorage));
  }, []);

  const recommendedGame = skill ? recommendHomeGame(skill, age ?? undefined) : null;
  const isReturning = resumeState.resumeGames.length > 0;
  const currentVoiceId =
    phase === "intro"
      ? "home-welcome"
      : phase === "age"
        ? "home-age"
        : phase === "skill"
          ? "home-skill"
          : phase === "result"
            ? recommendedGame === "letters"
              ? "home-result-letters"
              : recommendedGame === "sentier"
                ? "home-result-sentier"
                : "home-result-bateau"
            : null;
  const currentLine = currentVoiceId ? voiceLineById.get(currentVoiceId) : undefined;
  const sceneTheme: "mixed" | HomeGameId =
    phase === "result" && recommendedGame ? recommendedGame : "mixed";
  const progressLabel = phase === "age" ? "1 sur 2" : phase === "skill" ? "2 sur 2" : null;
  const ageContext =
    phase === "result" && age && age !== "other"
      ? `Une aventure choisie pour tes ${age} ans`
      : null;

  async function playLine(line: VoiceLine | undefined) {
    if (!line) {
      return;
    }

    const playbackId = playbackIdRef.current + 1;
    playbackIdRef.current = playbackId;
    setPlayingLineId(line.id);
    window.speechSynthesis?.cancel();
    const result = await playVoice(line.audio);

    if (result === "failed" && playbackIdRef.current === playbackId) {
      await speakFrench(line.text);
    }

    if (playbackIdRef.current === playbackId) {
      setPlayingLineId(null);
    }
  }

  function stopVoice() {
    playbackIdRef.current += 1;
    cancelVoice();
    window.speechSynthesis?.cancel();
    setPlayingLineId(null);
  }

  function moveTo(nextPhase: OnboardingPhase, lineId?: string) {
    stopVoice();
    setPhase(nextPhase);

    if (lineId) {
      void playLine(voiceLineById.get(lineId));
    }
  }

  function beginOnboarding() {
    setAge(null);
    setSkill(null);
    moveTo("intro", "home-welcome");
  }

  function chooseAge(choice: AgeChoice) {
    setAge(choice);
    moveTo("skill", "home-skill");
  }

  function chooseSkill(choice: SkillChoice) {
    const game = recommendHomeGame(choice, age ?? undefined);
    setSkill(choice);
    moveTo(
      "result",
      game === "letters"
        ? "home-result-letters"
        : game === "sentier"
          ? "home-result-sentier"
          : "home-result-bateau",
    );
  }

  function remember(gameId: HomeGameId) {
    rememberLastGame(window.localStorage, gameId);
  }

  function resumeHref(gameId: HomeGameId) {
    return `${sitePath(GAME_BY_ID[gameId].route)}?reprendre=1`;
  }

  function entryAction() {
    if (!isReturning) {
      return (
        <button
          className="home-onboarding__button home-onboarding__button--primary home-onboarding__button--entry"
          type="button"
          onClick={beginOnboarding}
        >
          Commencer
          <span aria-hidden="true">→</span>
        </button>
      );
    }

    if (resumeState.resumeGames.length === 1) {
      const gameId = resumeState.resumeGames[0];

      return (
        <a
          className="home-onboarding__button home-onboarding__button--primary home-onboarding__button--entry"
          href={resumeHref(gameId)}
          onClick={() => remember(gameId)}
        >
          Reprendre
          <span aria-hidden="true">→</span>
        </a>
      );
    }

    return (
      <button
        className="home-onboarding__button home-onboarding__button--primary home-onboarding__button--entry"
        type="button"
        onClick={() => moveTo("resume")}
      >
        Reprendre
        <span aria-hidden="true">→</span>
      </button>
    );
  }

  function responsePanel() {
    if (phase === "entry") {
      return (
        <div className="home-onboarding__response-panel home-onboarding__response-panel--entry">
          {entryAction()}
          {isReturning ? (
            <button
              className="home-onboarding__alternative"
              type="button"
              onClick={beginOnboarding}
            >
              Recommencer
            </button>
          ) : null}
        </div>
      );
    }

    if (phase === "resume") {
      return (
        <div
          className="home-onboarding__response-panel home-onboarding__response-panel--resume"
          aria-label="Choisis l’aventure à reprendre"
        >
          {resumeState.resumeGames.map((gameId) => (
            <a
              className="home-onboarding__button home-onboarding__button--primary"
              href={resumeHref(gameId)}
              key={gameId}
              onClick={() => remember(gameId)}
            >
              Reprendre {GAME_BY_ID[gameId].shortTitle}
              <span aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      );
    }

    if (phase === "intro") {
      return (
        <div className="home-onboarding__response-panel home-onboarding__response-panel--intro">
          <button
            className="home-onboarding__button home-onboarding__button--primary"
            type="button"
            onClick={() => moveTo("age", "home-age")}
          >
            Continuer
            <span aria-hidden="true">→</span>
          </button>
        </div>
      );
    }

    if (phase === "age") {
      return (
        <OnboardingQuestion
          kind="age"
          playingLineId={playingLineId}
          lineById={voiceLineById}
          onChooseAge={chooseAge}
          onChooseSkill={chooseSkill}
          onListen={(line) => void playLine(line)}
        />
      );
    }

    if (phase === "skill") {
      return (
        <OnboardingQuestion
          kind="skill"
          playingLineId={playingLineId}
          lineById={voiceLineById}
          onChooseAge={chooseAge}
          onChooseSkill={chooseSkill}
          onListen={(line) => void playLine(line)}
        />
      );
    }

    if (!recommendedGame) {
      return null;
    }

    return (
      <OnboardingResult
        recommendedGame={recommendedGame}
        onRemember={remember}
      />
    );
  }

  return (
    <section
      className={`home-onboarding home-onboarding--${sceneTheme} home-onboarding--${phase}`}
      aria-label="Pana t’aide à choisir un jeu"
    >
      <OnboardingScene
        theme={sceneTheme}
        showReadingCurrent={phase !== "result"}
      />

      {phase === "age" || phase === "skill" || phase === "result" || phase === "resume" ? (
        <button
          className="home-onboarding__back"
          type="button"
          onClick={() => {
            if (phase === "resume") {
              moveTo("entry");
            } else if (phase === "result") {
              moveTo("skill", "home-skill");
            } else if (phase === "skill") {
              moveTo("age", "home-age");
            } else {
              moveTo("intro", "home-welcome");
            }
          }}
        >
          ← Retour
        </button>
      ) : null}

      <div
        className={`home-onboarding__interaction home-onboarding__interaction--${phase} ${
          currentLine ? "" : "home-onboarding__interaction--without-dialogue"
        }`}
      >
        <div className="home-onboarding__character-dialogue">
          <img
            className="home-onboarding__pana"
            src={PANA_PATH}
            alt="Pana, la capitaine"
            width="480"
            height="480"
            draggable={false}
          />

          {currentLine ? (
            <div className="home-onboarding__speech-bubble" aria-live="polite">
              {progressLabel ? <span className="home-onboarding__progress">{progressLabel}</span> : null}
              <svg
                className="home-onboarding__speech-tail"
                viewBox="0 0 38 24"
                aria-hidden="true"
              >
                <path d="M1.5 22.5 19 1.5 36.5 22.5" />
              </svg>
              <div>
                {ageContext ? <span className="home-onboarding__speech-kicker">{ageContext}</span> : null}
                <p>{currentLine.text}</p>
              </div>
              <button
                className="home-onboarding__audio"
                type="button"
                onClick={() => {
                  if (playingLineId === currentLine.id) {
                    stopVoice();
                  } else {
                    void playLine(currentLine);
                  }
                }}
                aria-label={playingLineId === currentLine.id ? "Interrompre Pana" : "Écouter Pana"}
              >
                <OnboardingSpeakerIcon
                  playing={playingLineId === currentLine.id}
                />
              </button>
            </div>
          ) : null}
        </div>

        {responsePanel()}
      </div>
    </section>
  );
}
