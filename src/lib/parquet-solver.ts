import { GRID_SIZE, type Tile } from "@/lib/parquet";
import type { PlacedTile } from "@/lib/parquet-layouts";

const DIGIT_MASK = 0x1ff;

export type PuzzleModel = {
  peers: number[][];
  groups: PuzzleGroup[];
  tileGroups: number[][];
};

export type PuzzleGroup = {
  kind: "row" | "column" | "region";
  index: number;
  tiles: number[];
  label: string;
};

export function buildPuzzleModel(boards: Tile[][]): PuzzleModel {
  const rowGroups = Array.from({ length: GRID_SIZE * 3 }, () => [] as number[]);
  const colGroups = Array.from({ length: GRID_SIZE * 3 }, () => [] as number[]);
  const regionGroups = Array.from({ length: 9 }, () => [] as number[]);
  let tileIndex = 0;

  boards.forEach((board, boardIndex) => {
    const boardRow = Math.floor(boardIndex / 3);
    const boardCol = boardIndex % 3;
    board.forEach((tile) => {
      for (let row = tile.row; row < tile.row + tile.height; row += 1) {
        rowGroups[boardRow * GRID_SIZE + row]?.push(tileIndex);
      }
      for (let col = tile.col; col < tile.col + tile.width; col += 1) {
        colGroups[boardCol * GRID_SIZE + col]?.push(tileIndex);
      }
      regionGroups[boardIndex]?.push(tileIndex);
      tileIndex += 1;
    });
  });

  const peerSets = Array.from({ length: tileIndex }, () => new Set<number>());
  for (const group of [...rowGroups, ...colGroups, ...regionGroups]) {
    for (const index of group) {
      for (const peer of group) {
        if (peer !== index) peerSets[index]?.add(peer);
      }
    }
  }

  const groups: PuzzleGroup[] = [
    ...rowGroups.map((tiles, index) => ({ kind: "row" as const, index, tiles, label: `row ${index + 1}` })),
    ...colGroups.map((tiles, index) => ({ kind: "column" as const, index, tiles, label: `column ${index + 1}` })),
    ...regionGroups.map((tiles, index) => ({ kind: "region" as const, index, tiles, label: `region ${index + 1}` })),
  ];
  const tileGroups = Array.from({ length: tileIndex }, () => [] as number[]);
  groups.forEach((group, groupIndex) => group.tiles.forEach((index) => tileGroups[index]?.push(groupIndex)));
  return { peers: peerSets.map((peers) => [...peers]), groups, tileGroups };
}

function bitCount(value: number): number {
  let count = 0;
  let bits = value;
  while (bits) {
    bits &= bits - 1;
    count += 1;
  }
  return count;
}

export function countSolutions(values: number[], model: PuzzleModel, limit = 2): number {
  const working = [...values];
  let solutions = 0;

  const search = () => {
    if (solutions >= limit) return;
    let selected = -1;
    let selectedMask = 0;
    let fewest = 10;

    for (let index = 0; index < working.length; index += 1) {
      if (working[index] !== 0) continue;
      let used = 0;
      for (const peer of model.peers[index] ?? []) {
        const value = working[peer] ?? 0;
        if (value > 0) used |= 1 << (value - 1);
      }
      const mask = DIGIT_MASK & ~used;
      const count = bitCount(mask);
      if (count === 0) return;
      if (count < fewest) {
        selected = index;
        selectedMask = mask;
        fewest = count;
        if (count === 1) break;
      }
    }

    if (selected === -1) {
      solutions += 1;
      return;
    }

    let choices = selectedMask;
    while (choices && solutions < limit) {
      const bit = choices & -choices;
      working[selected] = 32 - Math.clz32(bit);
      search();
      working[selected] = 0;
      choices ^= bit;
    }
  };

  for (let index = 0; index < working.length; index += 1) {
    const value = working[index] ?? 0;
    if (value === 0) continue;
    for (const peer of model.peers[index] ?? []) {
      if (peer < index && working[peer] === value) return 0;
    }
  }

  search();
  return solutions;
}

export async function digPuzzle(
  solution: number[],
  model: PuzzleModel,
  isCurrent: () => boolean,
): Promise<number[]> {
  const puzzle = [...solution];
  const order = Array.from({ length: puzzle.length }, (_, index) => index);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = order[index];
    const replacement = order[swapIndex];
    if (current === undefined || replacement === undefined) continue;
    order[index] = replacement;
    order[swapIndex] = current;
  }

  for (let attempt = 0; attempt < order.length; attempt += 1) {
    if (!isCurrent()) return puzzle;
    const tileIndex = order[attempt];
    if (tileIndex === undefined) continue;
    const value = puzzle[tileIndex] ?? 0;
    puzzle[tileIndex] = 0;
    if (countSolutions(puzzle, model, 2) !== 1) puzzle[tileIndex] = value;
    if (attempt % 3 === 2) await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  return puzzle;
}

