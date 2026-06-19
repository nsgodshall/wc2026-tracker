import type { Match, MatchResult, GroupStanding, GroupName } from "../data/types";
import { TEAMS } from "../data/teams";
import { GROUP_MATCHES } from "../data/schedule";

/** A simple home/away score pair for a single match. */
export interface Score {
  home: number;
  away: number;
}

/**
 * Resolves a match id to its score, or null if the match is not (yet) decided.
 * Used so the ranking logic can be driven by real results or by hypothetical
 * scenarios without cloning result Maps in tight loops.
 */
export type ScoreLookup = (matchId: string) => Score | null;

/** Build a ScoreLookup from a results Map. */
export function lookupFromResults(results: Map<string, MatchResult>): ScoreLookup {
  return (matchId) => {
    const r = results.get(matchId);
    if (!r || r.homeScore === null || r.awayScore === null) return null;
    return { home: r.homeScore, away: r.awayScore };
  };
}

function emptyStanding(teamId: string): GroupStanding {
  return {
    teamId,
    position: 0,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
    fairPlayPts: 0,
  };
}

/** Primary FIFA comparator: points → goal difference → goals scored. */
export function comparePrimary(a: GroupStanding, b: GroupStanding): number {
  if (a.points !== b.points) return b.points - a.points;
  if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
  if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
  return 0;
}

/**
 * Rank a set of teams using FIFA group-stage tiebreakers, driven by a
 * ScoreLookup so callers can rank real or hypothetical results. The shared
 * core used by both computeGroupStandings and the qualification engine.
 *
 * Returns the sorted standings plus `undecidedTie`: true when two teams could
 * not be separated by any implemented criterion (fair play / drawing of lots /
 * a perfectly circular head-to-head), i.e. the displayed order is arbitrary.
 */
export function rankTeams(
  teamIds: string[],
  groupMatches: Match[],
  score: ScoreLookup,
): { standings: GroupStanding[]; undecidedTie: boolean } {
  const standings = teamIds.map(emptyStanding);
  const byId = new Map(standings.map((s) => [s.teamId, s]));

  for (const match of groupMatches) {
    const s = score(match.id);
    if (!s) continue;
    const home = byId.get(match.homeTeamId);
    const away = byId.get(match.awayTeamId);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += s.home;
    home.goalsAgainst += s.away;
    away.goalsFor += s.away;
    away.goalsAgainst += s.home;

    if (s.home > s.away) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (s.home < s.away) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const s of standings) {
    s.goalDiff = s.goalsFor - s.goalsAgainst;
  }

  standings.sort(comparePrimary);

  const undecidedTie = resolveH2H(standings, groupMatches, score);

  for (let i = 0; i < standings.length; i++) {
    standings[i].position = i + 1;
  }

  return { standings, undecidedTie };
}

/**
 * Head-to-head tiebreaker for teams tied on points, GD, and GF. Reorders the
 * `standings` array in place. Returns true if any tie remained unresolved by
 * the implemented criteria (would fall to fair play / drawing of lots).
 */
export function resolveH2H(
  standings: GroupStanding[],
  groupMatches: Match[],
  score: ScoreLookup,
): boolean {
  // Find contiguous groups of teams tied on points, GD, and GF.
  const tiedGroups: GroupStanding[][] = [];
  let currentGroup: GroupStanding[] = [standings[0]];

  for (let i = 1; i < standings.length; i++) {
    const prev = standings[i - 1];
    const curr = standings[i];
    if (
      prev.points === curr.points &&
      prev.goalDiff === curr.goalDiff &&
      prev.goalsFor === curr.goalsFor
    ) {
      currentGroup.push(curr);
    } else {
      if (currentGroup.length > 1) tiedGroups.push(currentGroup);
      currentGroup = [curr];
    }
  }
  if (currentGroup.length > 1) tiedGroups.push(currentGroup);

  let undecided = false;

  for (const tiedGroup of tiedGroups) {
    const h2hRecords = new Map<string, { pts: number; gd: number; gf: number }>();
    for (const t of tiedGroup) {
      h2hRecords.set(t.teamId, { pts: 0, gd: 0, gf: 0 });
    }

    const tiedIds = new Set(tiedGroup.map((t) => t.teamId));

    for (const match of groupMatches) {
      if (!tiedIds.has(match.homeTeamId) || !tiedIds.has(match.awayTeamId)) continue;
      const s = score(match.id);
      if (!s) continue;

      const home = h2hRecords.get(match.homeTeamId)!;
      const away = h2hRecords.get(match.awayTeamId)!;
      home.gd += s.home - s.away;
      away.gd += s.away - s.home;
      home.gf += s.home;
      away.gf += s.away;

      if (s.home > s.away) home.pts += 3;
      else if (s.home < s.away) away.pts += 3;
      else {
        home.pts += 1;
        away.pts += 1;
      }
    }

    // Capture start index before sorting (tiedGroup is a contiguous block).
    const startIdx = standings.indexOf(tiedGroup[0]);

    tiedGroup.sort((a, b) => {
      const ha = h2hRecords.get(a.teamId)!;
      const hb = h2hRecords.get(b.teamId)!;
      if (ha.pts !== hb.pts) return hb.pts - ha.pts;
      if (ha.gd !== hb.gd) return hb.gd - ha.gd;
      if (ha.gf !== hb.gf) return hb.gf - ha.gf;
      return 0;
    });

    // Detect adjacent pairs the H2H mini-table still couldn't separate.
    for (let i = 1; i < tiedGroup.length; i++) {
      const ha = h2hRecords.get(tiedGroup[i - 1].teamId)!;
      const hb = h2hRecords.get(tiedGroup[i].teamId)!;
      if (ha.pts === hb.pts && ha.gd === hb.gd && ha.gf === hb.gf) {
        undecided = true;
      }
    }

    for (let i = 0; i < tiedGroup.length; i++) {
      standings[startIdx + i] = tiedGroup[i];
    }
  }

  return undecided;
}

/**
 * Given all match results, compute the group table for a specific group.
 * Follows FIFA tiebreaker rules:
 *   1. Points
 *   2. Goal difference
 *   3. Goals scored
 *   4. Head-to-head points among tied teams
 *   5. Head-to-head goal difference among tied teams
 *   6. Head-to-head goals scored among tied teams
 *   7. Fair play points (lower = better, not implemented here)
 *   8. Drawing of lots (not implemented)
 */
export function computeGroupStandings(
  group: GroupName,
  results: Map<string, MatchResult>,
): GroupStanding[] {
  const teamIds = TEAMS.filter((t) => t.group === group).map((t) => t.id);
  const groupMatches = GROUP_MATCHES.filter((m) => m.group === group);
  return rankTeams(teamIds, groupMatches, lookupFromResults(results)).standings;
}
