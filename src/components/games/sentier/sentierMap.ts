import type { SentierRegionId } from "./sentierContent";

export type SentierMapStage = {
  level: number;
  panel: number;
  x: number;
  y: number;
  regionId: SentierRegionId;
};

export const SENTIER_MAP_PANELS = [
  "/assets/world/jungle/map/jungle-map-chapter-1-v2.webp",
  "/assets/world/jungle/map/jungle-map-chapter-2-v2.webp",
  "/assets/world/jungle/map/jungle-map-chapter-3-v2.webp",
  "/assets/world/jungle/map/jungle-map-chapter-4-v2.webp",
] as const;

// Ajustement manuel des coffres : x et y sont les coordonnées en pourcentage
// de la planche. Les quatre planches partagent une bande verticale de 260 px.
export const SENTIER_MAP_STAGES: SentierMapStage[] = [
  { level: 1, panel: 0, x: 32, y: 22, regionId: "lisiere" },
  { level: 2, panel: 0, x: 70, y: 50, regionId: "lisiere" },
  { level: 3, panel: 0, x: 35, y: 75, regionId: "lisiere" },
  { level: 4, panel: 1, x: 69, y: 24, regionId: "eaux" },
  { level: 5, panel: 1, x: 34, y: 50, regionId: "eaux" },
  { level: 6, panel: 1, x: 69, y: 75, regionId: "eaux" },
  { level: 7, panel: 2, x: 34, y: 23, regionId: "profondeurs" },
  { level: 8, panel: 2, x: 67, y: 50, regionId: "profondeurs" },
  { level: 9, panel: 2, x: 36, y: 75, regionId: "profondeurs" },
  { level: 10, panel: 3, x: 69, y: 24, regionId: "ruines" },
  { level: 11, panel: 3, x: 36, y: 50, regionId: "ruines" },
  { level: 12, panel: 3, x: 64, y: 76, regionId: "ruines" },
];
