export const LETTERS_STORAGE_KEY = "readingo:lettres:v1";

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
  if (!storage) {
    return createInitialLettersProgress();
  }

  try {
    const saved = storage.getItem(LETTERS_STORAGE_KEY);
    return saved
      ? normalizeProgress(JSON.parse(saved) as Partial<LettersProgress>, totalLevels)
      : createInitialLettersProgress();
  } catch {
    return createInitialLettersProgress();
  }
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
  try {
    storage?.setItem(LETTERS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Le jeu reste jouable si localStorage est bloqué ou plein.
  }
}
