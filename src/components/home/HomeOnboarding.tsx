import { useEffect, useRef, useState } from "react";
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
import "./HomeOnboarding.css";

type OnboardingPhase = "entry" | "intro" | "age" | "skill" | "result" | "resume";

type VoiceLine = {
  id: string;
  text: string;
  audio: string;
};

type HomeVoiceLines = {
  dialogue: {
    homeOnboarding: VoiceLine[];
    homeAnswers: VoiceLine[];
  };
};

type ChoiceOptionProps = {
  lineId: string;
  label: string;
  token: string;
  detail?: string;
  kind: "age" | "skill";
  playingLineId: string | null;
  onChoose: () => void;
  onListen: (line: VoiceLine) => void;
};

const homeVoiceLines = voiceLinesData as HomeVoiceLines;
const voiceLines = [
  ...homeVoiceLines.dialogue.homeOnboarding,
  ...homeVoiceLines.dialogue.homeAnswers,
];
const voiceLineById = new Map(voiceLines.map((line) => [line.id, line]));
const PANA_PATH = sitePath("/assets/characters/pana-home.png");
const BOAT_PATH = sitePath("/assets/world/boat.png");
const ISLAND_PATH = sitePath("/assets/world/IslandWithChest.png");
const JUNGLE_PATH = sitePath("/assets/world/jungle/jungle-backdrop.png");
const FLOATING_READING_TOKENS = {
  mixed: [
    { text: "A", kind: "letter" },
    { text: "M", kind: "letter" },
    { text: "S", kind: "letter" },
    { text: "BA", kind: "syllable" },
    { text: "LO", kind: "syllable" },
    { text: "MI", kind: "syllable" },
    { text: "MOT", kind: "word" },
    { text: "LIRE", kind: "word" },
    { text: "LUNE", kind: "word" },
    { text: "BATEAU", kind: "word" },
  ],
  letters: [
    { text: "A", kind: "letter" },
    { text: "E", kind: "letter" },
    { text: "M", kind: "letter" },
    { text: "R", kind: "letter" },
    { text: "LA", kind: "syllable" },
    { text: "LU", kind: "syllable" },
    { text: "S", kind: "letter" },
    { text: "LUNE", kind: "word" },
    { text: "MER", kind: "word" },
    { text: "ÉTOILE", kind: "word" },
  ],
  bateau: [
    { text: "B", kind: "letter" },
    { text: "T", kind: "letter" },
    { text: "BA", kind: "syllable" },
    { text: "TO", kind: "syllable" },
    { text: "TEAU", kind: "syllable" },
    { text: "ÎLE", kind: "word" },
    { text: "MER", kind: "word" },
    { text: "BATEAU", kind: "word" },
    { text: "CARTE", kind: "word" },
    { text: "TRÉSOR", kind: "word" },
  ],
  sentier: [
    { text: "MOT", kind: "word" },
    { text: "LIRE", kind: "word" },
    { text: "MOTO", kind: "word" },
    { text: "PANDA", kind: "word" },
    { text: "LAPIN", kind: "word" },
    { text: "TAPIS", kind: "word" },
    { text: "MAISON", kind: "word" },
    { text: "CHEMIN", kind: "word" },
    { text: "GEMME", kind: "word" },
    { text: "TRÉSOR", kind: "word" },
  ],
} as const;
const FLOATING_TOKEN_POSITIONS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
] as const;

const GAME_DETAILS: Record<
  HomeGameId,
  {
    title: string;
    shortTitle: string;
    href: string;
    cta: string;
  }
> = {
  letters: {
    title: "L’Observatoire des lettres",
    shortTitle: "l’Observatoire",
    href: "/jeux/lettres/",
    cta: "Observer les lettres",
  },
  bateau: {
    title: "L’Archipel des mots",
    shortTitle: "l’Archipel",
    href: "/jeux/bateau/",
    cta: "Prendre la mer",
  },
  sentier: {
    title: "Le Sentier des mots",
    shortTitle: "le Sentier",
    href: "/jeux/mots/",
    cta: "Entrer dans la jungle",
  },
};

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

