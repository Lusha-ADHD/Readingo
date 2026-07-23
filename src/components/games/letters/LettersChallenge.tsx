import type { WordReference } from "../../../content/types";
import { sitePath } from "../../../utils/paths";
import { AudioButton } from "../../ui/AudioButton";
import { LetterTile } from "../../ui/LetterTile";
import { isTargetCharacter } from "./letterGame";
import type {
  LetterDisplayCase,
  LetterEntry,
} from "./letterGame";

const PANA_ASSET_PATH = sitePath("/assets/characters/pana.png");

type Props = {
  anchorWord: WordReference;
  targetLetter: LetterEntry;
  displayCase: LetterDisplayCase;
  choices: LetterEntry[];
  selectedLetterId: string | null;
  revealWord: boolean;
  inputLocked: boolean;
  panaMessage: string;
  onListenPrompt: () => void;
  onListenWord: () => void;
  onListenLetter: (letter: LetterEntry) => void;
  onChoose: (letterId: string) => void;
};

export function LettersChallenge({
  anchorWord,
  targetLetter,
  displayCase,
  choices,
  selectedLetterId,
  revealWord,
  inputLocked,
  panaMessage,
  onListenPrompt,
  onListenWord,
  onListenLetter,
  onChoose,
}: Props) {
  return (
    <main className="letters-game__exercise">
      <div className="letters-game__bottom-panels">
        <div className="letters-game__pana-prompt">
          <img className="letters-game__pana" src={PANA_ASSET_PATH} alt="" />
          <p role="status" aria-live="polite">
            {panaMessage}
          </p>
          <AudioButton
            className="letters-game__prompt-audio"
            disabled={inputLocked}
            label="Réécouter la consigne de Pana"
            onClick={onListenPrompt}
            size="compact"
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
              onClick={onListenWord}
              size="compact"
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
              <span className="letters-game__listen-hint">
                Quelle lettre Pana demande-t-elle ?
              </span>
            )}
          </div>

          <div className="letters-game__choices">
            {choices.map((entry) => {
              const state =
                selectedLetterId !== entry.id
                  ? "idle"
                  : entry.id === targetLetter.id
                    ? "correct"
                    : "wrong";

              return (
                <LetterTile
                  disabled={inputLocked}
                  key={entry.id}
                  letter={entry[displayCase]}
                  letterName={entry.nameText}
                  onChoose={() => onChoose(entry.id)}
                  onListen={() => onListenLetter(entry)}
                  state={state}
                />
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
