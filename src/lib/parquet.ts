export type TileKind = "square" | "horizontal" | "vertical" | "single";

export type Tile = {
  id: number;
  kind: TileKind;
  row: number;
  col: number;
  height: number;
  width: number;
};

const SIZE = 4;

const SHAPES: Record<TileKind, { height: number; width: number }> = {
  square: { height: 2, width: 2 },
  horizontal: { height: 1, width: 2 },
  vertical: { height: 2, width: 1 },
  single: { height: 1, width: 1 },
};

/** Cells occupied by a tile. */
function cellsOf(tile: Tile): number[] {
  const cells: number[] = [];
  for (let r = tile.row; r < tile.row + tile.height; r++) {
    for (let c = tile.col; c < tile.col + tile.width; c++) {
      cells.push(r * SIZE + c);
    }
  }
  return cells;
}

/** True when any cell of a is orthogonally adjacent to any cell of b. */
function touches(a: Tile, b: Tile): boolean {
  const bCells = new Set(cellsOf(b));
  for (const cell of cellsOf(a)) {
    const r = Math.floor(cell / SIZE);
    const c = cell % SIZE;
    const neighbours: Array<[number, number]> = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];
    for (const [nr, nc] of neighbours) {
      if (nr < 0 || nc < 0 || nr >= SIZE || nc >= SIZE) continue;
      if (bCells.has(nr * SIZE + nc)) return true;
    }
  }
  return false;
}

function valid(tiles: Tile[]): boolean {
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      const a = tiles[i]!;
      const b = tiles[j]!;
      if (!touches(a, b)) continue;
      // (ii) no 1x2 touches any 2x1
      const pair = [a.kind, b.kind];
      if (pair.includes("horizontal") && pair.includes("vertical")) return false;
      // (iii) no 1x1 touches another 1x1
      if (a.kind === "single" && b.kind === "single") return false;
    }
  }
  return true;
}

/** All layouts: centred 2x2 plus 2 horizontal, 2 vertical and 4 single tiles. */
export function allLayouts(): Tile[][] {
  const centre: Tile = { id: 0, kind: "square", row: 1, col: 1, height: 2, width: 2 };
  const occupied = new Set(cellsOf(centre));
  const solutions: Tile[][] = [];
  let nextId = 1;

  const remaining: Record<Exclude<TileKind, "square">, number> = {
    horizontal: 2,
    vertical: 2,
    single: 4,
  };

  const placed: Tile[] = [centre];

  const fits = (kind: TileKind, row: number, col: number) => {
    const { height, width } = SHAPES[kind];
    if (row + height > SIZE || col + width > SIZE) return false;
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (occupied.has(r * SIZE + c)) return false;
      }
    }
    return true;
  };

  const step = () => {
    let target = -1;
    for (let cell = 0; cell < SIZE * SIZE; cell++) {
      if (!occupied.has(cell)) {
        target = cell;
        break;
      }
    }
    if (target === -1) {
      if (valid(placed)) solutions.push(placed.map((t) => ({ ...t })));
      return;
    }
    const row = Math.floor(target / SIZE);
    const col = target % SIZE;

    for (const kind of ["horizontal", "vertical", "single"] as const) {
      if (remaining[kind] === 0) continue;
      if (!fits(kind, row, col)) continue;
      const { height, width } = SHAPES[kind];
      const tile: Tile = { id: nextId++, kind, row, col, height, width };
      const cells = cellsOf(tile);
      cells.forEach((c) => occupied.add(c));
      remaining[kind]--;
      placed.push(tile);

      step();

      placed.pop();
      remaining[kind]++;
      cells.forEach((c) => occupied.delete(c));
    }
  };

  step();
  return solutions;
}

const LAYOUTS = allLayouts();

export const layoutCount = LAYOUTS.length;

export function randomLayout(previous?: Tile[]): Tile[] {
  if (LAYOUTS.length === 0) return [];
  if (LAYOUTS.length === 1 || !previous) {
    return LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)]!;
  }
  const key = (tiles: Tile[]) =>
    tiles.map((t) => `${t.kind}${t.row}${t.col}`).sort().join("|");
  const prevKey = key(previous);
  let candidate = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)]!;
  let guard = 0;
  while (key(candidate) === prevKey && guard++ < 20) {
    candidate = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)]!;
  }
  return candidate;
}

export const GRID_SIZE = SIZE;
