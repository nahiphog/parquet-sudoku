import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { GRID_SIZE, layoutCount, randomLayout, type Tile, type TileKind } from "@/lib/parquet";

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
    ],
  }),
  component: Index,
});

const KIND_STYLES: Record<TileKind, string> = {
  square: "bg-tile-square text-tile-square-foreground",
  horizontal: "bg-tile-horizontal text-tile-foreground",
  vertical: "bg-tile-vertical text-tile-foreground",
  single: "bg-tile-single text-tile-foreground",
};

const KIND_LABELS: Record<TileKind, string> = {
  square: "2×2",
  horizontal: "1×2",
  vertical: "2×1",
  single: "1×1",
};

const LEGEND: Array<{ kind: TileKind; count: number; note: string }> = [
  { kind: "square", count: 1, note: "locked to the centre" },
  { kind: "horizontal", count: 2, note: "wide pieces" },
  { kind: "vertical", count: 2, note: "tall pieces" },
  { kind: "single", count: 4, note: "never adjacent" },
];

const RULES = [
  "The 2×2 tile always sits exactly in the middle.",
  "No 1×2 tile may share an edge with any 2×1 tile.",
  "No two 1×1 tiles may share an edge.",
];

function Board({ tiles, spin }: { tiles: Tile[]; spin: number }) {
  return (
    <div
      className="relative aspect-square w-full max-w-md rounded-2xl bg-board p-3 shadow-board ring-1 ring-border"
      role="img"
      aria-label="Four by four parquet grid filled with nine tiles"
    >
      <div className="relative h-full w-full overflow-hidden rounded-xl">
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
          aria-hidden="true"
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
            <div key={i} className="border border-dashed border-board-line/70" />
          ))}
        </div>

        <div
          className="absolute inset-0 grid gap-[3px] p-[3px]"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {tiles.map((tile, index) => (
            <div
              key={`${spin}-${tile.id}`}
              className={`tile-surface animate-tile-settle flex items-center justify-center rounded-lg text-sm font-semibold tracking-wide ${KIND_STYLES[tile.kind]}`}
              style={{
                gridRow: `${tile.row + 1} / span ${tile.height}`,
                gridColumn: `${tile.col + 1} / span ${tile.width}`,
                animationDelay: `${index * 45}ms`,
              }}
            >
              {KIND_LABELS[tile.kind]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Index() {
  const [tiles, setTiles] = useState<Tile[]>(() => randomLayout());
  const [spin, setSpin] = useState(0);

  const generate = useCallback(() => {
    setTiles((current) => randomLayout(current));
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
            Nine tiles, one 4×4 floor, three unbreakable rules.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Every layout uses one 2×2 tile, two 1×2 tiles, two 2×1 tiles and four 1×1 tiles.
            Press generate to lay a fresh floor.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <section className="flex flex-col items-center gap-6">
            <Board tiles={tiles} spin={spin} />
            <button
              type="button"
              onClick={generate}
              className="inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-semibold tracking-wide text-primary-foreground shadow-board transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:translate-y-0"
            >
              Generate grid
              <span aria-hidden="true">↻</span>
            </button>
            <p className="text-xs text-muted-foreground">
              Layout {spin + 1} generated · {layoutCount} arrangements satisfy every rule
            </p>
          </section>

          <section className="flex flex-col gap-10">
            <div>
              <h2 className="text-lg font-semibold text-foreground">The tile set</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {LEGEND.map((item) => (
                  <li
                    key={item.kind}
                    className="flex items-center gap-4 rounded-xl bg-card p-3 ring-1 ring-border"
                  >
                    <span
                      className={`tile-surface flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold ${KIND_STYLES[item.kind]}`}
                    >
                      {KIND_LABELS[item.kind]}
                    </span>
                    <span className="text-sm text-card-foreground">
                      <span className="font-semibold">{item.count}×</span> {KIND_LABELS[item.kind]}{" "}
                      tile{item.count > 1 ? "s" : ""}
                      <span className="text-muted-foreground"> — {item.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

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
                Under that reading exactly {layoutCount} distinct floors exist, so the generator
                picks a different one from the last each time.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
