export type SentierDirection =
  | "far-left"
  | "left"
  | "forward"
  | "right"
  | "far-right"
  | "uturn";

import type { SentierChoiceSeed, SentierDisplayCase } from "./sentierContent";

export type SentierPhase =
  | "intro"
  | "dialogue"
  | "map"
  | "presenting"
  | "choosing"
  | "travelling"
  | "wrong-feedback"
  | "reward"
  | "reward-collecting"
  | "uturn-prompt"
  | "uturn-travelling"
  | "destination-travelling"
  | "treasure-buried"
  | "treasure-revealed"
  | "treasure-collecting"
  | "grand-treasure"
  | "result";

export type SentierChoice = {
  wordId: string;
  displayWord: string;
  displayCase: SentierDisplayCase;
  direction: SentierDirection;
};

export type SentierState = {
  phase: SentierPhase;
  questionIndex: number;
  remainingWords: string[];
  choices: SentierChoice[];
  errors: number;
  selectedWordId: string | null;
  gems: number;
  pendingGems: number;
  rewardTotal: number;
  rewardCompletesLevel: boolean;
  destinationReached: boolean;
  transitionToken: number;
};

export const TREASURE_BONUS_GEMS = 8;

export type SentierAction =
  | { type: "START_DIALOGUE" }
  | { type: "SHOW_MAP" }
  | { type: "RESET_LEVEL" }
  | {
      type: "PRESENT_QUESTION";
      questionIndex: number;
      choices: SentierChoiceSeed[];
      rewardGems?: number;
      rewardCompletesLevel?: boolean;
      random?: () => number;
    }
  | { type: "ENABLE_CHOICES" }
  | { type: "SELECT"; wordId: string }
  | { type: "ARRIVE_CORRECT" }
  | { type: "ARRIVE_WRONG"; random?: () => number }
  | { type: "RETRY" }
  | { type: "START_UTURN" }
  | { type: "FINISH_UTURN" }
  | { type: "START_REWARD_COLLECTION" }
  | { type: "GEM_ARRIVED" }
  | { type: "FINISH_REWARD" }
  | { type: "START_DESTINATION" }
  | { type: "ARRIVE_DESTINATION" }
  | { type: "DIG_TREASURE" }
  | { type: "OPEN_TREASURE" }
  | { type: "SHOW_GRAND_TREASURE" }
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
  choices: readonly SentierChoiceSeed[],
  random = Math.random,
): SentierChoice[] {
  const directions = DIRECTION_SETS[choices.length];

  if (!directions) {
    throw new Error(`Le Sentier attend entre 1 et 5 choix, reçu : ${choices.length}.`);
  }

  const shuffledChoices = shuffleValues(choices, random);
  return shuffledChoices.map((choice, index) => ({ ...choice, direction: directions[index] }));
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
    selectedWordId: null,
    gems: 0,
    pendingGems: 0,
    rewardTotal: 0,
    rewardCompletesLevel: false,
    destinationReached: false,
    transitionToken: 0,
  };
}

