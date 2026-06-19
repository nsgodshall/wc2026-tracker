import type {
  Match,
  MatchResult,
  GroupName,
  GroupStanding,
} from "../data/types";
import { GROUP_MATCHES } from "../data/schedule";
import { getTeamsByGroup } from "../data/teams";
import {
  rankTeams,
  lookupFromResults,
  type Score,
  type ScoreLookup,
} from "./standings";

/**
 * "What each team needs" — group-stage clinching engine.
 *
 * Within-group status (won-group / clinched-top2 / alive / eliminated) is
 * computed exactly: we enumerate every win/draw/loss combination of the
 * remaining matches (at most 3^4 = 81) and, for each, construct the goal margins
 * that are most and least favourable to the team. Because the favourable
 * construction uses a large winning margin, the binding tiebreaker is
 * points → goal difference → goals scored (a total order), so this yields the
 * team's true best/worst achievable finishing position. (The only blind spot is
 * the vanishingly rare case where teams tie on points AND GD AND GF and
 * head-to-head decides — there the extreme construction avoids the tie, so it
 * cannot mislead.)
 *
 * Third place: the top 2 of each group always advance; the 8 best third-placed
 * teams across all 12 groups also advance. We treat a team as eliminated only
 * when it cannot finish in the top THREE (the within-group part is exact). For a
 * team that can finish 3rd we add a `thirdPlace` outlook: the points it could
 * finish 3rd on, and — given the other groups' CURRENT standings (a snapshot,
 * since those groups have games left too) — whether that would make the best-8
 * cut. The snapshot is clearly labelled; it sharpens as the other groups finish.
 *
 * Goal-margin prose ("win by 2+") is only emitted on a team's final match,
 * where it is well defined, via a small realistic-scoreline scan.
 */

export type OutlookStatus =
  | "won-group"
  | "clinched-top2"
  | "alive"
  | "eliminated";

export type OwnResult = "win" | "draw" | "loss";
export type VerdictKind = "guarantees" | "possible" | "impossible";

export interface OwnResultOutlook {
  matchId: string;
  opponentId: string;
  result: OwnResult;
  verdict: VerdictKind;
  /** Whether the verdict is about reaching the top 2 or (3rd-only teams) top 3. */
  target: "top2" | "top3";
  /** For `possible`: other results that must also happen. */
  condition?: string;
  /** Final-matchday goal-margin advice, when meaningful. */
  marginText?: string;
  /** For top-2 rows, whether this same result still leaves a top-3 path. */
  thirdPlaceVerdict?: VerdictKind;
}

/**
 * The best-8 third-place path. `estimate` is a SNAPSHOT against the other
 * groups' current standings — it moves as those groups play their remaining
 * games. `minPoints`/`maxPoints` are the within-group exact range a team could
 * finish 3rd on.
 */
export interface ThirdPlaceOutlook {
  minPoints: number;
  maxPoints: number;
  estimate?: "qualifies" | "bubble" | "eliminated";
  /** Points the 8th-best third currently has — snapshot context, not a clinch. */
  cutLinePoints?: number;
  /** Other groups used for the snapshot; helps the UI avoid over-selling early cuts. */
  otherGroupsStarted?: number;
  otherGroupsComplete?: number;
  otherGroupsTotal?: number;
}

export interface OwnPlacementOutlook {
  matchId: string;
  opponentId: string;
  result: OwnResult;
  minPosition: number;
  maxPosition: number;
  /** For rows where winning the group needs another match to break right. */
  winGroupCondition?: string;
  /** True when W/D/L outcomes alone are not enough because scorelines matter. */
  scorelineDependent: boolean;
}

export interface TeamOutlook {
  teamId: string;
  teamName: string;
  status: OutlookStatus;
  minPosition: number;
  maxPosition: number;
  tiebreakUndecided: boolean;
  remainingForTeam: number;
  ownResults: OwnResultOutlook[];
  /** Explains 1st/2nd permutations after a team has already clinched top 2. */
  placementResults: OwnPlacementOutlook[];
  /** Present when the team can still finish 3rd and isn't already through. */
  thirdPlace?: ThirdPlaceOutlook;
}

