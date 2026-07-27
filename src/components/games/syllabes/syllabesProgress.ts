import { GAME_BY_ID, GAME_IDS } from "../../../content/gameCatalog.ts";
import { readStoredJson, writeStoredJson } from "../../../utils/storage.ts";

export const SYLLABLES_STORAGE_KEY =
  GAME_BY_ID[GAME_IDS.SYLLABLES].progressKeys[0];

export type SyllabesProgress = {
  version: 3;
  unlockedLevel: number;
  completedLevels: number[];
  totalTreasures: number;
  bestTreasuresByLevel: Record<string, number>;
  completedWords: string[];
  sessions: number;
};

export function createInitialProgress(): SyllabesProgress {
  return {
    version: 3,
    unlockedLevel: 1,
    completedLevels: [],
    totalTreasures: 0,
    bestTreasuresByLevel: {},
    completedWords: [],
    sessions: 0,
  };
}

function normalizeProgress(value: Partial<SyllabesProgress>, totalLevels: number): SyllabesProgress {
  const initial = createInitialProgress();
  const completedLevels = Array.from(
    new Set((Array.isArray(value.completedLevels) ? value.completedLevels : []).filter((level) => Number.isInteger(level) && level >= 1 && level <= totalLevels)),
  ).sort((left, right) => left - right);

  return {
    version: 3,
    unlockedLevel: Math.min(totalLevels, Math.max(1, Number(value.unlockedLevel) || 1)),
    completedLevels,
    totalTreasures: Math.max(0, Number(value.totalTreasures) || 0),
    bestTreasuresByLevel:
      value.bestTreasuresByLevel && typeof value.bestTreasuresByLevel === "object" ? value.bestTreasuresByLevel : initial.bestTreasuresByLevel,
    completedWords: Array.isArray(value.completedWords) ? Array.from(new Set(value.completedWords.filter((id) => typeof id === "string"))) : [],
    sessions: Math.max(0, Number(value.sessions) || 0),
  };
}

export function readSyllabesProgress(
  storage: Storage | null,
  totalLevels: number,
): SyllabesProgress {
  const saved = readStoredJson<Partial<SyllabesProgress>>(
    storage,
    SYLLABLES_STORAGE_KEY,
  );

  if (saved !== null) {
    return normalizeProgress(saved, totalLevels);
  }

  return createInitialProgress();
}

export function completeSyllabesLevel(
  progress: SyllabesProgress,
  level: number,
  treasures: number,
  completedWordIds: string[],
  totalLevels: number,
): SyllabesProgress {
  const safeTreasures = Math.max(0, Math.round(treasures));
  const isFirstCompletion = !progress.completedLevels.includes(level);
  const canUnlockNext = isFirstCompletion && level === progress.unlockedLevel && level < totalLevels;

  return normalizeProgress(
    {
      version: 3,
      unlockedLevel: canUnlockNext ? level + 1 : progress.unlockedLevel,
      completedLevels: [...progress.completedLevels, level],
      totalTreasures: progress.totalTreasures + safeTreasures,
      bestTreasuresByLevel: {
        ...progress.bestTreasuresByLevel,
        [String(level)]: Math.max(progress.bestTreasuresByLevel[String(level)] ?? 0, safeTreasures),
      },
      completedWords: [...progress.completedWords, ...completedWordIds],
      sessions: progress.sessions + 1,
    },
    totalLevels,
  );
}

export function saveSyllabesProgress(storage: Storage | null, progress: SyllabesProgress) {
  writeStoredJson(storage, SYLLABLES_STORAGE_KEY, progress);
}
