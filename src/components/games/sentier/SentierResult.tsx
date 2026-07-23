import { sitePath } from "../../../utils/paths";
import { GameButton } from "../../ui/GameButton";

const PANA_PATH = sitePath("/assets/characters/pana.png");
const GEM_PATH = sitePath("/assets/world/jungle/gem.png");

type Props = {
  level: number;
  title: string;
  gems: number;
  maxGems: number;
  bestScore: number;
  onReplay: () => void;
};

export function SentierResult({
  level,
  title,
  gems,
  maxGems,
  bestScore,
  onReplay,
}: Props) {
  return (
    <section className="sentier-result" data-testid="sentier-result">
      <img src={PANA_PATH} alt="Pana" />
      <div>
        <p>
          Niveau {level} · {title}
        </p>
        <h2>Étape terminée !</h2>
        <strong>
          <img src={GEM_PATH} alt="" /> {gems} gemmes sur {maxGems}
        </strong>
        {bestScore > 0 ? (
          <span>Meilleur score : {Math.max(bestScore, gems)}</span>
        ) : null}
      </div>
      <div className="sentier-result__actions">
        <GameButton onClick={onReplay}>Rejouer le niveau</GameButton>
        <a href={sitePath("/#jeux")}>Retour aux jeux</a>
      </div>
    </section>
  );
}
