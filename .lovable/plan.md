# Add puzzle digging and compact controls

## Changes
- Replace the introductory content with a slim header: information button left, “Parquet Sudoku” centered, and a minimalist sun/moon theme control right.
- Remember the selected light or dark appearance and apply it across the page.
- Turn “How to play” into a two-page popup with navigation and a page indicator:
  - Page 1 keeps the current rules text.
  - Page 2 shows the two inspiration references, opening external destinations safely in a new tab.
- Remove the title block, description, placement rules, and generated-grid counter.
- Generate a complete valid board, then dig clues in randomized order. Keep a removal only when an exact solver confirms that the remaining clues have one solution.
- Show the minimal uniquely solvable puzzle beside the completed solution, with the puzzle on the left on wide screens and above the solution on small screens.
- Show the elapsed generation time and a clear generating state while uniqueness checks run.

## Technical details
- Derive the 33 all-different groups from each tile’s occupied rows, columns, and 4×4 region.
- Use bitmask candidates, constraint propagation, and minimum-remaining-values backtracking; uniqueness checks stop immediately after finding a second solution.
- Yield periodically during digging so the page stays usable, and discard stale work if generation is triggered again.
- Keep the current parquet placement rules and 81-cell completed-board construction.
- Use the supplied World Puzzle Federation PDF. The second inspiration text lacks a destination URL, so use the closest verified Parquet puzzle reference unless an exact link is supplied.
- Validate clue minimality, uniqueness, elapsed-time display, theme switching, popup navigation, and desktop/mobile layout in the running preview.
