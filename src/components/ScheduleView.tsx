import { useState, useMemo, useRef } from "react";
import { GROUP_MATCHES } from "../data/schedule";
import { ALL_GROUPS } from "../data/teams";
import MatchCard from "./MatchCard";
import GroupTable from "./GroupTable";
import QualificationScenarios from "./QualificationScenarios";
import type { GroupName, Match } from "../data/types";

export default function ScheduleView() {
  const [selectedGroup, setSelectedGroup] = useState<GroupName | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // All unique dates
  const allDates = useMemo(() => {
    const dates = new Set<string>();
    for (const m of GROUP_MATCHES) dates.add(m.date);
    return Array.from(dates).sort();
  }, []);

  // Group matches by date
  const byDate = useMemo(() => {
    const map = new Map<string, typeof GROUP_MATCHES>();
    for (const m of GROUP_MATCHES) {
      if (selectedGroup && m.group !== selectedGroup) continue;
      if (selectedDate && m.date !== selectedDate) continue;
      const existing = map.get(m.date) ?? [];
      existing.push(m);
      map.set(m.date, existing);
    }
    for (const matches of map.values()) {
      matches.sort((a, b) => matchStartKey(a).localeCompare(matchStartKey(b)));
    }
    return map;
  }, [selectedGroup, selectedDate]);

  const sortedDates = Array.from(byDate.keys()).sort();

  const jumpTo = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
    setSelectedGroup(null);
    setTimeout(() => {
      dayRefs.current
        .get(date)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const today = new Date().toISOString().slice(0, 10);

  const fmt = (date: string) =>
    new Date(date + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const fullFmt = (date: string) =>
    new Date(date + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="schedule-view">
      <div className="schedule-header">
        <h2>Group Stage Schedule</h2>
        <div className="filter-bar">
          <button
            className={`filter-btn ${!selectedGroup && !selectedDate ? "active" : ""}`}
            onClick={() => {
              setSelectedGroup(null);
              setSelectedDate(null);
            }}
          >
            All
          </button>
          {allDates.includes(today) && (
            <button
              className={`filter-btn ${selectedDate === today ? "active" : ""}`}
              onClick={() => jumpTo(today)}
            >
              Today
            </button>
          )}
          <span className="filter-sep" />
          {ALL_GROUPS.map((g) => (
            <button
              key={g}
              className={`filter-btn ${selectedGroup === g ? "active" : ""}`}
              onClick={() => {
                setSelectedGroup(selectedGroup === g ? null : g);
                setSelectedDate(null);
              }}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="date-jump-bar">
          {allDates.map((d) => (
            <button
              key={d}
              className={`date-chip ${selectedDate === d ? "active" : ""}`}
              onClick={() => jumpTo(d)}
            >
              {fmt(d)}
            </button>
          ))}
        </div>
      </div>

      {selectedGroup && (
        <div className="schedule-with-standings">
          <div className="schedule-standings-panel">
            <GroupTable group={selectedGroup} />
            <QualificationScenarios group={selectedGroup} />
          </div>
          <div className="schedule-matches-panel">
            {sortedDates.map((date) => (
              <div
                key={date}
                ref={(el) => {
                  if (el) dayRefs.current.set(date, el);
                }}
              >
                <h3 className="matchday-title">{fullFmt(date)}</h3>
                <div className="matchday-matches">
                  {(byDate.get(date) ?? []).map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedGroup &&
        sortedDates.map((date) => (
          <div
            key={date}
            ref={(el) => {
              if (el) dayRefs.current.set(date, el);
            }}
          >
            <h3 className="matchday-title">{fullFmt(date)}</h3>
            <div className="matchday-matches">
              {(byDate.get(date) ?? []).map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function matchStartKey(match: Match): string {
  return `${match.date}T${match.time ?? "99:99"}-${match.id}`;
}
