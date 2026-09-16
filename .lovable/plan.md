# Add playable numbers and instructions

## Changes
- Change the main action label to “Generate a grid”.
- Extend generation so every parquet tile receives one number from 1–9.
- Enforce that each of the 12 horizontal lines, 12 vertical lines, and nine 4×4 regions contains every number exactly once, accounting for tiles that span two cells.
- Render all 81 assigned numbers centered inside their tiles.
- Add an information icon at the top left that opens a small “How to play” popup with the supplied instructions and can be dismissed.
- Verify repeated generation and the compact layout in the running preview.

## Technical details
- Model each parquet tile as one Sudoku cell and derive row, column, and region memberships from its occupied grid coordinates.
- Use randomized constraint propagation with backtracking to assign digits while preventing duplicates in every membership group.
- Keep the existing parquet-layout rules and visual treatment unchanged apart from the requested numbers and information control.
