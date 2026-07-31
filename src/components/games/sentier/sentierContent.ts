import type { LessonBase, WordReference } from "../../../content/types";

export type SentierDisplayCase = "uppercase" | "lowercase";
export type SentierRegionId = "lisiere" | "eaux" | "profondeurs" | "ruines";

export type SentierQuestion = {
  id: string;
  targetWordId: string;
  choiceWordIds: string[];
  displayCase: SentierDisplayCase;
  choiceCases?: Partial<Record<string, SentierDisplayCase>>;
};

export type SentierLesson = LessonBase & {
  regionId: SentierRegionId;
  questions: SentierQuestion[];
};

export type SentierChoiceSeed = {
  wordId: string;
  displayWord: string;
  displayCase: SentierDisplayCase;
};

export function formatSentierWord(word: string, displayCase: SentierDisplayCase) {
  return displayCase === "uppercase"
    ? word.toLocaleUpperCase("fr-FR")
    : word.toLocaleLowerCase("fr-FR");
}

export function buildSentierChoiceSeeds(
  question: SentierQuestion,
  wordById: ReadonlyMap<string, WordReference>,
): SentierChoiceSeed[] {
  const choices = question.choiceWordIds.map((wordId) => {
    const entry = wordById.get(wordId);

    if (!entry) {
      throw new Error(`${question.id}: mot inconnu dans les choix : ${wordId}`);
    }

    const displayCase = question.choiceCases?.[wordId] ?? question.displayCase;
    return { wordId, displayWord: formatSentierWord(entry.displayWord, displayCase), displayCase };
  });

  if (!choices.some((choice) => choice.wordId === question.targetWordId)) {
    throw new Error(`${question.id}: la bonne réponse ${question.targetWordId} est absente des choix`);
  }

  return choices;
}
