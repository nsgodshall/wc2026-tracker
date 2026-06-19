import type { Match, MatchResult, GroupName } from "../data/types";
import { GROUP_MATCHES } from "../data/schedule";
import { getTeamsByGroup } from "../data/teams";
import { rankTeams, lookupFromResults, type Score, type ScoreLookup } from "./standings";

/**
 * "What each team needs" — group-stage clinching engine.
 *
 * Scope: the top-2 race WITHIN a group only. The cross-group "best 8 third
 * placed teams" cut is intentionally out of scope for now.
 *
 * Status (won-group / clinched-top2 / alive / eliminated) is computed exactly:
 * we enumerate every win/draw/loss combination of the remaining matches
 * (at most 3^4 = 81) and, for each, construct the goal margins that are most
 * and least favourable to the team. Because the favourable construction uses a
 * large winning margin, the binding tiebreaker is points → goal difference →
 * goals scored (a total order), so this yields the team's true best/worst
 * achievable finishing position. (The only blind spot is the vanishingly rare
 * case where teams tie on points AND GD AND GF and head-to-head decides — there
 * the extreme construction avoids the tie, so it cannot mislead.)
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
  /** For `possible`: other results that must also happen. */
  condition?: string;
  /** Final-matchday goal-margin advice, when meaningful. */
  marginText?: string;
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
): GroupOutlook {
  const teamIds = getTeamsByGroup(group).map((t) => t.id);
  const groupMatches = GROUP_MATCHES.filter((m) => m.group === group);
  const remaining = groupMatches.filter((m) => !isPlayed(m, results));
  const base = lookupFromResults(results);

  // Current standings drive display order + undecided-tie detection.
  const current = rankTeams(teamIds, groupMatches, base);
  const undecidedTeams = findUndecidedTeams(group, results);

  const finalMatchday = remaining.length <= 2;

  const teams: TeamOutlook[] = current.standings.map((row) => {
    const teamId = row.teamId;
    const ownRemaining = remaining.filter(
      (m) => m.homeTeamId === teamId || m.awayTeamId === teamId,
    );

    const { status, minPosition, maxPosition } = classify(
      teamId,
      teamIds,
      groupMatches,
      remaining,
      base,
    );

    const ownResults = describeOwnResults(
      teamId,
      teamIds,
      groupMatches,
      remaining,
      ownRemaining,
      base,
      finalMatchday,
      nameOf,
    );

    return {
      teamId,
      teamName: nameOf(teamId),
      status,
      minPosition,
      maxPosition,
      tiebreakUndecided: undecidedTeams.has(teamId),
      remainingForTeam: ownRemaining.length,
      ownResults,
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

function classify(
  teamId: string,
  teamIds: string[],
  groupMatches: Match[],
  remaining: Match[],
  base: ScoreLookup,
): { status: OutlookStatus; minPosition: number; maxPosition: number } {
  let canTop2 = false;
  let alwaysTop2 = true;
  let alwaysFirst = true;
  let minPosition = 4;
  let maxPosition = 1;

  for (const combo of enumerateOutcomes(remaining.length)) {
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

    if (best <= 2) canTop2 = true;
    if (worst > 2) alwaysTop2 = false;
    if (worst > 1) alwaysFirst = false;

    minPosition = Math.min(minPosition, best);
    maxPosition = Math.max(maxPosition, worst);
  }

  let status: OutlookStatus;
  if (!canTop2) status = "eliminated";
  else if (alwaysFirst) status = "won-group";
  else if (alwaysTop2) status = "clinched-top2";
  else status = "alive";

  return { status, minPosition, maxPosition };
}

/**
 * Finishing position of `teamId` for a fixed win/draw/loss combo, with goal
 * margins constructed to be most (`best`) or least (`worst`) favourable.
 */
function positionFor(
  teamId: string,
  teamIds: string[],
  groupMatches: Match[],
  remaining: Match[],
  combo: Outcome[],
  base: ScoreLookup,
  mode: "best" | "worst",
): number {
  const overrides = new Map<string, Score>();
  for (let i = 0; i < remaining.length; i++) {
    overrides.set(remaining[i].id, buildScore(remaining[i], combo[i], teamId, mode));
  }
  return rankWith(teamIds, groupMatches, base, overrides, teamId);
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

  return outcome === "H" ? { home: margin, away: 0 } : { home: 0, away: margin };
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

  const out: OwnResultOutlook[] = [];

  for (const result of ["win", "draw", "loss"] as OwnResult[]) {
    const fixedOutcome = resultToOutcome(result, isHome);

    let possible = false;
    let guaranteed = true;
    const achieving: Outcome[][] = [];

    for (const otherCombo of enumerateOutcomes(others.length)) {
      const combo = withFixed(remaining, rm.id, fixedOutcome, others, otherCombo);

      const best = positionFor(teamId, teamIds, groupMatches, remaining, combo, base, "best");
      const worst = positionFor(teamId, teamIds, groupMatches, remaining, combo, base, "worst");

      if (best <= 2) {
        possible = true;
        achieving.push(otherCombo);
      }
      if (worst > 2) guaranteed = false;
    }

    let verdict: VerdictKind;
    if (!possible) verdict = "impossible";
    else if (guaranteed) verdict = "guarantees";
    else verdict = "possible";

    const outlook: OwnResultOutlook = { matchId: rm.id, opponentId, result, verdict };

    if (verdict === "possible") {
      outlook.condition = necessaryCondition(others, achieving, teamId, nameOf);
    }

    if (finalMatchday && verdict === "possible") {
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

/**
 * Among the combos of other matches that let the team reach top-2, find any
 * other match whose result is the SAME across all of them — that result is a
 * necessary condition. Returns human-readable text or undefined.
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
    const distinct = new Set(achieving.map((c) => c[i]));
    if (distinct.size === 1) {
      const [only] = distinct;
      const text = describeOutcome(others[i], only, teamId, nameOf);
      if (text) parts.push(text);
    }
  }
  if (parts.length === 0) return undefined;
  return parts.join(" and ");
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
    const m = winMarginToGuarantee(teamId, teamIds, groupMatches, rm, others, isHome, base);
    if (m && m >= 2) return `Win by ${m}+ to be sure`;
    return undefined;
  }

  // Draw / loss: describe how big a rival win would deny the team (only clean,
  // single-other-match cases on the final day).
  if (others.length !== 1) return undefined;
  return rivalDenial(teamId, teamIds, groupMatches, rm, others[0], result, isHome, base, nameOf);
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
      overrides.set(rm.id, isHome ? { home: m, away: 0 } : { home: 0, away: m });
      for (let i = 0; i < others.length; i++) {
        overrides.set(others[i].id, buildScore(others[i], combo[i], teamId, "worst"));
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
    positionWithScores(teamId, teamIds, groupMatches, [
      [rm.id, ownScore],
      [other.id, { home: 0, away: 0 }],
    ], base) > 2;
  if (drawDenies) return undefined; // not a clean "rival win" threshold

  const sides: { winnerId: string; loserId: string; score: (k: number) => Score }[] = [
    { winnerId: other.homeTeamId, loserId: other.awayTeamId, score: (k) => ({ home: k, away: 0 }) },
    { winnerId: other.awayTeamId, loserId: other.homeTeamId, score: (k) => ({ home: 0, away: k }) },
  ];

  const denials: { winnerId: string; loserId: string; k: number }[] = [];
  for (const side of sides) {
    for (let k = 1; k <= SCAN_MAX; k++) {
      const pos = positionWithScores(teamId, teamIds, groupMatches, [
        [rm.id, ownScore],
        [other.id, side.score(k)],
      ], base);
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

/** Rank with overrides layered on top of base results; return focal position. */
function rankWith(
  teamIds: string[],
  groupMatches: Match[],
  base: ScoreLookup,
  overrides: Map<string, Score>,
  focalId: string,
): number {
  const lookup: ScoreLookup = (id) => overrides.get(id) ?? base(id);
  const { standings } = rankTeams(teamIds, groupMatches, lookup);
  return standings.find((s) => s.teamId === focalId)!.position;
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

/** Build a full combo over `remaining` with one match fixed and others filled. */
function withFixed(
  remaining: Match[],
  fixedId: string,
  fixedOutcome: Outcome,
  others: Match[],
  otherCombo: Outcome[],
): Outcome[] {
  const otherMap = new Map<string, Outcome>();
  for (let i = 0; i < others.length; i++) otherMap.set(others[i].id, otherCombo[i]);
  return remaining.map((m) => (m.id === fixedId ? fixedOutcome : otherMap.get(m.id)!));
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
