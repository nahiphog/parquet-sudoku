import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Eraser, Hammer, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CellBoard } from "@/components/CellBoard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VERSIONS, boardsFor, placeBoards, type PuzzleVersion } from "@/lib/parquet-layouts";
import { buildModelFromPlaced, hasUniqueSolution, randomSolution } from "@/lib/parquet-solver";

export const Route = createFileRoute("/custom")({
  head: () => ({
    meta: [
      { title: "Custom Build — Parquet Sudoku" },
      { name: "description", content: "Choose your own given cells and build a uniquely solvable Parquet Sudoku around them." },
      { property: "og:title", content: "Custom Build — Parquet Sudoku" },
      { property: "og:description", content: "Pick the given cells, then let the builder search for a unique Parquet Sudoku." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomBuild,
});

function CustomBuild() {
  const [version, setVersion] = useState<PuzzleVersion>("v1");
  const [greens, setGreens] = useState<Set<number>>(new Set());
  const [building, setBuilding] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [result, setResult] = useState<{ clues: number[]; solution: number[] } | null>(null);
  const runRef = useRef(0);
  const tiles = useMemo(() => placeBoards(boardsFor(version)), [version]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", window.localStorage.getItem("parquet-theme") === "dark");
  }, []);

  const toggle = (index: number) => {
    if (building) return;
    setResult(null);
    setGreens((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const build = async () => {
    const run = runRef.current + 1;
    runRef.current = run;
    setBuilding(true);
    setResult(null);
    setAttempts(0);
    setElapsed(null);
    const model = buildModelFromPlaced(tiles);
    const started = performance.now();
    let tries = 0;
    while (runRef.current === run) {
      tries += 1;
      const solution = randomSolution(model);
      if (solution) {
        const clues = solution.map((value, index) => (greens.has(index) ? value : 0));
        if (hasUniqueSolution(clues, model)) {
          setResult({ clues, solution });
          break;
        }
      }
      if (tries % 5 === 0) {
        setAttempts(tries);
        setElapsed(performance.now() - started);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    }
    if (runRef.current !== run) return;
    setAttempts(tries);
    setElapsed(performance.now() - started);
    setBuilding(false);
  };

  const halt = () => {
    runRef.current += 1;
    setBuilding(false);
  };

  const empty = useMemo(() => tiles.map(() => 0), [tiles]);
  const n = greens.size;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 px-4 py-3 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-[5.5rem_1fr_5.5rem] items-center gap-3">
          <Button asChild variant="outline" size="icon" className="rounded-full">
            <Link to="/" aria-label="Back to generator"><ArrowLeft aria-hidden="true" /></Link>
          </Button>
          <h1 className="text-center text-xl font-semibold sm:text-2xl">Custom Build</h1>
          <span />
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-8 sm:px-6">
        <Select value={version} onValueChange={(value) => { setVersion(value as PuzzleVersion); setGreens(new Set()); setResult(null); }} disabled={building}>
          <SelectTrigger className="h-12 w-36 rounded-full" aria-label="Tile layout version"><SelectValue /></SelectTrigger>
          <SelectContent>{VERSIONS.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
        <div className="grid w-full gap-8 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">Pick given cells</h2>
            <CellBoard tiles={tiles} values={result?.clues ?? empty} givens={result?.clues ?? empty} spin={0} label="Custom given-cell picker" greens={greens} onSelect={toggle} />
          </section>
          <section className="space-y-3">
            <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">Solution</h2>
            <CellBoard tiles={tiles} values={result?.solution ?? empty} givens={result?.clues ?? empty} spin={0} label="Custom puzzle solution" />
          </section>
        </div>
        <p className="text-sm font-semibold" aria-live="polite">Selected cells (N): {n}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {building ? (
            <Button type="button" variant="destructive" size="lg" className="h-12 rounded-full px-8 font-semibold" onClick={halt}><Square aria-hidden="true" />Halt build</Button>
          ) : (
            <Button type="button" size="lg" className="h-12 rounded-full px-8 font-semibold shadow-board" onClick={() => void build()} disabled={n === 0}><Hammer aria-hidden="true" />Build puzzle</Button>
          )}
          <Button type="button" variant="outline" size="lg" className="h-12 rounded-full px-6" onClick={() => { setGreens(new Set()); setResult(null); }} disabled={building || n === 0}><Eraser aria-hidden="true" />Clear</Button>
        </div>
        <p className="min-h-5 text-center text-sm text-muted-foreground" aria-live="polite">
          {building
            ? `Building — ${attempts} attempts so far…`
            : result
              ? `Unique puzzle found after ${attempts} attempts in ${((elapsed ?? 0) / 1000).toFixed(2)} seconds`
              : elapsed !== null
                ? `Halted after ${attempts} attempts`
                : ""}
        </p>
      </div>
    </main>
  );
}
