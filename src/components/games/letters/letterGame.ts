import type { LessonBase } from "../../../content/types.ts";

export type LetterDisplayCase = "uppercase" | "lowercase";

export type LetterEntry = {
  id: string;
  uppercase: string;
  lowercase: string;
  nameText: string;
  nameSpeechText: string;
  nameAudio: string;
  soundText: string;
  anchorWordId: string;
  promptText: string;
  promptSpeechText: string;
  promptAudio: string;
};

export type LetterQuestion = {
  id: string;
  targetLetterId: string;
  choiceLetterIds: string[];
  displayCase: LetterDisplayCase;
};

export type LetterLesson = LessonBase & {
  questions: LetterQuestion[];
};

export function shuffleLetterIds(letterIds: string[], random: () => number = Math.random) {
  const shuffled = [...letterIds];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

export function isTargetCharacter(character: string, target: LetterEntry) {
  return character.localeCompare(target.lowercase, "fr", { sensitivity: "base" }) === 0;
}
