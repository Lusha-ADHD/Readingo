type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;

export function readStoredJson<T>(
  storage: ReadableStorage | null,
  key: string,
): T | null {
  if (!storage) {
    return null;
  }

  try {
    const saved = storage.getItem(key);
    return saved === null ? null : (JSON.parse(saved) as T);
  } catch {
    return null;
  }
}

export function writeStoredJson(
  storage: WritableStorage | null,
  key: string,
  value: unknown,
): boolean {
  if (!storage) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      return false;
    }

    storage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}
