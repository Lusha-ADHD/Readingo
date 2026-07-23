export type BateauPhase =
  | "intro"
  | "dialog"
  | "map"
  | "playing"
  | "validating"
  | "sailing"
  | "done";

export type SailingIsland = {
  id: string;
  globalIndex: number;
  hasTreasure: boolean;
  size: "small" | "large";
  sailingOrder: number | null;
};

export type Journey = {
  wind: 1 | 2 | 3;
  islands: SailingIsland[];
  treasuresFound: number;
};

export const SAILING_DURATIONS: Record<Journey["wind"], number> = {
  1: 1700,
  2: 2200,
  3: 2700,
};

export function buildSceneIslands(
  startIndex: number,
  visibleCount: number,
  sailingCount = 0,
): SailingIsland[] {
  return Array.from({ length: visibleCount }, (_, index) => ({
    id: `scene-island-${startIndex + index}`,
    globalIndex: startIndex + index,
    hasTreasure: (startIndex + index) % 2 === 1,
    size: (startIndex + index) % 2 === 0 ? "small" : "large",
    sailingOrder: index > 0 && index <= sailingCount ? index - 1 : null,
  }));
}

export function buildJourney(startIndex: number, wind: Journey["wind"]): Journey {
  const islands = buildSceneIslands(startIndex, 2 + wind, wind);

  return {
    wind,
    islands,
    treasuresFound: islands.filter(
      (island) => island.sailingOrder != null && island.hasTreasure,
    ).length,
  };
}

export function getWindLabel(wind: Journey["wind"]) {
  if (wind === 3) {
    return "Vent très fort";
  }

  return wind === 2 ? "Vent moyen" : "Vent faible";
}
