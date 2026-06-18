import { useState } from "react";
import { GROUP_MATCHES } from "../data/schedule";
import { ALL_GROUPS } from "../data/teams";
import MatchCard from "./MatchCard";
import GroupTable from "./GroupTable";
import type { GroupName } from "../data/types";

export default function ScheduleView() {
  const [selectedGroup, setSelectedGroup] = useState<GroupName | null>(null);

  // Group matches by date
  const byDate = new Map<string, typeof GROUP_MATCHES>();
  for (const m of GROUP_MATCHES) {
    if (selectedGroup && m.group !== selectedGroup) continue;
    const existing = byDate.get(m.date) ?? [];
    existing.push(m);
    byDate.set(m.date, existing);
  }

  const sortedDates = Array.from(byDate.keys()).sort();

  return (
    <div className="schedule-view">
      <div className="schedule-header">
        <h2>Group Stage Schedule</h2>
        <div className="filter-bar">
          <button
            className={`filter-btn ${!selectedGroup ? "active" : ""}`}
            onClick={() => setSelectedGroup(null)}
          >
            All Groups
          </button>
          {ALL_GROUPS.map((g) => (
            <button
              key={g}
              className={`filter-btn ${selectedGroup === g ? "active" : ""}`}
              onClick={() => setSelectedGroup(selectedGroup === g ? null : g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Show standings panel when a group is selected */}
      {selectedGroup && (
        <div className="schedule-with-standings">
          <div className="schedule-standings-panel">
            <GroupTable group={selectedGroup} />
          </div>
          <div className="schedule-matches-panel">
            {sortedDates.map((date) => {
              const matches = byDate.get(date)!;
              const dateStr = new Date(date + "T12:00:00").toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                },
              );
              return (
                <div key={date} className="matchday">
                  <h3 className="matchday-title">{dateStr}</h3>
                  <div className="matchday-matches">
                    {matches.map((m) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full schedule when viewing all groups */}
      {!selectedGroup &&
        sortedDates.map((date) => {
          const matches = byDate.get(date)!;
          const dateStr = new Date(date + "T12:00:00").toLocaleDateString(
            "en-US",
            {
              weekday: "long",
              month: "long",
              day: "numeric",
            },
          );
          return (
            <div key={date} className="matchday">
              <h3 className="matchday-title">{dateStr}</h3>
              <div className="matchday-matches">
                {matches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
