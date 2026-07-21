import "./game-ui.css";
import { sitePath } from "../../utils/paths";

type RewardBurstProps = {
  points: number;
};

export function RewardBurst({ points }: RewardBurstProps) {
  const chestIconPath = sitePath("/assets/world/Chest.png");

  return (
    <div className="reward-burst" aria-live="polite">
      <span>+{points}</span>
      <img className="reward-burst__chest" src={chestIconPath} alt="" draggable={false} />
    </div>
  );
}
