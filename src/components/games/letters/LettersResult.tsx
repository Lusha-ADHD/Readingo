import { sitePath } from "../../../utils/paths";
import { GameButton } from "../../ui/GameButton";

const PANA_ASSET_PATH = sitePath("/assets/characters/pana.png");

type Props = {
  starCount: number;
  onReplay: () => void;
};

export function LettersResult({ starCount, onReplay }: Props) {
  return (
    <div className="letters-game__result">
      <img
        className="letters-game__pana letters-game__pana--result"
        src={PANA_ASSET_PATH}
        alt="Pana"
      />
      <div className="letters-game__result-panel">
        <p className="letters-game__eyebrow">{starCount} étoiles allumées</p>
        <h2>Constellation terminée !</h2>
        <p>Tu as retrouvé toutes les lettres demandées par Pana.</p>
        <GameButton onClick={onReplay}>Rejouer</GameButton>
      </div>
    </div>
  );
}
