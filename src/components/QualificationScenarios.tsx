import { useMemo } from "react";
import type { GroupName } from "../data/types";
import { useApp } from "../state/AppContext";
import { computeGroupStandings } from "../logic/standings";
import { GROUP_MATCHES } from "../data/schedule";
import { getTeamsByGroup } from "../data/teams";

interface Props {
  group: GroupName;
}

type OutcomeLabel = "Win" | "Draw" | "Lose";

interface TeamScenario {
  teamId: string;
  teamName: string;
  matchId: string;
  outcomes: { label: OutcomeLabel; position: number }[];
}

export default function QualificationScenarios({ group }: Props) {
  const { results, getTeamName } = useApp();

  const scenarios = useMemo((): TeamScenario[] => {
    const groupMatches = GROUP_MATCHES.filter((m) => m.group === group);
    const remaining = groupMatches.filter((m) => {
      const r = results.get(m.id);
      return !r || r.homeScore === null || r.awayScore === null;
    });

    if (remaining.length === 0) return [];

    const groupTeams = getTeamsByGroup(group);

    return remaining.flatMap((match) => {
      const teamsInMatch = groupTeams.filter(
        (t) => t.id === match.homeTeamId || t.id === match.awayTeamId,
      );

      return teamsInMatch.map((team) => {
        const isHome = team.id === match.homeTeamId;
        const outcomeDefinitions: [OutcomeLabel, number, number][] = [
          ["Win", 1, 0],
          ["Draw", 0, 0],
          ["Lose", 0, 1],
        ];

        const outcomes = outcomeDefinitions.map(([label, homeGoals, awayGoals]) => {
          const simResults = new Map(results);
          simResults.set(match.id, {
            matchId: match.id,
            homeScore: isHome ? homeGoals : awayGoals,
            awayScore: isHome ? awayGoals : homeGoals,
          });
          const standings = computeGroupStandings(group, simResults);
          const row = standings.find((r) => r.teamId === team.id)!;
          return { label, position: row.position };
        });

        return {
          teamId: team.id,
          teamName: getTeamName(team.id),
          matchId: match.id,
          outcomes,
        };
      });
    });
  }, [results, group, getTeamName]);

  if (scenarios.length === 0) return null;

  return (
    <div className="qual-scenarios">
      <div className="qs-title">What each team needs</div>
      {scenarios.map((s) => (
        <div key={`${s.teamId}-${s.matchId}`} className="qs-row">
          <span className="qs-team">{s.teamName}</span>
          <span className="qs-outcomes">
            {s.outcomes.map((o) => {
              const cls =
                o.position <= 2 ? "qs-in" : o.position === 3 ? "qs-third" : "qs-out";
              const symbol =
                o.position <= 2 ? "✓" : o.position === 3 ? "3rd" : "✗";
              return (
                <span key={o.label} className={`qs-badge ${cls}`}>
                  {o.label}: {symbol}
                </span>
              );
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
