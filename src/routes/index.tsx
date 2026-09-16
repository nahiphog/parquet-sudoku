import { createFileRoute } from "@tanstack/react-router";
import { Info, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GRID_SIZE, allLayouts, layoutCount, type Tile } from "@/lib/parquet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Parquet Sudoku — Random Tile Grid Generator" },
      {
        name: "description",
        content:
          "Generate a 12x12 parquet puzzle made from nine randomized 4x4 tile grids, each following strict placement and no-touch rules.",
      },
      { property: "og:title", content: "Parquet Sudoku — Random Tile Grid Generator" },
      {
        property: "og:description",
        content:
          "Generate nine randomized parquet puzzles together as one seamless 12x12 grid.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const RULES = [
  "The 2×2 tile always sits exactly in the middle.",
  "No 1×2 tile may share an edge with any 2×1 tile.",
  "No two 1×1 tiles may share an edge.",
  "No 1×1 tile may sit in a corner of its 4×4 section.",
];

const BOARD_COUNT = 9;
const COMBINED_SIZE = GRID_SIZE * 3;
const VALID_LAYOUTS = allLayouts();
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

type NumberedTile = Tile & { value: number };

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    const replacement = shuffled[swapIndex];
    if (current === undefined || replacement === undefined) continue;
    shuffled[index] = replacement;
    shuffled[swapIndex] = current;
  }
  return shuffled;
}

function createBoards(randomize = true): Tile[][] {
  if (VALID_LAYOUTS.length === 0) return [];

  // Build each 4×4 section from its own layout choice. Repeating the full set
  // before shuffling guarantees visible variety even though only three valid
  // arrangements exist and nine sections must be filled.
  const candidates = Array.from(
    { length: BOARD_COUNT },
    (_, index) => VALID_LAYOUTS[index % VALID_LAYOUTS.length]!,
  );

  const selected = randomize ? shuffle(candidates) : candidates;
  return selected.map((layout) => layout.map((tile) => ({ ...tile })));
}

function numberBoards(boards: Tile[][], randomize: boolean): NumberedTile[][] | null {
  const flatTiles = boards.flatMap((board, region) => {
    const boardRow = Math.floor(region / 3);
    const boardCol = region % 3;
    return board.map((tile) => ({
      ...tile,
      row: tile.row + boardRow * GRID_SIZE,
      col: tile.col + boardCol * GRID_SIZE,
      region,
    }));
  });

  if (flatTiles.length !== 81) return null;

  const groups: number[][] = [];
  for (let row = 0; row < COMBINED_SIZE; row++) {
    groups.push(
      flatTiles.flatMap((tile, index) =>
        row >= tile.row && row < tile.row + tile.height ? [index] : [],
      ),
    );
  }
  for (let col = 0; col < COMBINED_SIZE; col++) {
    groups.push(
      flatTiles.flatMap((tile, index) =>
        col >= tile.col && col < tile.col + tile.width ? [index] : [],
      ),
    );
  }
  for (let region = 0; region < BOARD_COUNT; region++) {
    groups.push(
      flatTiles.flatMap((tile, index) => (tile.region === region ? [index] : [])),
    );
  }

  if (groups.some((group) => group.length !== DIGITS.length)) return null;

  const peers = flatTiles.map((_, tileIndex) => {
    const related = new Set<number>();
    for (const group of groups) {
      if (!group.includes(tileIndex)) continue;
      for (const peer of group) {
        if (peer !== tileIndex) related.add(peer);
      }
    }
    return [...related];
  });

  const solve = (domains: number[]): number[] | null => {
    let bestIndex = -1;
    let bestCount = 10;
    for (let index = 0; index < domains.length; index++) {
      const count = domains[index]?.toString(2).replaceAll("0", "").length ?? 0;
      if (count === 0) return null;
      if (count > 1 && count < bestCount) {
        bestIndex = index;
        bestCount = count;
      }
    }
    if (bestIndex === -1) return domains;

    const domain = domains[bestIndex] ?? 0;
    const candidates = DIGITS.filter((digit) => domain & (1 << (digit - 1)));
    for (const digit of randomize ? shuffle(candidates) : candidates) {
      const bit = 1 << (digit - 1);
      const next = [...domains];
      next[bestIndex] = bit;
      const queue = [bestIndex];
      let valid = true;

      while (queue.length > 0 && valid) {
        const assigned = queue.pop();
        if (assigned === undefined) break;
        const assignedDomain = next[assigned] ?? 0;
        if ((assignedDomain & (assignedDomain - 1)) !== 0) continue;
        for (const peer of peers[assigned] ?? []) {
          const peerDomain = next[peer] ?? 0;
          if ((peerDomain & assignedDomain) === 0) continue;
          const reduced = peerDomain & ~assignedDomain;
          if (reduced === 0) {
            valid = false;
            break;
          }
          if (reduced !== peerDomain) {
            next[peer] = reduced;
            if ((reduced & (reduced - 1)) === 0) queue.push(peer);
          }
        }
      }

      if (valid) {
        const solved = solve(next);
        if (solved) return solved;
      }
    }
    return null;
  };

  const solved = solve(Array.from({ length: flatTiles.length }, () => 0b111111111));
  if (!solved) return null;

  let offset = 0;
  return boards.map((board) =>
    board.map((tile) => {
      const domain = solved[offset] ?? 1;
      offset += 1;
      return { ...tile, value: Math.log2(domain) + 1 };
    }),
  );
}

