import { sitePath } from "../../utils/paths";
import type { SentierChoice, SentierDirection, SentierPhase } from "./sentierState";

type Props = {
  choices: SentierChoice[];
  phase: SentierPhase;
  selectedDirection: SentierDirection | null;
  lostness: number;
  rewardGems: number;
  sceneVersion: number;
  onSkipTravel: () => void;
};

const ASSETS = {
  backdrop: sitePath("/assets/world/jungle/jungle-backdrop.png"),
  canopy: sitePath("/assets/world/jungle/jungle-canopy.png"),
  foliageLeft: sitePath("/assets/world/jungle/foliage-left.png"),
  foliageRight: sitePath("/assets/world/jungle/foliage-right.png"),
  vinesA: sitePath("/assets/world/jungle/vines-a.png"),
  vinesB: sitePath("/assets/world/jungle/vines-b.png"),
  rockFern: sitePath("/assets/world/jungle/rock-fern.png"),
  gem: sitePath("/assets/world/jungle/gem.png"),
};

const ANCHORS: Record<SentierDirection, number> = {
  "far-left": 7,
  left: 22,
  forward: 50,
  right: 78,
  "far-right": 93,
  uturn: 50,
};

function pathFor(direction: SentierDirection) {
  const x = ANCHORS[direction];
  const control = 50 + (x - 50) * 0.55;
  return `M 50 108 C 50 82, ${control} 48, ${x} 17`;
}

function isTravelling(phase: SentierPhase) {
  return phase === "travelling" || phase === "uturn-travelling";
}

export function JungleScene({
  choices,
  phase,
  selectedDirection,
  lostness,
  rewardGems,
  sceneVersion,
  onSkipTravel,
}: Props) {
  const travelling = isTravelling(phase);
  const direction = selectedDirection ?? "forward";

  return (
    <button
      className={`jungle-scene jungle-scene--lost-${Math.min(2, lostness)} ${
        travelling ? `jungle-scene--travelling jungle-scene--${direction}` : ""
      }`}
      data-testid="sentier-scene"
      onClick={travelling ? onSkipTravel : undefined}
      type="button"
      aria-label={travelling ? "Terminer le déplacement" : "Carrefour dans la jungle"}
      tabIndex={travelling ? 0 : -1}
    >
      <span className="jungle-scene__world" key={`world-${sceneVersion}`}>
        <img className="jungle-scene__backdrop" src={ASSETS.backdrop} alt="" draggable={false} />
        <span className="jungle-scene__light" />
        <img className="jungle-scene__canopy" src={ASSETS.canopy} alt="" draggable={false} />
        <svg
          className="jungle-scene__paths"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {choices.map((choice) => (
            <path
              className={`jungle-scene__path ${
                choice.direction === selectedDirection ? "jungle-scene__path--selected" : ""
              }`}
              d={pathFor(choice.direction)}
              key={`${choice.word}-${choice.direction}`}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
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
      </span>

      {phase === "reward" && rewardGems > 0 ? (
        <span className="jungle-scene__rewards" aria-hidden="true">
          {Array.from({ length: rewardGems }, (_, index) => (
            <img
              className={`jungle-scene__gem jungle-scene__gem--${index + 1}`}
              src={ASSETS.gem}
              alt=""
              key={index}
            />
          ))}
        </span>
      ) : null}
    </button>
  );
}
