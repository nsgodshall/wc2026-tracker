import { useMemo } from "react";
import type { GroupName } from "../data/types";
import { useApp } from "../state/AppContext";
import { computeGroupStandings } from "../logic/standings";
import { GROUP_MATCHES } from "../data/schedule";
import { TEAMS } from "../data/teams";

interface Props {
  group: GroupName;
}

export default function QualificationScenarios({ group }: Props) {
  const { results } = useApp();

  const scenarios = useMemo(() => {
    const matches = GROUP_MATCHES.filter((m) => m.group === group);
    const played = matches.filter((m) => {
      const r = results.get(m.id);
      return r?.homeScore !== null && r?.awayScore !== null;
    });
    if (played.length === 0) return null;

    return matches
      .filter((m) => {
        const r = results.get(m.id);
        return r?.homeScore === null || r?.awayScore === null;
      })
      .map((remMatch) => {
        return TEAMS.filter((t) => t.group === group).map((team) => {
          const isHome = remMatch.homeTeamId === team.id;
          const outcomes: {
            label: string;
            pos: number;
            qualifies: boolean;
            third: boolean;
          }[] = [];

          for (const [hs, as, lbl] of [
            [1, 0, "Win"],
            [0, 0, "Draw"],
            [0, 1, "Lose"],
          ] as const) {
            const sim = new Map(results);
            const id = remMatch.id;
            if (isHome)
              sim.set(id, { matchId: id, homeScore: hs, awayScore: as });
            else sim.set(id, { matchId: id, homeScore: as, awayScore: hs });

            const row = computeGroupStandings(group, sim).find(
              (r) => r.teamId === team.id,
            )!;
            outcomes.push({
              label: lbl,
              pos: row.position,
              qualifies: row.position <= 2,
              third: row.position === 3,
            });
          }

          return { teamId: team.id, outcomes, matchId: remMatch.id };
        });
      })
      .flat();
  }, [results, group]);

  if (!scenarios) return null;

  return (
    <div className="qual-scenarios">
      <div className="qs-title">What each team needs</div>
      {scenarios.map((s) => {
        const t = TEAMS.find((x) => x.id === s.teamId)!;
        return (
          <div key={`${s.teamId}-${s.matchId}`} className="qs-row">
            <span className="qs-team">{t.name}</span>
            <span className="qs-outcomes">
              {s.outcomes.map((o) => (
                <span
                  key={o.label}
                  className={`qs-badge ${o.qualifies ? "qs-in" : o.third ? "qs-third" : "qs-out"}`}
                >
                  {o.label}:{" "}
                  {o.qualifies
                    ? "✓ Qualifies"
                    : o.third
                      ? "3rd place"
                      : "✗ Out"}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
