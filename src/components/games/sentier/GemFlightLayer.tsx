import type { CSSProperties } from "react";
import { sitePath } from "../../../utils/paths";

const GEM_PATH = sitePath("/assets/world/jungle/gem.png");

export type GemFlightBatch = {
  id: number;
  count: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  durationMs: number;
  staggerMs: number;
};

type GemFlightStyle = CSSProperties & {
  "--sentier-gem-flight-x": string;
  "--sentier-gem-flight-y": string;
};

type Props = {
  batch: GemFlightBatch | null;
};

export function GemFlightLayer({ batch }: Props) {
  if (!batch) {
    return null;
  }

  return (
    <div className="sentier-gem-flights" data-testid="sentier-gem-flights" aria-hidden="true">
      {Array.from({ length: batch.count }, (_, index) => {
        const spread = (index - (batch.count - 1) / 2) * Math.min(18, 54 / batch.count);
        const style: GemFlightStyle = {
          left: batch.originX + spread,
          top: batch.originY + Math.abs(spread) * 0.15,
          animationDelay: `${index * batch.staggerMs}ms`,
          animationDuration: `${batch.durationMs}ms`,
          "--sentier-gem-flight-x": `${batch.targetX - batch.originX - spread}px`,
          "--sentier-gem-flight-y": `${batch.targetY - batch.originY}px`,
        };

        return (
          <img
            className="sentier-gem-flight"
            src={GEM_PATH}
            alt=""
            draggable={false}
            key={`${batch.id}-${index}`}
            style={style}
          />
        );
      })}
    </div>
  );
}