export interface GroupOutlook {
  group: GroupName;
  remainingMatchIds: string[];
  /** True when at most two matches remain (every team has ≤1 game left). */
  finalMatchday: boolean;
  teams: TeamOutlook[];
}

/** A large but finite winning margin used to dominate goal-difference ties. */
const BIG = 50;
/** Max goals per side considered when scanning realistic final-day scorelines. */
const SCAN_MAX = 9;

/** Home/away outcome of a single match. */
type Outcome = "H" | "D" | "A";
const OUTCOMES: Outcome[] = ["H", "D", "A"];

type NameOf = (id: string) => string;

export function computeGroupOutlook(
  group: GroupName,
  results: Map<string, MatchResult>,
  nameOf: NameOf,
  allStandings?: Map<GroupName, GroupStanding[]>,
): GroupOutlook {
  const teamIds = getTeamsByGroup(group).map((t) => t.id);
  const groupMatches = GROUP_MATCHES.filter((m) => m.group === group);
  const remaining = groupMatches.filter((m) => !isPlayed(m, results));
  const base = lookupFromResults(results);

  // Current standings drive display order + undecided-tie detection.
  const current = rankTeams(teamIds, groupMatches, base);
  const undecidedTeams = findUndecidedTeams(group, results);

  // Other groups' current third-place points — the snapshot best-8 cut context.
  const thirdSnapshot = allStandings
    ? otherGroupsThirdSnapshot(allStandings, group)
    : null;

  const finalMatchday = remaining.length <= 2;

  const teams: TeamOutlook[] = current.standings.map((row) => {
    const teamId = row.teamId;
    const ownRemaining = remaining.filter(
      (m) => m.homeTeamId === teamId || m.awayTeamId === teamId,
    );

    const cls = classify(teamId, teamIds, groupMatches, remaining, base);

    // Top-2 contenders get top-2 verdicts; 3rd-only contenders get top-3 ones.
    const threshold: 2 | 3 | 0 = cls.canTop2 ? 2 : cls.canThird ? 3 : 0;
    const ownResults =
      threshold === 0
        ? []
        : describeOwnResults(
            teamId,
            teamIds,
            groupMatches,
            remaining,
            ownRemaining,
            base,
            finalMatchday,
            threshold,
            nameOf,
          );

    const placementResults =
      cls.status === "clinched-top2" &&
      cls.minPosition === 1 &&
      cls.maxPosition === 2
        ? describePlacementResults(
            teamId,
            teamIds,
            groupMatches,
            remaining,
            ownRemaining,
            base,
            nameOf,
          )
        : [];

    let thirdPlace: ThirdPlaceOutlook | undefined;
    if (cls.status === "alive" && cls.canThird) {
      thirdPlace = {
        minPoints: cls.minThirdPoints,
        maxPoints: cls.maxThirdPoints,
      };
      if (thirdSnapshot) {
        Object.assign(
          thirdPlace,
          thirdEstimate(cls.minThirdPoints, cls.maxThirdPoints, thirdSnapshot),
        );
      }
    }

    return {
      teamId,
      teamName: nameOf(teamId),
      status: cls.status,
      minPosition: cls.minPosition,
      maxPosition: cls.maxPosition,
      tiebreakUndecided: undecidedTeams.has(teamId),
      remainingForTeam: ownRemaining.length,
      ownResults,
      placementResults,
      thirdPlace,
    };
  });

  return {
    group,
    remainingMatchIds: remaining.map((m) => m.id),
    finalMatchday,
    teams,
  };
}

// --- Status classification ---------------------------------------------------

interface Classification {
  status: OutlookStatus;
  minPosition: number;
  maxPosition: number;
  canTop2: boolean;
  canThird: boolean;
  /** Points range a team could finish exactly 3rd on (exact; margins don't change points). */
  minThirdPoints: number;
  maxThirdPoints: number;
}

