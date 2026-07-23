import assert from "node:assert/strict";
import test from "node:test";
import {
  isTargetCharacter,
  shuffleLetterIds,
} from "../src/components/games/letters/letterGame.ts";
import type { LetterEntry } from "../src/components/games/letters/letterGame.ts";
import {
  completeLettersLevel,
  createInitialLettersProgress,
  readLettersProgress,
} from "../src/components/games/letters/lettersProgress.ts";

const targetA: LetterEntry = {
  id: "a",
  uppercase: "A",
  lowercase: "a",
  nameText: "a",
  nameSpeechText: "a",
  nameAudio: "/assets/audio/fr/letters/names/a.mp3",
  soundText: "/a/",
  anchorWordId: "ananas",
  promptText: "A comme ananas",
  promptSpeechText: "A comme ananas",
  promptAudio: "/assets/audio/fr/letters/prompts/a-ananas.mp3",
};

test("le mélange conserve chaque choix exactement une fois", () => {
  const values = [0.1, 0.8];
  let index = 0;
  const choices = shuffleLetterIds(["a", "m", "l"], () => values[index++] ?? 0);

  assert.deepEqual([...choices].sort(), ["a", "l", "m"]);
  assert.equal(new Set(choices).size, 3);
});

test("la lettre cible est reconnue sans dépendre de la casse", () => {
  assert.equal(isTargetCharacter("A", targetA), true);
  assert.equal(isTargetCharacter("a", targetA), true);
  assert.equal(isTargetCharacter("n", targetA), false);
});

test("la progression initiale ne contient aucune constellation terminée", () => {
  assert.deepEqual(createInitialLettersProgress(), {
    version: 1,
    unlockedLevel: 1,
    completedLevels: [],
    sessions: 0,
  });
});

test("terminer le niveau enregistre une session sans dupliquer le niveau", () => {
  const first = completeLettersLevel(createInitialLettersProgress(), 1, 1);
  const replay = completeLettersLevel(first, 1, 1);

  assert.deepEqual(replay.completedLevels, [1]);
  assert.equal(replay.sessions, 2);
});

test("terminer le niveau frontière débloque le niveau Lettres suivant", () => {
  const progress = completeLettersLevel(
    createInitialLettersProgress(),
    1,
    3,
  );

  assert.equal(progress.unlockedLevel, 2);
  assert.deepEqual(progress.completedLevels, [1]);
});

test("une ancienne sauvegarde Lettres déduit le niveau débloqué", () => {
  const storage = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        completedLevels: [1],
        sessions: 1,
      }),
  } as unknown as Storage;

  assert.equal(readLettersProgress(storage, 3).unlockedLevel, 2);
});

test("une sauvegarde Lettres corrompue ne bloque pas le jeu", () => {
  const storage = {
    getItem: () => "{cassé",
    setItem: () => undefined,
  } as unknown as Storage;

  assert.deepEqual(readLettersProgress(storage, 1), createInitialLettersProgress());
});
