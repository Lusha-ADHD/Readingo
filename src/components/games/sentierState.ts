export type SentierDirection =
  | "far-left"
  | "left"
  | "forward"
  | "right"
  | "far-right"
  | "uturn";

export type SentierPhase =
  | "intro"
  | "dialogue"
  | "presenting"
  | "choosing"
  | "travelling"
  | "wrong-feedback"
  | "reward"
  | "uturn-prompt"
  | "uturn-travelling"
  | "result";

export type SentierChoice = {
  word: string;
  direction: SentierDirection;
};

export type SentierState = {
  phase: SentierPhase;
  questionIndex: number;
  remainingWords: string[];
  choices: SentierChoice[];
  errors: number;
  selectedWord: string | null;
  gems: number;
  pendingGems: number;
  transitionToken: number;
};

export type SentierAction =
  | { type: "START_DIALOGUE" }
  | { type: "PRESENT_QUESTION"; questionIndex: number; words: string[]; random?: () => number }
  | { type: "ENABLE_CHOICES" }
  | { type: "SELECT"; word: string }
  | { type: "ARRIVE_CORRECT" }
  | { type: "ARRIVE_WRONG"; random?: () => number }
  | { type: "RETRY" }
  | { type: "START_UTURN" }
  | { type: "FINISH_UTURN" }
  | { type: "COLLECT_REWARD" }
  | { type: "SHOW_RESULT" };

const DIRECTION_SETS: Record<number, SentierDirection[]> = {
  1: ["uturn"],
  2: ["left", "right"],
  3: ["left", "forward", "right"],
  4: ["far-left", "left", "right", "far-right"],
  5: ["far-left", "left", "forward", "right", "far-right"],
};

export function shuffleValues<T>(values: readonly T[], random = Math.random): T[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }

  return shuffled;
}

export function assignDirections(
  words: readonly string[],
  random = Math.random,
): SentierChoice[] {
  const directions = DIRECTION_SETS[words.length];

  if (!directions) {
    throw new Error(`Le Sentier attend entre 1 et 5 choix, reçu : ${words.length}.`);
  }

  const shuffledWords = shuffleValues(words, random);
  return shuffledWords.map((word, index) => ({ word, direction: directions[index] }));
}

export function rewardForErrors(errors: number) {
  return errors <= 0 ? 2 : errors === 1 ? 1 : 0;
}

export function createInitialSentierState(): SentierState {
  return {
    phase: "intro",
    questionIndex: 0,
    remainingWords: [],
    choices: [],
    errors: 0,
    selectedWord: null,
    gems: 0,
    pendingGems: 0,
    transitionToken: 0,
  };
}

export function sentierReducer(state: SentierState, action: SentierAction): SentierState {
  switch (action.type) {
    case "START_DIALOGUE":
      return state.phase === "intro" ? { ...state, phase: "dialogue" } : state;

    case "PRESENT_QUESTION": {
      const words = Array.from(new Set(action.words));

      return {
        ...state,
        phase: "presenting",
        questionIndex: action.questionIndex,
        remainingWords: words,
        choices: assignDirections(words, action.random),
        errors: 0,
        selectedWord: null,
        pendingGems: 0,
        transitionToken: state.transitionToken + 1,
      };
    }

    case "ENABLE_CHOICES":
      return state.phase === "presenting" ? { ...state, phase: "choosing" } : state;

    case "SELECT":
      if (state.phase !== "choosing" || !state.remainingWords.includes(action.word)) {
        return state;
      }

      return {
        ...state,
        phase: "travelling",
        selectedWord: action.word,
        transitionToken: state.transitionToken + 1,
      };

    case "ARRIVE_CORRECT": {
      if (state.phase !== "travelling") {
        return state;
      }

      return {
        ...state,
        phase: "reward",
        pendingGems: rewardForErrors(state.errors),
      };
    }

    case "ARRIVE_WRONG": {
      if (state.phase !== "travelling" || !state.selectedWord) {
        return state;
      }

      const remainingWords = state.remainingWords.filter((word) => word !== state.selectedWord);
      const errors = state.errors + 1;
      const mustTurnBack = remainingWords.length === 1;

      return {
        ...state,
        phase: mustTurnBack ? "uturn-prompt" : "wrong-feedback",
        remainingWords,
        choices: assignDirections(remainingWords, action.random),
        errors,
        selectedWord: null,
      };
    }

    case "START_UTURN":
      if (state.phase !== "uturn-prompt") {
        return state;
      }

      return {
        ...state,
        phase: "uturn-travelling",
        selectedWord: state.remainingWords[0] ?? null,
        transitionToken: state.transitionToken + 1,
      };

    case "RETRY":
      return state.phase === "wrong-feedback"
        ? { ...state, phase: "choosing", transitionToken: state.transitionToken + 1 }
        : state;

    case "COLLECT_REWARD":
      if (state.phase !== "reward") {
        return state;
      }

      return {
        ...state,
        gems: state.gems + state.pendingGems,
        pendingGems: 0,
      };

    case "FINISH_UTURN":
      return state.phase === "uturn-travelling"
        ? { ...state, phase: "reward", pendingGems: 0 }
        : state;

    case "SHOW_RESULT":
      return { ...state, phase: "result", selectedWord: null, pendingGems: 0 };

    default:
      return state;
  }
}