function classify(
  teamId: string,
  teamIds: string[],
  groupMatches: Match[],
  remaining: Match[],
  base: ScoreLookup,
): Classification {
  let canTop2 = false;
  let alwaysTop2 = true;
  let alwaysFirst = true;
  let canThird = false;
  let minPosition = 4;
  let maxPosition = 1;
  let minThirdPoints = Infinity;
  let maxThirdPoints = -Infinity;

  for (const combo of enumerateOutcomes(remaining.length)) {
    const bestRow = rowFor(
      teamId,
      teamIds,
      groupMatches,
      remaining,
      combo,
      base,
      "best",
    );
    const best = bestRow.position;
    const worst = rowFor(
      teamId,
      teamIds,
      groupMatches,
      remaining,
      combo,
      base,
      "worst",
    ).position;

    if (best <= 2) canTop2 = true;
    if (worst > 2) alwaysTop2 = false;
    if (worst > 1) alwaysFirst = false;

    minPosition = Math.min(minPosition, best);
    maxPosition = Math.max(maxPosition, worst);

    // 3rd is reachable in this combo if 3 lies within the achievable range.
    if (best <= 3 && worst >= 3) {
      canThird = true;
      // Points only depend on win/draw/loss, so bestRow.points is exact here.
      minThirdPoints = Math.min(minThirdPoints, bestRow.points);
      maxThirdPoints = Math.max(maxThirdPoints, bestRow.points);
    }
  }

  let status: OutlookStatus;
  if (!canTop2 && !canThird) status = "eliminated";
  else if (alwaysFirst) status = "won-group";
  else if (alwaysTop2) status = "clinched-top2";
  else status = "alive";

  return {
    status,
    minPosition,
    maxPosition,
    canTop2,
    canThird,
    minThirdPoints,
    maxThirdPoints,
  };
}

/**
 * Standings row for `teamId` for a fixed win/draw/loss combo, with goal margins
 * constructed to be most (`best`) or least (`worst`) favourable.
 */
function rowFor(
  teamId: string,
  teamIds: string[],
  groupMatches: Match[],
  remaining: Match[],
  combo: Outcome[],
  base: ScoreLookup,
  mode: "best" | "worst",
): GroupStanding {
  const overrides = new Map<string, Score>();
  for (let i = 0; i < remaining.length; i++) {
    overrides.set(
      remaining[i].id,
      buildScore(remaining[i], combo[i], teamId, mode),
    );
  }
  return rowWith(teamIds, groupMatches, base, overrides, teamId);
}

function positionFor(
  teamId: string,
  teamIds: string[],
  groupMatches: Match[],
  remaining: Match[],
  combo: Outcome[],
  base: ScoreLookup,
  mode: "best" | "worst",
): number {
  return rowFor(teamId, teamIds, groupMatches, remaining, combo, base, mode)
    .position;
}

/** Construct a scoreline for one match given its outcome and a focal team. */
function buildScore(
  match: Match,
  outcome: Outcome,
  focalId: string,
  mode: "best" | "worst",
): Score {
  if (outcome === "D") return { home: 0, away: 0 };

  const focalIsHome = match.homeTeamId === focalId;
  const focalIsAway = match.awayTeamId === focalId;
  const focalPlays = focalIsHome || focalIsAway;

  let margin: number;
  if (focalPlays) {
    const focalWins =
      (outcome === "H" && focalIsHome) || (outcome === "A" && focalIsAway);
    if (focalWins) {
      margin = mode === "best" ? BIG : 1; // win big when helping, scrape when hurting
    } else {
      margin = mode === "best" ? 1 : BIG; // lose narrowly when helping, badly when hurting
    }
  } else {
    // Match between two rivals: small margin helps the focal team, big hurts.
    margin = mode === "best" ? 1 : BIG;
  }

  return outcome === "H"
    ? { home: margin, away: 0 }
    : { home: 0, away: margin };
}

// --- Per-result narrative ----------------------------------------------------

