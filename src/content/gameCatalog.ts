import gameData from "./fr/games.json" with { type: "json" };

export const GAME_IDS = {
  LETTERS: "letters",
  BATEAU: "bateau",
  SENTIER: "sentier",
} as const;

export type GameId = (typeof GAME_IDS)[keyof typeof GAME_IDS];
export type GameTheme = "letters" | "bateau" | "forest";

export type GameDefinition = {
  id: GameId;
  route: string;
  title: string;
  shortTitle: string;
  description: string;
  eyebrow: string;
  pageDescription: string;
  seoTitle: string;
  seoDescription: string;
  cta: string;
  icon: string;
  meta: string;
  theme: GameTheme;
  progressKeys: string[];
  skills: string[];
};

export const GAME_CATALOG = gameData as GameDefinition[];

export const GAME_BY_ID = Object.fromEntries(
  GAME_CATALOG.map((game) => [game.id, game]),
) as Record<GameId, GameDefinition>;

export function isGameId(value: unknown): value is GameId {
  return typeof value === "string" && Object.hasOwn(GAME_BY_ID, value);
}