export function sentierReducer(state: SentierState, action: SentierAction): SentierState {
  switch (action.type) {
    case "START_DIALOGUE":
      return state.phase === "intro" ? { ...state, phase: "dialogue" } : state;

    case "SHOW_MAP":
      return { ...createInitialSentierState(), phase: "map" };

    case "RESET_LEVEL":
      return { ...createInitialSentierState(), phase: "presenting" };

    case "PRESENT_QUESTION": {
      const choices = action.choices.filter(
        (choice, index, entries) =>
          entries.findIndex((candidate) => candidate.wordId === choice.wordId) === index,
      );

      return {
        ...state,
        phase: action.rewardGems === undefined ? "presenting" : "reward",
        questionIndex: action.questionIndex,
        remainingWords: choices.map((choice) => choice.wordId),
        choices: assignDirections(choices, action.random),
        errors: 0,
        selectedWordId: null,
        pendingGems: action.rewardGems ?? 0,
        rewardTotal: action.rewardGems ?? 0,
        rewardCompletesLevel: action.rewardCompletesLevel ?? false,
        destinationReached: false,
        transitionToken: state.transitionToken + 1,
      };
    }

    case "ENABLE_CHOICES":
      return state.phase === "presenting" ||
        (state.phase === "reward" && state.pendingGems === 0)
        ? { ...state, phase: "choosing" }
        : state;

    case "SELECT":
      if (state.phase !== "choosing" || !state.remainingWords.includes(action.wordId)) {
        return state;
      }

      return {
        ...state,
        phase: "travelling",
        selectedWordId: action.wordId,
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
        rewardTotal: rewardForErrors(state.errors),
        rewardCompletesLevel: true,
      };
    }

    case "ARRIVE_WRONG": {
      if (state.phase !== "travelling" || !state.selectedWordId) {
        return state;
      }

      const remainingWords = state.remainingWords.filter((wordId) => wordId !== state.selectedWordId);
      const remainingChoices = state.choices.filter(
        (choice) => choice.wordId !== state.selectedWordId,
      );
      const errors = state.errors + 1;
      const mustTurnBack = remainingWords.length === 1;

      return {
        ...state,
        phase: mustTurnBack ? "uturn-prompt" : "wrong-feedback",
        remainingWords,
        choices: assignDirections(remainingChoices, action.random),
        errors,
        selectedWordId: null,
      };
    }

    case "START_UTURN":
      if (state.phase !== "uturn-prompt") {
        return state;
      }

      return {
        ...state,
        phase: "uturn-travelling",
        selectedWordId: state.remainingWords[0] ?? null,
        transitionToken: state.transitionToken + 1,
      };

    case "RETRY":
      return state.phase === "wrong-feedback"
        ? { ...state, phase: "choosing", transitionToken: state.transitionToken + 1 }
        : state;

    case "START_REWARD_COLLECTION":
      if (state.phase !== "reward" || state.pendingGems <= 0) {
        return state;
      }

      return {
        ...state,
        phase: "reward-collecting",
      };

    case "GEM_ARRIVED":
      if (
        (state.phase !== "reward-collecting" && state.phase !== "treasure-collecting") ||
        state.pendingGems <= 0
      ) {
        return state;
      }

      return {
        ...state,
        gems: state.gems + 1,
        pendingGems: state.pendingGems - 1,
      };

    case "FINISH_REWARD":
      if (
        (state.phase !== "reward" && state.phase !== "reward-collecting") ||
        state.pendingGems > 0
      ) {
        return state;
      }

      return {
        ...state,
        phase: "presenting",
      };

    case "START_DESTINATION":
      if (
        state.pendingGems > 0 ||
        !state.rewardCompletesLevel ||
        (state.phase !== "reward" &&
          state.phase !== "reward-collecting" &&
          state.phase !== "presenting")
      ) {
        return state;
      }

      return {
        ...state,
        phase: "destination-travelling",
        selectedWordId: null,
        destinationReached: true,
        transitionToken: state.transitionToken + 1,
      };

    case "ARRIVE_DESTINATION":
      return state.phase === "destination-travelling"
        ? { ...state, phase: "treasure-buried" }
        : state;

    case "DIG_TREASURE":
      return state.phase === "treasure-buried"
        ? { ...state, phase: "treasure-revealed" }
        : state;

    case "OPEN_TREASURE":
      return state.phase === "treasure-revealed"
        ? {
            ...state,
            phase: "treasure-collecting",
            pendingGems: TREASURE_BONUS_GEMS,
            rewardTotal: TREASURE_BONUS_GEMS,
          }
        : state;

    case "FINISH_UTURN":
      return state.phase === "uturn-travelling"
        ? {
            ...state,
            phase: "reward",
            pendingGems: 0,
            rewardTotal: 0,
            rewardCompletesLevel: true,
          }
        : state;

    case "SHOW_RESULT":
      return (state.phase === "treasure-collecting" || state.phase === "grand-treasure") &&
        state.pendingGems === 0
        ? { ...state, phase: "result", selectedWordId: null }
        : state;

    case "SHOW_GRAND_TREASURE":
      return state.phase === "treasure-collecting" && state.pendingGems === 0
        ? { ...state, phase: "grand-treasure" }
        : state;

    default:
      return state;
  }
}
