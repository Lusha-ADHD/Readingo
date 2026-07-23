import { GameButton } from "./GameButton";
import { PanaMascot } from "./PanaMascot";
import "./game-intro.css";

type GameIntroOverlayProps = {
  title: string;
  subtitle?: string;
  onStart: () => void;
  startLabel?: string;
};

type GameDialogueOverlayProps = {
  text: string;
  onSkip: () => void;
  skipLabel?: string;
};

export function GameIntroOverlay({
  title,
  subtitle,
  onStart,
  startLabel = "Commencer",
}: GameIntroOverlayProps) {
  return (
    <div className="game-intro">
      <h2 className="game-intro__title">{title}</h2>
      {subtitle ? <p className="game-intro__subtitle">{subtitle}</p> : null}
      <PanaMascot className="game-intro__pana game-intro__pana--start" />
      <GameButton onClick={onStart}>{startLabel}</GameButton>
    </div>
  );
}

export function GameDialogueOverlay({
  text,
  onSkip,
  skipLabel = "Passer",
}: GameDialogueOverlayProps) {
  return (
    <div className="game-intro game-intro--dialogue">
      <PanaMascot className="game-intro__pana game-intro__pana--dialogue" />
      <div className="game-intro__speech" aria-live="polite">
        {text}
      </div>
      <GameButton onClick={onSkip} variant="secondary">
        {skipLabel}
      </GameButton>
    </div>
  );
}
