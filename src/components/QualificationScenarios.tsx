import { useMemo } from "react";
import type { GroupName } from "../data/types";
import { useApp } from "../state/AppContext";
import {
  computeGroupOutlook,
  type OutlookStatus,
  type OwnResultOutlook,
  type VerdictKind,
} from "../logic/scenarios";

interface Props {
  group: GroupName;
}

const STATUS_META: Record<
  OutlookStatus,
  { label: string; cls: string }
> = {
  "won-group": { label: "Won group 🏆", cls: "qs-in" },
  "clinched-top2": { label: "Through ✓", cls: "qs-in" },
  alive: { label: "Still alive", cls: "qs-third" },
  eliminated: { label: "Eliminated ✗", cls: "qs-out" },
};

const VERDICT_META: Record<VerdictKind, { label: string; cls: string }> = {
  guarantees: { label: "Through", cls: "qs-in" },
  possible: { label: "Maybe", cls: "qs-third" },
  impossible: { label: "Out", cls: "qs-out" },
};

const RESULT_LABEL: Record<OwnResultOutlook["result"], string> = {
  win: "Win",
  draw: "Draw",
  loss: "Lose",
};

export default function QualificationScenarios({ group }: Props) {
  const { results, getTeamName } = useApp();

  const outlook = useMemo(
    () => computeGroupOutlook(group, results, getTeamName),
    [group, results, getTeamName],
  );

  // Nothing useful to show before any match is played.
  const anyDecided = outlook.teams.some(
    (t) => t.status !== "alive" || t.ownResults.length > 0,
  );

  return (
    <div className="qual-scenarios">
      <div className="qs-title">What each team needs</div>
      {!anyDecided && (
        <div className="qs-note">
          Enter some results to see who can still qualify.
        </div>
      )}
      {outlook.teams.map((t) => {
        const meta = STATUS_META[t.status];
        const opponentName =
          t.ownResults.length > 0 ? getTeamName(t.ownResults[0].opponentId) : null;
        return (
          <div key={t.teamId} className="qs-team-block">
            <div className="qs-row">
              <span className="qs-team">{t.teamName}</span>
              <span className={`qs-badge ${meta.cls}`}>{meta.label}</span>
              {t.status === "alive" && t.minPosition !== t.maxPosition && (
                <span className="qs-range">
                  can finish {ordinal(t.minPosition)}–{ordinal(t.maxPosition)}
                </span>
              )}
            </div>

            {opponentName && (
              <div className="qs-detail">
                <div className="qs-detail-head">Last game vs {opponentName}</div>
                {t.ownResults.map((r) => {
                  const v = VERDICT_META[r.verdict];
                  return (
                    <div key={r.result} className="qs-line">
                      <span className="qs-result">{RESULT_LABEL[r.result]}</span>
                      <span className={`qs-badge ${v.cls}`}>{v.label}</span>
                      {r.condition && (
                        <span className="qs-cond">if {r.condition}</span>
                      )}
                      {r.marginText && (
                        <span className="qs-cond">{r.marginText}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {t.tiebreakUndecided && (
              <div className="qs-note">
                Level on all tiebreakers — decided by fair play / drawing of lots.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ordinal(n: number): string {
  return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
}
