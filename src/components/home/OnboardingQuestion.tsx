import type { VoiceLine } from "../../content/types";
import type { AgeChoice, SkillChoice } from "./onboardingState";

export function OnboardingSpeakerIcon({ playing }: { playing: boolean }) {
  return (
    <svg
      className={`home-onboarding__speaker ${
        playing ? "home-onboarding__speaker--playing" : ""
      }`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M3.5 9.25h4.1L13 5.15v13.7l-5.4-4.1H3.5z" />
      <path d="M16 8.8a5.1 5.1 0 0 1 0 6.4" />
      <path d="M18.7 6.15a8.9 8.9 0 0 1 0 11.7" />
    </svg>
  );
}

type ChoiceOptionProps = {
  lineId: string;
  label: string;
  token: string;
  detail?: string;
  kind: "age" | "skill";
  line: VoiceLine | undefined;
  playingLineId: string | null;
  onChoose: () => void;
  onListen: (line: VoiceLine) => void;
};

function ChoiceOption({
  lineId,
  label,
  token,
  detail,
  kind,
  line,
  playingLineId,
  onChoose,
  onListen,
}: ChoiceOptionProps) {
  return (
    <div className={`home-onboarding__choice home-onboarding__choice--${kind}`}>
      <button
        className="home-onboarding__choice-select"
        type="button"
        onClick={onChoose}
      >
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
        <OnboardingSpeakerIcon playing={playingLineId === lineId} />
      </button>
    </div>
  );
}

const SKILL_OPTIONS: Array<{
  choice: SkillChoice;
  lineId: string;
  label: string;
  token: string;
}> = [
  {
    choice: "discovering-letters",
    lineId: "home-answer-discovering-letters",
    label: "Je découvre les lettres",
    token: "A",
  },
  {
    choice: "knows-letters",
    lineId: "home-answer-knows-letters",
    label: "Je connais déjà beaucoup de lettres",
    token: "ABC",
  },
  {
    choice: "reads-syllables",
    lineId: "home-answer-reads-syllables",
    label: "Je commence à lire des syllabes",
    token: "BA",
  },
  {
    choice: "reads-words",
    lineId: "home-answer-reads-words",
    label: "Je commence à lire des mots",
    token: "MOT",
  },
];

type Props = {
  kind: "age" | "skill";
  playingLineId: string | null;
  lineById: ReadonlyMap<string, VoiceLine>;
  onChooseAge: (choice: AgeChoice) => void;
  onChooseSkill: (choice: SkillChoice) => void;
  onListen: (line: VoiceLine) => void;
};

export function OnboardingQuestion({
  kind,
  playingLineId,
  lineById,
  onChooseAge,
  onChooseSkill,
  onListen,
}: Props) {
  if (kind === "age") {
    const ageOptions: AgeChoice[] = ["5", "6", "7", "other"];

    return (
      <div
        className="home-onboarding__response-panel home-onboarding__response-panel--age"
        role="group"
        aria-label="Choisis ton âge"
      >
        {ageOptions.map((choice) => {
          const lineId = `home-answer-age-${choice}`;

          return (
            <ChoiceOption
              key={choice}
              lineId={lineId}
              label={choice === "other" ? "Autre" : choice}
              token={choice === "other" ? "+" : choice}
              detail={choice === "other" ? undefined : "ans"}
              kind="age"
              line={lineById.get(lineId)}
              playingLineId={playingLineId}
              onChoose={() => onChooseAge(choice)}
              onListen={onListen}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="home-onboarding__response-panel home-onboarding__response-panel--skill"
      role="group"
      aria-label="Choisis ce qui te ressemble"
    >
      {SKILL_OPTIONS.map((option) => (
        <ChoiceOption
          key={option.choice}
          lineId={option.lineId}
          label={option.label}
          token={option.token}
          kind="skill"
          line={lineById.get(option.lineId)}
          playingLineId={playingLineId}
          onChoose={() => onChooseSkill(option.choice)}
          onListen={onListen}
        />
      ))}
    </div>
  );
}