function createPuzzle(randomize: boolean): NumberedTile[][] {
  for (let attempt = 0; attempt < 30; attempt++) {
    const numbered = numberBoards(createBoards(randomize), randomize);
    if (numbered) return numbered;
  }
  return [];
}

function Board({ boards, spin }: { boards: NumberedTile[][]; spin: number }) {
  const tiles = boards.flatMap((board, boardIndex) => {
    const boardRow = Math.floor(boardIndex / 3);
    const boardCol = boardIndex % 3;
    return board.map((tile) => ({
      ...tile,
      id: boardIndex * 100 + tile.id,
      row: tile.row + boardRow * GRID_SIZE,
      col: tile.col + boardCol * GRID_SIZE,
    }));
  });

  return (
    <div
      className="relative aspect-square w-full max-w-xl bg-board p-2 shadow-board ring-1 ring-border sm:p-3"
      role="img"
      aria-label="Twelve by twelve parquet grid made from nine four by four tile layouts"
    >
      <div className="relative h-full w-full overflow-hidden">
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${COMBINED_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${COMBINED_SIZE}, minmax(0, 1fr))`,
          }}
          aria-hidden="true"
        >
          {Array.from({ length: COMBINED_SIZE * COMBINED_SIZE }).map((_, i) => (
            <div key={i} className="border border-dashed border-board-line/70" />
          ))}
        </div>

        <div
          className="absolute inset-0 grid gap-px p-px"
          style={{
            gridTemplateColumns: `repeat(${COMBINED_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${COMBINED_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {tiles.map((tile, index) => (
            <div
              key={`${spin}-${index}`}
              className="animate-tile-settle border border-border bg-card"
              style={{
                gridRow: `${tile.row + 1} / span ${tile.height}`,
                gridColumn: `${tile.col + 1} / span ${tile.width}`,
                animationDelay: `${index * 8}ms`,
              }}
            >
              <span className="flex h-full w-full items-center justify-center text-base font-bold text-card-foreground sm:text-xl">
                {tile.value}
              </span>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden="true">
          {Array.from({ length: BOARD_COUNT }).map((_, index) => (
            <div key={index} className="border border-foreground/30" />
          ))}
        </div>
      </div>
    </div>
  );
}

function Index() {
  const [boards, setBoards] = useState<NumberedTile[][]>(() => createPuzzle(false));
  const [spin, setSpin] = useState(0);

  const generate = useCallback(() => {
    setBoards(createPuzzle(true));
    setSpin((s) => s + 1);
  }, []);

  return (
    <main className="relative min-h-screen px-6 py-14">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-4 rounded-full sm:left-6 sm:top-6"
            aria-label="How to play"
          >
            <Info aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" side="bottom" className="w-[min(22rem,calc(100vw-2rem))]">
          <h2 className="text-base font-semibold text-popover-foreground">How to play</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Fill each empty cell with a number from 1 to 9 so that each of the 12 rows, 12
            columns and 9 regions contains every number exactly once. Some cells span across
            two rows or two columns.
          </p>
        </PopoverContent>
      </Popover>
      <div className="mx-auto flex max-w-5xl flex-col gap-14">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Parquet Sudoku
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-semibold text-foreground sm:text-5xl">
            Nine parquet puzzles, one 12×12 grid.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Each 4×4 section uses one 2×2 tile, two 1×2 tiles, two 2×1 tiles and four 1×1
            tiles. Press generate to create all nine sections at once.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-start">
          <section className="flex flex-col items-center gap-6">
            <Board boards={boards} spin={spin} />
            <Button
              type="button"
              onClick={generate}
              size="lg"
              className="h-12 rounded-full px-8 font-semibold shadow-board transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Generate a grid
              <RefreshCw aria-hidden="true" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Grid {spin + 1} generated · nine independently randomized 4×4 sections
            </p>
          </section>

          <section>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Placement rules</h2>
              <ol className="mt-4 flex flex-col gap-4">
                {RULES.map((rule, i) => (
                  <li key={rule} className="flex gap-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-muted-foreground">{rule}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 border-l-2 border-border pl-4 text-sm leading-relaxed text-muted-foreground">
                Tiles &ldquo;touch&rdquo; when they share an edge; meeting at a corner is allowed.
                Each 4×4 section independently uses one of the {layoutCount} valid arrangements.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
