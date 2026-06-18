import type { Match, MatchResult, GroupStanding, GroupName } from "../data/types";
import { TEAMS } from "../data/teams";
import { GROUP_MATCHES } from "../data/schedule";

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
  results: Map<string, MatchResult>
): GroupStanding[] {
  const groupTeams = TEAMS.filter((t) => t.group === group);
  const groupMatches = GROUP_MATCHES.filter((m) => m.group === group);

  // Raw standings
  const standings: GroupStanding[] = groupTeams.map((team) => ({
    teamId: team.id,
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
  }));

  // Accumulate results
  for (const match of groupMatches) {
    const result = results.get(match.id);
    if (!result || result.homeScore === null || result.awayScore === null) continue;

    const homeStanding = standings.find((s) => s.teamId === match.homeTeamId)!;
    const awayStanding = standings.find((s) => s.teamId === match.awayTeamId)!;

    homeStanding.played++;
    awayStanding.played++;
    homeStanding.goalsFor += result.homeScore;
    homeStanding.goalsAgainst += result.awayScore;
    awayStanding.goalsFor += result.awayScore;
    awayStanding.goalsAgainst += result.homeScore;

    if (result.homeScore > result.awayScore) {
      homeStanding.won++;
      homeStanding.points += 3;
      awayStanding.lost++;
    } else if (result.homeScore < result.awayScore) {
      awayStanding.won++;
      awayStanding.points += 3;
      homeStanding.lost++;
    } else {
      homeStanding.drawn++;
      awayStanding.drawn++;
      homeStanding.points += 1;
      awayStanding.points += 1;
    }
  }

  for (const s of standings) {
    s.goalDiff = s.goalsFor - s.goalsAgainst;
  }

  // Sort by FIFA tiebreaker criteria
  standings.sort((a, b) => {
    // 1. Points
    if (a.points !== b.points) return b.points - a.points;
    // 2. Goal diff
    if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
    // 3. Goals scored
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
    // 4-6. Head-to-head (need to identify tie subsets)
    // We'll resolve h2h for tied teams below
    return 0;
  });

  // Resolve head-to-head ties
  resolveH2H(standings, groupMatches, results);

  // Assign positions
  for (let i = 0; i < standings.length; i++) {
    standings[i].position = i + 1;
  }

  return standings;
}

/**
 * Head-to-head tiebreaker for teams tied on points, GD, and GF.
 */
function resolveH2H(
  standings: GroupStanding[],
  groupMatches: Match[],
  results: Map<string, MatchResult>
) {
  // Find groups of teams tied on points, GD, and GF
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

  // For each tied group, compute h2h mini-table
  for (const tiedGroup of tiedGroups) {
    const h2hRecords = new Map<string, { pts: number; gd: number; gf: number }>();
    for (const t of tiedGroup) {
      h2hRecords.set(t.teamId, { pts: 0, gd: 0, gf: 0 });
    }

    const tiedIds = new Set(tiedGroup.map((t) => t.teamId));

    for (const match of groupMatches) {
      if (!tiedIds.has(match.homeTeamId) || !tiedIds.has(match.awayTeamId)) continue;
      const result = results.get(match.id);
      if (!result || result.homeScore === null || result.awayScore === null) continue;

      const home = h2hRecords.get(match.homeTeamId)!;
      const away = h2hRecords.get(match.awayTeamId)!;
      home.gd += result.homeScore - result.awayScore;
      away.gd += result.awayScore - result.homeScore;
      home.gf += result.homeScore;
      away.gf += result.awayScore;

      if (result.homeScore > result.awayScore) home.pts += 3;
      else if (result.homeScore < result.awayScore) away.pts += 3;
      else { home.pts += 1; away.pts += 1; }
    }

    // Capture start index before sorting (tiedGroup is a contiguous block in standings)
    const startIdx = standings.indexOf(tiedGroup[0]);

    // Reorder tiedGroup by h2h
    tiedGroup.sort((a, b) => {
      const ha = h2hRecords.get(a.teamId)!;
      const hb = h2hRecords.get(b.teamId)!;
      if (ha.pts !== hb.pts) return hb.pts - ha.pts;
      if (ha.gd !== hb.gd) return hb.gd - ha.gd;
      if (ha.gf !== hb.gf) return hb.gf - ha.gf;
      return 0;
    });

    // Write back into standings array at the correct indices
    for (let i = 0; i < tiedGroup.length; i++) {
      standings[startIdx + i] = tiedGroup[i];
    }
  }
}
