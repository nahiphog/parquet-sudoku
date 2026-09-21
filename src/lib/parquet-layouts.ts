import { GRID_SIZE, allLayouts } from "@/lib/parquet";

/** A tile described by the grid cells it occupies inside its own 4x4 section. */
export type CellTile = { cells: Array<[number, number]> };

export type PuzzleVersion = "v1" | "v2";

export const VERSIONS: Array<{ id: PuzzleVersion; label: string }> = [
  { id: "v1", label: "Version 1" },
  { id: "v2", label: "Version 2" },
];

/** Version 2: two L-shaped tiles, one 2x2 tile and six 1x1 tiles. */
const V2_PATTERN = [
  [1, 1, 2, 3],
  [1, 4, 4, 5],
  [6, 4, 4, 7],
  [8, 9, 7, 7],
];

function patternToTiles(pattern: number[][]): CellTile[] {
  const groups = new Map<number, Array<[number, number]>>();
  pattern.forEach((row, rowIndex) => {
    row.forEach((id, colIndex) => {
      const cells = groups.get(id) ?? [];
      cells.push([rowIndex, colIndex]);
      groups.set(id, cells);
    });
  });
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, cells]) => ({ cells }));
}

const V1_LAYOUTS: CellTile[][] = allLayouts().map((tiles) =>
  tiles.map((tile) => {
    const cells: Array<[number, number]> = [];
    for (let row = tile.row; row < tile.row + tile.height; row += 1) {
      for (let col = tile.col; col < tile.col + tile.width; col += 1) {
        cells.push([row, col]);
      }
    }
    return { cells };
  }),
);

const V2_LAYOUTS: CellTile[][] = [patternToTiles(V2_PATTERN)];

export function layoutsFor(version: PuzzleVersion): CellTile[][] {
  return version === "v1" ? V1_LAYOUTS : V2_LAYOUTS;
}

/** Section pattern known to admit complete 1-9 fillings for each version. */
const SECTION_PATTERN: Record<PuzzleVersion, number[]> = {
  v1: [1, 1, 1, 0, 0, 0, 0, 0, 0],
  v2: [0, 0, 0, 0, 0, 0, 0, 0, 0],
};

/** The nine 4x4 sections of a combined grid. */
export function boardsFor(version: PuzzleVersion): CellTile[][] {
  const layouts = layoutsFor(version);
  return (SECTION_PATTERN[version] ?? []).map((index) => layouts[index] ?? []);
}

export type PlacedTile = {
  /** Cells in combined 12x12 coordinates. */
  cells: Array<[number, number]>;
  boardIndex: number;
};

export function placeBoards(boards: CellTile[][]): PlacedTile[] {
  return boards.flatMap((board, boardIndex) => {
    const rowOffset = Math.floor(boardIndex / 3) * GRID_SIZE;
    const colOffset = (boardIndex % 3) * GRID_SIZE;
    return board.map((tile) => ({
      boardIndex,
      cells: tile.cells.map(
        ([row, col]) => [row + rowOffset, col + colOffset] as [number, number],
      ),
    }));
  });
}

export const COMBINED_SIZE = GRID_SIZE * 3;
