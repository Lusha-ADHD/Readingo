export const HOME_LAST_GAME_STORAGE_KEY = "readingo:last-game:v1";
export const LETTERS_PROGRESS_STORAGE_KEY = "readingo:lettres:v1";
export const BATEAU_PROGRESS_STORAGE_KEYS = ["readingo:bateau:v3", "readingo:bateau:v2"] as const;
export const SENTIER_PROGRESS_STORAGE_KEY = "readingo:sentier-des-mots:v1";

export type HomeGameId = "letters" | "bateau" | "sentier";
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

function isHomeGameId(value: unknown): value is HomeGameId {
  return value === "letters" || value === "bateau" || value === "sentier";
}

export function recommendHomeGame(skill: SkillChoice, _age?: AgeChoice): HomeGameId {
  if (skill === "discovering-letters") {
    return "letters";
  }

  return skill === "reads-words" ? "sentier" : "bateau";
}

export function readResumeState(storage: Storage | null): ResumeState {
  const progressGames: HomeGameId[] = [];
  const lettersProgress = readJson(storage, LETTERS_PROGRESS_STORAGE_KEY);
  const bateauProgress = BATEAU_PROGRESS_STORAGE_KEYS
    .map((key) => readJson(storage, key))
    .find(hasProgress);
  const sentierProgress = readJson(storage, SENTIER_PROGRESS_STORAGE_KEY);

  if (hasProgress(lettersProgress)) {
    progressGames.push("letters");
  }

  if (bateauProgress) {
    progressGames.push("bateau");
  }

  if (hasProgress(sentierProgress)) {
    progressGames.push("sentier");
  }

  const savedLastGame = readJson(storage, HOME_LAST_GAME_STORAGE_KEY) as SavedLastGame | null;
  const lastGame =
    savedLastGame &&
    isHomeGameId(savedLastGame.gameId) &&
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
