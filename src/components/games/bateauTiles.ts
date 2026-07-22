export type BateauTile = {
  id: string;
  text: string;
};

type TileChallenge = {
  id: string;
  syllables: string[];
  distractors: string[];
};

export function createBateauTiles(challenge: TileChallenge): BateauTile[] {
  return [...challenge.syllables, ...challenge.distractors]
    .map((text, index) => ({ id: `${challenge.id}-${text}-${index}`, text }))
    .sort((left, right) => {
      const comparison = `${challenge.id}-${left.text}-${left.id}`.localeCompare(
        `${challenge.id}-${right.text}-${right.id}`,
      );
      return challenge.id.length % 2 === 0 ? comparison : -comparison;
    });
}
