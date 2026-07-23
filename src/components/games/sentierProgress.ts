export const SENTIER_STORAGE_KEY = "readingo:sentier-des-mots:v1";

export type SentierProgress = {
  version: 1;
  completedLevels: number[];
  bestGemsByLevel: Record<string, number>;
  sessions: number;
};

export function createInitialSentierProgress(): SentierProgress {
  return {
    version: 1,
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
    completedLevels,
    bestGemsByLevel,
    sessions: Math.max(0, Math.round(Number(value.sessions) || 0)),
  };
}

export function readSentierProgress(
  storage: Storage | null,
  totalLevels: number,
): SentierProgress {
  if (!storage) {
    return createInitialSentierProgress();
  }

  try {
    const saved = storage.getItem(SENTIER_STORAGE_KEY);
    return saved
      ? normalizeProgress(JSON.parse(saved) as Partial<SentierProgress>, totalLevels)
      : createInitialSentierProgress();
  } catch {
    return createInitialSentierProgress();
  }
}

export function completeSentierLevel(
  progress: SentierProgress,
  level: number,
  gems: number,
  totalLevels: number,
): SentierProgress {
  return normalizeProgress(
    {
      version: 1,
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
  try {
    storage?.setItem(SENTIER_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // La partie reste jouable si le stockage est bloqué ou plein.
  }
}
