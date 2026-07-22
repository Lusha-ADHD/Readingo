import "./game-ui.css";
import type { CSSProperties } from "react";
import { sitePath } from "../../utils/paths";

type ProgressBarProps = {
  current: number;
  total: number;
  score: number;
  level: number;
  levelTotal: number;
  totalTreasures: number;
};

export function ProgressBar({ current, total, score, level, levelTotal, totalTreasures }: ProgressBarProps) {
  const value = total > 0 ? Math.round((current / total) * 100) : 0;
  const currentWord = Math.min(current + 1, total);
  const chestIconPath = sitePath("/assets/world/Chest.png");

  return (
    <div
      className="progress-bar"
      aria-label={`Niveau ${level} sur ${levelTotal}, mot ${currentWord} sur ${total}, ${score} coffre${score > 1 ? "s" : ""} dans ce niveau, ${totalTreasures} au total`}
    >
      <div className="progress-bar__label">
        <span>
          Niveau {level}/{levelTotal} · Mot {currentWord}/{total}
        </span>
        <span className="progress-bar__score">
          <img src={chestIconPath} alt="" draggable={false} />
          {score} · Total {totalTreasures}
        </span>
      </div>
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ "--progress-value": `${value}%` } as CSSProperties} />
      </div>
    </div>
  );
}
