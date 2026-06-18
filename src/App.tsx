import { useState } from "react";
import { AppProvider, useApp } from "./state/AppContext";
import GroupTable from "./components/GroupTable";
import ScheduleView from "./components/ScheduleView";
import KnockoutBracket from "./components/KnockoutBracket";
import ThirdPlaceRanking from "./components/ThirdPlaceRanking";
import TeamEditor from "./components/TeamEditor";
import { ALL_GROUPS, TEAMS } from "./data/teams";

type Tab = "standings" | "schedule" | "third-place" | "knockout";

function TabButton({
  tab,
  current,
  label,
  onClick,
}: {
  tab: Tab;
  current: Tab;
  label: string;
  onClick: (t: Tab) => void;
}) {
  return (
    <button
      className={`tab-btn ${current === tab ? "active" : ""}`}
      onClick={() => onClick(tab)}
    >
      {label}
    </button>
  );
}

function AppContent() {
  const [tab, setTab] = useState<Tab>("standings");
  const { resetAll, allMatches, getResult } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const todaysMatches = allMatches.filter((m) => m.date === today);

  const flag = (teamId: string) => {
    const t = TEAMS.find((x) => x.id === teamId);
    if (!t?.fifaCode) return null;
    return (
      <img
        src={`https://flagcdn.com/w40/${t.fifaCode}.png`}
        alt=""
        className="htm-flag"
        width="20"
        height="14"
      />
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1>⚽ 2026 FIFA World Cup Tracker</h1>
          <div className="header-actions">
            <TeamEditor />
            <button className="btn-reset" onClick={resetAll}>
              Reset Scores
            </button>
          </div>
        </div>
        {todaysMatches.length > 0 && (
          <div className="header-today">
            <span className="header-today-label">Today</span>
            {todaysMatches.map((m) => {
              const r = getResult(m.id);
              return (
                <span key={m.id} className="header-today-match">
                  {flag(m.homeTeamId)}
                  <span className="htm-score">
                    {r?.homeScore !== null ? r?.homeScore : "–"}:
                    {r?.awayScore !== null ? r?.awayScore : "–"}
                  </span>
                  {flag(m.awayTeamId)}
                </span>
              );
            })}
          </div>
        )}
        <nav className="tab-nav">
          <TabButton
            tab="standings"
            current={tab}
            label="Standings"
            onClick={setTab}
          />
          <TabButton
            tab="schedule"
            current={tab}
            label="Schedule"
            onClick={setTab}
          />
          <TabButton
            tab="third-place"
            current={tab}
            label="3rd Place"
            onClick={setTab}
          />
          <TabButton
            tab="knockout"
            current={tab}
            label="Knockout"
            onClick={setTab}
          />
        </nav>
      </header>

      <main className="app-main">
        {tab === "standings" && (
          <div className="standings-grid">
            {ALL_GROUPS.map((group) => (
              <GroupTable key={group} group={group} />
            ))}
          </div>
        )}
        {tab === "schedule" && <ScheduleView />}
        {tab === "third-place" && <ThirdPlaceRanking />}
        {tab === "knockout" && <KnockoutBracket />}
      </main>

      <footer className="app-footer">
        <p>
          Tournament: June 11 – July 19, 2026 | 16 Host Cities in USA, Canada,
          &amp; Mexico | 12 Groups → 32 Knockout Teams
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
