import { describe, expect, it } from "vitest";

import { boardsFor, placeBoards } from "@/lib/parquet-layouts";
import {
  buildModelFromPlaced,
  digPuzzleToTarget,
  hasUniqueSolution,
  randomSolution,
} from "@/lib/parquet-solver";
import { buildWalkthrough } from "@/lib/parquet-walkthrough";

describe("exact clue generation", () => {
  for (const target of Array.from({ length: 12 }, (_, index) => index + 16)) {
    it(`stops at exactly ${target} givens and remains unique`, async () => {
      const tiles = placeBoards(boardsFor("v2"));
      const model = buildModelFromPlaced(tiles);
      const solution = randomSolution(model);
      expect(solution).not.toBeNull();
      if (!solution) return;
      const clues = await digPuzzleToTarget(solution, model, target, () => true);
      expect(clues).not.toBeNull();
      expect(clues?.filter(Boolean)).toHaveLength(target);
      expect(clues && hasUniqueSolution(clues, model)).toBe(true);
    });
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
  });
});