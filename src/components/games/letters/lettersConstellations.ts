export type ConstellationPoint = {
  x: number;
  y: number;
};

export type ConstellationConnection = readonly [number, number];

export type ConstellationDefinition = {
  id: string;
  points: readonly ConstellationPoint[];
  connections: readonly ConstellationConnection[];
};

const sequentialConnections = Array.from(
  { length: 7 },
  (_, index) => [index, index + 1] as const,
);

export const LETTERS_CONSTELLATIONS: readonly ConstellationDefinition[] = [
  {
    id: "sillage",
    points: [
      { x: 15, y: 66 },
      { x: 28, y: 39 },
      { x: 42, y: 58 },
      { x: 54, y: 25 },
      { x: 67, y: 45 },
      { x: 79, y: 20 },
      { x: 87, y: 54 },
      { x: 72, y: 72 },
    ],
    connections: sequentialConnections,
  },
  {
    id: "horizon",
    points: [
      { x: 13, y: 30 },
      { x: 30, y: 19 },
      { x: 47, y: 34 },
      { x: 68, y: 18 },
      { x: 88, y: 35 },
      { x: 73, y: 58 },
      { x: 49, y: 70 },
      { x: 25, y: 57 },
    ],
    connections: sequentialConnections,
  },
  {
    id: "spirale",
    points: [
      { x: 16, y: 57 },
      { x: 27, y: 29 },
      { x: 52, y: 17 },
      { x: 78, y: 29 },
      { x: 87, y: 56 },
      { x: 66, y: 73 },
      { x: 42, y: 65 },
      { x: 48, y: 43 },
    ],
    connections: sequentialConnections,
  },
  {
    id: "eclat",
    points: [
      { x: 50, y: 12 },
      { x: 58, y: 36 },
      { x: 84, y: 31 },
      { x: 68, y: 50 },
      { x: 84, y: 72 },
      { x: 54, y: 62 },
      { x: 31, y: 77 },
      { x: 38, y: 47 },
    ],
    connections: sequentialConnections,
  },
  {
    id: "passage",
    points: [
      { x: 13, y: 54 },
      { x: 28, y: 24 },
      { x: 47, y: 44 },
      { x: 64, y: 18 },
      { x: 88, y: 30 },
      { x: 76, y: 62 },
      { x: 52, y: 71 },
      { x: 29, y: 64 },
    ],
    connections: sequentialConnections,
  },
  {
    id: "couronne",
    points: [
      { x: 15, y: 48 },
      { x: 27, y: 22 },
      { x: 48, y: 35 },
      { x: 67, y: 17 },
      { x: 87, y: 43 },
      { x: 70, y: 68 },
      { x: 45, y: 74 },
      { x: 25, y: 65 },
    ],
    connections: [
      ...sequentialConnections,
      [7, 0],
      [2, 6],
    ],
  },
  {
    id: "arche",
    points: [
      { x: 13, y: 68 },
      { x: 19, y: 39 },
      { x: 34, y: 18 },
      { x: 52, y: 12 },
      { x: 70, y: 20 },
      { x: 84, y: 42 },
      { x: 88, y: 69 },
      { x: 51, y: 55 },
    ],
    connections: [...sequentialConnections, [7, 3]],
  },
  {
    id: "ruban",
    points: [
      { x: 12, y: 27 },
      { x: 31, y: 17 },
      { x: 49, y: 31 },
      { x: 69, y: 19 },
      { x: 88, y: 34 },
      { x: 71, y: 51 },
      { x: 48, y: 69 },
      { x: 24, y: 61 },
    ],
    connections: [...sequentialConnections, [2, 6]],
  },
  {
    id: "orbite",
    points: [
      { x: 16, y: 43 },
      { x: 27, y: 20 },
      { x: 52, y: 13 },
      { x: 77, y: 24 },
      { x: 87, y: 49 },
      { x: 70, y: 70 },
      { x: 43, y: 74 },
      { x: 29, y: 50 },
    ],
    connections: [...sequentialConnections, [7, 0], [1, 5]],
  },
  {
    id: "prisme",
    points: [
      { x: 50, y: 10 },
      { x: 83, y: 31 },
      { x: 72, y: 69 },
      { x: 29, y: 70 },
      { x: 16, y: 31 },
      { x: 50, y: 31 },
      { x: 62, y: 54 },
      { x: 39, y: 54 },
    ],
    connections: [...sequentialConnections, [4, 0], [5, 7], [7, 3]],
  },
  {
    id: "tourbillon",
    points: [
      { x: 14, y: 53 },
      { x: 23, y: 27 },
      { x: 47, y: 14 },
      { x: 75, y: 23 },
      { x: 88, y: 49 },
      { x: 69, y: 73 },
      { x: 42, y: 67 },
      { x: 51, y: 42 },
    ],
    connections: sequentialConnections,
  },
  {
    id: "aurore",
    points: [
      { x: 12, y: 65 },
      { x: 27, y: 40 },
      { x: 42, y: 58 },
      { x: 51, y: 17 },
      { x: 61, y: 58 },
      { x: 76, y: 39 },
      { x: 89, y: 65 },
      { x: 51, y: 75 },
    ],
    connections: [
      [0, 1],
      [1, 3],
      [3, 5],
      [5, 6],
      [1, 2],
      [2, 7],
      [7, 4],
      [4, 5],
    ],
  },
] as const;

export function getLettersConstellation(level: number) {
  return LETTERS_CONSTELLATIONS[level - 1] ?? LETTERS_CONSTELLATIONS[0];
}
