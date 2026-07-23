import assert from "node:assert/strict";
import test from "node:test";
import {
  HOME_LAST_GAME_STORAGE_KEY,
  readResumeState,
  recommendHomeGame,
  rememberLastGame,
  shouldResumeFromUrl,
} from "../src/components/home/onboardingState.ts";

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } as unknown as Storage;
}

test("chaque âge conserve la recommandation liée à la compétence", () => {
  for (const age of ["5", "6", "7", "other"] as const) {
    assert.equal(recommendHomeGame("discovering-letters", age), "letters");
    assert.equal(recommendHomeGame("knows-letters", age), "bateau");
    assert.equal(recommendHomeGame("reads-syllables", age), "bateau");
    assert.equal(recommendHomeGame("reads-words", age), "sentier");
  }
});

test("un nouveau visiteur n’a aucune aventure à reprendre", () => {
  assert.deepEqual(readResumeState(createStorage()), {
    progressGames: [],
    resumeGames: [],
    lastGame: null,
  });
});

test("une seule sauvegarde propose directement le jeu correspondant", () => {
  const storage = createStorage({
    "readingo:lettres:v1": JSON.stringify({ sessions: 1, completedLevels: [1] }),
  });

  assert.deepEqual(readResumeState(storage).resumeGames, ["letters"]);
});

test("deux anciennes sauvegardes sans récence proposent les deux jeux", () => {
  const storage = createStorage({
    "readingo:lettres:v1": JSON.stringify({ sessions: 1 }),
    "readingo:bateau:v2": JSON.stringify({ sessions: 2, completedWords: ["bateau"] }),
  });

  assert.deepEqual(readResumeState(storage).resumeGames, ["letters", "bateau"]);
});

test("une progression du Sentier permet de reprendre la jungle", () => {
  const storage = createStorage({
    "readingo:sentier-des-mots:v1": JSON.stringify({
      sessions: 1,
      completedLevels: [1],
      bestGemsByLevel: { "1": 12 },
    }),
  });

  assert.deepEqual(readResumeState(storage).resumeGames, ["sentier"]);
});

test("le dernier jeu valide devient l’action de reprise principale", () => {
  const storage = createStorage({
    "readingo:lettres:v1": JSON.stringify({ sessions: 1 }),
    "readingo:bateau:v3": JSON.stringify({ sessions: 2, unlockedLevel: 2 }),
    [HOME_LAST_GAME_STORAGE_KEY]: JSON.stringify({ gameId: "bateau", updatedAt: 42 }),
  });

  assert.deepEqual(readResumeState(storage).resumeGames, ["bateau"]);
  assert.equal(readResumeState(storage).lastGame, "bateau");
});

test("une sauvegarde corrompue est ignorée", () => {
  const storage = createStorage({
    "readingo:lettres:v1": "{cassé",
    [HOME_LAST_GAME_STORAGE_KEY]: "{cassé",
  });

  assert.deepEqual(readResumeState(storage).resumeGames, []);
});

test("la dernière aventure est enregistrée sans modifier la progression", () => {
  const storage = createStorage();
  rememberLastGame(storage, "letters", 123);

  assert.deepEqual(JSON.parse(storage.getItem(HOME_LAST_GAME_STORAGE_KEY) ?? ""), {
    gameId: "letters",
    updatedAt: 123,
  });
});

test("le paramètre de reprise est explicite", () => {
  assert.equal(shouldResumeFromUrl("?reprendre=1"), true);
  assert.equal(shouldResumeFromUrl("?niveau=2"), false);
});
