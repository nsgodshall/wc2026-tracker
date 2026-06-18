import { useState } from "react";
import { TEAMS } from "../data/teams";
import { useApp } from "../state/AppContext";

export default function TeamEditor() {
  const { teamNames, setTeamName } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const teams = TEAMS.filter(
    (t) =>
      !filter ||
      t.id.toLowerCase().includes(filter.toLowerCase()) ||
      (teamNames.get(t.id) ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="team-editor">
      <button className="btn-secondary" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "Close" : "Edit Team Names"}
      </button>
      {isOpen && (
        <div className="team-editor-panel">
          <input
            type="text"
            className="team-search"
            placeholder="Filter teams..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="team-list">
            {teams.map((team) => (
              <div key={team.id} className="team-row">
                <span className="team-id">{team.id}</span>
                <input
                  type="text"
                  className="team-name-input"
                  value={teamNames.get(team.id) ?? team.name}
                  onChange={(e) => setTeamName(team.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
