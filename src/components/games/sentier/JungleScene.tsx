import { useEffect } from "react";
import { sitePath } from "../../../utils/paths";
import type { SentierDirection, SentierPhase } from "./sentierState";

type Props = {
  choiceCount: number;
  destinationReached: boolean;
  phase: SentierPhase;
  selectedDirection: SentierDirection | null;
  lostness: number;
  mirrorBackdrop: boolean;
  rewardGems: number;
  showSinglePath: boolean;
  preloadTreasureAssets: boolean;
  sceneVersion: number;
  onDigTreasure: (source: HTMLElement) => void;
  onOpenTreasure: (source: HTMLElement) => void;
  onRewardMound: (source: HTMLElement) => void;
  onSkipTravel: () => void;
};

type BackdropPathCount = 0 | 1 | 2 | 3 | 4 | 5;

const ASSETS = {
  backdrops: {
    0: sitePath("/assets/world/jungle/jungle-crossroads-0-test.webp"),
    1: sitePath("/assets/world/jungle/jungle-crossroads-1-test.webp"),
    2: sitePath("/assets/world/jungle/jungle-crossroads-2-test.webp"),
    3: sitePath("/assets/world/jungle/jungle-crossroads-3-test.webp"),
    4: sitePath("/assets/world/jungle/jungle-crossroads-4-test.webp"),
    5: sitePath("/assets/world/jungle/jungle-crossroads-5-test.webp"),
  } satisfies Record<BackdropPathCount, string>,
  destination: sitePath("/assets/world/jungle/jungle-destination-ruins.webp"),
  canopy: sitePath("/assets/world/jungle/jungle-canopy.png"),
  foliageLeft: sitePath("/assets/world/jungle/foliage-left.png"),
  foliageRight: sitePath("/assets/world/jungle/foliage-right.png"),
  vinesA: sitePath("/assets/world/jungle/vines-a.png"),
  vinesB: sitePath("/assets/world/jungle/vines-b.png"),
  rockFern: sitePath("/assets/world/jungle/rock-fern.png"),
  gem: sitePath("/assets/world/jungle/gem.png"),
  mound: sitePath("/assets/world/jungle/dirt-mound.webp"),
  chestBuried: sitePath("/assets/world/jungle/treasure-chest-buried.webp"),
  chestOpen: sitePath("/assets/world/jungle/treasure-chest-open.webp"),
};

const NEXT_BACKDROP_COUNT: Partial<Record<BackdropPathCount, BackdropPathCount>> = {
  5: 4,
  4: 3,
  3: 2,
  2: 0,
};

function isTravelling(phase: SentierPhase) {
  return phase === "travelling" || phase === "uturn-travelling";
}

function backdropPathCount(choiceCount: number): BackdropPathCount {
  if (choiceCount === 1) {
    return 0;
  }

  if (choiceCount === 2 || choiceCount === 3 || choiceCount === 4 || choiceCount === 5) {
    return choiceCount;
  }

  return 5;
}