function SpeakerIcon({ playing }: { playing: boolean }) {
  return (
    <svg
      className={`home-onboarding__speaker ${playing ? "home-onboarding__speaker--playing" : ""}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M3.5 9.25h4.1L13 5.15v13.7l-5.4-4.1H3.5z" />
      <path d="M16 8.8a5.1 5.1 0 0 1 0 6.4" />
      <path d="M18.7 6.15a8.9 8.9 0 0 1 0 11.7" />
    </svg>
  );
}

function SceneDecor({
  theme,
  showReadingCurrent,
}: {
  theme: "mixed" | HomeGameId;
  showReadingCurrent: boolean;
}) {
  return (
    <div className="home-onboarding__decor" aria-hidden="true">
      <span className="home-onboarding__moon" />
      <span className="home-onboarding__cloud home-onboarding__cloud--one" />
      <span className="home-onboarding__cloud home-onboarding__cloud--two" />
      <span className="home-onboarding__star home-onboarding__star--one" />
      <span className="home-onboarding__star home-onboarding__star--two" />
      <span className="home-onboarding__star home-onboarding__star--three" />
      <svg className="home-onboarding__constellation" viewBox="0 0 180 92">
        <path d="M12 68 48 36 84 57 119 20 164 48" />
        <circle cx="12" cy="68" r="4" />
        <circle cx="48" cy="36" r="4" />
        <circle cx="84" cy="57" r="4" />
        <circle cx="119" cy="20" r="4" />
        <circle cx="164" cy="48" r="4" />
      </svg>
      <span className="home-onboarding__wave home-onboarding__wave--one" />
      <span className="home-onboarding__wave home-onboarding__wave--two" />
      {showReadingCurrent ? (
        <span className="home-onboarding__reading-current">
          {FLOATING_READING_TOKENS[theme].map((token, index) => (
            <span
              className={`home-onboarding__reading-track home-onboarding__reading-track--${FLOATING_TOKEN_POSITIONS[index]}`}
              key={`${theme}-${token.text}`}
            >
              <span
                className={`home-onboarding__reading-token home-onboarding__reading-token--${token.kind}`}
              >
                <span className="home-onboarding__reading-label">{token.text}</span>
              </span>
            </span>
          ))}
        </span>
      ) : null}
      {theme === "bateau" ? (
        <img className="home-onboarding__island" src={ISLAND_PATH} alt="" draggable={false} />
      ) : null}
      {theme === "sentier" ? (
        <img className="home-onboarding__jungle" src={JUNGLE_PATH} alt="" draggable={false} />
      ) : null}
      {theme !== "mixed" && theme !== "sentier" ? (
        <img className="home-onboarding__boat" src={BOAT_PATH} alt="" draggable={false} />
      ) : null}
    </div>
  );
}

function ChoiceOption({
  lineId,
  label,
  token,
  detail,
  kind,
  playingLineId,
  onChoose,
  onListen,
}: ChoiceOptionProps) {
  const line = voiceLineById.get(lineId);
  const isPlaying = playingLineId === lineId;

  return (
    <div className={`home-onboarding__choice home-onboarding__choice--${kind}`}>
      <button className="home-onboarding__choice-select" type="button" onClick={onChoose}>
        <span className="home-onboarding__choice-token">{token}</span>
        <span className="home-onboarding__choice-label">
          {kind === "age" && detail ? <small>{detail}</small> : label}
        </span>
      </button>
      <button
        className="home-onboarding__choice-audio"
        type="button"
        onClick={() => line && onListen(line)}
        aria-label={`Écouter « ${line?.text ?? label} »`}
      >
        <SpeakerIcon playing={isPlaying} />
      </button>
    </div>
  );
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
    return `${sitePath(GAME_DETAILS[gameId].href)}?reprendre=1`;
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
              Reprendre {GAME_DETAILS[gameId].shortTitle}
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
        <div
          className="home-onboarding__response-panel home-onboarding__response-panel--age"
          role="group"
          aria-label="Choisis ton âge"
        >
          {(["5", "6", "7"] as AgeChoice[]).map((choice) => (
            <ChoiceOption
              key={choice}
              lineId={`home-answer-age-${choice}`}
              label={choice}
              token={choice}
              detail="ans"
              kind="age"
              playingLineId={playingLineId}
              onChoose={() => chooseAge(choice)}
              onListen={(line) => void playLine(line)}
            />
          ))}
          <ChoiceOption
            lineId="home-answer-age-other"
            label="Autre"
            token="+"
            kind="age"
            playingLineId={playingLineId}
            onChoose={() => chooseAge("other")}
            onListen={(line) => void playLine(line)}
          />
        </div>
      );
    }

    if (phase === "skill") {
      return (
        <div
          className="home-onboarding__response-panel home-onboarding__response-panel--skill"
          role="group"
          aria-label="Choisis ce qui te ressemble"
        >
          <ChoiceOption
            lineId="home-answer-discovering-letters"
            label="Je découvre les lettres"
            token="A"
            kind="skill"
            playingLineId={playingLineId}
            onChoose={() => chooseSkill("discovering-letters")}
            onListen={(line) => void playLine(line)}
          />
          <ChoiceOption
            lineId="home-answer-knows-letters"
            label="Je connais déjà beaucoup de lettres"
            token="ABC"
            kind="skill"
            playingLineId={playingLineId}
            onChoose={() => chooseSkill("knows-letters")}
            onListen={(line) => void playLine(line)}
          />
          <ChoiceOption
            lineId="home-answer-reads-syllables"
            label="Je commence à lire des syllabes"
            token="BA"
            kind="skill"
            playingLineId={playingLineId}
            onChoose={() => chooseSkill("reads-syllables")}
            onListen={(line) => void playLine(line)}
          />
          <ChoiceOption
            lineId="home-answer-reads-words"
            label="Je commence à lire des mots"
            token="MOT"
            kind="skill"
            playingLineId={playingLineId}
            onChoose={() => chooseSkill("reads-words")}
            onListen={(line) => void playLine(line)}
          />
        </div>
      );
    }

    if (!recommendedGame) {
      return null;
    }

    const alternativeGame =
      recommendedGame === "letters" ? "bateau" : recommendedGame === "sentier" ? "bateau" : "letters";

    return (
      <div className="home-onboarding__response-panel home-onboarding__response-panel--result">
        <a
          className="home-onboarding__button home-onboarding__button--primary"
          href={sitePath(GAME_DETAILS[recommendedGame].href)}
          onClick={() => remember(recommendedGame)}
        >
          {GAME_DETAILS[recommendedGame].cta}
          <span aria-hidden="true">→</span>
        </a>
        <a
          className="home-onboarding__alternative"
          href={sitePath(GAME_DETAILS[alternativeGame].href)}
          onClick={() => remember(alternativeGame)}
        >
          Voir plutôt {GAME_DETAILS[alternativeGame].shortTitle}
        </a>
      </div>
    );
  }

  return (
    <section
      className={`home-onboarding home-onboarding--${sceneTheme} home-onboarding--${phase}`}
      aria-label="Pana t’aide à choisir un jeu"
    >
      <SceneDecor theme={sceneTheme} showReadingCurrent={phase !== "result"} />

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
                <SpeakerIcon playing={playingLineId === currentLine.id} />
              </button>
            </div>
          ) : null}
        </div>

        {responsePanel()}
      </div>
    </section>
  );
}