function describeOwnResults(
  teamId: string,
  teamIds: string[],
  groupMatches: Match[],
  remaining: Match[],
  ownRemaining: Match[],
  base: ScoreLookup,
  finalMatchday: boolean,
  threshold: 2 | 3,
  nameOf: NameOf,
): OwnResultOutlook[] {
  if (ownRemaining.length !== 1) {
    // Aggregating "what each result does" across multiple own games is
    // ambiguous; we only narrate when a team has a single game left.
    return [];
  }

  const rm = ownRemaining[0];
  const others = remaining.filter((m) => m.id !== rm.id);
  const isHome = rm.homeTeamId === teamId;
  const opponentId = isHome ? rm.awayTeamId : rm.homeTeamId;
  const target = threshold === 2 ? "top2" : "top3";

  const out: OwnResultOutlook[] = [];

  for (const result of ["win", "draw", "loss"] as OwnResult[]) {
    const fixedOutcome = resultToOutcome(result, isHome);

    let possible = false;
    let guaranteed = true;
    let possibleTop3 = false;
    let guaranteedTop3 = true;
    const achieving: Outcome[][] = [];

    for (const otherCombo of enumerateOutcomes(others.length)) {
      const combo = withFixed(
        remaining,
        rm.id,
        fixedOutcome,
        others,
        otherCombo,
      );

      const best = positionFor(
        teamId,
        teamIds,
        groupMatches,
        remaining,
        combo,
        base,
        "best",
      );
      const worst = positionFor(
        teamId,
        teamIds,
        groupMatches,
        remaining,
        combo,
        base,
        "worst",
      );

      if (best <= threshold) {
        possible = true;
        achieving.push(otherCombo);
      }
      if (worst > threshold) guaranteed = false;

      if (threshold === 2) {
        if (best <= 3) possibleTop3 = true;
        if (worst > 3) guaranteedTop3 = false;
      }
    }

    let verdict: VerdictKind;
    if (!possible) verdict = "impossible";
    else if (guaranteed) verdict = "guarantees";
    else verdict = "possible";

    const outlook: OwnResultOutlook = {
      matchId: rm.id,
      opponentId,
      result,
      verdict,
      target,
    };

    if (threshold === 2 && verdict !== "guarantees") {
      outlook.thirdPlaceVerdict = resultVerdict(possibleTop3, guaranteedTop3);
    }

    if (verdict === "possible") {
      outlook.condition = necessaryCondition(others, achieving, teamId, nameOf);
    }

    // Goal-margin prose is only well defined for the top-2 race.
    if (threshold === 2 && finalMatchday && verdict === "possible") {
      outlook.marginText = marginAdvice(
        teamId,
        teamIds,
        groupMatches,
        rm,
        others,
        result,
        isHome,
        base,
        nameOf,
      );
    }

    out.push(outlook);
  }

  return out;
}

function describePlacementResults(
  teamId: string,
  teamIds: string[],
  groupMatches: Match[],
  remaining: Match[],
  ownRemaining: Match[],
  base: ScoreLookup,
  nameOf: NameOf,
): OwnPlacementOutlook[] {
  if (ownRemaining.length !== 1) return [];

  const rm = ownRemaining[0];
  const others = remaining.filter((m) => m.id !== rm.id);
  const isHome = rm.homeTeamId === teamId;
  const opponentId = isHome ? rm.awayTeamId : rm.homeTeamId;
  const out: OwnPlacementOutlook[] = [];

  for (const result of ["win", "draw", "loss"] as OwnResult[]) {
    const fixedOutcome = resultToOutcome(result, isHome);
    let minPosition = 4;
    let maxPosition = 1;
    let canWinGroup = false;
    let alwaysWinsGroup = true;
    let scorelineDependent = false;
    const winningCombos: Outcome[][] = [];

    for (const otherCombo of enumerateOutcomes(others.length)) {
      const combo = withFixed(
        remaining,
        rm.id,
        fixedOutcome,
        others,
        otherCombo,
      );
      const best = positionFor(
        teamId,
        teamIds,
        groupMatches,
        remaining,
        combo,
        base,
        "best",
      );
      const worst = positionFor(
        teamId,
        teamIds,
        groupMatches,
        remaining,
        combo,
        base,
        "worst",
      );

      minPosition = Math.min(minPosition, best);
      maxPosition = Math.max(maxPosition, worst);
      if (best === 1) {
        canWinGroup = true;
        winningCombos.push(otherCombo);
      }
      if (worst > 1) alwaysWinsGroup = false;
      if (best === 1 && worst > 1) scorelineDependent = true;
    }

    out.push({
      matchId: rm.id,
      opponentId,
      result,
      minPosition,
      maxPosition,
      winGroupCondition:
        canWinGroup && !alwaysWinsGroup
          ? necessaryCondition(others, winningCombos, teamId, nameOf)
          : undefined,
      scorelineDependent,
    });
  }

  return out;
}

