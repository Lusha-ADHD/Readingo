import type { WordReference } from "../../../content/types";
import { sitePath } from "../../../utils/paths";
import { AudioButton } from "../../ui/AudioButton";
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
        <path d="M24 28V16a8 8 0 0 0-16 0v10" />
        <path d="m3 21 5 5 5-5" />
      </svg>
    );
  }

  const paths: Record<Exclude<SentierDirection, "uturn">, React.ReactNode> = {
    "far-left": (
      <>
        <path d="M24 28V16H7" />
        <path d="m12 11-5 5 5 5" />
      </>
    ),
    left: (
      <>
        <path d="M23 28v-6L9 8" />
        <path d="M9 16V8h8" />
      </>
    ),
    forward: (
      <>
        <path d="M16 28V5" />
        <path d="m8 13 8-8 8 8" />
      </>
    ),
    right: (
      <>
        <path d="M9 28v-6L23 8" />
        <path d="M15 8h8v8" />
      </>
    ),
    "far-right": (
      <>
        <path d="M8 28V16h17" />
        <path d="m20 11 5 5-5 5" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      {paths[direction]}
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
