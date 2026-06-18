import { useApp } from "../state/AppContext";
import { getTeamById, getFlagUrl } from "../data/teams";

export default function ThirdPlaceRanking() {
  const { thirdPlaceRanks, getTeamName } = useApp();

  if (thirdPlaceRanks.length === 0) return null;

  return (
    <div className="third-place-ranking">
      <h2>3rd Place Ranking</h2>
      <p className="subtitle">
        The 12 third-place teams are ranked across all groups. Only the{" "}
        <strong>top 8</strong> advance to the Round of 32.
      </p>
      <div className="tpr-explanation">
        <h4>Ranking criteria (in order):</h4>
        <ol>
          <li>Points</li>
          <li>Goal difference</li>
          <li>Goals scored</li>
          <li>Fair play points (fewer deductions = better)</li>
          <li>Latest FIFA ranking</li>
        </ol>
        <p className="tpr-note">
          The 8 qualifying 3rd-place teams are then allocated to specific Round
          of 32 slots according to a pre-determined table (FIFA Annex C) based
          on which groups they come from, to avoid rematches with group
          winners/runners-up from the same group.
        </p>
      </div>
      <table className="group-table tpr-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>Group</th>
            <th>Pts</th>
            <th>GD</th>
            <th>GF</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {thirdPlaceRanks.map((tpr) => (
            <tr
              key={tpr.teamId}
              className={tpr.qualifies ? "qualified" : "eliminated"}
            >
              <td>{tpr.rank}</td>
              <td className="team-name-cell">
                <img
                  src={getFlagUrl(getTeamById(tpr.teamId)?.fifaCode ?? "")}
                  alt=""
                  className="flag-icon"
                  width="20"
                  height="14"
                />
                {getTeamName(tpr.teamId)}
              </td>
              <td>{tpr.group}</td>
              <td>{tpr.points}</td>
              <td
                className={
                  tpr.goalDiff > 0
                    ? "positive"
                    : tpr.goalDiff < 0
                      ? "negative"
                      : ""
                }
              >
                {tpr.goalDiff > 0 ? "+" : ""}
                {tpr.goalDiff}
              </td>
              <td>{tpr.goalsFor}</td>
              <td>
                <span
                  className={`status-badge ${tpr.qualifies ? "qualifies" : "out"}`}
                >
                  {tpr.qualifies ? "✓ Advances" : "✗ Out"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