/**
 * Builds a human-readable condition from the set of other-match outcome
 * combinations that let the focal team succeed. When a single outcome is
 * required (e.g. "Mexico beat South Korea") it returns that. When multiple
 * outcomes work (e.g. win OR draw) it enumerates them explicitly so "Maybe"
 * scenarios tell the user exactly what they need from the other game.
 */
function necessaryCondition(
  others: Match[],
  achieving: Outcome[][],
  teamId: string,
  nameOf: NameOf,
): string | undefined {
  if (others.length === 0 || achieving.length === 0) return undefined;

  const parts: string[] = [];
  for (let i = 0; i < others.length; i++) {
    const distinct = [...new Set(achieving.map((c) => c[i]))];
    if (distinct.length === 3) continue; // all outcomes work → no constraint
    if (distinct.length === 1) {
      const text = describeOutcome(others[i], distinct[0], teamId, nameOf);
      if (text) parts.push(text);
    } else {
      // 2 outcomes — enumerate both so the scenario is explicit.
      const text = disjunctiveCondition(others[i], distinct, teamId, nameOf);
      if (text) parts.push(text);
    }
  }
  if (parts.length === 0) return undefined;
  return parts.join(" and ");
}

/** Build text for a match where two of three outcomes are viable. */
function disjunctiveCondition(
  match: Match,
  outcomes: Outcome[],
  teamId: string,
  nameOf: NameOf,
): string | undefined {
  if (match.homeTeamId === teamId || match.awayTeamId === teamId)
    return undefined;
  const home = nameOf(match.homeTeamId);
  const away = nameOf(match.awayTeamId);
  const set = new Set(outcomes);
  // {H, D}: home win or draw
  if (set.has("H") && set.has("D")) return `${home} win or draw vs ${away}`;
  // {D, A}: away win or draw
  if (set.has("D") && set.has("A")) return `${away} win or draw vs ${home}`;
  // {H, A}: either side wins (no draw)
  return `${home} or ${away} win`;
}

/** Goal-margin advice for a single remaining match on the final matchday. */
function marginAdvice(
  teamId: string,
  teamIds: string[],
  groupMatches: Match[],
  rm: Match,
  others: Match[],
  result: OwnResult,
  isHome: boolean,
  base: ScoreLookup,
  nameOf: NameOf,
): string | undefined {
  if (result === "win") {
    // Smallest winning margin that secures top-2 regardless of the other game.
    const m = winMarginToGuarantee(
      teamId,
      teamIds,
      groupMatches,
      rm,
      others,
      isHome,
      base,
    );
    if (m && m >= 2) return `Win by ${m}+ to be sure`;
    return undefined;
  }

  // Draw / loss: describe how big a rival win would deny the team (only clean,
  // single-other-match cases on the final day).
  if (others.length !== 1) return undefined;
  return rivalDenial(
    teamId,
    teamIds,
    groupMatches,
    rm,
    others[0],
    result,
    isHome,
    base,
    nameOf,
  );
}

