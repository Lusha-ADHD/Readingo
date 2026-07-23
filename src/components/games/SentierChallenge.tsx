import type { WordReference } from "../../content/types";
import { sitePath } from "../../utils/paths";
import { AudioButton } from "../ui/AudioButton";
import type { SentierChoice, SentierDirection, SentierPhase } from "./sentierState";

type Props = {
  target: WordReference;
  choices: SentierChoice[];
  phase: SentierPhase;
  selectedWord: string | null;
  message: string;
  onListen: () => void;
  onChoose: (word: string) => void;
  onUturn: () => void;
};

const PANA_PATH = sitePath("/assets/characters/pana.png");

function DirectionIcon({ direction }: { direction: SentierDirection }) {
  if (direction === "uturn") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M25 25v-8.5a8 8 0 0 0-8-8H8" />
        <path d="m12 4.5-5 4 5 4" />
      </svg>
    );
  }

  const rotations: Record<Exclude<SentierDirection, "uturn">, number> = {
    "far-left": -62,
    left: -42,
    forward: 0,
    right: 42,
    "far-right": 62,
  };

  return (
    <svg
      viewBox="0 0 32 32"
      style={{ transform: `rotate(${rotations[direction]}deg)` }}
      aria-hidden="true"
    >
      <path d="M16 27V6" />
      <path d="m8.5 13.5 7.5-8 7.5 8" />
    </svg>
  );
}

function isInputLocked(phase: SentierPhase) {
  return phase !== "choosing" && phase !== "uturn-prompt";
}

export function SentierChallenge({
  target,
  choices,
  phase,
  selectedWord,
  message,
  onListen,
  onChoose,
  onUturn,
}: Props) {
  const locked = isInputLocked(phase);

  return (
    <section className="sentier-challenge" data-testid="sentier-controls">
      <div className="sentier-challenge__pana" aria-live="polite">
        <img src={PANA_PATH} alt="Pana" draggable={false} />
        <p>{message}</p>
      </div>

      <div className="sentier-challenge__card">
        <div className="sentier-challenge__target" data-testid="sentier-target">
          <img src={sitePath(target.image)} alt={target.displayWord} draggable={false} />
          <AudioButton
            className="sentier-challenge__audio"
            label={`Écouter le mot ${target.displayWord}`}
            onClick={onListen}
            size="compact"
          />
        </div>

        <h2>Trouve le mot</h2>

        <div
          className="sentier-challenge__choices"
          data-choice-count={choices.length}
          data-testid="sentier-choices"
        >
          {choices.map((choice) => {
            const selected = selectedWord === choice.word;
            const isUturn = phase === "uturn-prompt";

            return (
              <button
                className={`sentier-choice ${selected ? "sentier-choice--selected" : ""} ${
                  phase === "reward" && selected ? "sentier-choice--correct" : ""
                }`}
                disabled={locked}
                key={`${choice.word}-${choice.direction}`}
                onClick={() => (isUturn ? onUturn() : onChoose(choice.word))}
                type="button"
                data-testid="sentier-choice"
              >
                <span className="sentier-choice__word">{choice.word.toLocaleLowerCase("fr")}</span>
                <span className="sentier-choice__direction">
                  <DirectionIcon direction={isUturn ? "uturn" : choice.direction} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
