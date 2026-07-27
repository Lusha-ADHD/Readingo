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

export function SyllabesResult({
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
      className={`syllabes-game__panel syllabes-game__panel--end ${
        leaving ? "syllabes-game__panel--leaving" : ""
      }`}
    >
      <div className="syllabes-game__end" aria-live="polite">
        <p className="syllabes-game__eyebrow">Niveau {level} terminé</p>
        <h2>{level === levelCount ? "Cap sur le trésor !" : "Bravo !"}</h2>
        <p>
          {wordCount} mots réussis, {treasures} coffre
          {treasures > 1 ? "s" : ""} collecté
          {treasures > 1 ? "s" : ""}.
        </p>
        <div className="syllabes-game__end-actions">
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
