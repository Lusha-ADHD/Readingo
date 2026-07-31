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

export type SentierMapTestState = {
  progress: SentierProgress;
  newlyUnlockedLevel: number | null;
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
      .map(([key, score]) => [key, Math.max(0, Math.min(24, Math.round(Number(score) || 0)))]),
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

function parseCompletedLevels(value: string | null, totalLevels: number) {
  if (!value) return [];

  const levels = value.split(",").flatMap((part) => {
    const range = part.trim().match(/^(\d+)-(\d+)$/);

    if (!range) return [Number(part)];

    const start = Number(range[1]);
    const end = Number(range[2]);
    const length = Math.max(0, Math.min(totalLevels, end) - Math.max(1, start) + 1);
    return Array.from({ length }, (_, index) => Math.max(1, start) + index);
  });

  return Array.from(
    new Set(levels.filter((level) => Number.isInteger(level) && level >= 1 && level <= totalLevels)),
  ).sort((left, right) => left - right);
}

export function createSentierMapTestState(
  search: string | URLSearchParams,
  totalLevels: number,
): SentierMapTestState | null {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const preset = params.get("preset");
  const presetCompletedCount: Record<string, number> = {
    new: 0,
    middle: Math.min(5, totalLevels),
    unlock: Math.min(5, totalLevels),
    final: Math.max(0, totalLevels - 1),
    complete: totalLevels,
  };
  const hasCustomState = ["unlocked", "completed", "score", "new"].some((key) =>
    params.has(key),
  );

  if (!(preset && preset in presetCompletedCount) && !hasCustomState) return null;

  const completedLevels = preset && preset in presetCompletedCount
    ? Array.from({ length: presetCompletedCount[preset] }, (_, index) => index + 1)
    : parseCompletedLevels(params.get("completed"), totalLevels);
  const defaultScore = preset === "complete" ? 24 : preset === "final" ? 20 : 18;
  const score = Number(params.get("score") ?? defaultScore);
  const requestedNewLevel = preset === "unlock"
    ? Math.min(6, totalLevels)
    : Number(params.get("new"));
  const inferredUnlockedLevel = Math.min(totalLevels, completedLevels.length + 1);
  const unlockedLevel = Number(params.get("unlocked")) || requestedNewLevel || inferredUnlockedLevel;
  const progress = normalizeProgress(
    {
      version: 1,
      unlockedLevel,
      completedLevels,
      bestGemsByLevel: Object.fromEntries(
        completedLevels.map((level) => [String(level), score]),
      ),
      sessions: completedLevels.length,
    },
    totalLevels,
  );
  const newlyUnlockedLevel = Number.isInteger(requestedNewLevel) && requestedNewLevel >= 1
    ? Math.min(totalLevels, requestedNewLevel)
    : null;

  return { progress, newlyUnlockedLevel };
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