/** Dig only until an exact number of uniquely-solvable givens remains. */
export async function digPuzzleToTarget(
  solution: number[],
  model: PuzzleModel,
  target: number,
  isCurrent: () => boolean,
): Promise<number[] | null> {
  if (target < 1 || target > solution.length) return null;
  const puzzle = [...solution];
  const order = Array.from({ length: puzzle.length }, (_, index) => index);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = order[index];
    const replacement = order[swapIndex];
    if (current === undefined || replacement === undefined) continue;
    order[index] = replacement;
    order[swapIndex] = current;
  }

  let remaining = puzzle.length;
  for (let attempt = 0; attempt < order.length && remaining > target; attempt += 1) {
    if (!isCurrent()) return null;
    const tileIndex = order[attempt];
    if (tileIndex === undefined) continue;
    const value = puzzle[tileIndex] ?? 0;
    puzzle[tileIndex] = 0;
    if (countSolutions(puzzle, model, 2) === 1) remaining -= 1;
    else puzzle[tileIndex] = value;
    if (attempt % 3 === 2) await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  return remaining === target ? puzzle : null;
}

export function hasUniqueSolution(values: number[], model: PuzzleModel): boolean {
  return countSolutions(values, model, 2) === 1;
}

/** Peer groups derived from cell-based tiles already placed in 12x12 coordinates. */
export function buildModelFromPlaced(tiles: PlacedTile[]): PuzzleModel {
  const rowGroups = new Map<number, number[]>();
  const colGroups = new Map<number, number[]>();
  const regionGroups = new Map<number, number[]>();

  const push = (map: Map<number, number[]>, key: number, index: number) => {
    const group = map.get(key) ?? [];
    if (!group.includes(index)) group.push(index);
    map.set(key, group);
  };

  tiles.forEach((tile, index) => {
    for (const [row, col] of tile.cells) {
      push(rowGroups, row, index);
      push(colGroups, col, index);
    }
    push(regionGroups, tile.boardIndex, index);
  });

  const peerSets = Array.from({ length: tiles.length }, () => new Set<number>());
  for (const group of [...rowGroups.values(), ...colGroups.values(), ...regionGroups.values()]) {
    for (const index of group) {
      for (const peer of group) {
        if (peer !== index) peerSets[index]?.add(peer);
      }
    }
  }

  const groups: PuzzleGroup[] = [
    ...[...rowGroups.entries()].sort((a, b) => a[0] - b[0]).map(([index, members]) => ({ kind: "row" as const, index, tiles: members, label: `row ${index + 1}` })),
    ...[...colGroups.entries()].sort((a, b) => a[0] - b[0]).map(([index, members]) => ({ kind: "column" as const, index, tiles: members, label: `column ${index + 1}` })),
    ...[...regionGroups.entries()].sort((a, b) => a[0] - b[0]).map(([index, members]) => ({ kind: "region" as const, index, tiles: members, label: `region ${index + 1}` })),
  ];
  const tileGroups = Array.from({ length: tiles.length }, () => [] as number[]);
  groups.forEach((group, groupIndex) => group.tiles.forEach((index) => tileGroups[index]?.push(groupIndex)));
  return { peers: peerSets.map((peers) => [...peers]), groups, tileGroups };
}

/** A random complete assignment of 1-9 respecting every peer group, or null. */
export function randomSolution(model: PuzzleModel): number[] | null {
  const total = model.peers.length;
  const values = new Array<number>(total).fill(0);
  let steps = 0;

  const search = (): boolean => {
    if (steps++ > 400_000) return false;
    let selected = -1;
    let selectedMask = 0;
    let fewest = 10;

    for (let index = 0; index < total; index += 1) {
      if (values[index] !== 0) continue;
      let used = 0;
      for (const peer of model.peers[index] ?? []) {
        const value = values[peer] ?? 0;
        if (value > 0) used |= 1 << (value - 1);
      }
      const mask = DIGIT_MASK & ~used;
      const count = bitCount(mask);
      if (count === 0) return false;
      if (count < fewest) {
        selected = index;
        selectedMask = mask;
        fewest = count;
        if (count === 1) break;
      }
    }

    if (selected === -1) return true;

    const choices: number[] = [];
    let bits = selectedMask;
    while (bits) {
      const bit = bits & -bits;
      choices.push(32 - Math.clz32(bit));
      bits ^= bit;
    }
    for (let i = choices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const a = choices[i];
      const b = choices[j];
      if (a === undefined || b === undefined) continue;
      choices[i] = b;
      choices[j] = a;
    }

    for (const choice of choices) {
      values[selected] = choice;
      if (search()) return true;
      values[selected] = 0;
    }
    return false;
  };

  return search() ? values : null;
}
/** Pencil marks: every digit not ruled out by a given in a peer tile. */
export function snyderMarks(values: number[], model: PuzzleModel, _tiles?: PlacedTile[]): number[][] {
  return values.map((value, index) => {
    if (value) return [];
    let used = 0;
    for (const peer of model.peers[index] ?? []) {
      const v = values[peer] ?? 0;
      if (v > 0) used |= 1 << (v - 1);
    }
    const out: number[] = [];
    for (let d = 1; d <= 9; d += 1) if (!(used & (1 << (d - 1)))) out.push(d);
    return out;
  });
}
