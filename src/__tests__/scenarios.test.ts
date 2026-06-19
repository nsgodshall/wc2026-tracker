import { describe, it, expect } from "vitest";
import { computeGroupOutlook, type TeamOutlook } from "../logic/scenarios";
import { getTeamById } from "../data/teams";
import type { MatchResult } from "../data/types";

function resultsMap(
  results: { matchId: string; homeScore: number; awayScore: number }[],
): Map<string, MatchResult> {
  const map = new Map<string, MatchResult>();
  for (const r of results) {
    map.set(r.matchId, { matchId: r.matchId, homeScore: r.homeScore, awayScore: r.awayScore });
  }
  return map;
}

const nameOf = (id: string) => getTeamById(id)?.name ?? id;

function team(outlook: ReturnType<typeof computeGroupOutlook>, id: string): TeamOutlook {
  return outlook.teams.find((t) => t.teamId === id)!;
}

// Group A fixtures:
//   G01 A1 v A4   G02 A2 v A3   (MD1)
//   G25 A3 v A4   G28 A1 v A2   (MD2)
//   G49 A3 v A1   G50 A4 v A2   (MD3)

describe("computeGroupOutlook — status classification", () => {
  it("marks two runaway teams as clinched and the others eliminated", () => {
    // A1 & A3 both reach 6 pts after MD2; A2 & A4 stuck on 0 (max 3).
    const results = resultsMap([
      { matchId: "G01", homeScore: 1, awayScore: 0 }, // A1 beats A4
      { matchId: "G02", homeScore: 0, awayScore: 1 }, // A3 beats A2
      { matchId: "G25", homeScore: 1, awayScore: 0 }, // A3 beats A4
      { matchId: "G28", homeScore: 1, awayScore: 0 }, // A1 beats A2
    ]);
    const outlook = computeGroupOutlook("A", results, nameOf);

    expect(team(outlook, "A1").status).toBe("clinched-top2");
    expect(team(outlook, "A3").status).toBe("clinched-top2");
    expect(team(outlook, "A2").status).toBe("eliminated");
    expect(team(outlook, "A4").status).toBe("eliminated");

    // A clinched team's every remaining result still guarantees top 2.
    for (const r of team(outlook, "A1").ownResults) {
      expect(r.verdict).toBe("guarantees");
    }
    // An eliminated team can never reach top 2.
    for (const r of team(outlook, "A2").ownResults) {
      expect(r.verdict).toBe("impossible");
    }
  });

  it("marks a dominant leader as having won the group", () => {
    const results = resultsMap([
      { matchId: "G01", homeScore: 3, awayScore: 0 }, // A1 big win
      { matchId: "G02", homeScore: 0, awayScore: 0 },
      { matchId: "G25", homeScore: 0, awayScore: 0 },
      { matchId: "G28", homeScore: 3, awayScore: 0 }, // A1 big win
      { matchId: "G50", homeScore: 0, awayScore: 0 },
    ]);
    // Only G49 (A3 v A1) remains; A1 on 6 is unreachable (others max 5).
    const outlook = computeGroupOutlook("A", results, nameOf);

    expect(team(outlook, "A1").status).toBe("won-group");
    expect(team(outlook, "A1").remainingForTeam).toBe(1);
    for (const r of team(outlook, "A1").ownResults) {
      expect(r.verdict).toBe("guarantees");
    }
  });
});

describe("computeGroupOutlook — final-day scenarios", () => {
  it("derives a goal-margin denial threshold for a draw", () => {
    // A1 runaway 1st on 6. A2 on 3 leads A3 (1) for 2nd; A2 plays weak A4,
    // A3 plays A1. A2's draw is enough unless A3 beats A1 by 2+.
    const results = resultsMap([
      { matchId: "G01", homeScore: 2, awayScore: 0 }, // A1 2-0 A4
      { matchId: "G02", homeScore: 2, awayScore: 0 }, // A2 2-0 A3
      { matchId: "G25", homeScore: 1, awayScore: 1 }, // A3 1-1 A4
      { matchId: "G28", homeScore: 2, awayScore: 0 }, // A1 2-0 A2
    ]);
    const outlook = computeGroupOutlook("A", results, nameOf);
    expect(outlook.finalMatchday).toBe(true);

    const a2 = team(outlook, "A2");
    expect(a2.status).toBe("alive");

    const win = a2.ownResults.find((r) => r.result === "win")!;
    const draw = a2.ownResults.find((r) => r.result === "draw")!;
    const loss = a2.ownResults.find((r) => r.result === "loss")!;

    expect(win.verdict).toBe("guarantees"); // away win mapped correctly
    expect(loss.verdict).toBe("impossible");
    expect(draw.verdict).toBe("possible");
    expect(draw.marginText).toBe("Safe unless Czech Republic beat Mexico by 2+");
  });
});

describe("computeGroupOutlook — undecided tiebreaks", () => {
  it("flags two teams that finish identical with an equal head-to-head", () => {
    const results = resultsMap([
      { matchId: "G01", homeScore: 2, awayScore: 0 }, // A1 2-0 A4
      { matchId: "G02", homeScore: 2, awayScore: 0 }, // A2 2-0 A3
      { matchId: "G25", homeScore: 2, awayScore: 0 }, // A3 2-0 A4
      { matchId: "G28", homeScore: 1, awayScore: 1 }, // A1 1-1 A2 (equal H2H)
      { matchId: "G49", homeScore: 0, awayScore: 2 }, // A1 beats A3 (away)
      { matchId: "G50", homeScore: 0, awayScore: 2 }, // A2 beats A4 (away)
    ]);
    const outlook = computeGroupOutlook("A", results, nameOf);

    // A1 & A2 both finish 7 pts, +4 GD, 5 GF, and drew each other.
    expect(team(outlook, "A1").tiebreakUndecided).toBe(true);
    expect(team(outlook, "A2").tiebreakUndecided).toBe(true);
    expect(team(outlook, "A3").tiebreakUndecided).toBe(false);

    // All matches played: both are top-2, none "alive".
    expect(["won-group", "clinched-top2"]).toContain(team(outlook, "A1").status);
    expect(["won-group", "clinched-top2"]).toContain(team(outlook, "A2").status);
    expect(team(outlook, "A1").ownResults).toHaveLength(0);
  });
});

describe("computeGroupOutlook — edge cases", () => {
  it("handles a group with no results yet (all alive, four games left)", () => {
    const outlook = computeGroupOutlook("A", new Map(), nameOf);
    expect(outlook.remainingMatchIds).toHaveLength(6);
    expect(outlook.finalMatchday).toBe(false);
    for (const t of outlook.teams) {
      expect(t.status).toBe("alive");
      expect(t.minPosition).toBe(1);
      expect(t.maxPosition).toBe(4);
      // Two remaining games each: narrative is suppressed.
      expect(t.ownResults).toHaveLength(0);
    }
  });

  it("narrates per-result verdicts once a team has a single game left", () => {
    const results = resultsMap([
      { matchId: "G01", homeScore: 2, awayScore: 0 }, // A1 2-0 A4
      { matchId: "G02", homeScore: 2, awayScore: 0 }, // A2 2-0 A3
      { matchId: "G25", homeScore: 1, awayScore: 1 }, // A3 1-1 A4
      { matchId: "G28", homeScore: 2, awayScore: 0 }, // A1 2-0 A2
    ]);
    const outlook = computeGroupOutlook("A", results, nameOf);
    const a2 = team(outlook, "A2");
    expect(a2.ownResults).toHaveLength(3);
    expect(a2.ownResults.map((r) => r.result)).toEqual(["win", "draw", "loss"]);
  });
});