export function JungleScene({
  choiceCount,
  destinationReached,
  phase,
  selectedDirection,
  lostness,
  mirrorBackdrop,
  rewardGems,
  showSinglePath,
  preloadTreasureAssets,
  sceneVersion,
  onDigTreasure,
  onOpenTreasure,
  onRewardMound,
  onSkipTravel,
}: Props) {
  const travelling = isTravelling(phase);
  const direction = selectedDirection ?? "forward";
  const pathCount = showSinglePath ? 1 : backdropPathCount(choiceCount);
  const backdrop = destinationReached ? ASSETS.destination : ASSETS.backdrops[pathCount];

  useEffect(() => {
    if (destinationReached) {
      return;
    }

    const nextPathCount = NEXT_BACKDROP_COUNT[pathCount];

    if (nextPathCount === undefined) {
      return;
    }

    const image = new Image();
    image.src = ASSETS.backdrops[nextPathCount];
  }, [destinationReached, pathCount]);

  useEffect(() => {
    if (!preloadTreasureAssets) {
      return;
    }

    for (const source of [
      ASSETS.backdrops[1],
      ASSETS.destination,
      ASSETS.mound,
      ASSETS.chestBuried,
      ASSETS.chestOpen,
    ]) {
      const image = new Image();
      image.src = source;
    }
  }, [preloadTreasureAssets]);

  return (
    <div
      className={`jungle-scene jungle-scene--lost-${Math.min(2, lostness)} ${
        travelling ? `jungle-scene--travelling jungle-scene--${direction}` : ""
      } ${destinationReached ? "jungle-scene--destination" : ""} ${
        phase === "destination-travelling" ? "jungle-scene--destination-travelling" : ""
      } ${destinationReached ? "" : `jungle-scene--paths-${pathCount}`} jungle-scene--light-${
        sceneVersion % 4
      }`}
      data-testid="sentier-scene"
      data-light-variant={sceneVersion % 4}
      onClick={travelling ? onSkipTravel : undefined}
      onKeyDown={
        travelling
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSkipTravel();
              }
            }
          : undefined
      }
      role={travelling ? "button" : undefined}
      aria-label={travelling ? "Terminer le déplacement" : undefined}
      tabIndex={travelling ? 0 : undefined}
    >
      {phase === "destination-travelling" ? (
        <img
          className={`jungle-scene__destination-previous ${
            mirrorBackdrop ? "jungle-scene__backdrop--mirrored" : ""
          }`}
          src={ASSETS.backdrops[pathCount]}
          alt=""
          draggable={false}
        />
      ) : null}

      <span className="jungle-scene__world" key={`world-${sceneVersion}`}>
        <img
          className={`jungle-scene__backdrop ${
            !destinationReached && mirrorBackdrop ? "jungle-scene__backdrop--mirrored" : ""
          }`}
          src={backdrop}
          alt=""
          data-path-count={destinationReached ? undefined : pathCount}
          data-scene={destinationReached ? "destination" : "crossroads"}
          data-testid="sentier-backdrop"
          draggable={false}
          fetchPriority="high"
        />
        <span className="jungle-scene__light" />
        <img className="jungle-scene__canopy" src={ASSETS.canopy} alt="" draggable={false} />
        <img
          className="jungle-scene__rock-fern"
          src={ASSETS.rockFern}
          alt=""
          draggable={false}
        />
        <img
          className="jungle-scene__foliage jungle-scene__foliage--left"
          src={ASSETS.foliageLeft}
          alt=""
          draggable={false}
        />
        <img
          className="jungle-scene__foliage jungle-scene__foliage--right"
          src={ASSETS.foliageRight}
          alt=""
          draggable={false}
        />
        <img className="jungle-scene__vines jungle-scene__vines--a" src={ASSETS.vinesA} alt="" />
        <img className="jungle-scene__vines jungle-scene__vines--b" src={ASSETS.vinesB} alt="" />
        <span className="jungle-scene__mist" />
        <span className="jungle-scene__particles" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <span className="jungle-scene__particle" key={index} />
          ))}
        </span>
        {pathCount === 0 && !destinationReached ? (
          <span className="jungle-scene__eyes" data-testid="sentier-jungle-eyes" aria-hidden="true" />
        ) : null}
      </span>

      {phase === "reward" && rewardGems > 0 ? (
        <button
          className={`jungle-scene__reward-mound jungle-scene__reward-mound--${rewardGems}`}
          data-testid="sentier-reward-mound"
          onClick={(event) => {
            event.stopPropagation();
            onRewardMound(event.currentTarget);
          }}
          type="button"
          aria-label={`Ramasser ${rewardGems} gemme${rewardGems > 1 ? "s" : ""}`}
        >
          {Array.from({ length: rewardGems }, (_, index) => (
            <img
              className={`jungle-scene__hidden-gem jungle-scene__hidden-gem--${index + 1}`}
              src={ASSETS.gem}
              alt=""
              key={index}
              draggable={false}
            />
          ))}
          <img className="jungle-scene__mound" src={ASSETS.mound} alt="" draggable={false} />
          <span className="jungle-scene__sparkle" aria-hidden="true" />
        </button>
      ) : null}

      {phase === "destination-travelling" || phase === "treasure-buried" ? (
        <button
          className="jungle-scene__treasure jungle-scene__treasure--buried"
          data-testid="sentier-treasure-mound"
          onClick={(event) => onDigTreasure(event.currentTarget)}
          type="button"
          disabled={phase === "destination-travelling"}
          aria-label="Creuser la motte de terre brillante"
        >
          <img
            className="jungle-scene__chest-peek"
            src={ASSETS.chestBuried}
            alt=""
            draggable={false}
          />
          <img
            className="jungle-scene__treasure-mound"
            src={ASSETS.mound}
            alt=""
            draggable={false}
          />
          <span className="jungle-scene__sparkle" aria-hidden="true" />
        </button>
      ) : null}

      {phase === "treasure-revealed" ? (
        <button
          className="jungle-scene__treasure jungle-scene__treasure--revealed"
          data-testid="sentier-buried-chest"
          onClick={(event) => onOpenTreasure(event.currentTarget)}
          type="button"
          aria-label="Ouvrir le coffre au trésor"
        >
          <img src={ASSETS.chestBuried} alt="" draggable={false} />
          <span className="jungle-scene__sparkle" aria-hidden="true" />
        </button>
      ) : null}

      {phase === "treasure-collecting" || (phase === "result" && destinationReached) ? (
        <img
          className="jungle-scene__open-chest"
          data-testid="sentier-open-chest"
          src={ASSETS.chestOpen}
          alt="Coffre au trésor ouvert"
          draggable={false}
        />
      ) : null}
    </div>
  );
}
