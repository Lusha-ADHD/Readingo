import {
  GAME_BY_ID,
  GAME_CATALOG,
  GAME_IDS,
  isGameId,
} from "../../content/gameCatalog.ts";
import type { GameId } from "../../content/gameCatalog.ts";

export const HOME_LAST_GAME_STORAGE_KEY = "readingo:last-game:v1";
export const LETTERS_PROGRESS_STORAGE_KEY = GAME_BY_ID[GAME_IDS.LETTERS].progressKeys[0];
export const BATEAU_PROGRESS_STORAGE_KEYS = GAME_BY_ID[GAME_IDS.BATEAU].progressKeys;
export const SENTIER_PROGRESS_STORAGE_KEY = GAME_BY_ID[GAME_IDS.SENTIER].progressKeys[0];

export type HomeGameId = GameId;
export type AgeChoice = "5" | "6" | "7" | "other";
export type SkillChoice =
  | "discovering-letters"
  | "knows-letters"
  | "reads-syllables"
  | "reads-words";

export type ResumeState = {
  progressGames: HomeGameId[];
  resumeGames: HomeGameId[];
  lastGame: HomeGameId | null;
};

type SavedProgress = {
  sessions?: number;
  unlockedLevel?: number;
  completedLevels?: unknown[];
  completedWords?: unknown[];
  bestTreasures?: number;
};

type SavedLastGame = {
  gameId?: unknown;
  updatedAt?: unknown;
};

function readJson(storage: Storage | null, key: string): unknown {
  if (!storage) {
    return null;
  }

  try {
    const saved = storage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function hasProgress(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const progress = value as SavedProgress;
  return Boolean(
    (Number(progress.sessions) || 0) > 0 ||
    (Number(progress.unlockedLevel) || 1) > 1 ||
    progress.completedLevels?.length ||
    progress.completedWords?.length ||
    (Number(progress.bestTreasures) || 0) > 0,
  );
}

export function recommendHomeGame(skill: SkillChoice, _age?: AgeChoice): HomeGameId {
  if (skill === "discovering-letters") {
    return GAME_IDS.LETTERS;
  }

  return skill === "reads-words" ? GAME_IDS.SENTIER : GAME_IDS.BATEAU;
}

export function readResumeState(storage: Storage | null): ResumeState {
  const progressGames = GAME_CATALOG
    .filter((game) => game.progressKeys.some((key) => hasProgress(readJson(storage, key))))
    .map((game) => game.id);

  const savedLastGame = readJson(storage, HOME_LAST_GAME_STORAGE_KEY) as SavedLastGame | null;
  const lastGame =
    savedLastGame &&
    isGameId(savedLastGame.gameId) &&
    Number.isFinite(savedLastGame.updatedAt) &&
    progressGames.includes(savedLastGame.gameId)
      ? savedLastGame.gameId
      : null;

  return {
    progressGames,
    resumeGames: lastGame ? [lastGame] : progressGames,
    lastGame,
  };
}

export function rememberLastGame(storage: Storage | null, gameId: HomeGameId, updatedAt = Date.now()) {
  try {
    storage?.setItem(HOME_LAST_GAME_STORAGE_KEY, JSON.stringify({ gameId, updatedAt }));
  } catch {
    // La navigation et les jeux restent disponibles si le stockage est bloqué.
  }
}

export function shouldResumeFromUrl(locationSearch: string) {
  return new URLSearchParams(locationSearch).get("reprendre") === "1";
}
