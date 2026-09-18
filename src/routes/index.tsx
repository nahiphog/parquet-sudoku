import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Info, LoaderCircle, Moon, RefreshCw, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { GRID_SIZE, allLayouts, type Tile } from "@/lib/parquet";
import { buildPuzzleModel, digPuzzle } from "@/lib/parquet-solver";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Parquet Sudoku — Puzzle Generator" },
      {
        name: "description",
        content: "Generate minimal, uniquely solvable Parquet Sudoku puzzles with their completed solutions.",
      },
      { property: "og:title", content: "Parquet Sudoku — Puzzle Generator" },
      {
        property: "og:description",
        content: "Generate minimal, uniquely solvable Parquet Sudoku puzzles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const BOARD_COUNT = 9;
const COMBINED_SIZE = GRID_SIZE * 3;
const VALID_LAYOUTS = allLayouts();
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const SOLUTION_LAYOUTS = [1, 1, 1, 0, 0, 0, 0, 0, 0];
const SOLUTION_VALUES = [
  3, 9, 4, 2, 7, 6, 8, 5, 1, 1, 6, 7, 3, 8, 5, 2, 4, 9, 4, 5, 8, 1, 2, 9, 7, 6, 3,
  7, 1, 8, 9, 4, 3, 5, 2, 6, 8, 2, 4, 6, 3, 1, 9, 5, 7, 2, 3, 7, 5, 1, 4, 6, 9, 8,
  9, 8, 5, 1, 7, 2, 3, 6, 4, 6, 9, 2, 4, 8, 7, 1, 3, 5, 5, 7, 6, 3, 2, 8, 4, 1, 9,
];
const PENPA_URL =
  "https://swaroopg92.github.io/penpa-edit/?m=solve&p=7Vdbb9tGE33Xr1gQ6Ns24F5400uRuklfEjf9nA9BIBgBLdOxEEp0SCqOZSS/PWdmhxEpKUDRom+FJPLwaGfm7OzuaNR93JZtpY2ldxLrWBu8UiD6uCzhD/H0er3q62quXpXtx23Vq4vtdfNhq59u+9umnauLcq3Oyru7ulqXm59fPGyqTmn9fFXXqiqXt6pa3/UPalnh+X7V36pSbbbrq6pVN22zVkb1jSpU16j+tuyDRXODh0oZq9rmvvvJnhFcNvV2velUubnG+LZ6v2rwtGw2fbkCqD5V7cPgufpcLvv6QTWbZfVEXTTriuN3qrsrN6pctk3Xqf6+Yf+qaRlLgCf6j3N9U9ZdNVtIAi5ni8hEOrL4mOjy6+78KxPF5exx97/54+7dfHH5Re/+v4f5Hl7MH3E9nzGLo3mi8hFSDX50ZEriPB7wnsi4HogkpiIYk8Ykx04MSY/8GJscmjl2M/IsXHsJx0z7CfbMzZmPyMrawwx+ZjhSY1iWcOzGnl2GVshfXuGPSdjhq1GnhPPzMgqCdkYWSUJz2KkOYtZzygbmXEHfjLDaf7uB8tjeJHe8vU5Xy1fX2MN9c7x9Te+xnxN+PqCxzzD0tos07ZAIIsEFE67GOKBcdeOloOwxbHySAVhb7Qj8YSTDMct2OKuXS62eaE9LQEw7trbYIu79rR8hF2mfRJscdc+DbYePr349IiFZ7GFH9HgoQ3PIRY041k0QI/MxaXQmYlOD/2p6LeYlxdbA8022NoCtpRwwrlBTsQWOh1tMMY5sMRy5AfLyv5Resb58VawBRY9HrHolDD2ew2kzWPpGafAg2bE9RLXIy5tKpo76p4Xnd4gPybE8iYGHuXHBG0+zr/nx8fIbRx8+jgFltzSGtH2Y+xHa0e5DZp9jLixxI0RN6a42ERveCud8dXThiqQAHKMLYo7EgwjxpjcmCchwLZAAkg48ZiQszIGE5rwNFEej8QbCGQetm4Yg6SOeTrfhFMkns4o4Qy2hYwhnCNJjJHgYUwCnk458/BTiH/+bRGfGWINYxLihzHQmYt+wlnQ7DL6bQpjvMHiuGCLOza48A6JH/NUdAlbLAJtOuZhmwxjgGkDMsYiD2MsFpk2HWFsOp8Ij8044WkzUj4xF1sEP7awoRiQZkubVPKDg+vskH+HMcHWWdqwMkeLHNJhojF5jDFBv83JZ1hrFyMPseTK0eEQng4lVXpeL8RKxWeBnNBGZoxYdCgJ04FIRUMKn3S4eQxtUvGJIuRkXnwQE+FRbFwitjkdAomVwycVMB4Pn4nknzY+/VJxbnHIqJgRTsCnwntaF1kLKnKSK59AfyZ8glhUzNgn1ssGDXxw7bDWxMt6YV5e9hsXRdaPQ5ZyBc/oN3o2W2DXUAd0/Er+4+lFLdB5aK7Om3Zd1miF5PllhDYo6pr6Xbdtb8plFc25fdLMhY4smvftVpi6ae7q1WY6bPV+07TVya+IrK7fnxp/1bTX5Hz0xX1Z1xMitLoTarlql/WU6tvV5Lls0RpOmHXZ306Iq7JHW9zdru6mnqpNPxXQl1OJ5YfyINp6P+cvs+hzxJ8FDnyqDTeZxXz3VO9+D83Y0Ifq3Z/oMl/Od+fUZC4itDPck/AgC/gsNDkE3/D3hM6ko4uBzwUDvgUMeXn3IjCv5ovdax1RnF/ZmmC0bj5BatBBz8tmfYXJLKJROsI3Hf9NGBpIarKe/liuE7kCg1xCJ+QW/77c4vJLWIj473T4vxx2+CMidPgj4kRD/5fa98Nm3dCPwMSPNOujWNKsT5ipwH/eCh/3MgfF9rNUi6Y9WTBADzVjyp4sDsIf1QfwR5WAAh4XA7An6gHYw5IA6rgqgDwqDOB+UBvI62F5IFWHFYJCHRUJCjWuE4vL2Tc=&a=RZHRrQNBCAN7uW8+lmVhoZYo/bcRsO/pSZGsC3NjQj6fr/x/Hl1H9iOdV2zypMSkqyQyOI8jjrxyJ++WQibn6ZxnyJmsS08lPNZ+nVTF96YO7pjDc6zQf47B71zHWz+v+1+Q9m6ZcegCHUp7KLePQy7Oy7mhLe7LtRZc+8YbheUvbQ3NT8q1AeVieXbZSJMbpm8403nBjEU8XrxtwG9AnonqUjyV8p612Vl7c2wLG5fxjmW8b+XL5cu1Dlw1Nv/l9wc=";

type NumberedTile = Tile & { value: number };

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex] as T, shuffled[index] as T];
  }
  return shuffled;
}

