import { GAME_BY_ID } from "../../content/gameCatalog";
import { sitePath } from "../../utils/paths";
import type { HomeGameId } from "./onboardingState";

type Props = {
  recommendedGame: HomeGameId;
  onRemember: (gameId: HomeGameId) => void;
};

export function OnboardingResult({
  recommendedGame,
  onRemember,
}: Props) {
  const alternativeGame =
    recommendedGame === "letters"
      ? "bateau"
      : recommendedGame === "sentier"
        ? "bateau"
        : "letters";

  return (
    <div className="home-onboarding__response-panel home-onboarding__response-panel--result">
      <a
        className="home-onboarding__button home-onboarding__button--primary"
        href={sitePath(GAME_BY_ID[recommendedGame].route)}
        onClick={() => onRemember(recommendedGame)}
      >
        {GAME_BY_ID[recommendedGame].cta}
        <span aria-hidden="true">→</span>
      </a>
      <a
        className="home-onboarding__alternative"
        href={sitePath(GAME_BY_ID[alternativeGame].route)}
        onClick={() => onRemember(alternativeGame)}
      >
        Voir plutôt {GAME_BY_ID[alternativeGame].shortTitle}
      </a>
    </div>
  );
}
