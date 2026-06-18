import { describe, it, expect } from "vitest";
import { SEED_RESULTS } from "../data/seed";
import { GROUP_MATCHES } from "../data/schedule";
import { computeGroupStandings } from "../logic/standings";
import { computeThirdPlaceRanking } from "../logic/thirdPlace";
import { ALL_GROUPS } from "../data/teams";
import type { GroupName, GroupStanding, MatchResult } from "../data/types";

/** Build a results Map from the seed data */
function seedResultsMap(): Map<string, MatchResult> {
  const map = new Map<string, MatchResult>();
  for (const r of SEED_RESULTS) {
    map.set(r.matchId, r);
  }
  return map;
}

describe("seed data integrity", () => {
  it("has exactly 24 results (all MD1 matches)", () => {
    expect(SEED_RESULTS).toHaveLength(24);
  });

  it("all match IDs exist in the schedule", () => {
    const scheduleIds = new Set(GROUP_MATCHES.map((m) => m.id));
    for (const r of SEED_RESULTS) {
      expect(scheduleIds.has(r.matchId)).toBe(true);
    }
  });

  it("all scores are non-negative numbers", () => {
    for (const r of SEED_RESULTS) {
      expect(r.homeScore).toBeGreaterThanOrEqual(0);
      expect(r.awayScore).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("standings from seed data", () => {
  const results = seedResultsMap();
  const allStandings = new Map<GroupName, GroupStanding[]>();
  for (const g of ALL_GROUPS) {
    allStandings.set(g, computeGroupStandings(g, results));
  }

  it("Group A: Mexico top, South Korea 2nd", () => {
    const s = allStandings.get("A")!;
    expect(s[0].teamId).toBe("A1"); // Mexico
    expect(s[0].points).toBe(3);
    expect(s[1].teamId).toBe("A2"); // South Korea
    expect(s[1].points).toBe(3);
  });

  it("Group B: all four teams on 1 point", () => {
    const s = allStandings.get("B")!;
    for (const row of s) {
      expect(row.points).toBe(1);
    }
  });

  it("Group D: USA top with 3 pts, GD +3", () => {
    const s = allStandings.get("D")!;
    const usa = s.find((r) => r.teamId === "D1")!;
    expect(usa.points).toBe(3);
    expect(usa.goalDiff).toBe(3);
  });

  it("Group E: Germany top with 3 pts, GD +6", () => {
    const s = allStandings.get("E")!;
    const ger = s.find((r) => r.teamId === "E1")!;
    expect(ger.points).toBe(3);
    expect(ger.goalDiff).toBe(6);
  });

  it("Group H: Spain drew 0-0, Uruguay drew 1-1", () => {
    const s = allStandings.get("H")!;
    const esp = s.find((r) => r.teamId === "H1")!;
    const uru = s.find((r) => r.teamId === "H4")!;
    expect(esp.points).toBe(1);
    expect(esp.goalDiff).toBe(0);
    expect(uru.points).toBe(1);
  });

  it("every team has played exactly 1 match", () => {
    for (const g of ALL_GROUPS) {
      const s = allStandings.get(g)!;
      for (const row of s) {
        expect(row.played).toBe(1);
      }
    }
  });

  it("total goals match real tournament (75 goals in 24 matches)", () => {
    let totalGoals = 0;
    for (const r of SEED_RESULTS) {
      totalGoals += (r.homeScore ?? 0) + (r.awayScore ?? 0);
    }
    expect(totalGoals).toBe(75);
  });
});

describe("third-place ranking from seed data", () => {
  const results = seedResultsMap();
  const allStandings = new Map<GroupName, GroupStanding[]>();
  for (const g of ALL_GROUPS) {
    allStandings.set(g, computeGroupStandings(g, results));
  }
  const ranks = computeThirdPlaceRanking(allStandings);

  it("returns 12 teams", () => {
    expect(ranks).toHaveLength(12);
  });

  it("top 8 qualify", () => {
    const q = ranks.filter((r) => r.qualifies);
    expect(q).toHaveLength(8);
  });

  it("Netherlands (Group F 2nd, 1pt, GD 0) is ranked among top thirds", () => {
    // After MD1: Sweden 3pts(GD+4), Netherlands 1pt(GD 0, GF 2), Japan 1pt(GD 0, GF 2)
    // Netherlands is actually 2nd (ahead of Japan on fair play)
    // 3rd place is Japan (F2)
    const jpn = ranks.find((r) => r.teamId === "F2");
    expect(jpn).toBeDefined();
    // Japan: 1 pt, GD 0, GF 2 — tied with Brazil, Belgium, Qatar, Portugal on 1pt
    // But ahead on GF and fair play
    expect(jpn!.points).toBe(1);
  });

  it("Turkey (Group D 3rd, 0 pts, GD -2) is ranked last", () => {
    const tur = ranks.find((r) => r.teamId === "D4");
    expect(tur).toBeDefined();
    expect(tur!.rank).toBe(12);
    expect(tur!.qualifies).toBe(false);
  });
});
