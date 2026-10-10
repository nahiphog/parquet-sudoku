<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep Parquet Sudoku constraint logic in pure `src/lib` modules so generation, uniqueness, and walkthrough rules share one tested model.
- Define the walkthrough repertoire in one catalog module so every displayed technique corresponds to an implemented solver step.
- Record step evidence alongside post-step snapshots in the pure walkthrough model; render eliminated candidates as a temporary overlay so navigation never mutates solver state.
- Derive technique tally ordering and difficulty from the shared catalog rather than clue count, so summaries reflect the implemented solving repertoire.
