import type {
  GroupName,
  MatchResult,
  GroupStanding,
  KnockoutSlot,
} from "../data/types";
import { TEAMS, ALL_GROUPS } from "../data/teams";
import { KNOCKOUT_SLOTS, KNOCKOUT_MATCHES } from "../data/knockout";
import { computeGroupStandings } from "../logic/standings";
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

  // Third-place slot assignments
  const mapping: { koSlotIndex: number; candidateGroups: GroupName[] }[] = [];
  for (let i = 0; i < KNOCKOUT_SLOTS.length; i++) {
    const gs = parseThirdPlaceGroups(KNOCKOUT_SLOTS[i].label);
    if (gs.length > 0) mapping.push({ koSlotIndex: i, candidateGroups: gs });
  }
  const tpa = assignThirdPlaceSlots(thirdPlaceRanks, mapping);

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

  for (const a of tpa) {
    if (a.assignedTeamId) {
      slots[a.koSlotIndex].teamId = a.assignedTeamId;
      slots[a.koSlotIndex].teamName = getName(a.assignedTeamId);
    }
  }

  // Fill group qualifiers into R32 slots (0–31)
  for (let i = 0; i < 32; i++) {
    if (slots[i].teamId) continue;
    const label = slots[i].label;
    if (label[0] === "1" && label.length === 2) {
      const s = allStandings.get(label[1] as GroupName);
      if (s?.length) {
        slots[i].teamId = s[0].teamId;
        slots[i].teamName = getName(s[0].teamId);
      }
    } else if (label[0] === "2" && label.length === 2) {
      const s = allStandings.get(label[1] as GroupName);
      if (s && s.length > 1) {
        slots[i].teamId = s[1].teamId;
        slots[i].teamName = getName(s[1].teamId);
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
