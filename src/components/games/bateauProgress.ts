import { GAME_BY_ID, GAME_IDS } from "../../content/gameCatalog.ts";

export const [BATEAU_STORAGE_KEY, LEGACY_BATEAU_STORAGE_KEY] =
  GAME_BY_ID[GAME_IDS.BATEAU].progressKeys;

export type BateauProgress = {
  version: 3;
  unlockedLevel: number;
  completedLevels: number[];
  totalTreasures: number;
  bestTreasuresByLevel: Record<string, number>;
  completedWords: string[];
  sessions: number;
};

type LegacyProgress = {
  bestTreasures?: number;
  sessions?: number;
  completedWords?: string[];
};

export function createInitialProgress(): BateauProgress {
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

function normalizeProgress(value: Partial<BateauProgress>, totalLevels: number): BateauProgress {
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

export function migrateLegacyProgress(legacy: LegacyProgress, firstLevelWordIds: string[], totalLevels: number): BateauProgress {
  const completedWords = Array.isArray(legacy.completedWords) ? Array.from(new Set(legacy.completedWords)) : [];
  const completedFirstLevel = firstLevelWordIds.every((id) => completedWords.includes(id));
  const bestTreasures = Math.max(0, Number(legacy.bestTreasures) || 0);

  return normalizeProgress(
    {
      version: 3,
      unlockedLevel: completedFirstLevel ? Math.min(2, totalLevels) : 1,
      completedLevels: completedFirstLevel ? [1] : [],
      totalTreasures: bestTreasures,
      bestTreasuresByLevel: completedFirstLevel ? { "1": bestTreasures } : {},
      completedWords,
      sessions: Math.max(0, Number(legacy.sessions) || 0),
    },
    totalLevels,
  );
}

export function readBateauProgress(storage: Storage | null, firstLevelWordIds: string[], totalLevels: number): BateauProgress {
  if (!storage) {
    return createInitialProgress();
  }

  try {
    const saved = storage.getItem(BATEAU_STORAGE_KEY);

    if (saved) {
      return normalizeProgress(JSON.parse(saved) as Partial<BateauProgress>, totalLevels);
    }

    const legacy = storage.getItem(LEGACY_BATEAU_STORAGE_KEY);

    if (legacy) {
      return migrateLegacyProgress(JSON.parse(legacy) as LegacyProgress, firstLevelWordIds, totalLevels);
    }
  } catch {
    return createInitialProgress();
  }

  return createInitialProgress();
}

export function completeBateauLevel(
  progress: BateauProgress,
  level: number,
  treasures: number,
  completedWordIds: string[],
  totalLevels: number,
): BateauProgress {
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

export function saveBateauProgress(storage: Storage | null, progress: BateauProgress) {
  try {
    storage?.setItem(BATEAU_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // A blocked or full localStorage must not prevent play.
  }
}
