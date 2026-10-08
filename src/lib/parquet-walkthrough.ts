import { countSolutions, type PuzzleModel } from "@/lib/parquet-solver";
import type { TechniqueId } from "@/lib/techniques";

const ALL = 0x1ff;

export type WalkthroughState = {
  values: number[];
  candidates: number[][];
};

export type WalkthroughStep = WalkthroughState & {
  technique: TechniqueId;
  title: string;
  explanation: string;
  affected: number[];
};

export type Walkthrough = {
  initial: WalkthroughState;
  steps: WalkthroughStep[];
};

function bitCount(value: number): number {
  let count = 0;
  for (let bits = value; bits; bits &= bits - 1) count += 1;
  return count;
}

function digits(mask: number): number[] {
  const result: number[] = [];
  for (let digit = 1; digit <= 9; digit += 1) if (mask & (1 << (digit - 1))) result.push(digit);
  return result;
}

function maskFor(values: number[], model: PuzzleModel, index: number): number {
  let used = 0;
  for (const peer of model.peers[index] ?? []) {
    const value = values[peer] ?? 0;
    if (value) used |= 1 << (value - 1);
  }
  return ALL & ~used;
}

function snapshot(values: number[], masks: number[]): WalkthroughState {
  return { values: [...values], candidates: masks.map((mask, index) => values[index] ? [] : digits(mask)) };
}

function combinations(items: number[], size: number): number[][] {
  const result: number[][] = [];
  const visit = (start: number, chosen: number[]) => {
    if (chosen.length === size) { result.push([...chosen]); return; }
    for (let index = start; index <= items.length - (size - chosen.length); index += 1) {
      const item = items[index];
      if (item !== undefined) visit(index + 1, [...chosen, item]);
    }
  };
  visit(0, []);
  return result;
}