function winMarginToGuarantee(
  teamId: string,
  teamIds: string[],
  groupMatches: Match[],
  rm: Match,
  others: Match[],
  isHome: boolean,
  base: ScoreLookup,
): number | null {
  for (let m = 1; m <= SCAN_MAX; m++) {
    let safeForAll = true;
    for (const combo of enumerateOutcomes(others.length)) {
      const overrides = new Map<string, Score>();
      // Team wins by exactly m with the lowest goals for (worst sub-case).
      overrides.set(
        rm.id,
        isHome ? { home: m, away: 0 } : { home: 0, away: m },
      );
      for (let i = 0; i < others.length; i++) {
        overrides.set(
          others[i].id,
          buildScore(others[i], combo[i], teamId, "worst"),
        );
      }
      if (rankWith(teamIds, groupMatches, base, overrides, teamId) > 2) {
        safeForAll = false;
        break;
      }
    }
    if (safeForAll) return m;
  }
  return null;
}

/**
 * On the final day, when a team's draw/loss keeps it up unless a rival wins big,
 * report the rival's margin threshold. Only emitted for clean single-rival cases.
 */
function rivalDenial(
  teamId: string,
  teamIds: string[],
  groupMatches: Match[],
  rm: Match,
  other: Match,
  result: OwnResult,
  isHome: boolean,
  base: ScoreLookup,
  nameOf: NameOf,
): string | undefined {
  // Fix the team's own result at a representative scoreline.
  const ownScore: Score =
    result === "draw"
      ? { home: 0, away: 0 }
      : isHome
        ? { home: 0, away: 1 }
        : { home: 1, away: 0 };

  // Check whether a draw in the other match already denies the team.
  const drawDenies =
    positionWithScores(
      teamId,
      teamIds,
      groupMatches,
      [
        [rm.id, ownScore],
        [other.id, { home: 0, away: 0 }],
      ],
      base,
    ) > 2;
  if (drawDenies) return undefined; // not a clean "rival win" threshold

  const sides: {
    winnerId: string;
    loserId: string;
    score: (k: number) => Score;
  }[] = [
    {
      winnerId: other.homeTeamId,
      loserId: other.awayTeamId,
      score: (k) => ({ home: k, away: 0 }),
    },
    {
      winnerId: other.awayTeamId,
      loserId: other.homeTeamId,
      score: (k) => ({ home: 0, away: k }),
    },
  ];

  const denials: { winnerId: string; loserId: string; k: number }[] = [];
  for (const side of sides) {
    for (let k = 1; k <= SCAN_MAX; k++) {
      const pos = positionWithScores(
        teamId,
        teamIds,
        groupMatches,
        [
          [rm.id, ownScore],
          [other.id, side.score(k)],
        ],
        base,
      );
      if (pos > 2) {
        denials.push({ winnerId: side.winnerId, loserId: side.loserId, k });
        break;
      }
    }
  }

  if (denials.length !== 1) return undefined; // 0 → safe (handled elsewhere); 2 → too messy
  const d = denials[0];
  const winner = nameOf(d.winnerId);
  const loser = nameOf(d.loserId);
  return d.k === 1
    ? `Safe unless ${winner} beat ${loser}`
    : `Safe unless ${winner} beat ${loser} by ${d.k}+`;
}

// --- Ranking helpers ---------------------------------------------------------

/** Rank with overrides layered on top of base results; return focal row. */
function rowWith(
  teamIds: string[],
  groupMatches: Match[],
  base: ScoreLookup,
  overrides: Map<string, Score>,
  focalId: string,
): GroupStanding {
  const lookup: ScoreLookup = (id) => overrides.get(id) ?? base(id);
  const { standings } = rankTeams(teamIds, groupMatches, lookup);
  return standings.find((s) => s.teamId === focalId)!;
}

function rankWith(
  teamIds: string[],
  groupMatches: Match[],
  base: ScoreLookup,
  overrides: Map<string, Score>,
  focalId: string,
): number {
  return rowWith(teamIds, groupMatches, base, overrides, focalId).position;
}

