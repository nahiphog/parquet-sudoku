import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Info, LoaderCircle, Moon, RefreshCw, Square, Target, Sun } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  COMBINED_SIZE,
  VERSIONS,
  boardsFor,
  placeBoards,
  type PlacedTile,
  type PuzzleVersion,
} from "@/lib/parquet-layouts";
import { buildModelFromPlaced, digPuzzle, randomSolution, snyderMarks } from "@/lib/parquet-solver";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Parquet Sudoku — Puzzle Generator" },
      {
        name: "description",
        content: "Generate minimal, uniquely solvable Parquet Sudoku puzzles in two tile layouts, with their completed solutions.",
      },
      { property: "og:title", content: "Parquet Sudoku — Puzzle Generator" },
      {
        property: "og:description",
        content: "Generate minimal, uniquely solvable Parquet Sudoku puzzles in two tile layouts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const BOARD_COUNT = 9;
const TARGETS = [8, 9, 10, 11, 12, 13, 14];
const PENPA_URL =
  "https://swaroopg92.github.io/penpa-edit/?m=solve&p=7Vdbb9tGE33Xr1gQ6Ns24F5490uRuklfEjf9nA9BIBgBLdOxEEp0SCqOZSS/PWdmhxEpKUDRom+FJPLwaGfm7OzuaNR93JZtpY2ldxLrWBu8UiD6uCzhD/H0er3q62quXpXtx23Vq4vtdfNhq59u+9umnauLcq3Oyru7ulqXm59fPGyqTmn9fFXXqiqXt6pa3/UPalnh+X7V36pSbbbrq6pVN22zVkb1jSpU16j+tuyDRXODh0oZq9rmvvvJnhFcNvV2velUubnG+LZ6v2rwtGw2fbkCqD5V7cPgufpcLvv6QTWbZfVEXTTriuN3qrsrN6pctk3Xqf6+Yf+qaRlLgCf6j3N9U9ZdNVtIAi5ni8hEOrL4mOjy6+78KxPF5exx97/54+7dfHH5Re/+v4f5Hl7MH3E9nzGLo3mi8hFSDX50ZEriPB7wnsi4HogkpiIYk8Ykx04MSY/8GJscmjl2M/IsXHsJx0z7CfbMzZmPyMrawwx+ZjhSY1iWcOzGnl2GVshfXuGPSdjhq1GnhPPzMgqCdkYWSUJz2KkOYtZzygbmXEHfjLDaf7uB8tjeJHe8vU5Xy1fX2MN9c7x9Te+xnxN+PqCxzzD0tos07ZAIIsEFE67GOKBcdeOloOwxbHySAVhb7Qj8YSTDMct2OKuXS62eaE9LQEw7trbYIu79rR8hF2mfRJscdc+DbYePr349IiFZ7GFH9HgoQ3PIRY041k0QI/MxaXQmYlOD/2p6LeYlxdbA8022NoCtpRwwrlBTsQWOh1tMMY5sMRy5AfLyv5Resb58VawBRY9HrHolDD2ew2kzWPpGafAg2bE9RLXIy5tKpo76p4Xnd4gPybE8iYGHuXHBG0+zr/nx8fIbRx8+jgFltzSGtH2Y+xHa0e5DZp9jLixxI0RN6a42ERveCud8dXThiqQAHKMLYo7EgwjxpjcmCchwLZAAkg48ZiQszIGE5rwNFEej8QbCGQetm4Yg6SOeTrfhFMkns4o4Qy2hYwhnCNJjJHgYUwCnk458/BTiH/+bRGfGWINYxLihzHQmYt+wlnQ7DL6bQpjvMHiuGCLOza48A6JH/NUdAlbLAJtOuZhmwxjgGkDMsYiD2MsFpk2HWFsOp8Ij8044WkzUj4xF1sEP7awoRiQZkubVPKDg+vskH+HMcHWWdqwMkeLHNJhojF5jDFBv83JZ1hrFyMPseTK0eEQng4lVXpeL8RKxWeBnNBGZoxYdCgJ04FIRUMKn3S4eQxtUvGJIuRkXnwQE+FRbFwitjkdAomVwycVMB4Pn4nknzY+/VJxbnHIqJgRTsCnwntaF1kLKnKSK59AfyZ8glhUzNgn1ssGDXxw7bDWxMt6YV5e9hsXRdaPQ5ZyBc/oN3o2W2DXUAd0/Er+4+lFLdB5aK7Om3Zd1miF5PllhDYo6pr6Xbdtb8plFc25fdLMhY4smvftVpi6ae7q1WY6bPV+07TVya+IrK7fnxp/1bTX5Hz0xX1Z1xMitLoTarlql/WU6tvV5Lls0RpOmHXZ306Iq7JHW9zdru6mnqpNPxXQl1OJ5YfyINp6P+cvs+hzxJ8FDnyqDTeZxXz3VO9+D83Y0Ifq3Z/oMl/Od+fUZC4itDPck/AgC/gsNDkE3/D3hM6ko4uBzwUDvgUMeXn3IjCv5ovdax1RnF/ZmmC0bj5BatBBz8tmfYXJLKJROsI3Hf9NGBpIarKe/liuE7kCg1xCJ+QW/77c4vJLWIj473T4vxx2+CMidPgj4kRD/5fa98Nm3dCPwMSPNOujWNKsT5ipwH/eCh/3MgfF9rNUi6Y9WTBADzVjyp4sDsIf1QfwR5WAAh4XA7An6gHYw5IA6rgqgDwqDOB+UBvI62F5IFWHFYJCHRUJCjWuE4vL2Tc=&a=RZHRrQNBCAN7uW8+lmVhoZYo/bcRsO/pSZGsC3NjQj6fr/x/Hl1H9iOdV2zypMSkqyQyOI8jjrxyJ++WQibn6ZxnyJmsS08lPNZ+nVTF96YO7pjDc6zQf47B71zHWz+v+1+Q9m6ZcegCHUp7KLePQy7Oy7mhLe7LtRZc+8YbheUvbQ3NT8q1AeVieXbZSJMbpm8403nBjEU8XrxtwG9AnonqUjyV8p612Vl7c2wLG5fxjmW8b+XL5cu1Dlw1Nv/l9wc=";

function CellBoard({ tiles, values, spin, label, marks }: { tiles: PlacedTile[]; values: number[]; spin: number; label: string; marks?: number[][] }) {
  const owner = useMemo(() => {
    const map = new Map<number, number>();
    tiles.forEach((tile, index) => {
      for (const [row, col] of tile.cells) map.set(row * COMBINED_SIZE + col, index);
    });
    return map;
  }, [tiles]);

  const digits = useMemo(
    () =>
      tiles.map((tile, index) => {
        const rows = tile.cells.reduce((sum, [row]) => sum + row, 0) / tile.cells.length;
        const cols = tile.cells.reduce((sum, [, col]) => sum + col, 0) / tile.cells.length;
        return {
          index,
          top: ((rows + 0.5) / COMBINED_SIZE) * 100,
          left: ((cols + 0.5) / COMBINED_SIZE) * 100,
        };
      }),
    [tiles],
  );

  return (
    <div className="relative aspect-square w-full bg-board p-2 shadow-board ring-1 ring-border sm:p-3" role="img" aria-label={label}>
      <div className="relative h-full w-full">
        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${COMBINED_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${COMBINED_SIZE}, minmax(0, 1fr))`,
          }}
          aria-hidden="true"
        >
          {Array.from({ length: COMBINED_SIZE * COMBINED_SIZE }).map((_, cell) => {
            const row = Math.floor(cell / COMBINED_SIZE);
            const col = cell % COMBINED_SIZE;
            const self = owner.get(cell);
            const sameAs = (r: number, c: number) =>
              r >= 0 && c >= 0 && r < COMBINED_SIZE && c < COMBINED_SIZE && owner.get(r * COMBINED_SIZE + c) === self;
            return (
              <div
                key={cell}
                className="border-solid border-foreground/60 bg-card"
                style={{
                  borderTopWidth: sameAs(row - 1, col) ? 0 : 1,
                  borderBottomWidth: sameAs(row + 1, col) ? 0 : 1,
                  borderLeftWidth: sameAs(row, col - 1) ? 0 : 1,
                  borderRightWidth: sameAs(row, col + 1) ? 0 : 1,
                }}
              />
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-0">
          {digits.map(({ index, top, left }) => {
            const value = values[index] ?? 0;
            if (!value) return null;
            return (
              <span
                key={`${spin}-${index}`}
                className="animate-tile-settle absolute -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-card-foreground sm:text-lg"
                style={{ top: `${top}%`, left: `${left}%`, animationDelay: `${index * 4}ms` }}
              >
                {value}
              </span>
            );
          })}
          {marks?.map((digitsHere, index) => {
            const first = tiles[index]?.cells.reduce((a, b) => (b[0] < a[0] || (b[0] === a[0] && b[1] < a[1]) ? b : a));
            if (!first || !digitsHere.length || values[index]) return null;
            return (
              <span
                key={`m-${index}`}
                className="absolute text-[0.5rem] leading-none text-primary sm:text-[0.65rem]"
                style={{ top: `calc(${(first[0] / COMBINED_SIZE) * 100}% + 2px)`, left: `calc(${(first[1] / COMBINED_SIZE) * 100}% + 2px)` }}
              >
                {digitsHere.join("")}
              </span>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden="true">
          {Array.from({ length: BOARD_COUNT }).map((_, index) => (
            <div key={index} className="border-2 border-foreground/70" />
          ))}
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

type Puzzle = { tiles: PlacedTile[]; solution: number[]; clues: number[] };

function buildPuzzle(version: PuzzleVersion, isCurrent: () => boolean) {
  const tiles = placeBoards(boardsFor(version));
  const model = buildModelFromPlaced(tiles);
  const solution = randomSolution(model);
  if (!solution) return null;
  return digPuzzle(solution, model, isCurrent).then((clues) => ({ tiles, solution, clues }) as Puzzle);
}

function Index() {
  const [version, setVersion] = useState<PuzzleVersion>("v1");
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [spin, setSpin] = useState(0);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [hunting, setHunting] = useState(false);
  const [attempts, setAttempts] = useState<number | null>(null);
  const [target, setTarget] = useState(12);
  const [dark, setDark] = useState(false);
  const [showSnyder, setShowSnyder] = useState(false);
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

  const generate = useCallback(async (nextVersion: PuzzleVersion = version) => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    setGenerating(true);
    setElapsed(null);
    setAttempts(null);
    const started = performance.now();
    const next = await buildPuzzle(nextVersion, () => generationRef.current === generation);
    if (generationRef.current !== generation) return;
    if (next) {
      setPuzzle(next);
      setSpin((value) => value + 1);
      setElapsed(performance.now() - started);
    }
    setGenerating(false);
  }, [version]);

  useEffect(() => {
    void generate("v1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeVersion = (value: string) => {
    const next = value as PuzzleVersion;
    setVersion(next);
    void generate(next);
  };

  const hunt = useCallback(async () => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    setGenerating(true);
    setHunting(true);
    setElapsed(null);
    setAttempts(0);
    const started = performance.now();
    let tries = 0;

    while (generationRef.current === generation) {
      tries += 1;
      const next = await buildPuzzle(version, () => generationRef.current === generation);
      if (generationRef.current !== generation) return;
      setAttempts(tries);
      if (next && next.clues.filter((value) => value > 0).length <= target) {
        setPuzzle(next);
        setSpin((value) => value + 1);
        setElapsed(performance.now() - started);
        break;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }

    if (generationRef.current !== generation) return;
    setHunting(false);
    setGenerating(false);
  }, [target, version]);

  const stop = () => {
    generationRef.current += 1;
    setHunting(false);
    setGenerating(false);
  };

  const tiles = puzzle?.tiles ?? placeBoards(boardsFor(version));
  const clueValues = puzzle?.clues ?? [];
  const solutionValues = puzzle?.solution ?? [];
  const clueCount = clueValues.filter((value) => value > 0).length;
  const marks = useMemo(
    () => (puzzle && showSnyder ? snyderMarks(puzzle.clues, buildModelFromPlaced(puzzle.tiles), puzzle.tiles) : undefined),
    [puzzle, showSnyder],
  );

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
          <section className="space-y-3"><h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">Puzzle</h2><CellBoard tiles={tiles} values={clueValues} spin={spin} label="Parquet Sudoku puzzle" marks={marks} /></section>
          <section className="space-y-3"><h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">Solution</h2><CellBoard tiles={tiles} values={solutionValues} spin={spin} label="Completed Parquet Sudoku solution" /></section>
        </div>

        <div className="flex items-center gap-6">
          <p className="text-sm font-semibold" aria-live="polite">Given cells: {clueCount}</p>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={showSnyder} onCheckedChange={setShowSnyder} disabled={!puzzle} aria-label="Show Snyder notation" />
            Snyder notation
          </label>
        </div>

        <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Select value={version} onValueChange={changeVersion} disabled={generating}>
            <SelectTrigger className="h-12 w-36 rounded-full" aria-label="Tile layout version"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VERSIONS.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => void generate()} disabled={generating} size="lg" className="h-12 rounded-full px-8 font-semibold shadow-board">
            {generating && !hunting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
            {generating && !hunting ? "Generating puzzle…" : "Generate a grid"}
          </Button>
          <div className="flex items-center gap-2">
            <Select value={String(target)} onValueChange={(value) => setTarget(Number(value))} disabled={generating}>
              <SelectTrigger className="h-12 w-28 rounded-full" aria-label="Target number of given cells"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TARGETS.map((value) => <SelectItem key={value} value={String(value)}>{value} cells</SelectItem>)}
              </SelectContent>
            </Select>
            {hunting ? (
              <Button type="button" onClick={stop} variant="destructive" size="lg" className="h-12 rounded-full px-6 font-semibold">
                <Square aria-hidden="true" />Stop searching
              </Button>
            ) : (
              <Button type="button" onClick={hunt} disabled={generating} variant="secondary" size="lg" className="h-12 rounded-full px-6 font-semibold">
                <Target aria-hidden="true" />Hunt for target
              </Button>
            )}
          </div>
        </div>

        <p className="min-h-5 text-center text-sm text-muted-foreground" aria-live="polite">
          {hunting
            ? `Searching for ${target} given cells or fewer — ${attempts ?? 0} puzzles generated…`
            : generating
              ? "Checking for a unique solution…"
              : elapsed === null
                ? ""
                : `${attempts === null ? "" : `${attempts} puzzles generated · `}Generated in ${(elapsed / 1000).toFixed(2)} seconds`}
        </p>
      </div>
    </main>
  );
}
