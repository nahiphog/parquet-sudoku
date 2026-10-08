# Add exact-clue puzzles and guided solving

## Changes

- Center every candidate list inside its merged tile and keep candidates visible on the puzzle at all times.
- Add a separate Techniques page linked from the header. It will list only the techniques the app can actually detect and demonstrate, grouped by difficulty with a short explanation of each.
- Replace the existing low-clue hunt control with an exact-clue generator for 16–27 givens. Digging will stop immediately when the selected count is reached while preserving a unique solution after every removal.
- Add a solution walkthrough below the generated puzzle with previous/next controls, the current technique name and explanation, and a board showing the accumulated solved values and remaining candidates.
- During the walkthrough, candidate eliminations will disappear from the centered notation while placements become full-size digits.
- Keep the existing layout-version picker, ordinary minimal-puzzle generation, cell inspection/highlighting, theme control, and completed-solution board.

## Solver repertoire

The first deterministic repertoire will contain techniques that can be expressed safely against Parquet Sudoku’s overlapping row, column, and region groups:

- Naked Single
- Hidden Single
- Locked Candidates
- Naked Pair, Triple, and Quad
- Hidden Pair, Triple, and Quad
- X-Wing, Swordfish, and Jellyfish
- Forcing Chain by contradiction as a guaranteed final logical proof when the pattern techniques stall

The Techniques page will distinguish placement techniques from candidate-elimination techniques and describe how merged tiles can belong to multiple rows or columns.

## Technical details

- Extend the puzzle model with named all-different groups and tile-to-group membership so techniques can produce human-readable steps.
- Add an exact-target digging function that randomizes removal order, retains only uniqueness-preserving removals, and stops at exactly the selected clue count; retry with a new completed grid only if a pass unexpectedly cannot reach the target.
- Build a pure walkthrough engine whose state is a value array plus candidate masks. Each step records the technique, affected tiles, placements, eliminations, and explanation.
- Use exact contradiction checks only for the forcing-chain fallback, ensuring every unique generated puzzle has a complete walkthrough rather than presenting unsupported logical claims.
- Add focused tests for every requested exact target (16 through 27), centered-candidate data placement, and walkthrough completion against the known solution.
- Add unique route metadata for the Techniques page and preserve the existing home-page metadata.

## Validation

- Generate both layout versions at several exact targets, including 16 and 27, and confirm the displayed given count is exact and the puzzle remains unique.
- Step through a complete walkthrough and confirm candidates are always visible, eliminations disappear at the relevant step, and the final board matches the solution.
- Check the puzzle and Techniques page on desktop and mobile, including dark mode and merged-tile candidate centering.
