import { describe, it, expect } from "vitest";
import {
  computeGroupOutlook,
  getTeamClinchInfo,
  type TeamOutlook,
} from "../logic/scenarios";
import { getTeamById } from "../data/teams";
import type { GroupName, GroupStanding, MatchResult } from "../data/types";

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

const nameOf = (id: string) => getTeamById(id)?.name ?? id;

/** Fabricate an allStandings map where every other group's 3rd has `thirdPts`. */
function standingsWithThirds(
  thirdPts: number,
): Map<GroupName, GroupStanding[]> {
  const groups: GroupName[] = [
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
  ];
  const row = (points: number): GroupStanding => ({
    teamId: "x",
    position: 3,
    played: 3,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points,
    fairPlayPts: 0,
  });
  const map = new Map<GroupName, GroupStanding[]>();
  for (const g of groups) map.set(g, [row(9), row(6), row(thirdPts)]);
  return map;
}

function team(
  outlook: ReturnType<typeof computeGroupOutlook>,
  id: string,
): TeamOutlook {
  return outlook.teams.find((t) => t.teamId === id)!;
}

// Group A fixtures:
//   G01 A1 v A4   G02 A2 v A3   (MD1)
//   G25 A3 v A4   G28 A1 v A2   (MD2)
//   G49 A3 v A1   G50 A4 v A2   (MD3)

describe("computeGroupOutlook — status classification", () => {
  it("clinches the top two and leaves the rest fighting for 3rd", () => {
    // A1 & A3 both reach 6 pts after MD2; A2 & A4 can't reach top 2 (max 3)
    // but can still finish 3rd, so they're alive via the best-3rd path.
    const results = resultsMap([
      { matchId: "G01", homeScore: 1, awayScore: 0 }, // A1 beats A4
      { matchId: "G02", homeScore: 0, awayScore: 1 }, // A3 beats A2
      { matchId: "G25", homeScore: 1, awayScore: 0 }, // A3 beats A4
      { matchId: "G28", homeScore: 1, awayScore: 0 }, // A1 beats A2
    ]);
    const outlook = computeGroupOutlook("A", results, nameOf);

    expect(team(outlook, "A1").status).toBe("clinched-top2");
    expect(team(outlook, "A3").status).toBe("clinched-top2");
    expect(team(outlook, "A2").status).toBe("alive");
    expect(team(outlook, "A4").status).toBe("alive");

    // A clinched team's every remaining result still guarantees top 2.
    const a1 = team(outlook, "A1");
    for (const r of a1.ownResults) {
      expect(r.verdict).toBe("guarantees");
    }

    // Clinched top-2 teams still get explicit 1st/2nd placement scenarios.
    expect(a1.placementResults).toHaveLength(3);
    expect(a1.placementResults.find((r) => r.result === "win")).toMatchObject({
      minPosition: 1,
      maxPosition: 1,
    });
    expect(a1.placementResults.find((r) => r.result === "loss")).toMatchObject({
      minPosition: 2,
      maxPosition: 2,
    });

    // A2 can only reach 3rd: verdicts are about top-3, and winning gets it there.
    const a2 = team(outlook, "A2");
    expect(a2.thirdPlace).toBeDefined();
    const a2Win = a2.ownResults.find((r) => r.result === "win")!;
    expect(a2Win.target).toBe("top3");
    expect(a2Win.verdict).toBe("guarantees");
    expect(a2.ownResults.find((r) => r.result === "loss")!.verdict).toBe(
      "impossible",
    );
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
    expect(team(outlook, "A1").placementResults).toHaveLength(0);
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
    expect(loss.thirdPlaceVerdict).toBe("possible");
    expect(draw.verdict).toBe("possible");
    expect(draw.marginText).toBe(
      "Safe unless Czech Republic beat Mexico by 2+",
    );
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
    expect(["won-group", "clinched-top2"]).toContain(
      team(outlook, "A1").status,
    );
    expect(["won-group", "clinched-top2"]).toContain(
      team(outlook, "A2").status,
    );
    expect(team(outlook, "A1").ownResults).toHaveLength(0);
  });
});