function createSolution(randomize: boolean): NumberedTile[][] {
  const digitMap = randomize ? shuffle(DIGITS) : DIGITS;
  let valueIndex = 0;
  const solved = SOLUTION_LAYOUTS.map((layoutIndex) =>
    (VALID_LAYOUTS[layoutIndex] ?? []).map((tile) => {
      const original = SOLUTION_VALUES[valueIndex] ?? 1;
      valueIndex += 1;
      return { ...tile, value: digitMap[original - 1] ?? original };
    }),
  );
  if (!randomize) return solved;
  const rowOrder = shuffle([0, 1, 2]);
  const colOrder = shuffle([0, 1, 2]);
  return rowOrder.flatMap((row) => colOrder.map((col) => solved[row * 3 + col] ?? []));
}

function Board({ boards, values, spin, label }: { boards: NumberedTile[][]; values: number[]; spin: number; label: string }) {
  let valueIndex = 0;
  const tiles = boards.flatMap((board, boardIndex) => {
    const boardRow = Math.floor(boardIndex / 3);
    const boardCol = boardIndex % 3;
    return board.map((tile) => ({ ...tile, displayValue: values[valueIndex++] ?? 0, id: boardIndex * 100 + tile.id, row: tile.row + boardRow * GRID_SIZE, col: tile.col + boardCol * GRID_SIZE }));
  });
  return (
    <div className="relative aspect-square w-full bg-board p-2 shadow-board ring-1 ring-border sm:p-3" role="img" aria-label={label}>
      <div className="relative h-full w-full overflow-hidden">
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COMBINED_SIZE}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${COMBINED_SIZE}, minmax(0, 1fr))` }} aria-hidden="true">
          {Array.from({ length: COMBINED_SIZE * COMBINED_SIZE }).map((_, index) => <div key={index} className="border border-dashed border-board-line/70" />)}
        </div>
        <div className="absolute inset-0 grid gap-px p-px" style={{ gridTemplateColumns: `repeat(${COMBINED_SIZE}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${COMBINED_SIZE}, minmax(0, 1fr))` }}>
          {tiles.map((tile, index) => (
            <div key={`${spin}-${index}`} className="animate-tile-settle border border-border bg-card" style={{ gridRow: `${tile.row + 1} / span ${tile.height}`, gridColumn: `${tile.col + 1} / span ${tile.width}`, animationDelay: `${index * 4}ms` }}>
              <span className="flex h-full w-full items-center justify-center text-sm font-bold text-card-foreground sm:text-lg">{tile.displayValue || null}</span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden="true">
          {Array.from({ length: BOARD_COUNT }).map((_, index) => <div key={index} className="border border-foreground/30" />)}
        </div>
      </div>
    </div>
  );
}

function Guide() {
  const [page, setPage] = useState(0);
  return (
    <Popover onOpenChange={(open) => { if (!open) setPage(0); }}>
      <PopoverTrigger asChild><Button variant="outline" size="icon" className="rounded-full" aria-label="How to play"><Info aria-hidden="true" /></Button></PopoverTrigger>
      <PopoverContent align="start" side="bottom" className="w-[min(22rem,calc(100vw-2rem))]">
        {page === 0 ? (
          <><h2 className="text-base font-semibold text-popover-foreground">How to play</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Fill each empty cell with a number from 1 to 9 so that each of the 12 rows, 12 columns and 9 regions contains every number exactly once. Some cells span across two rows or two columns.</p></>
        ) : (
          <><h2 className="text-base font-semibold text-popover-foreground">Inspiration</h2><div className="mt-3 flex flex-col gap-3 text-sm"><a className="text-primary underline underline-offset-4" href="https://gp.worldpuzzle.org/sites/default/files/Puzzles/2023/2023_SudokuRound3.pdf#page=5" target="_blank" rel="noreferrer">World Puzzle Federation Grand Prix 2023 page 5</a><a className="text-primary underline underline-offset-4" href={PENPA_URL} target="_blank" rel="noreferrer">A puzzle made by Sam Cappleman-Lynes</a></div></>
        )}
        <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
          <Button variant="ghost" size="icon" onClick={() => setPage(0)} disabled={page === 0} aria-label="Previous page"><ArrowLeft aria-hidden="true" /></Button>
          <span className="text-xs text-muted-foreground">{page + 1} / 2</span>
          <Button variant="ghost" size="icon" onClick={() => setPage(1)} disabled={page === 1} aria-label="Next page"><ArrowRight aria-hidden="true" /></Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Index() {
  const initial = createSolution(false);
  const [solution, setSolution] = useState(initial);
  const [puzzleValues, setPuzzleValues] = useState(() => initial.flatMap((board) => board.map((tile) => tile.value)));
  const [spin, setSpin] = useState(0);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [dark, setDark] = useState(false);
  const generationRef = useRef(0);

  useEffect(() => {
    const saved = window.localStorage.getItem("parquet-theme");
    const useDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(useDark);
    document.documentElement.classList.toggle("dark", useDark);
  }, []);

  const changeTheme = (checked: boolean) => {
    setDark(checked);
    document.documentElement.classList.toggle("dark", checked);
    window.localStorage.setItem("parquet-theme", checked ? "dark" : "light");
  };

  const generate = useCallback(async () => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    setGenerating(true);
    setElapsed(null);
    const started = performance.now();
    const nextSolution = createSolution(true);
    const solutionValues = nextSolution.flatMap((board) => board.map((tile) => tile.value));
    const model = buildPuzzleModel(nextSolution);
    const dug = await digPuzzle(solutionValues, model, () => generationRef.current === generation);
    if (generationRef.current !== generation) return;
    setSolution(nextSolution);
    setPuzzleValues(dug);
    setSpin((value) => value + 1);
    setElapsed(performance.now() - started);
    setGenerating(false);
  }, []);

  const solutionValues = solution.flatMap((board) => board.map((tile) => tile.value));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 px-4 py-3 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-[2.5rem_1fr_4.75rem] items-center gap-3">
          <Guide />
          <h1 className="text-center text-xl font-semibold sm:text-2xl">Parquet Sudoku</h1>
          <div className="flex items-center justify-end gap-2">
            <Sun className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Switch checked={dark} onCheckedChange={changeTheme} aria-label="Use dark mode" />
            <Moon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col items-center gap-7 px-4 py-8 sm:px-6">
        <div className="grid w-full gap-8 lg:grid-cols-2">
          <section className="space-y-3"><h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">Puzzle</h2><Board boards={solution} values={puzzleValues} spin={spin} label="Parquet Sudoku puzzle" /></section>
          <section className="space-y-3"><h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">Solution</h2><Board boards={solution} values={solutionValues} spin={spin} label="Completed Parquet Sudoku solution" /></section>
        </div>
        <Button type="button" onClick={generate} disabled={generating} size="lg" className="h-12 rounded-full px-8 font-semibold shadow-board">
          {generating ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
          {generating ? "Generating puzzle…" : "Generate a grid"}
        </Button>
        <p className="h-5 text-sm text-muted-foreground" aria-live="polite">{generating ? "Checking for a unique solution…" : elapsed === null ? "" : `Generated in ${(elapsed / 1000).toFixed(2)} seconds`}</p>
      </div>
    </main>
  );
}