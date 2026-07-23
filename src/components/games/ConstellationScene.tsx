import type { CSSProperties } from "react";

type ConstellationSceneProps = {
  litStars: number;
  pendingLetter?: string;
  pendingStarIndex?: number;
  complete?: boolean;
};

const STAR_POINTS = [
  { x: 15, y: 66 },
  { x: 28, y: 39 },
  { x: 42, y: 58 },
  { x: 54, y: 25 },
  { x: 67, y: 45 },
  { x: 79, y: 20 },
  { x: 87, y: 54 },
  { x: 72, y: 72 },
];

const CONSTELLATION_PATH = STAR_POINTS.map(
  (point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
).join(" ");

export function ConstellationScene({
  litStars,
  pendingLetter,
  pendingStarIndex = litStars,
  complete = false,
}: ConstellationSceneProps) {
  const pendingPoint = STAR_POINTS[Math.min(pendingStarIndex, STAR_POINTS.length - 1)];

  return (
    <div className={`constellation-scene ${complete ? "constellation-scene--complete" : ""}`} aria-hidden="true">
      <span className="constellation-scene__dust constellation-scene__dust--one" />
      <span className="constellation-scene__dust constellation-scene__dust--two" />
      <div className="constellation-scene__clouds">
        <span className="constellation-scene__cloud constellation-scene__cloud--one" />
        <span className="constellation-scene__cloud constellation-scene__cloud--two" />
        <span className="constellation-scene__cloud constellation-scene__cloud--three" />
      </div>
      <span className="constellation-scene__shooting-star" />
      <span className="constellation-scene__planet">
        <span className="constellation-scene__planet-ring" />
        <span className="constellation-scene__planet-body" />
      </span>
      <svg
        className="constellation-scene__drawing"
        viewBox="0 0 100 88"
        preserveAspectRatio="none"
      >
        <path className="constellation-scene__path" d={CONSTELLATION_PATH} />
        {STAR_POINTS.slice(1).map((point, index) => {
          const previousPoint = STAR_POINTS[index];
          const isLit = index + 1 < litStars;

          return (
            <line
              className={`constellation-scene__link ${
                isLit ? "constellation-scene__link--lit" : ""
              }`}
              key={`link-${index}`}
              pathLength="1"
              x1={previousPoint.x}
              x2={point.x}
              y1={previousPoint.y}
              y2={point.y}
            />
          );
        })}
        {STAR_POINTS.map((point, index) => (
          <g
            className={`constellation-scene__star ${
              index < litStars ? "constellation-scene__star--lit" : ""
            } ${
              pendingLetter && index === pendingStarIndex && index < litStars
                ? "constellation-scene__star--new"
                : ""
            }`}
            key={`${point.x}-${point.y}`}
            transform={`translate(${point.x} ${point.y})`}
          >
            <circle className="constellation-scene__star-halo" r="4.6" />
            <path d="M0-3.8 1.05-1.15 3.8 0 1.05 1.15 0 3.8-1.05 1.15-3.8 0-1.05-1.15Z" />
          </g>
        ))}
      </svg>
      {pendingLetter && (
        <span
          className="constellation-scene__letter-comet"
          style={{
            "--star-x": `${17.5 + pendingPoint.x * 0.65}%`,
            "--star-x-mobile": `${11 + pendingPoint.x * 0.78}%`,
            "--star-y": `${1.5 + pendingPoint.y * 0.34}%`,
          } as CSSProperties}
        >
          {pendingLetter}
        </span>
      )}
    </div>
  );
}