describe("computeGroupOutlook — third place", () => {
  // Config: A1 & A3 clinch top 2; A2 & A4 fight for 3rd (3rd reachable on 1–3 pts).
  const results = resultsMap([
    { matchId: "G01", homeScore: 1, awayScore: 0 }, // A1 beats A4
    { matchId: "G02", homeScore: 0, awayScore: 1 }, // A3 beats A2
    { matchId: "G25", homeScore: 1, awayScore: 0 }, // A3 beats A4
    { matchId: "G28", homeScore: 1, awayScore: 0 }, // A1 beats A2
  ]);

  it("reports the 3rd-place points range", () => {
    const a2 = team(
      computeGroupOutlook("A", results, nameOf),
      "A2",
    ).thirdPlace!;
    expect(a2.minPoints).toBe(1);
    expect(a2.maxPoints).toBe(3);
    expect(a2.estimate).toBeUndefined(); // no allStandings passed
  });

  it("estimates 'qualifies' when other groups' thirds are weak", () => {
    const outlook = computeGroupOutlook(
      "A",
      results,
      nameOf,
      standingsWithThirds(0),
    );
    const a2 = team(outlook, "A2").thirdPlace!;
    expect(a2.estimate).toBe("qualifies");
    expect(a2.cutLinePoints).toBe(0);
  });

  it("estimates 'eliminated' when other groups' thirds are strong", () => {
    const outlook = computeGroupOutlook(
      "A",
      results,
      nameOf,
      standingsWithThirds(7),
    );
    const a2 = team(outlook, "A2").thirdPlace!;
    expect(a2.estimate).toBe("eliminated");
    expect(a2.cutLinePoints).toBe(7);
  });

  it("marks a team that can only finish 4th as eliminated", () => {
    // A4 loses all three; everyone else has points → A4 locked in last.
    const sealed = resultsMap([
      { matchId: "G01", homeScore: 1, awayScore: 0 }, // A1 beats A4
      { matchId: "G25", homeScore: 1, awayScore: 0 }, // A3 beats A4
      { matchId: "G50", homeScore: 0, awayScore: 1 }, // A2 beats A4 (away)
      { matchId: "G02", homeScore: 1, awayScore: 0 }, // A2 beats A3
      { matchId: "G28", homeScore: 1, awayScore: 0 }, // A1 beats A2
    ]);
    const a4 = team(computeGroupOutlook("A", sealed, nameOf), "A4");
    expect(a4.status).toBe("eliminated");
    expect(a4.thirdPlace).toBeUndefined();
  });
});

describe("getTeamClinchInfo", () => {
  it("detects a team that can clinch top 2 on matchday 2", () => {
    // A1 has one win. A2 and A4 are on 3; A3 is stuck on 0 after two games.
    // If A1 beats A2 in G28, only A4 can still catch A1, so A1 clinches top 2.
    const results = resultsMap([
      { matchId: "G01", homeScore: 1, awayScore: 0 }, // A1 beats A4
      { matchId: "G02", homeScore: 1, awayScore: 0 }, // A2 beats A3
      { matchId: "G25", homeScore: 0, awayScore: 1 }, // A4 beats A3
    ]);

    const info = getTeamClinchInfo("A", results);
    expect(info.get("A1")?.alreadyThrough).toBe(false);
    expect(info.get("A1")?.clinchByMatch.get("G28")).toEqual(["win"]);
  });

  it("marks a team as already through after clinching", () => {
    const results = resultsMap([
      { matchId: "G01", homeScore: 1, awayScore: 0 }, // A1 beats A4
      { matchId: "G02", homeScore: 1, awayScore: 0 }, // A2 beats A3
      { matchId: "G25", homeScore: 0, awayScore: 1 }, // A4 beats A3
      { matchId: "G28", homeScore: 1, awayScore: 0 }, // A1 beats A2 and clinches
    ]);

    const info = getTeamClinchInfo("A", results);
    expect(info.get("A1")?.alreadyThrough).toBe(true);
    expect(info.get("A1")?.clinchByMatch.size).toBe(0);
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
