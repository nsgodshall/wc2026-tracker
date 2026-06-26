import { describe, it, expect } from "vitest";
import { computeThirdPlaceRanking } from "../logic/thirdPlace";
import { computeGroupStandings } from "../logic/standings";
import { ALL_GROUPS } from "../data/teams";
import type { GroupName, GroupStanding, MatchResult } from "../data/types";

/** Build standings by overriding the 3rd-place row for specific groups. */
function buildStandings(
  overrides: Partial<
    Record<
      GroupName,
      {
        teamId: string;
        points: number;
        goalDiff: number;
        goalsFor: number;
        fairPlayPts: number;
      }
    >
  >,
): Map<GroupName, GroupStanding[]> {
  const allStandings = new Map<GroupName, GroupStanding[]>();
  for (const g of ALL_GROUPS) {
    const standings = computeGroupStandings(g, new Map());
    const third = standings[2];
    if (!third) continue;
    const ov = overrides[g];
    if (ov) {
      third.teamId = ov.teamId;
      third.points = ov.points;
      third.goalDiff = ov.goalDiff;
      third.goalsFor = ov.goalsFor;
      third.fairPlayPts = ov.fairPlayPts;
    }
    allStandings.set(g, standings);
  }
  return allStandings;
}

describe("computeThirdPlaceRanking", () => {
  it("returns 12 third-place teams", () => {
    const allStandings = new Map<GroupName, GroupStanding[]>();
    for (const g of ALL_GROUPS) {
      allStandings.set(g, computeGroupStandings(g, new Map()));
    }
    const ranks = computeThirdPlaceRanking(allStandings);
    expect(ranks).toHaveLength(12);
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

  it("includes fairPlayPts and fifaRanking in each rank entry", () => {
    const allStandings = new Map<GroupName, GroupStanding[]>();
    for (const g of ALL_GROUPS) {
      allStandings.set(g, computeGroupStandings(g, new Map()));
    }
    const ranks = computeThirdPlaceRanking(allStandings);

    for (const r of ranks) {
      expect(r).toHaveProperty("fairPlayPts");
      expect(r).toHaveProperty("fifaRanking");
      expect(typeof r.fairPlayPts).toBe("number");
      expect(typeof r.fifaRanking).toBe("number");
    }
  });

  it("breaks ties on fair play points (fewer deductions = better)", () => {
    // Fair play points = card deductions; lower total = cleaner record = better.
    const allStandings = buildStandings({
      A: { teamId: "A3", points: 4, goalDiff: 2, goalsFor: 5, fairPlayPts: 7 },
      B: { teamId: "B3", points: 4, goalDiff: 2, goalsFor: 5, fairPlayPts: 2 },
    });
    const ranks = computeThirdPlaceRanking(allStandings);

    const a = ranks.find((r) => r.teamId === "A3")!;
    const b = ranks.find((r) => r.teamId === "B3")!;

    // B3 has 2 fair play pts vs A3's 7, so B3 should rank higher (lower = better)
    expect(b.rank).toBeLessThan(a.rank);
  });

  it("breaks ties on FIFA ranking when points, GD, GF, and fair play are equal", () => {
    // Find two teams from the real data and compare their FIFA rankings.
    // Create a scenario where everything is equal except ranking.
    const allStandings = buildStandings({
      A: { teamId: "A3", points: 4, goalDiff: 2, goalsFor: 5, fairPlayPts: 0 },
      B: { teamId: "B3", points: 4, goalDiff: 2, goalsFor: 5, fairPlayPts: 0 },
    });
    const ranks = computeThirdPlaceRanking(allStandings);

    const a = ranks.find((r) => r.teamId === "A3")!;
    const b = ranks.find((r) => r.teamId === "B3")!;

    // FIFA ranking should break the tie deterministically
    if (a.fifaRanking !== b.fifaRanking) {
      if (a.fifaRanking < b.fifaRanking) {
        expect(a.rank).toBeLessThan(b.rank);
      } else {
        expect(b.rank).toBeLessThan(a.rank);
      }
    }
    // If rankings happen to be equal (unlikely with distinct teams), ranks differ arbitrarily but deterministically
    expect(a.rank).not.toBe(b.rank);
  });
});
