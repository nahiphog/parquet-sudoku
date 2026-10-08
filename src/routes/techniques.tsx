import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Eraser, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TECHNIQUES } from "@/lib/techniques";

export const Route = createFileRoute("/techniques")({
  head: () => ({
    meta: [
      { title: "Solving Techniques — Parquet Sudoku" },
      { name: "description", content: "Explore the logical techniques used in Parquet Sudoku solution walkthroughs." },
      { property: "og:title", content: "Solving Techniques — Parquet Sudoku" },
      { property: "og:description", content: "A practical repertoire of placement and candidate-elimination techniques for Parquet Sudoku." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TechniquesPage,
});

function TechniquesPage() {
  const [dark, setDark] = useState(false);

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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 px-4 py-3 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-[2.5rem_1fr_4.75rem] items-center gap-3">
          <Button asChild variant="outline" size="icon" className="rounded-full">
            <Link to="/" aria-label="Back to puzzle generator"><ArrowLeft aria-hidden="true" /></Link>
          </Button>
          <h1 className="text-center text-xl font-semibold sm:text-2xl">Solving Techniques</h1>
          <div className="flex items-center justify-end gap-2">
            <Sun className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Switch checked={dark} onCheckedChange={changeTheme} aria-label="Use dark mode" />
            <Moon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          The walkthrough tries these techniques in order. A merged tile participates in every row and column it covers, plus its 4×4 region.
        </p>
        <div className="mt-8 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2">
          {TECHNIQUES.map((technique) => {
            const placement = technique.id === "naked-single" || technique.id === "hidden-single" || technique.id === "forcing-chain";
            return (
              <article id={technique.id} key={technique.id} className="bg-card p-6 text-card-foreground">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">{technique.level}</Badge>
                  {placement ? <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> : <Eraser className="h-4 w-4 text-primary" aria-hidden="true" />}
                </div>
                <h2 className="mt-4 text-xl font-semibold">{technique.name}</h2>
                <p className="mt-2 font-semibold text-foreground">{technique.summary}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{technique.detail}</p>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}