function positionWithScores(
  focalId: string,
  teamIds: string[],
  groupMatches: Match[],
  scores: [string, Score][],
  base: ScoreLookup,
): number {
  const overrides = new Map(scores);
  return rankWith(teamIds, groupMatches, base, overrides, focalId);
}

// --- Third-place (best-8) snapshot -------------------------------------------

interface ThirdPlaceSnapshot {
  points: number[];
  groupsStarted: number;
  groupsComplete: number;
  groupsTotal: number;
}

/** Current third-place context for every group except the one being analysed. */
function otherGroupsThirdSnapshot(
  allStandings: Map<GroupName, GroupStanding[]>,
  group: GroupName,
): ThirdPlaceSnapshot {
  const points: number[] = [];
  let groupsStarted = 0;
  let groupsComplete = 0;

  for (const [g, standings] of allStandings) {
    if (g === group) continue;
    const third = standings[2];
    if (!third) continue;

    points.push(third.points);
    if (standings.some((row) => row.played > 0)) groupsStarted++;
    if (standings.length >= 4 && standings.every((row) => row.played === 3)) {
      groupsComplete++;
    }
  }

  return {
    points,
    groupsStarted,
    groupsComplete,
    groupsTotal: points.length,
  };
}

/**
 * Estimate, against the other groups' current third-place points, whether a
 * team finishing 3rd with a points total in [minP, maxP] would make the best-8
 * cut. Eight of twelve thirds advance, so a team is in if at most 7 other
 * thirds are strictly above it. Comparison is on points only (a deliberate
 * simplification — GD/GF break the real ties), so "eliminated" is conservative
 * and "qualifies" is optimistic.
 */
function thirdEstimate(
  minP: number,
  maxP: number,
  snapshot: ThirdPlaceSnapshot,
): {
  estimate: "qualifies" | "bubble" | "eliminated";
  cutLinePoints: number;
  otherGroupsStarted: number;
  otherGroupsComplete: number;
  otherGroupsTotal: number;
} {
  const sorted = [...snapshot.points].sort((a, b) => b - a);
  const cutLinePoints = sorted.length >= 8 ? sorted[7] : 0;
  const qualifyAt = (p: number) =>
    snapshot.points.filter((otherPoints) => otherPoints > p).length <= 7;

  let estimate: "qualifies" | "bubble" | "eliminated";
  if (!qualifyAt(maxP)) estimate = "eliminated";
  else if (qualifyAt(minP)) estimate = "qualifies";
  else estimate = "bubble";

  return {
    estimate,
    cutLinePoints,
    otherGroupsStarted: snapshot.groupsStarted,
    otherGroupsComplete: snapshot.groupsComplete,
    otherGroupsTotal: snapshot.groupsTotal,
  };
}

// --- Small utilities ---------------------------------------------------------

function isPlayed(m: Match, results: Map<string, MatchResult>): boolean {
  const r = results.get(m.id);
  return !!r && r.homeScore !== null && r.awayScore !== null;
}

function enumerateOutcomes(n: number): Outcome[][] {
  if (n === 0) return [[]];
  const rest = enumerateOutcomes(n - 1);
  const out: Outcome[][] = [];
  for (const o of OUTCOMES) {
    for (const r of rest) out.push([o, ...r]);
  }
  return out;
}

function resultToOutcome(result: OwnResult, isHome: boolean): Outcome {
  if (result === "draw") return "D";
  if (result === "win") return isHome ? "H" : "A";
  return isHome ? "A" : "H";
}

function resultVerdict(possible: boolean, guaranteed: boolean): VerdictKind {
  if (!possible) return "impossible";
  return guaranteed ? "guarantees" : "possible";
}

/** Build a full combo over `remaining` with one match fixed and others filled. */
function withFixed(
  remaining: Match[],
  fixedId: string,
  fixedOutcome: Outcome,
  others: Match[],
  otherCombo: Outcome[],
): Outcome[] {
  const otherMap = new Map<string, Outcome>();
  for (let i = 0; i < others.length; i++)
    otherMap.set(others[i].id, otherCombo[i]);
  return remaining.map((m) =>
    m.id === fixedId ? fixedOutcome : otherMap.get(m.id)!,
  );
}

