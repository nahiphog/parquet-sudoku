import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { GRID_SIZE, layoutCount, randomLayout, type Tile } from "@/lib/parquet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Parquet Sudoku — Random Tile Grid Generator" },
      {
        name: "description",
        content:
          "Generate 4x4 parquet grids from nine tiles: one 2x2 centre, two 1x2, two 2x1 and four 1x1 pieces, following strict no-touch rules.",
      },
      { property: "og:title", content: "Parquet Sudoku — Random Tile Grid Generator" },
      {
        property: "og:description",
        content:
          "Press generate to lay nine parquet tiles into a 4x4 grid under three placement rules.",
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
];

const BOARD_COUNT = 9;
const COMBINED_SIZE = GRID_SIZE * 3;

function createBoards(previous?: Tile[][]): Tile[][] {
  return Array.from({ length: BOARD_COUNT }, (_, index) => randomLayout(previous?.[index]));
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
              key={`${spin}-${tile.id}`}
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
  const [boards, setBoards] = useState<Tile[][]>(() => createBoards());
  const [spin, setSpin] = useState(0);

  const generate = useCallback(() => {
    setBoards((current) => createBoards(current));
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
