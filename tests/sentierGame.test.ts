import assert from "node:assert/strict";
import test from "node:test";
import {
  assignDirections,
  createInitialSentierState,
  rewardForErrors,
  sentierReducer,
  shuffleValues,
} from "../src/components/games/sentier/sentierState.ts";
import {
  completeSentierLevel,
  createInitialSentierProgress,
  readSentierProgress,
} from "../src/components/games/sentier/sentierProgress.ts";

function createStorage(value: string | null) {
  return {
    getItem: () => value,
    setItem: () => undefined,
  } as unknown as Storage;
}

test("le mélange conserve tous les mots une seule fois", () => {
  const shuffled = shuffleValues(["moto", "melon", "maison"], () => 0.2);
  assert.deepEqual([...shuffled].sort(), ["maison", "melon", "moto"]);
  assert.equal(new Set(shuffled).size, 3);
});

test("les directions couvrent les configurations de deux à cinq choix", () => {
  assert.deepEqual(
    assignDirections(["a", "b"], () => 0.99).map((choice) => choice.direction),
    ["left", "right"],
  );
  assert.deepEqual(
    assignDirections(["a", "b", "c"], () => 0.99).map((choice) => choice.direction),
    ["left", "forward", "right"],
  );
  assert.deepEqual(
    assignDirections(["a", "b", "c", "d", "e"], () => 0.99).map(
      (choice) => choice.direction,
    ),
    ["far-left", "left", "forward", "right", "far-right"],
  );
});

test("le barème vaut deux, un puis zéro gemme", () => {
  assert.equal(rewardForErrors(0), 2);
  assert.equal(rewardForErrors(1), 1);
  assert.equal(rewardForErrors(2), 0);
});

test("deux erreurs conduisent au demi-tour et bloquent les doubles actions", () => {
  let state = sentierReducer(createInitialSentierState(), {
    type: "PRESENT_QUESTION",
    questionIndex: 0,
    words: ["moto", "melon", "maison"],
    random: () => 0.99,
  });
  state = sentierReducer(state, { type: "ENABLE_CHOICES" });
  state = sentierReducer(state, { type: "SELECT", word: "melon" });
  const locked = sentierReducer(state, { type: "SELECT", word: "maison" });
  assert.equal(locked.selectedWord, "melon");

  state = sentierReducer(state, { type: "ARRIVE_WRONG", random: () => 0.99 });
  assert.equal(state.phase, "wrong-feedback");
  state = { ...state, phase: "choosing" };
  state = sentierReducer(state, { type: "SELECT", word: "maison" });
  state = sentierReducer(state, { type: "ARRIVE_WRONG", random: () => 0.99 });
  assert.equal(state.phase, "uturn-prompt");
  assert.deepEqual(state.remainingWords, ["moto"]);
});

test("la progression garde le meilleur score sans dupliquer le niveau", () => {
  const first = completeSentierLevel(createInitialSentierProgress(), 1, 12, 1);
  const replay = completeSentierLevel(first, 1, 9, 1);
  assert.deepEqual(replay.completedLevels, [1]);
  assert.equal(replay.bestGemsByLevel["1"], 12);
  assert.equal(replay.sessions, 2);
});

test("terminer le niveau frontière débloque le niveau Sentier suivant", () => {
  const progress = completeSentierLevel(
    createInitialSentierProgress(),
    1,
    14,
    3,
  );

  assert.equal(progress.unlockedLevel, 2);
  assert.deepEqual(progress.completedLevels, [1]);
});

test("une ancienne sauvegarde Sentier déduit le niveau débloqué", () => {
  const progress = readSentierProgress(
    createStorage(
      JSON.stringify({
        version: 1,
        completedLevels: [1],
        bestGemsByLevel: { "1": 12 },
        sessions: 1,
      }),
    ),
    3,
  );

  assert.equal(progress.unlockedLevel, 2);
});

test("une sauvegarde corrompue est ignorée", () => {
  assert.deepEqual(
    readSentierProgress(createStorage("{cassé"), 1),
    createInitialSentierProgress(),
  );
});
