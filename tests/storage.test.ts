import assert from "node:assert/strict";
import test from "node:test";
import {
  readStoredJson,
  writeStoredJson,
} from "../src/utils/storage.ts";

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

test("readStoredJson lit une valeur JSON valide", () => {
  const storage = createStorage({
    progress: JSON.stringify({ sessions: 2 }),
  });

  assert.deepEqual(
    readStoredJson<{ sessions: number }>(storage, "progress"),
    { sessions: 2 },
  );
});

test("readStoredJson renvoie null si la valeur manque ou est corrompue", () => {
  const storage = createStorage({ broken: "{not-json" });

  assert.equal(readStoredJson(storage, "missing"), null);
  assert.equal(readStoredJson(storage, "broken"), null);
  assert.equal(readStoredJson(null, "progress"), null);
});

test("readStoredJson tolère un stockage indisponible", () => {
  const storage = {
    getItem: () => {
      throw new Error("blocked");
    },
  };

  assert.equal(readStoredJson(storage, "progress"), null);
});

test("writeStoredJson écrit une valeur sérialisée", () => {
  const storage = createStorage();

  assert.equal(writeStoredJson(storage, "progress", { sessions: 3 }), true);
  assert.equal(storage.getItem("progress"), '{"sessions":3}');
});

test("writeStoredJson reste non bloquant si l’écriture échoue", () => {
  const storage = {
    setItem: () => {
      throw new Error("full");
    },
  };
  const cyclic: { self?: unknown } = {};
  cyclic.self = cyclic;

  assert.equal(writeStoredJson(storage, "progress", { sessions: 3 }), false);
  assert.equal(writeStoredJson(createStorage(), "progress", cyclic), false);
  assert.equal(writeStoredJson(null, "progress", { sessions: 3 }), false);
});
