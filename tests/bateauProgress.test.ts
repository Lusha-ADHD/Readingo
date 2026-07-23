import assert from "node:assert/strict";
import test from "node:test";
import {
  completeBateauLevel,
  createInitialProgress,
  migrateLegacyProgress,
  readBateauProgress,
} from "../src/components/games/bateau/bateauProgress.ts";
import { createBateauTiles } from "../src/components/games/bateau/bateauTiles.ts";

const firstLevelWords = ["chaton", "bateau", "moto", "lapin", "melon", "tapis", "panda", "maison"];

test("la progression initiale ouvre seulement le niveau 1", () => {
  const progress = createInitialProgress();
  assert.equal(progress.unlockedLevel, 1);
  assert.deepEqual(progress.completedLevels, []);
  assert.equal(progress.totalTreasures, 0);
});

test("une ancienne partie terminée débloque le niveau 2", () => {
  const progress = migrateLegacyProgress(
    { bestTreasures: 7, sessions: 2, completedWords: firstLevelWords },
    firstLevelWords,
    6,
  );

  assert.equal(progress.unlockedLevel, 2);
  assert.deepEqual(progress.completedLevels, [1]);
  assert.equal(progress.totalTreasures, 7);
  assert.equal(progress.bestTreasuresByLevel["1"], 7);
});

test("terminer le niveau frontière débloque exactement le suivant", () => {
  const progress = completeBateauLevel(createInitialProgress(), 1, 5, firstLevelWords, 6);
  assert.equal(progress.unlockedLevel, 2);
  assert.deepEqual(progress.completedLevels, [1]);
  assert.equal(progress.totalTreasures, 5);
});

test("rejouer conserve la frontière et le meilleur score", () => {
  const first = completeBateauLevel(createInitialProgress(), 1, 5, firstLevelWords, 6);
  const replay = completeBateauLevel(first, 1, 3, firstLevelWords, 6);
  assert.equal(replay.unlockedLevel, 2);
  assert.equal(replay.bestTreasuresByLevel["1"], 5);
  assert.equal(replay.totalTreasures, 8);
  assert.equal(replay.sessions, 2);
});

test("terminer le dernier niveau n’invente pas un niveau 7", () => {
  const before = { ...createInitialProgress(), unlockedLevel: 6, completedLevels: [1, 2, 3, 4, 5] };
  const after = completeBateauLevel(before, 6, 9, ["macaroni"], 6);
  assert.equal(after.unlockedLevel, 6);
  assert.deepEqual(after.completedLevels, [1, 2, 3, 4, 5, 6]);
});

test("une sauvegarde corrompue revient à la progression initiale", () => {
  const storage = {
    getItem: () => "{not-json",
    setItem: () => undefined,
  } as unknown as Storage;
  assert.deepEqual(readBateauProgress(storage, firstLevelWords, 6), createInitialProgress());
});

test("les deux tuiles po d’hippopotame restent sélectionnables séparément", () => {
  const tiles = createBateauTiles({
    id: "hippopotame",
    syllables: ["hip", "po", "po", "tame"],
    distractors: ["pi", "peau", "pote"],
  });
  const poTiles = tiles.filter((tile) => tile.text === "po");

  assert.equal(tiles.length, 7);
  assert.equal(poTiles.length, 2);
  assert.notEqual(poTiles[0]?.id, poTiles[1]?.id);
});
