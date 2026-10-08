export type TechniqueId =
  | "naked-single"
  | "hidden-single"
  | "locked-candidates"
  | "naked-subset"
  | "hidden-subset"
  | "fish"
  | "forcing-chain";

export type Technique = {
  id: TechniqueId;
  name: string;
  level: "Foundation" | "Intermediate" | "Advanced";
  summary: string;
  detail: string;
};

export const TECHNIQUES: Technique[] = [
  {
    id: "naked-single",
    name: "Naked Single",
    level: "Foundation",
    summary: "A tile has only one candidate left.",
    detail: "Place the remaining candidate. The tile's rows, columns, and region have ruled out every other digit.",
  },
  {
    id: "hidden-single",
    name: "Hidden Single",
    level: "Foundation",
    summary: "A digit has only one possible tile in a group.",
    detail: "Even when that tile has several candidates, one digit appears nowhere else in the row, column, or region.",
  },
  {
    id: "locked-candidates",
    name: "Locked Candidates",
    level: "Intermediate",
    summary: "A digit is confined to the overlap of two groups.",
    detail: "If every place for a digit in one group also belongs to another group, remove that digit from the rest of the second group.",
  },
  {
    id: "naked-subset",
    name: "Naked Pair, Triple & Quad",
    level: "Intermediate",
    summary: "Two to four tiles contain the same-sized set of candidates.",
    detail: "Those digits must occupy those tiles, so they can be removed from all other tiles in the group.",
  },
  {
    id: "hidden-subset",
    name: "Hidden Pair, Triple & Quad",
    level: "Intermediate",
    summary: "Two to four digits are restricted to the same number of tiles.",
    detail: "Keep only those digits in the subset's tiles and remove their other candidates.",
  },
  {
    id: "fish",
    name: "X-Wing, Swordfish & Jellyfish",
    level: "Advanced",
    summary: "A digit is restricted across matching sets of rows and columns.",
    detail: "Two, three, or four base groups cover the same number of cross groups, eliminating the digit elsewhere in those cross groups.",
  },
  {
    id: "forcing-chain",
    name: "Forcing Chain by Contradiction",
    level: "Advanced",
    summary: "Every alternative candidate leads to a contradiction.",
    detail: "Test each candidate against the constraints. When all alternatives fail, the surviving candidate is forced.",
  },
];

export function techniqueById(id: TechniqueId): Technique {
  const found = TECHNIQUES.find((technique) => technique.id === id);
  if (found) return found;
  return {
    id: "naked-single",
    name: "Naked Single",
    level: "Foundation",
    summary: "A tile has only one candidate left.",
    detail: "Place the remaining candidate.",
  };
}