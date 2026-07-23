import { GameButton } from "../../ui/GameButton";

type Props = {
  level: number;
  levelCount: number;
  wordCount: number;
  treasures: number;
  leaving: boolean;
  onContinue: () => void;
  onReplay: () => void;
};

export function BateauResult({
  level,
  levelCount,
  wordCount,
  treasures,
  leaving,
  onContinue,
  onReplay,
}: Props) {
  return (
    <div
      className={`bateau-game__panel bateau-game__panel--end ${
        leaving ? "bateau-game__panel--leaving" : ""
      }`}
    >
      <div className="bateau-game__end" aria-live="polite">
        <p className="bateau-game__eyebrow">Niveau {level} terminé</p>
        <h2>{level === levelCount ? "Cap sur le trésor !" : "Bravo !"}</h2>
        <p>
          {wordCount} mots réussis, {treasures} coffre
          {treasures > 1 ? "s" : ""} collecté
          {treasures > 1 ? "s" : ""}.
        </p>
        <div className="bateau-game__end-actions">
          <GameButton onClick={onContinue} variant="success">
            Continuer l’aventure
          </GameButton>
          <GameButton onClick={onReplay} variant="secondary">
            Rejouer
          </GameButton>
        </div>
      </div>
    </div>
  );
}
