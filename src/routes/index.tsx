import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

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

function createBoards(): Tile[][] {
  if (VALID_LAYOUTS.length === 0) return [];

  // Build each 4×4 section from its own layout choice. Repeating the full set
  // before shuffling guarantees visible variety even though only three valid
  // arrangements exist and nine sections must be filled.
  const candidates = Array.from(
    { length: BOARD_COUNT },
    (_, index) => VALID_LAYOUTS[index % VALID_LAYOUTS.length]!,
  );

  return shuffle(candidates).map((layout) => layout.map((tile) => ({ ...tile })));
}

function createInitialBoards(): Tile[][] {
  if (VALID_LAYOUTS.length === 0) return [];
  return Array.from({ length: BOARD_COUNT }, (_, index) =>
    VALID_LAYOUTS[index % VALID_LAYOUTS.length]!.map((tile) => ({ ...tile })),
  );
}

function Board({ boards, spin }: { boards: Tile[][]; spin: number }) {
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
            />
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
  const [boards, setBoards] = useState<Tile[][]>(createInitialBoards);
  const [spin, setSpin] = useState(0);

  const generate = useCallback(() => {
    setBoards(createBoards());
    setSpin((s) => s + 1);
  }, []);

  return (
    <main className="min-h-screen px-6 py-14">
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
            <button
              type="button"
              onClick={generate}
              className="inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-semibold tracking-wide text-primary-foreground shadow-board transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:translate-y-0"
            >
              Generate 12×12 grid
              <span aria-hidden="true">↻</span>
            </button>
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
