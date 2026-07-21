import "./game-ui.css";
import type { CSSProperties } from "react";
import { sitePath } from "../../utils/paths";

type ProgressBarProps = {
  current: number;
  total: number;
  score: number;
};

export function ProgressBar({ current, total, score }: ProgressBarProps) {
  const value = total > 0 ? Math.round((current / total) * 100) : 0;
  const currentWord = Math.min(current + 1, total);
  const chestIconPath = sitePath("/assets/world/Chest.png");

  return (
    <div className="progress-bar" aria-label={`Mot ${currentWord} sur ${total}, ${score} coffre${score > 1 ? "s" : ""} collecté${score > 1 ? "s" : ""}`}>
      <div className="progress-bar__label">
        <span>
          Mot {currentWord} / {total}
        </span>
        <span className="progress-bar__score">
          <img src={chestIconPath} alt="" draggable={false} />
          {score} coffre{score > 1 ? "s" : ""}
        </span>
      </div>
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ "--progress-value": `${value}%` } as CSSProperties} />
      </div>
    </div>
  );
}
