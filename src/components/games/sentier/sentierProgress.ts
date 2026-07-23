import { GAME_BY_ID, GAME_IDS } from "../../../content/gameCatalog.ts";
import { readStoredJson, writeStoredJson } from "../../../utils/storage.ts";

export const SENTIER_STORAGE_KEY = GAME_BY_ID[GAME_IDS.SENTIER].progressKeys[0];

export type SentierProgress = {
  version: 1;
  unlockedLevel: number;
  completedLevels: number[];
  bestGemsByLevel: Record<string, number>;
  sessions: number;
};

export function createInitialSentierProgress(): SentierProgress {
  return {
    version: 1,
    unlockedLevel: 1,
    completedLevels: [],
    bestGemsByLevel: {},
    sessions: 0,
  };
}

function normalizeProgress(
  value: Partial<SentierProgress>,
  totalLevels: number,
): SentierProgress {
  const completedLevels = Array.from(
    new Set(
      (Array.isArray(value.completedLevels) ? value.completedLevels : []).filter(
        (level) => Number.isInteger(level) && level >= 1 && level <= totalLevels,
      ),
    ),
  ).sort((left, right) => left - right);
  let unlockedFromCompletions = 1;

  while (
    unlockedFromCompletions < totalLevels &&
    completedLevels.includes(unlockedFromCompletions)
  ) {
    unlockedFromCompletions += 1;
  }
  const bestGemsByLevel = Object.fromEntries(
    Object.entries(
      value.bestGemsByLevel && typeof value.bestGemsByLevel === "object"
        ? value.bestGemsByLevel
        : {},
    )
      .filter(([key]) => {
        const level = Number(key);
        return Number.isInteger(level) && level >= 1 && level <= totalLevels;
      })
      .map(([key, score]) => [key, Math.max(0, Math.min(16, Math.round(Number(score) || 0)))]),
  );

  return {
    version: 1,
    unlockedLevel: Math.min(
      totalLevels,
      Math.max(
        unlockedFromCompletions,
        Math.round(Number(value.unlockedLevel) || 1),
      ),
    ),
    completedLevels,
    bestGemsByLevel,
    sessions: Math.max(0, Math.round(Number(value.sessions) || 0)),
  };
}

export function readSentierProgress(
  storage: Storage | null,
  totalLevels: number,
): SentierProgress {
  const saved = readStoredJson<Partial<SentierProgress>>(storage, SENTIER_STORAGE_KEY);

  return saved !== null
    ? normalizeProgress(saved, totalLevels)
    : createInitialSentierProgress();
}

export function completeSentierLevel(
  progress: SentierProgress,
  level: number,
  gems: number,
  totalLevels: number,
): SentierProgress {
  const isFirstFrontierCompletion =
    level === progress.unlockedLevel &&
    !progress.completedLevels.includes(level);

  return normalizeProgress(
    {
      version: 1,
      unlockedLevel:
        isFirstFrontierCompletion && level < totalLevels
          ? level + 1
          : progress.unlockedLevel,
      completedLevels: [...progress.completedLevels, level],
      bestGemsByLevel: {
        ...progress.bestGemsByLevel,
        [level]: Math.max(progress.bestGemsByLevel[level] ?? 0, gems),
      },
      sessions: progress.sessions + 1,
    },
    totalLevels,
  );
}

export function saveSentierProgress(storage: Storage | null, progress: SentierProgress) {
  writeStoredJson(storage, SENTIER_STORAGE_KEY, progress);
}
