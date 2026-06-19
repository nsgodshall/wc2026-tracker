import type {
  GroupName,
  MatchResult,
  GroupStanding,
  KnockoutSlot,
} from "../data/types";
import { TEAMS, ALL_GROUPS } from "../data/teams";
import { KNOCKOUT_SLOTS, KNOCKOUT_MATCHES } from "../data/knockout";
import { GROUP_MATCHES } from "../data/schedule";
import { computeGroupStandings } from "../logic/standings";
import { computeGroupOutlook } from "../logic/scenarios";
import {
  computeThirdPlaceRanking,
  assignThirdPlaceSlots,
  type ThirdPlaceRank,
} from "../logic/thirdPlace";

function parseThirdPlaceGroups(label: string): GroupName[] {
  const parts = label.split("/");
  const groups: GroupName[] = [];
  for (const p of parts) {
    const g = p.trim().replace(/^\d/, "");
    if (g.length === 1 && g >= "A" && g <= "L") groups.push(g as GroupName);
  }
  return groups;
}

const getName = (id: string) => TEAMS.find((t) => t.id === id)?.name ?? id;

function lockedGroupSlots(
  group: GroupName,
  results: Map<string, MatchResult>,
): { first: string | null; second: string | null } {
  const outlook = computeGroupOutlook(group, results, getName);
  let first: string | null = null;
  let second: string | null = null;

  for (const team of outlook.teams) {
    if (team.tiebreakUndecided) continue;
    if (team.minPosition === 1 && team.maxPosition === 1) first = team.teamId;
    if (team.minPosition === 2 && team.maxPosition === 2) second = team.teamId;
  }

  return { first, second };
}

/** Fixed bracket progression: R32→R16, R16→QF, QF→SF, SF→Final/3rd */
const R32_TO_SLOT = [
  34, 32, 35, 36, 33, 37, 38, 39, 42, 43, 40, 41, 46, 44, 47, 45,
];
const R16_TO_SLOT = [49, 48, 50, 51, 53, 52, 54, 55];
const QF_TO_SLOT = [57, 56, 58, 59];

export function resolveKnockoutBracket(results: Map<string, MatchResult>): {
  slots: KnockoutSlot[];
  thirdPlaceRanks: ThirdPlaceRank[];
} {
  const allStandings = new Map<GroupName, GroupStanding[]>();
  for (const g of ALL_GROUPS)
    allStandings.set(g, computeGroupStandings(g, results));

  const thirdPlaceRanks = computeThirdPlaceRanking(allStandings);
  const allGroupMatchesPlayed = GROUP_MATCHES.every((m) => {
    const r = results.get(m.id);
    return !!r && r.homeScore !== null && r.awayScore !== null;
  });

  const slots: KnockoutSlot[] = KNOCKOUT_SLOTS.map((s) => ({
    ...s,
    teamId: null,
    teamName: null,
  }));
  // Expand to 64 slots — R16/QF/SF/Final need slots 32–63
  for (let i = slots.length; i < 64; i++) {
    slots.push({
      label: `Slot ${i}`,
      description: "",
      teamId: null,
      teamName: null,
    });
  }

  // Fill only mathematically locked group winners/runners-up into R32 slots.
  // A team that has merely clinched top 2 is not shown until its exact 1st/2nd
  // slot is locked.
  const lockedSlots = new Map<
    GroupName,
    { first: string | null; second: string | null }
  >();
  for (const group of ALL_GROUPS) {
    lockedSlots.set(group, lockedGroupSlots(group, results));
  }

  for (let i = 0; i < 32; i++) {
    const label = slots[i].label;
    if (label[0] === "1" && label.length === 2) {
      const teamId = lockedSlots.get(label[1] as GroupName)?.first;
      if (teamId) {
        slots[i].teamId = teamId;
        slots[i].teamName = getName(teamId);
      }
    } else if (label[0] === "2" && label.length === 2) {
      const teamId = lockedSlots.get(label[1] as GroupName)?.second;
      if (teamId) {
        slots[i].teamId = teamId;
        slots[i].teamName = getName(teamId);
      }
    }
  }

  // Third-place assignments are only displayed once the group stage is complete.
  // Before then, the ranking is a projection/snapshot, not a clinch.
  if (allGroupMatchesPlayed) {
    const mapping: { koSlotIndex: number; candidateGroups: GroupName[] }[] = [];
    for (let i = 0; i < KNOCKOUT_SLOTS.length; i++) {
      const gs = parseThirdPlaceGroups(KNOCKOUT_SLOTS[i].label);
      if (gs.length > 0) mapping.push({ koSlotIndex: i, candidateGroups: gs });
    }
    const tpa = assignThirdPlaceSlots(thirdPlaceRanks, mapping);
    for (const a of tpa) {
      if (a.assignedTeamId) {
        slots[a.koSlotIndex].teamId = a.assignedTeamId;
        slots[a.koSlotIndex].teamName = getName(a.assignedTeamId);
      }
    }
  }

  const rounds = [0, 16, 24, 28]; // start indices of r32, r16, qf, sf in KNOCKOUT_MATCHES
  const progressions = [R32_TO_SLOT, R16_TO_SLOT, QF_TO_SLOT];

  for (let ri = 0; ri < progressions.length; ri++) {
    const count = progressions[ri].length;
    for (let i = 0; i < count; i++) {
      const km = KNOCKOUT_MATCHES[rounds[ri] + i];
      const r = results.get(km.id);
      if (
        !r ||
        r.homeScore === null ||
        r.awayScore === null ||
        r.homeScore === r.awayScore
      )
        continue;
      const homeId = slots[km.homeSlotIndex].teamId;
      const awayId = slots[km.awaySlotIndex].teamId;
      const winner = r.homeScore > r.awayScore ? homeId : awayId;
      if (winner) {
        slots[progressions[ri][i]].teamId = winner;
        slots[progressions[ri][i]].teamName = getName(winner);
      }
    }
  }

  // Semifinals: winners → Final (slots 62, 63), losers → 3rd place (60, 61)
  const sf = [KNOCKOUT_MATCHES[28], KNOCKOUT_MATCHES[29]];
  for (let i = 0; i < 2; i++) {
    const r = results.get(sf[i].id);
    if (!r || r.homeScore === null || r.awayScore === null) continue;
    const homeId = slots[sf[i].homeSlotIndex].teamId;
    const awayId = slots[sf[i].awaySlotIndex].teamId;
    const winner = r.homeScore > r.awayScore ? homeId : awayId;
    const loser = r.homeScore < r.awayScore ? homeId : awayId;
    if (winner) {
      slots[i === 0 ? 62 : 63].teamId = winner;
      slots[i === 0 ? 62 : 63].teamName = getName(winner);
    }
    if (loser) {
      slots[i === 0 ? 60 : 61].teamId = loser;
      slots[i === 0 ? 60 : 61].teamName = getName(loser);
    }
  }

  return { slots, thirdPlaceRanks };
}
