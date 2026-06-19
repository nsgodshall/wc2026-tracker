import { useRef, useLayoutEffect, useMemo } from "react";
import type { GroupName, GroupStanding } from "../data/types";
import { useApp } from "../state/AppContext";
import { getTeamById } from "../data/teams";
import { computeGroupOutlook, type OutlookStatus } from "../logic/scenarios";
import FlagIcon from "./FlagIcon";
import { usePrevious } from "../state/usePrevious";

interface Props {
  group: GroupName;
}

const STATUS_PILL: Record<
  OutlookStatus,
  { label: string; cls: string } | null
> = {
  "won-group": { label: "Won", cls: "qs-in" },
  "clinched-top2": { label: "Through", cls: "qs-in" },
  alive: null, // no pill — the default, undecided state
  eliminated: { label: "Out", cls: "qs-out" },
};

export default function GroupTable({ group }: Props) {
  const { allStandings, getTeamName, thirdPlaceRanks, results } = useApp();
  const standings = allStandings.get(group) ?? [];

  // Per-team qualification status (top-2 race) for the status pills.
  const statusByTeam = useMemo(() => {
    const map = new Map<string, OutlookStatus>();
    for (const t of computeGroupOutlook(group, results, getTeamName).teams) {
      map.set(t.teamId, t.status);
    }
    return map;
  }, [group, results, getTeamName]);
  const prevStandings = usePrevious(standings);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Check if this group's 3rd place currently qualifies
  const thirdRank = thirdPlaceRanks.find((r) => r.group === group);
  const thirdQualifies = thirdRank?.qualifies ?? undefined; // undefined = not yet determined

  // Build a map of teamId → previous stats for change detection
  const prevStats = new Map<string, GroupStanding>();
  if (prevStandings) {
    for (const s of prevStandings) {
      prevStats.set(s.teamId, s);
    }
  }

  // Build a map of teamId → new row index (0-3)
  const newIndex = new Map<string, number>();
  for (let i = 0; i < standings.length; i++) {
    newIndex.set(standings[i].teamId, i);
  }

  // Animation: track old positions and animate to new
  const oldY = useRef<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    // Measure current positions of all rows, relative to the table container.
    // Using offsetTop (not getBoundingClientRect().top) keeps the FLIP immune to
    // page scroll and layout shifts above the table — otherwise every row gets the
    // same delta and the whole table appears to slide.
    const currentY = new Map<string, number>();
    for (const [teamId, el] of rowRefs.current) {
      currentY.set(teamId, el.offsetTop);
    }

    // For rows that changed position, apply a FLIP transform
    for (const [teamId, el] of rowRefs.current) {
      const prev = oldY.current.get(teamId);
      const curr = currentY.get(teamId);
      if (
        prev !== undefined &&
        curr !== undefined &&
        Math.abs(prev - curr) > 0.5
      ) {
        const delta = prev - curr;
        el.style.transition = "none";
        el.style.transform = `translateY(${delta}px)`;
        // Force reflow
        el.getBoundingClientRect();
        el.style.transition =
          "transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1.15)";
        el.style.transform = "translateY(0)";
      }
    }

    // Store current positions for next animation
    oldY.current = currentY;

    const timer = setTimeout(() => {}, 450);
    return () => clearTimeout(timer);
  }, [standings]);

  const setRowRef = (teamId: string) => (el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(teamId, el);
    else rowRefs.current.delete(teamId);
  };

  return (
    <div className="group-table-wrapper">
      <h3 className={`group-title group-${group}`}>Group {group}</h3>
      <div className="group-table-grid">
        <div className="gt-header">
          <span className="gt-col pos">#</span>
          <span className="gt-col team">Team</span>
          <span className="gt-col">GP</span>
          <span className="gt-col">W</span>
          <span className="gt-col">D</span>
          <span className="gt-col">L</span>
          <span className="gt-col">GF</span>
          <span className="gt-col">GA</span>
          <span className="gt-col">GD</span>
          <span className="gt-col">Pts</span>
        </div>
        {standings.map((row) => {
          const isTop2 = row.position <= 2;
          const isThird = row.position === 3;
          const prevRow = prevStats.get(row.teamId);
          const movedUp = prevRow && prevRow.position > row.position;
          const movedDown = prevRow && prevRow.position < row.position;

          return (
            <div
              key={row.teamId}
              ref={setRowRef(row.teamId)}
              className={`gt-row ${isTop2 ? "qualified" : ""} ${isThird ? (thirdQualifies ? "third-qualifies" : "third-eliminated") : ""}`}
            >
              <span className="gt-col pos">
                <span
                  className={`pos-num ${movedUp ? "moved-up" : movedDown ? "moved-down" : ""}`}
                >
                  {row.position}
                </span>
                {movedUp && <span className="pos-arrow up">▲</span>}
                {movedDown && <span className="pos-arrow down">▼</span>}
              </span>
              <span className="gt-col team">
                <FlagIcon
                  code={getTeamById(row.teamId)?.fifaCode ?? ""}
                  size={13}
                />
                {getTeamName(row.teamId)}
                <span className="fifa-rank">
                  ({getTeamById(row.teamId)?.ranking})
                </span>
                {(() => {
                  const pill =
                    STATUS_PILL[statusByTeam.get(row.teamId) ?? "alive"];
                  return pill ? (
                    <span className={`gt-status ${pill.cls}`}>
                      {pill.label}
                    </span>
                  ) : null;
                })()}
              </span>
              <span className="gt-col">
                <AnimatedValue
                  current={row.played}
                  previous={prevRow?.played}
                />
              </span>
              <span className="gt-col">
                <AnimatedValue current={row.won} previous={prevRow?.won} />
              </span>
              <span className="gt-col">
                <AnimatedValue current={row.drawn} previous={prevRow?.drawn} />
              </span>
              <span className="gt-col">
                <AnimatedValue current={row.lost} previous={prevRow?.lost} />
              </span>
              <span className="gt-col">
                <AnimatedValue
                  current={row.goalsFor}
                  previous={prevRow?.goalsFor}
                />
              </span>
              <span className="gt-col">
                <AnimatedValue
                  current={row.goalsAgainst}
                  previous={prevRow?.goalsAgainst}
                />
              </span>
              <span
                className={`gt-col ${row.goalDiff > 0 ? "positive" : row.goalDiff < 0 ? "negative" : ""}`}
              >
                <AnimatedValue
                  current={row.goalDiff}
                  previous={prevRow?.goalDiff}
                  prefix={row.goalDiff > 0 ? "+" : ""}
                />
              </span>
              <span className="gt-col points">
                <AnimatedValue
                  current={row.points}
                  previous={prevRow?.points}
                />
              </span>
            </div>
          );
        })}
      </div>
      <div className="qualification-legend">
        <span className="legend-dot qualified"></span> Qualify for R32 &nbsp;
        <span
          className={`legend-dot ${thirdQualifies === undefined ? "third-place" : thirdQualifies ? "third-qualifies" : "third-eliminated"}`}
        ></span>
        {thirdQualifies === undefined
          ? "May qualify (ranking undetermined)"
          : thirdQualifies
            ? "Qualifies for R32 ✓"
            : "Eliminated ✗"}
      </div>
    </div>
  );
}

function AnimatedValue({
  current,
  previous,
  prefix = "",
}: {
  current: number;
  previous?: number;
  prefix?: string;
}) {
  const changed = previous !== undefined && previous !== current;
  return (
    <span key={`${current}-${changed}`} className={changed ? "value-pop" : ""}>
      {prefix}
      {current}
    </span>
  );
}
