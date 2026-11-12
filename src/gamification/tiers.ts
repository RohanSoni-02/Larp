import { TIERS } from './constants';

export type TierProgress = {
  /** 0 = Larping … 3 = Legit */
  index: number;
  name: string;
  /** Progress toward the next tier; null when already Legit. */
  next: {
    name: string;
    hoursNeeded: number;
    hoursDone: number;
    nodesNeeded: number;
    nodesDone: number;
  } | null;
};

/** Nodes required for a tier, capped at the number of nodes in the skill's tree. */
export function tierNeedNodes(tierIndex: number, totalNodesInTree: number): number {
  return Math.min(TIERS[tierIndex]!.nodes, Math.max(0, totalNodesInTree));
}

/**
 * Tier from practice hours + landed nodes. Node requirements cap at the tree
 * size (e.g. calisthenics has 11 nodes, so Legit needs 11, not 12).
 * Note: "Legit" additionally requires vouches — enforced server-side; this
 * function computes the hours/nodes part only.
 */
export function tierFromProgress(
  practiceMinutes: number,
  nodesLanded: number,
  totalNodesInTree: number,
): TierProgress {
  const hours = practiceMinutes / 60;
  let index = 0;
  for (let i = 0; i < TIERS.length; i += 1) {
    if (hours >= TIERS[i]!.hours && nodesLanded >= tierNeedNodes(i, totalNodesInTree)) {
      index = i;
    }
  }
  const nextIndex = index + 1;
  const next =
    nextIndex < TIERS.length
      ? {
          name: TIERS[nextIndex]!.name,
          hoursNeeded: TIERS[nextIndex]!.hours,
          hoursDone: Math.floor(hours * 10) / 10,
          nodesNeeded: tierNeedNodes(nextIndex, totalNodesInTree),
          nodesDone: nodesLanded,
        }
      : null;
  return { index, name: TIERS[index]!.name, next };
}
