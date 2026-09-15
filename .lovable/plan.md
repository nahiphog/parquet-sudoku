# Build a 12×12 Parquet Sudoku generator

## Changes
- Generate nine independent valid 4×4 parquet layouts whenever the button is pressed.
- Arrange those boards in a seamless 3×3 formation, creating a combined 12×12 grid.
- Remove all text labels and distinct fill colors from the tiles while retaining subtle boundaries so each tile remains visible.
- Update the count text and page wording to describe the combined grid.
- Verify generation and the mobile layout in the running preview.

## Technical details
- Reuse the existing validated 4×4 layout generator for each of the nine sections.
- Keep each tile’s dimensions and placement rules unchanged within its own 4×4 section.
- Render the nine sections through one board component with stable sizing and accessible labeling.
