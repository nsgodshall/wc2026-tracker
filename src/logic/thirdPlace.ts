import type { GroupStanding, GroupName } from "../data/types";
import { ALL_GROUPS } from "../data/teams";

/**
 * Identifies the best 8 third-place finishers across all 12 groups.
 * Ranking criteria (same as group tiebreakers but across groups):
 *   1. Points
 *   2. Goal difference
 *   3. Goals scored
 *   4. Fair play points
 *   5. Drawing of lots
 */
export interface ThirdPlaceRank {
  teamId: string;
  group: GroupName;
  rank: number;
  qualifies: boolean; // top 8 qualify
  points: number;
  goalDiff: number;
  goalsFor: number;
}

export function computeThirdPlaceRanking(
  allStandings: Map<GroupName, GroupStanding[]>,
): ThirdPlaceRank[] {
  const thirds: ThirdPlaceRank[] = [];

  for (const group of ALL_GROUPS) {
    const standings = allStandings.get(group);
    if (!standings) continue;
    const third = standings[2]; // 0-indexed, so [2] = 3rd place
    if (!third) continue;
    thirds.push({
      teamId: third.teamId,
      group: group,
      rank: 0,
      qualifies: false,
      points: third.points,
      goalDiff: third.goalDiff,
      goalsFor: third.goalsFor,
    });
  }

  // Sort by criteria across groups
  thirds.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
    // fair play and drawing of lots not implemented
    return 0;
  });

  // Assign ranks and qualification
  for (let i = 0; i < thirds.length; i++) {
    thirds[i].rank = i + 1;
    thirds[i].qualifies = i < 8;
  }

  return thirds;
}

/**
 * Given third place rankings, determine which specific
 * best-3rd slot each qualified third-place team fills.
 *
 * Each R32 knockout slot specifies candidate groups (e.g., "3C/D/E/F").
 * We match the highest-ranked qualifying 3rd-place team from those
 * candidate groups to the slot, then remove that team from consideration.
 */
export interface ThirdPlaceSlot {
  koSlotIndex: number;
  koLabel: string;
  candidateGroups: GroupName[];
  assignedTeamId: string | null;
}

export function assignThirdPlaceSlots(
  thirdPlaceRanks: ThirdPlaceRank[],
  candidateMapping: { koSlotIndex: number; candidateGroups: GroupName[] }[],
): ThirdPlaceSlot[] {
  const qualifying = thirdPlaceRanks
    .filter((t) => t.qualifies)
    .sort((a, b) => a.rank - b.rank);

  const results: ThirdPlaceSlot[] = candidateMapping.map((m) => ({
    koSlotIndex: m.koSlotIndex,
    koLabel: `3rd (${m.candidateGroups.join(",")})`,
    candidateGroups: m.candidateGroups,
    assignedTeamId: null,
  }));

  // Available teams (can be assigned to a slot whose candidates contain them)
  const available = new Map<string, ThirdPlaceRank>();
  for (const q of qualifying) {
    available.set(q.teamId, q);
  }

  // For each slot, find the highest-ranked qualifying team from its candidate groups
  for (const slot of results) {
    let best: ThirdPlaceRank | null = null;
    for (const q of qualifying) {
      if (available.has(q.teamId) && slot.candidateGroups.includes(q.group)) {
        if (!best || q.rank < best.rank) {
          best = q;
        }
      }
    }
    if (best) {
      slot.assignedTeamId = best.teamId;
      available.delete(best.teamId);
    }
  }

  return results;
}
