import assert from "node:assert/strict";
import test from "node:test";
import {
  assignDirections,
  createInitialSentierState,
  rewardForErrors,
  sentierReducer,
  shuffleValues,
  TREASURE_BONUS_GEMS,
} from "../src/components/games/sentier/sentierState.ts";
import {
  completeSentierLevel,
  createSentierMapTestState,
  createInitialSentierProgress,
  readSentierProgress,
} from "../src/components/games/sentier/sentierProgress.ts";
import { SENTIER_MAP_PANELS, SENTIER_MAP_STAGES } from "../src/components/games/sentier/sentierMap.ts";
import sentierLessons from "../src/content/fr/sentier-lessons.json" with { type: "json" };

const seeds = (wordIds: string[]) =>
  wordIds.map((wordId) => ({ wordId, displayWord: wordId, displayCase: "lowercase" as const }));

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
    assignDirections(seeds(["a", "b"]), () => 0.99).map((choice) => choice.direction),
    ["left", "right"],
  );
  assert.deepEqual(
    assignDirections(seeds(["a", "b", "c"]), () => 0.99).map((choice) => choice.direction),
    ["left", "forward", "right"],
  );
  assert.deepEqual(
    assignDirections(seeds(["a", "b", "c", "d", "e"]), () => 0.99).map(
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

test("la question suivante reste bloquée jusqu’à l’arrivée de la gemme", () => {
  let state = sentierReducer(createInitialSentierState(), {
    type: "PRESENT_QUESTION",
    questionIndex: 1,
    choices: seeds(["panda", "lapin", "moto"]),
    rewardGems: 1,
    random: () => 0.99,
  });

  assert.equal(state.questionIndex, 1);
  assert.equal(state.phase, "reward");
  assert.equal(state.pendingGems, 1);
  assert.deepEqual(
    state.choices.map((choice) => choice.wordId),
    ["panda", "lapin", "moto"],
  );

  const stillLocked = sentierReducer(state, { type: "ENABLE_CHOICES" });
  assert.equal(stillLocked.phase, "reward");
  assert.equal(stillLocked.gems, 0);

  state = sentierReducer(state, { type: "START_REWARD_COLLECTION" });
  assert.equal(state.phase, "reward-collecting");
  assert.equal(
    sentierReducer(state, { type: "START_REWARD_COLLECTION" }),
    state,
  );

  state = sentierReducer(state, { type: "GEM_ARRIVED" });
  assert.equal(state.gems, 1);
  assert.equal(state.pendingGems, 0);
  state = sentierReducer(state, { type: "FINISH_REWARD" });
  assert.equal(state.phase, "presenting");
  state = sentierReducer(state, { type: "ENABLE_CHOICES" });
  assert.equal(state.phase, "choosing");
});

test("deux gemmes sont comptées uniquement à leur arrivée", () => {
  let state = sentierReducer(createInitialSentierState(), {
    type: "PRESENT_QUESTION",
    questionIndex: 1,
    choices: seeds(["panda", "lapin", "moto"]),
    rewardGems: 2,
    random: () => 0.99,
  });

  state = sentierReducer(state, { type: "START_REWARD_COLLECTION" });
  state = sentierReducer(state, { type: "GEM_ARRIVED" });
  assert.equal(state.gems, 1);
  assert.equal(state.pendingGems, 1);
  assert.equal(sentierReducer(state, { type: "FINISH_REWARD" }), state);

  state = sentierReducer(state, { type: "GEM_ARRIVED" });
  assert.equal(state.gems, 2);
  assert.equal(state.pendingGems, 0);
  assert.equal(sentierReducer(state, { type: "GEM_ARRIVED" }), state);
});

test("une récompense nulle ignore la motte et permet de poursuivre", () => {
  let state = sentierReducer(createInitialSentierState(), {
    type: "PRESENT_QUESTION",
    questionIndex: 2,
    choices: seeds(["chaton", "lapin", "moto"]),
    rewardGems: 0,
    random: () => 0.99,
  });

  assert.equal(state.phase, "reward");
  assert.equal(state.pendingGems, 0);
  assert.equal(sentierReducer(state, { type: "START_REWARD_COLLECTION" }), state);
  state = sentierReducer(state, { type: "FINISH_REWARD" });
  state = sentierReducer(state, { type: "ENABLE_CHOICES" });
  assert.equal(state.phase, "choosing");
});

test("le trésor impose les deux clics et collecte huit gemmes avant le résultat", () => {
  let state = sentierReducer(createInitialSentierState(), {
    type: "PRESENT_QUESTION",
    questionIndex: 7,
    choices: seeds(["maison", "melon", "panda"]),
    random: () => 0.99,
  });
  state = sentierReducer(state, { type: "ENABLE_CHOICES" });
  state = sentierReducer(state, { type: "SELECT", wordId: "maison" });
  state = sentierReducer(state, { type: "ARRIVE_CORRECT" });

  assert.equal(state.phase, "reward");
  assert.equal(state.rewardCompletesLevel, true);
  assert.equal(sentierReducer(state, { type: "START_DESTINATION" }), state);

  state = sentierReducer(state, { type: "START_REWARD_COLLECTION" });
  state = sentierReducer(state, { type: "GEM_ARRIVED" });
  state = sentierReducer(state, { type: "GEM_ARRIVED" });
  assert.equal(state.gems, 2);

  state = sentierReducer(state, { type: "START_DESTINATION" });
  assert.equal(state.phase, "destination-travelling");
  assert.equal(state.destinationReached, true);
  assert.equal(sentierReducer(state, { type: "DIG_TREASURE" }), state);

  state = sentierReducer(state, { type: "ARRIVE_DESTINATION" });
  assert.equal(state.phase, "treasure-buried");
  assert.equal(sentierReducer(state, { type: "OPEN_TREASURE" }), state);

  state = sentierReducer(state, { type: "DIG_TREASURE" });
  assert.equal(state.phase, "treasure-revealed");
  assert.equal(sentierReducer(state, { type: "DIG_TREASURE" }), state);

  state = sentierReducer(state, { type: "OPEN_TREASURE" });
  assert.equal(state.phase, "treasure-collecting");
  assert.equal(state.pendingGems, TREASURE_BONUS_GEMS);
  assert.equal(sentierReducer(state, { type: "SHOW_RESULT" }), state);

  for (let index = 0; index < TREASURE_BONUS_GEMS; index += 1) {
    state = sentierReducer(state, { type: "GEM_ARRIVED" });
  }

  assert.equal(state.gems, 10);
  assert.equal(state.pendingGems, 0);
  state = sentierReducer(state, { type: "SHOW_RESULT" });
  assert.equal(state.phase, "result");
});

test("deux erreurs conduisent au demi-tour et bloquent les doubles actions", () => {
  let state = sentierReducer(createInitialSentierState(), {
    type: "PRESENT_QUESTION",
    questionIndex: 0,
    choices: seeds(["moto", "melon", "maison"]),
    random: () => 0.99,
  });
  state = sentierReducer(state, { type: "ENABLE_CHOICES" });
  state = sentierReducer(state, { type: "SELECT", wordId: "melon" });
  const locked = sentierReducer(state, { type: "SELECT", wordId: "maison" });
  assert.equal(locked.selectedWordId, "melon");

  state = sentierReducer(state, { type: "ARRIVE_WRONG", random: () => 0.99 });
  assert.equal(state.phase, "wrong-feedback");
  state = { ...state, phase: "choosing" };
  state = sentierReducer(state, { type: "SELECT", wordId: "maison" });
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

test("la normalisation accepte 24 gemmes et borne les anciens scores", () => {
  const progress = readSentierProgress(
    createStorage(
      JSON.stringify({
        version: 1,
        completedLevels: [1],
        bestGemsByLevel: { "1": 99 },
        sessions: 1,
      }),
    ),
    1,
  );

  assert.equal(progress.bestGemsByLevel["1"], 24);
});

test("une sauvegarde corrompue est ignorée", () => {
  assert.deepEqual(
    readSentierProgress(createStorage("{cassé"), 1),
    createInitialSentierProgress(),
  );
});

test("les préréglages de carte couvrent les principales progressions", () => {
  const newcomer = createSentierMapTestState("preset=new", 12);
  const middle = createSentierMapTestState("preset=middle", 12);
  const unlocking = createSentierMapTestState("preset=unlock", 12);
  const final = createSentierMapTestState("preset=final", 12);
  const complete = createSentierMapTestState("preset=complete", 12);

  assert.deepEqual(newcomer?.progress.completedLevels, []);
  assert.equal(newcomer?.progress.unlockedLevel, 1);
  assert.deepEqual(middle?.progress.completedLevels, [1, 2, 3, 4, 5]);
  assert.equal(middle?.progress.unlockedLevel, 6);
  assert.equal(unlocking?.newlyUnlockedLevel, 6);
  assert.equal(final?.progress.unlockedLevel, 12);
  assert.equal(final?.progress.completedLevels.length, 11);
  assert.equal(complete?.progress.completedLevels.length, 12);
  assert.equal(Object.values(complete?.progress.bestGemsByLevel ?? {}).reduce((sum, score) => sum + score, 0), 288);
});

test("la carte de test accepte une progression personnalisée", () => {
  const custom = createSentierMapTestState(
    "completed=1-3,5&unlocked=7&score=14&new=7",
    12,
  );

  assert.deepEqual(custom?.progress.completedLevels, [1, 2, 3, 5]);
  assert.equal(custom?.progress.unlockedLevel, 7);
  assert.equal(custom?.progress.bestGemsByLevel["5"], 14);
  assert.equal(custom?.newlyUnlockedLevel, 7);
});

test("la carte de jungle définit quatre planches et douze étapes valides", () => {
  assert.equal(SENTIER_MAP_PANELS.length, 4);
  assert.equal(SENTIER_MAP_STAGES.length, 12);
  assert.deepEqual(SENTIER_MAP_STAGES.map((stage) => stage.level), Array.from({ length: 12 }, (_, index) => index + 1));
  assert.ok(SENTIER_MAP_STAGES.every((stage) => stage.panel >= 0 && stage.panel < 4 && stage.x > 0 && stage.x < 100 && stage.y > 0 && stage.y < 100));
});

test("les douze niveaux Sentier respectent les casses et nombres de choix", () => {
  const expectedCounts = [3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5];
  assert.equal(sentierLessons.length, 12);
  sentierLessons.forEach((lesson, index) => {
    assert.equal(lesson.level, index + 1);
    assert.equal(lesson.questions.length, 8);
    for (const question of lesson.questions) {
      assert.equal(question.choiceWordIds.length, expectedCounts[index]);
      assert.equal(question.choiceWordIds.filter((wordId) => wordId === question.targetWordId).length, 1);
      if (index < 4) assert.equal(question.displayCase, "uppercase");
      if (index >= 4 && index < 8) assert.equal(question.displayCase, "lowercase");
      if (index >= 10) assert.equal(new Set(Object.values(question.choiceCases ?? {})).size, 2);
    }
  });
});
