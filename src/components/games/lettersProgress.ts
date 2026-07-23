import { GAME_BY_ID, GAME_IDS } from "../../content/gameCatalog.ts";
import { readStoredJson, writeStoredJson } from "../../utils/storage.ts";

export const LETTERS_STORAGE_KEY = GAME_BY_ID[GAME_IDS.LETTERS].progressKeys[0];

export type LettersProgress = {
  version: 1;
  completedLevels: number[];
  sessions: number;
};

export function createInitialLettersProgress(): LettersProgress {
  return {
    version: 1,
    completedLevels: [],
    sessions: 0,
  };
}

function normalizeProgress(value: Partial<LettersProgress>, totalLevels: number): LettersProgress {
  const completedLevels = Array.from(
    new Set(
      (Array.isArray(value.completedLevels) ? value.completedLevels : []).filter(
        (level) => Number.isInteger(level) && level >= 1 && level <= totalLevels,
      ),
    ),
  ).sort((left, right) => left - right);

  return {
    version: 1,
    completedLevels,
    sessions: Math.max(0, Math.round(Number(value.sessions) || 0)),
  };
}

export function readLettersProgress(storage: Storage | null, totalLevels: number): LettersProgress {
  const saved = readStoredJson<Partial<LettersProgress>>(storage, LETTERS_STORAGE_KEY);

  return saved !== null
    ? normalizeProgress(saved, totalLevels)
    : createInitialLettersProgress();
}

export function completeLettersLevel(
  progress: LettersProgress,
  level: number,
  totalLevels: number,
): LettersProgress {
  return normalizeProgress(
    {
      version: 1,
      completedLevels: [...progress.completedLevels, level],
      sessions: progress.sessions + 1,
    },
    totalLevels,
  );
}

export function saveLettersProgress(storage: Storage | null, progress: LettersProgress) {
  writeStoredJson(storage, LETTERS_STORAGE_KEY, progress);
}