function describeOutcome(
  match: Match,
  outcome: Outcome,
  teamId: string,
  nameOf: NameOf,
): string | undefined {
  const home = nameOf(match.homeTeamId);
  const away = nameOf(match.awayTeamId);
  if (outcome === "D") return `${home} and ${away} draw`;
  if (outcome === "H") {
    return match.awayTeamId === teamId ? undefined : `${home} beat ${away}`;
  }
  return match.homeTeamId === teamId ? undefined : `${away} beat ${home}`;
}

// --- Match-card clinch badges -------------------------------------------------

/** Per-team clinch info for match-card badges. */
export interface TeamClinch {
  alreadyThrough: boolean;
  clinchByMatch: Map<string, OwnResult[]>;
}

/**
 * For every team in a group, determine whether they've already clinched and,
 * for matches they still have to play, which results would guarantee top 2.
 */
export function getTeamClinchInfo(
  group: GroupName,
  results: Map<string, MatchResult>,
): Map<string, TeamClinch> {
  const teamIds = getTeamsByGroup(group).map((t) => t.id);
  const groupMatches = GROUP_MATCHES.filter((m) => m.group === group);
  const remaining = groupMatches.filter((m) => !isPlayed(m, results));
  const base = lookupFromResults(results);

  const map = new Map<string, TeamClinch>();

  for (const teamId of teamIds) {
    const cls = classify(teamId, teamIds, groupMatches, remaining, base);
    const alreadyThrough =
      cls.status === "won-group" || cls.status === "clinched-top2";

    const clinchByMatch = new Map<string, OwnResult[]>();

    if (!alreadyThrough && cls.canTop2) {
      for (const rm of remaining) {
        if (rm.homeTeamId !== teamId && rm.awayTeamId !== teamId) continue;
        const clinchResults: OwnResult[] = [];
        const isHome = rm.homeTeamId === teamId;

        for (const result of ["win", "draw", "loss"] as OwnResult[]) {
          const fixedOutcome = resultToOutcome(result, isHome);
          const others = remaining.filter((m) => m.id !== rm.id);

          let guarantees = true;
          for (const otherCombo of enumerateOutcomes(others.length)) {
            const combo = withFixed(
              remaining,
              rm.id,
              fixedOutcome,
              others,
              otherCombo,
            );
            const worst = positionFor(
              teamId,
              teamIds,
              groupMatches,
              remaining,
              combo,
              base,
              "worst",
            );
            if (worst > 2) {
              guarantees = false;
              break;
            }
          }
          if (guarantees) clinchResults.push(result);
        }

        if (clinchResults.length > 0) clinchByMatch.set(rm.id, clinchResults);
      }
    }

    map.set(teamId, { alreadyThrough, clinchByMatch });
  }

  return map;
}

/**
 * Teams whose final position is undecided by implemented tiebreakers (fair
 * play / drawing of lots / circular head-to-head). Only meaningful once all
 * group matches are played; otherwise returns an empty set.
 */
function findUndecidedTeams(
  group: GroupName,
  results: Map<string, MatchResult>,
): Set<string> {
  const teamIds = getTeamsByGroup(group).map((t) => t.id);
  const groupMatches = GROUP_MATCHES.filter((m) => m.group === group);
  const allPlayed = groupMatches.every((m) => isPlayed(m, results));
  if (!allPlayed) return new Set();

  const { standings, undecidedTie } = rankTeams(
    teamIds,
    groupMatches,
    lookupFromResults(results),
  );
  if (!undecidedTie) return new Set();

  const undecided = new Set<string>();
  for (let i = 1; i < standings.length; i++) {
    const a = standings[i - 1];
    const b = standings[i];
    if (
      a.points === b.points &&
      a.goalDiff === b.goalDiff &&
      a.goalsFor === b.goalsFor
    ) {
      undecided.add(a.teamId);
      undecided.add(b.teamId);
    }
  }
  return undecided;
}
