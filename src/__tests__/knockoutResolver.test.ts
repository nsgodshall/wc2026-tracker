import { describe, expect, it } from "vitest";
import { KNOCKOUT_SLOTS } from "../data/knockout";
import { resolveKnockoutBracket } from "../logic/knockoutResolver";
import type { MatchResult } from "../data/types";

function resultsMap(
  results: { matchId: string; homeScore: number; awayScore: number }[],
): Map<string, MatchResult> {
  const map = new Map<string, MatchResult>();
  for (const r of results) {
    map.set(r.matchId, {
      matchId: r.matchId,
      homeScore: r.homeScore,
      awayScore: r.awayScore,
    });
  }
  return map;
}

function slotIndex(label: string): number {
  const i = KNOCKOUT_SLOTS.findIndex((s) => s.label === label);
  if (i === -1) throw new Error(`Missing knockout slot ${label}`);
  return i;
}

describe("resolveKnockoutBracket", () => {
  it("does not project current standings into knockout slots before teams clinch", () => {
    const { slots } = resolveKnockoutBracket(new Map());

    for (let i = 0; i < KNOCKOUT_SLOTS.length; i++) {
      expect(slots[i].teamId).toBeNull();
    }
  });

  it("does not fill 1st/2nd slots when teams have clinched top 2 but not exact positions", () => {
    // A1 and A3 have both clinched top 2 on 6 pts, but they still play each
    // other for the group title, so neither 1A nor 2A is locked.
    const results = resultsMap([
      { matchId: "G01", homeScore: 1, awayScore: 0 }, // A1 beats A4
      { matchId: "G02", homeScore: 0, awayScore: 1 }, // A3 beats A2
      { matchId: "G25", homeScore: 1, awayScore: 0 }, // A3 beats A4
      { matchId: "G28", homeScore: 1, awayScore: 0 }, // A1 beats A2
    ]);

    const { slots } = resolveKnockoutBracket(results);
    expect(slots[slotIndex("1A")].teamId).toBeNull();
    expect(slots[slotIndex("2A")].teamId).toBeNull();
  });

  it("fills exact group winner and runner-up slots once locked", () => {
    const results = resultsMap([
      { matchId: "G01", homeScore: 1, awayScore: 0 }, // A1 beats A4
      { matchId: "G02", homeScore: 1, awayScore: 0 }, // A2 beats A3
      { matchId: "G25", homeScore: 1, awayScore: 0 }, // A3 beats A4
      { matchId: "G28", homeScore: 1, awayScore: 0 }, // A1 beats A2
      { matchId: "G49", homeScore: 0, awayScore: 1 }, // A1 beats A3
      { matchId: "G50", homeScore: 0, awayScore: 1 }, // A2 beats A4
    ]);

    const { slots } = resolveKnockoutBracket(results);
    expect(slots[slotIndex("1A")].teamId).toBe("A1");
    expect(slots[slotIndex("2A")].teamId).toBe("A2");
    // Best-third slots are not populated until the whole group stage is done.
    expect(slots[slotIndex("3A/B/C/D/F")].teamId).toBeNull();
  });
});
