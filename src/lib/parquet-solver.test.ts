import { describe, expect, it } from "vitest";

import { boardsFor, placeBoards } from "@/lib/parquet-layouts";
import {
  buildModelFromPlaced,
  digPuzzleToTarget,
  hasUniqueSolution,
  randomSolution,
} from "@/lib/parquet-solver";
import { buildWalkthrough } from "@/lib/parquet-walkthrough";
import { summarizeTechniques } from "@/lib/techniques";

describe("exact clue generation", () => {
  for (const target of Array.from({ length: 17 }, (_, index) => index + 11)) {
    it(`stops at exactly ${target} givens and remains unique`, async () => {
      const tiles = placeBoards(boardsFor("v2"));
      const model = buildModelFromPlaced(tiles);
      let clues: number[] | null = null;
      for (let attempt = 0; attempt < 200 && !clues; attempt += 1) {
        const solution = randomSolution(model);
        expect(solution).not.toBeNull();
        if (!solution) continue;
        clues = await digPuzzleToTarget(solution, model, target, () => true);
      }
      expect(clues).not.toBeNull();
      expect(clues?.filter(Boolean)).toHaveLength(target);
      expect(clues && hasUniqueSolution(clues, model)).toBe(true);
    }, 60000);
  }
});

describe("solution walkthrough", () => {
  it("finishes on the generated solution while retaining candidates at the start", async () => {
    const tiles = placeBoards(boardsFor("v2"));
    const model = buildModelFromPlaced(tiles);
    const solution = randomSolution(model);
    expect(solution).not.toBeNull();
    if (!solution) return;
    const clues = await digPuzzleToTarget(solution, model, 21, () => true);
    expect(clues).not.toBeNull();
    if (!clues) return;
    const walkthrough = buildWalkthrough(clues, solution, model);
    expect(walkthrough.initial.candidates.filter((marks) => marks.length > 0)).toHaveLength(solution.length - 21);
    expect(walkthrough.steps.at(-1)?.values).toEqual(solution);
    let previous = walkthrough.initial;
    for (const step of walkthrough.steps) {
      expect(step.source.length).toBeGreaterThan(0);
      expect(step.groups.length).toBeGreaterThan(0);
      for (const removal of step.eliminations) {
        expect(previous.candidates[removal.tile]).toContain(removal.digit);
        expect(step.candidates[removal.tile]).not.toContain(removal.digit);
        expect(removal.digit).not.toBe(solution[removal.tile]);
      }
      for (const highlight of step.highlights) expect(previous.candidates[highlight.tile]).toContain(highlight.digit);
      for (const placement of step.placements) expect(placement.digit).toBe(solution[placement.tile]);
      previous = step;
    }
  });
});

describe("technique summary", () => {
  it("lists technique step numbers from easiest to hardest", () => {
    const summary = summarizeTechniques([
      { technique: "fish", title: "Swordfish" },
      { technique: "hidden-single", title: "Hidden Single" },
      { technique: "naked-single", title: "Naked Single" },
      { technique: "naked-single", title: "Naked Single" },
      { technique: "fish", title: "X-Wing" },
    ]);
    expect(summary.rows.map((row) => [row.title, row.steps])).toEqual([
      ["Naked Single", [3, 4]], ["Hidden Single", [2]], ["X-Wing", [5]], ["Swordfish", [1]],
    ]);
    expect(summary.difficulty).toBe("Advanced");
  });

  it("rates a singles-only puzzle as Foundation", () => {
    expect(summarizeTechniques([{ technique: "naked-single", title: "Naked Single" }]).difficulty).toBe("Foundation");
  });

  it("rates a subset puzzle as Intermediate", () => {
    expect(summarizeTechniques([{ technique: "naked-subset", title: "Naked Pair" }]).difficulty).toBe("Intermediate");
  });
});