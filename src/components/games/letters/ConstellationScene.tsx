import type { CSSProperties } from "react";
import type { ConstellationDefinition } from "./lettersConstellations";

type ConstellationSceneProps = {
  constellation: ConstellationDefinition;
  litStars: number;
  pendingLetter?: string;
  pendingStarIndex?: number;
  complete?: boolean;
};

export function ConstellationScene({
  constellation,
  litStars,
  pendingLetter,
  pendingStarIndex = litStars,
  complete = false,
}: ConstellationSceneProps) {
  const pendingPoint = constellation.points[
    Math.min(pendingStarIndex, constellation.points.length - 1)
  ];

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
        {constellation.connections.map(([fromIndex, toIndex], index) => {
          const from = constellation.points[fromIndex];
          const to = constellation.points[toIndex];
          const isLit = fromIndex < litStars && toIndex < litStars;

          return (
            <line
              className={`constellation-scene__path constellation-scene__link ${
                isLit ? "constellation-scene__link--lit" : ""
              }`}
              key={`link-${index}`}
              pathLength="1"
              x1={from.x}
              x2={to.x}
              y1={from.y}
              y2={to.y}
            />
          );
        })}
        {constellation.points.map((point, index) => (
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
