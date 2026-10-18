import { useMemo } from "react";

import { COMBINED_SIZE, type PlacedTile } from "@/lib/parquet-layouts";
import { buildModelFromPlaced } from "@/lib/parquet-solver";
import type { WalkthroughStep } from "@/lib/parquet-walkthrough";

const BOARD_COUNT = 9;

export function CellBoard({ tiles, values, givens, spin, label, marks, selected, onSelect, evidence, greens }: { tiles: PlacedTile[]; values: number[]; givens: number[]; spin: number; label: string; marks?: number[][] | undefined; selected?: number | null; onSelect?: (index: number) => void; evidence?: WalkthroughStep | undefined; greens?: Set<number> }) {
  const model = useMemo(() => buildModelFromPlaced(tiles), [tiles]);
  const peers = model.peers;
  const seen = useMemo(() => new Set(selected == null ? [] : peers[selected] ?? []), [peers, selected]);
  const proofGroups = (evidence?.groups ?? []).flatMap((index) => model.groups[index] ? [model.groups[index]] : []);
  const proofTiles = new Set(evidence?.source ?? []);
  const highlightedMarks = new Set(evidence?.highlights.map(({ tile, digit }) => `${tile}-${digit}`) ?? []);
  const removedMarks = new Set(evidence?.eliminations.map(({ tile, digit }) => `${tile}-${digit}`) ?? []);
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
        >
          {Array.from({ length: COMBINED_SIZE * COMBINED_SIZE }).map((_, cell) => {
            const row = Math.floor(cell / COMBINED_SIZE);
            const col = cell % COMBINED_SIZE;
            const self = owner.get(cell);
            const inAxis = proofGroups.some((group) => group.kind === "row" ? group.index === row : group.kind === "column" ? group.index === col : group.index === tiles[self ?? -1]?.boardIndex);
            const sameAs = (r: number, c: number) =>
              r >= 0 && c >= 0 && r < COMBINED_SIZE && c < COMBINED_SIZE && owner.get(r * COMBINED_SIZE + c) === self;
            return (
              <div
                key={cell}
                onClick={onSelect && self !== undefined ? () => onSelect(self) : undefined}
                data-cell={cell}
                data-axis={inAxis || undefined}
                className={`border-solid border-foreground/60 ${onSelect ? "cursor-pointer" : ""} ${self !== undefined && greens?.has(self) ? "bg-custom-cell" : self !== undefined && proofTiles.has(self) ? "bg-step-highlight" : self !== undefined && self === selected ? "bg-step-highlight" : inAxis || (self !== undefined && seen.has(self)) ? "bg-step-axis" : givens[self ?? -1] ? "bg-given-surface" : "bg-card"}`}
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
                data-value-tile={index}
                className={`absolute -translate-x-1/2 -translate-y-1/2 text-sm font-bold sm:text-lg ${givens[index] ? "text-given-ink" : "text-solved-ink"}`}
                style={{ top: `${top}%`, left: `${left}%` }}
              >
                {value}
              </span>
            );
          })}
          {marks?.map((digitsHere, index) => {
            const position = digits[index];
            const removed = evidence?.eliminations.filter((item) => item.tile === index).map((item) => item.digit) ?? [];
            if (!position || (!digitsHere.length && !removed.length) || values[index]) return null;
            return (
              <span
                key={`m-${index}`}
                className="absolute grid h-[min(7%,1.7rem)] w-[min(7%,1.7rem)] -translate-x-1/2 -translate-y-1/2 grid-cols-3 place-items-center text-[0.51rem] font-semibold leading-none text-solved-ink sm:text-[0.69rem]"
                style={{ top: `${position.top}%`, left: `${position.left}%` }}
              >
                {Array.from({ length: 9 }, (_, digit) => {
                  const number = digit + 1;
                  const crossed = removedMarks.has(`${index}-${number}`);
                  const highlighted = highlightedMarks.has(`${index}-${number}`);
                  return <span key={digit} data-candidate={digitsHere.includes(number) || crossed ? `${index}-${number}` : undefined} data-removed={crossed || undefined} className={crossed ? "text-elimination-ink line-through decoration-2" : highlighted ? "bg-step-highlight font-extrabold ring-1 ring-solved-ink" : ""}>{digitsHere.includes(number) || crossed ? number : ""}</span>;
                })}
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

