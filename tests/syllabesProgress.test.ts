import assert from "node:assert/strict";
import test from "node:test";
import {
  completeSyllabesLevel,
  createInitialProgress,
  readSyllabesProgress,
} from "../src/components/games/syllabes/syllabesProgress.ts";
import { createSyllabesTiles } from "../src/components/games/syllabes/syllabesTiles.ts";

const firstLevelWords = ["chaton", "bateau", "moto", "lapin", "melon", "tapis", "panda", "maison"];

test("la progression initiale ouvre seulement le niveau 1", () => {
  const progress = createInitialProgress();
  assert.equal(progress.unlockedLevel, 1);
  assert.deepEqual(progress.completedLevels, []);
  assert.equal(progress.totalTreasures, 0);
});

test("terminer le niveau frontière débloque exactement le suivant", () => {
  const progress = completeSyllabesLevel(createInitialProgress(), 1, 5, firstLevelWords, 6);
  assert.equal(progress.unlockedLevel, 2);
  assert.deepEqual(progress.completedLevels, [1]);
  assert.equal(progress.totalTreasures, 5);
});

test("rejouer conserve la frontière et le meilleur score", () => {
  const first = completeSyllabesLevel(createInitialProgress(), 1, 5, firstLevelWords, 6);
  const replay = completeSyllabesLevel(first, 1, 3, firstLevelWords, 6);
  assert.equal(replay.unlockedLevel, 2);
  assert.equal(replay.bestTreasuresByLevel["1"], 5);
  assert.equal(replay.totalTreasures, 8);
  assert.equal(replay.sessions, 2);
});

test("terminer le dernier niveau n’invente pas un niveau 7", () => {
  const before = { ...createInitialProgress(), unlockedLevel: 6, completedLevels: [1, 2, 3, 4, 5] };
  const after = completeSyllabesLevel(before, 6, 9, ["macaroni"], 6);
  assert.equal(after.unlockedLevel, 6);
  assert.deepEqual(after.completedLevels, [1, 2, 3, 4, 5, 6]);
});

test("une sauvegarde corrompue revient à la progression initiale", () => {
  const storage = {
    getItem: () => "{not-json",
    setItem: () => undefined,
  } as unknown as Storage;
  assert.deepEqual(readSyllabesProgress(storage, 6), createInitialProgress());
});

test("les deux tuiles po d’hippopotame restent sélectionnables séparément", () => {
  const tiles = createSyllabesTiles({
    id: "hippopotame",
    syllables: ["hip", "po", "po", "tame"],
    distractors: ["pi", "peau", "pote"],
  });
  const poTiles = tiles.filter((tile) => tile.text === "po");

  assert.equal(tiles.length, 7);
  assert.equal(poTiles.length, 2);
  assert.notEqual(poTiles[0]?.id, poTiles[1]?.id);
});
