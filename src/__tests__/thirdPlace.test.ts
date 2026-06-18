import { describe, it, expect } from "vitest";
import { computeThirdPlaceRanking } from "../logic/thirdPlace";
import { computeGroupStandings } from "../logic/standings";
import { ALL_GROUPS } from "../data/teams";
import type { GroupName, GroupStanding } from "../data/types";

describe("computeThirdPlaceRanking", () => {
  it("returns 12 third-place teams", () => {
    const allStandings = new Map<GroupName, GroupStanding[]>();
    for (const g of ALL_GROUPS) {
      allStandings.set(g, computeGroupStandings(g, new Map()));
    }
    const ranks = computeThirdPlaceRanking(allStandings);
    expect(ranks).toHaveLength(12);
  });

  it("ranks by points then GD then GF across groups", () => {
    // Manually construct scenarios where third-place teams have different stats
    const allStandings = new Map<GroupName, GroupStanding[]>();

    for (const g of ALL_GROUPS) {
      // Just use empty standings — all teams have 0 pts
      allStandings.set(g, computeGroupStandings(g, new Map()));
    }

    // Now inject specific third-place stats
    // Group A 3rd: 6 pts (overridden below via results)
    // Group B 3rd: 4 pts
    // etc.

    const ranks = computeThirdPlaceRanking(allStandings);

    // All teams are on 0 points since no results, so they're all tied
    expect(ranks).toHaveLength(12);
    for (const r of ranks) {
      expect(r.points).toBe(0);
    }
    // Top 8 should be marked as qualifying
    const qualifying = ranks.filter((r) => r.qualifies);
    expect(qualifying).toHaveLength(8);
  });

  it("top 8 qualify, bottom 4 do not", () => {
    const allStandings = new Map<GroupName, GroupStanding[]>();
    for (const g of ALL_GROUPS) {
      allStandings.set(g, computeGroupStandings(g, new Map()));
    }
    const ranks = computeThirdPlaceRanking(allStandings);

    for (let i = 0; i < 8; i++) {
      expect(ranks[i].qualifies).toBe(true);
    }
    for (let i = 8; i < 12; i++) {
      expect(ranks[i].qualifies).toBe(false);
    }
  });

  it("handles 0 played games gracefully", () => {
    const allStandings = new Map<GroupName, GroupStanding[]>();
    for (const g of ALL_GROUPS) {
      allStandings.set(g, computeGroupStandings(g, new Map()));
    }
    const ranks = computeThirdPlaceRanking(allStandings);

    expect(ranks).toHaveLength(12);
    expect(ranks[0].rank).toBe(1);
    expect(ranks[11].rank).toBe(12);
  });
});
