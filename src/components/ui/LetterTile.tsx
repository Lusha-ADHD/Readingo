import { AudioButton } from "./AudioButton";
import "./game-ui.css";

type LetterTileProps = {
  letter: string;
  letterName: string;
  state?: "idle" | "correct" | "wrong";
  disabled?: boolean;
  onChoose: () => void;
  onListen: () => void;
};

export function LetterTile({
  letter,
  letterName,
  state = "idle",
  disabled = false,
  onChoose,
  onListen,
}: LetterTileProps) {
  return (
    <div className={`letter-tile letter-tile--${state}`}>
      <button
        className="letter-tile__choice"
        disabled={disabled}
        onClick={onChoose}
        type="button"
        aria-label={`Choisir la lettre ${letterName}`}
      >
        <span aria-hidden="true">{letter}</span>
      </button>
      <AudioButton
        className="letter-tile__audio"
        disabled={disabled}
        label={`Écouter le nom de la lettre ${letterName}`}
        onClick={onListen}
        size="compact"
      />
    </div>
  );
}