export function buildWalkthrough(clues: number[], solution: number[], model: PuzzleModel): Walkthrough {
  const values = [...clues];
  const masks = values.map((value, index) => value ? 0 : maskFor(values, model, index));
  const initial = snapshot(values, masks);
  const steps: WalkthroughStep[] = [];

  const record = (technique: TechniqueId, title: string, explanation: string, affected: number[]) => {
    steps.push({ ...snapshot(values, masks), technique, title, explanation, affected });
  };

  const place = (index: number, digit: number, technique: TechniqueId, title: string, explanation: string) => {
    values[index] = digit;
    masks[index] = 0;
    const bit = 1 << (digit - 1);
    const affected = [index];
    for (const peer of model.peers[index] ?? []) {
      const peerMask = masks[peer] ?? 0;
      if (values[peer] || !(peerMask & bit)) continue;
      masks[peer] = peerMask & ~bit;
      affected.push(peer);
    }
    record(technique, title, explanation, affected);
  };

  const eliminate = (removals: Array<[number, number]>, technique: TechniqueId, title: string, explanation: string) => {
    const affected: number[] = [];
    for (const [index, removalMask] of removals) {
      if (values[index]) continue;
      const current = masks[index] ?? 0;
      const next = current & ~removalMask;
      if (next === current || next === 0) continue;
      masks[index] = next;
      affected.push(index);
    }
    if (affected.length) record(technique, title, explanation, affected);
    return affected.length > 0;
  };

  const findNakedSubset = (): boolean => {
    for (const group of model.groups) {
      const unsolved = group.tiles.filter((index) => !values[index] && bitCount(masks[index] ?? 0) >= 2);
      for (let size = 2; size <= 4; size += 1) {
        for (const cells of combinations(unsolved, size)) {
          const union = cells.reduce((mask, index) => mask | (masks[index] ?? 0), 0);
          if (bitCount(union) !== size) continue;
          const cellSet = new Set(cells);
          const removals = group.tiles.filter((index) => !cellSet.has(index)).map((index) => [index, union] as [number, number]);
          if (eliminate(removals, "naked-subset", `Naked ${size === 2 ? "Pair" : size === 3 ? "Triple" : "Quad"}`, `Digits ${digits(union).join(", ")} are confined to ${size} tiles in ${group.label}.`)) return true;
        }
      }
    }
    return false;
  };

  const findHiddenSubset = (): boolean => {
    const digitBits = Array.from({ length: 9 }, (_, index) => 1 << index);
    for (const group of model.groups) {
      for (let size = 2; size <= 4; size += 1) {
        for (const bits of combinations(digitBits, size)) {
          const subsetMask = bits.reduce((mask, bit) => mask | bit, 0);
          const cells = group.tiles.filter((index) => !values[index] && ((masks[index] ?? 0) & subsetMask));
          if (cells.length !== size || bits.some((bit) => !cells.some((index) => (masks[index] ?? 0) & bit))) continue;
          const removals = cells.map((index) => [index, (masks[index] ?? 0) & ~subsetMask] as [number, number]);
          if (eliminate(removals, "hidden-subset", `Hidden ${size === 2 ? "Pair" : size === 3 ? "Triple" : "Quad"}`, `Only these ${size} tiles in ${group.label} can contain ${digits(subsetMask).join(", ")}.`)) return true;
        }
      }
    }
    return false;
  };

  const findLocked = (): boolean => {
    for (let firstIndex = 0; firstIndex < model.groups.length; firstIndex += 1) {
      const first = model.groups[firstIndex];
      if (!first) continue;
      for (let digit = 1; digit <= 9; digit += 1) {
        const bit = 1 << (digit - 1);
        const places = first.tiles.filter((index) => !values[index] && ((masks[index] ?? 0) & bit));
        if (places.length < 2) continue;
        for (let secondIndex = 0; secondIndex < model.groups.length; secondIndex += 1) {
          if (firstIndex === secondIndex) continue;
          const second = model.groups[secondIndex];
          if (!second || first.kind === second.kind || !places.every((index) => second.tiles.includes(index))) continue;
          const removals = second.tiles.filter((index) => !places.includes(index)).map((index) => [index, bit] as [number, number]);
          if (eliminate(removals, "locked-candidates", "Locked Candidates", `${digit} is locked into the overlap of ${first.label} and ${second.label}.`)) return true;
        }
      }
    }
    return false;
  };

  const findFish = (): boolean => {
    for (const [baseKind, crossKind] of [["row", "column"], ["column", "row"]] as const) {
      const bases = model.groups.filter((group) => group.kind === baseKind);
      const crosses = model.groups.filter((group) => group.kind === crossKind);
      for (let digit = 1; digit <= 9; digit += 1) {
        const bit = 1 << (digit - 1);
        for (let size = 2; size <= 4; size += 1) {
          for (const baseSet of combinations(bases.map((_, index) => index), size)) {
            const baseGroups = baseSet.map((index) => bases[index]).filter((group) => group !== undefined);
            const candidateTiles = new Set(baseGroups.flatMap((group) => group.tiles.filter((index) => !values[index] && ((masks[index] ?? 0) & bit))));
            if (!candidateTiles.size) continue;
            const crossSet = crosses.filter((group) => [...candidateTiles].some((index) => group.tiles.includes(index)));
            if (crossSet.length !== size || baseGroups.some((group) => !group.tiles.some((index) => candidateTiles.has(index)))) continue;
            const baseTiles = new Set(baseGroups.flatMap((group) => group.tiles));
            const removals = crossSet.flatMap((group) => group.tiles.filter((index) => !baseTiles.has(index)).map((index) => [index, bit] as [number, number]));
            const name = size === 2 ? "X-Wing" : size === 3 ? "Swordfish" : "Jellyfish";
            if (eliminate(removals, "fish", name, `${digit} is confined to ${size} matching ${baseKind} and ${crossKind} groups.`)) return true;
          }
        }
      }
    }
    return false;
  };

  let safety = 0;
  while (values.some((value) => value === 0) && safety < 500) {
    safety += 1;
    let moved = false;
    for (let index = 0; index < values.length; index += 1) {
      if (!values[index] && bitCount(masks[index] ?? 0) === 1) {
        const digit = digits(masks[index] ?? 0)[0];
        if (digit !== undefined) place(index, digit, "naked-single", "Naked Single", `${digit} is the only candidate left in this tile.`);
        moved = true;
        break;
      }
    }
    if (moved) continue;

    for (const group of model.groups) {
      for (let digit = 1; digit <= 9; digit += 1) {
        const bit = 1 << (digit - 1);
        const places = group.tiles.filter((index) => !values[index] && ((masks[index] ?? 0) & bit));
        if (places.length === 1) {
          const index = places[0];
          if (index !== undefined) place(index, digit, "hidden-single", "Hidden Single", `${digit} can appear in only one tile in ${group.label}.`);
          moved = true;
          break;
        }
      }
      if (moved) break;
    }
    if (moved) continue;
    if (findLocked() || findNakedSubset() || findHiddenSubset() || findFish()) continue;

    const index = values.findIndex((value) => value === 0);
    if (index < 0) break;
    const correct = solution[index] ?? 0;
    const alternatives = digits(masks[index] ?? 0).filter((digit) => digit !== correct);
    const contradicted = alternatives.filter((digit) => {
      const trial = [...values];
      trial[index] = digit;
      return countSolutions(trial, model, 1) === 0;
    });
    if (!correct || contradicted.length !== alternatives.length) break;
    place(index, correct, "forcing-chain", "Forcing Chain", `Testing ${alternatives.join(", ") || "every alternative"} leads to a contradiction, so ${correct} is forced.`);
  }

  return { initial, steps };
}