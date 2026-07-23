import type { GameId } from "./gameCatalog";

export type AudioLine = {
  text: string;
  audio: string;
};

export type VoiceLine = AudioLine & {
  id: string;
};

export type WordEntry = {
  id: string;
  locale: string;
  word: string;
  displayWord: string;
  syllables: string[];
  spokenSyllables?: string[];
  distractors: string[];
  image: string;
  audioWord: string;
  audioSyllables: Partial<Record<string, string>>;
  difficulty: number;
  tags: string[];
};

export type WordReference = Pick<
  WordEntry,
  "id" | "displayWord" | "image" | "audioWord"
>;

export type SyllableEntry = {
  id: string;
  text: string;
  speechText?: string;
  audio: string;
};

export type LessonBase = {
  id: string;
  level: number;
  title: string;
  gameIds: GameId[];
};
