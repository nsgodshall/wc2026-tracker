import React from "react";
import type { Match } from "../data/types";
import { useApp } from "../state/AppContext";
import { getTeamById } from "../data/teams";
import FlagIcon from "./FlagIcon";

interface Props {
  match: Match;
  showVenue?: boolean;
  compact?: boolean;
}

/** Helper: ensure score is null or >= 0 */
function clampScore(val: string): number | null {
  if (val === "") return null;
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 0) return 0;
  return n;
}

export default function MatchCard({
  match,
  showVenue = true,
  compact = false,
}: Props) {
  const { getTeamName, getResult, setScore } = useApp();
  const result = getResult(match.id);

  const homeTeam = getTeamById(match.homeTeamId);
  const awayTeam = getTeamById(match.awayTeamId);

  const homeName = match.homeTeamId.startsWith("slot_")
    ? match.homeTeamId
    : getTeamName(match.homeTeamId);
  const awayName = match.awayTeamId.startsWith("slot_")
    ? match.awayTeamId
    : getTeamName(match.awayTeamId);

  const isKnockout = match.round !== "group";
  const isPlaceholder =
    match.homeTeamId.startsWith("slot_") ||
    match.awayTeamId.startsWith("slot_");

  const homeScore = result?.homeScore ?? 0;
  const awayScore = result?.awayScore ?? 0;
  const hasResult = result?.homeScore !== null || result?.awayScore !== null;

  const clearMatch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setScore(match.id, null, null);
  };

  const handleHomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = clampScore(e.target.value);
    setScore(match.id, num, result?.awayScore ?? null);
  };

  const handleAwayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = clampScore(e.target.value);
    setScore(match.id, result?.homeScore ?? null, num);
  };

  /** Left-click home name → +1, auto-sets away to 0 if empty */
  const incHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPlaceholder) return;
    const awayVal = result?.awayScore ?? 0;
    setScore(match.id, homeScore + 1, awayVal);
  };

  /** Right-click home name → -1, auto-sets away to 0 if empty */
  const decHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPlaceholder) return;
    const awayVal = result?.awayScore ?? 0;
    setScore(match.id, Math.max(0, homeScore - 1), awayVal);
  };

  /** Left-click away name → +1, auto-sets home to 0 if empty */
  const incAway = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPlaceholder) return;
    const homeVal = result?.homeScore ?? 0;
    setScore(match.id, homeVal, awayScore + 1);
  };

  /** Right-click away name → -1, auto-sets home to 0 if empty */
  const decAway = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPlaceholder) return;
    const homeVal = result?.homeScore ?? 0;
    setScore(match.id, homeVal, Math.max(0, awayScore - 1));
  };

  const dateStr = new Date(match.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const flagEmoji = (code: string) => <FlagIcon code={code} size={14} />;

  if (compact) {
    return (
      <div className={`match-card compact ${isKnockout ? "ko" : ""}`}>
        {hasResult && (
          <button
            className="match-clear-btn"
            onClick={clearMatch}
            title="Reset match"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 4v4h4" />
              <path d="M3.5 13A9 9 0 1 0 2 8" />
            </svg>
          </button>
        )}
        <div className="match-teams">
          <span
            className={`team-name clickable ${isPlaceholder ? "" : "has-score"}`}
            onClick={incHome}
            onContextMenu={decHome}
            title="Click +1 | Right-click −1"
          >
            {flagEmoji(homeTeam?.fifaCode ?? "")}
            {homeName}
            {homeTeam && (
              <span className="fifa-rank">({homeTeam.ranking})</span>
            )}
          </span>
          <div className="score-inputs compact-scores">
            <input
              type="number"
              min="0"
              max="99"
              className="score-in"
              value={result?.homeScore ?? ""}
              onChange={handleHomeChange}
              disabled={isPlaceholder}
              placeholder="-"
            />
            <span className="dash">-</span>
            <input
              type="number"
              min="0"
              max="99"
              className="score-in"
              value={result?.awayScore ?? ""}
              onChange={handleAwayChange}
              disabled={isPlaceholder}
              placeholder="-"
            />
          </div>
          <span
            className={`team-name clickable ${isPlaceholder ? "" : "has-score"}`}
            onClick={incAway}
            onContextMenu={decAway}
            title="Click +1 | Right-click −1"
          >
            {flagEmoji(awayTeam?.fifaCode ?? "")}
            {awayName}
            {awayTeam && (
              <span className="fifa-rank">({awayTeam.ranking})</span>
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`match-card ${isKnockout ? "ko" : ""}`}>
      {match.knockoutLabel && (
        <div className="match-label">{match.knockoutLabel}</div>
      )}
      {hasResult && (
        <button
          className="match-clear-btn"
          onClick={clearMatch}
          title="Reset match"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 4v4h4" />
            <path d="M3.5 13A9 9 0 1 0 2 8" />
          </svg>
        </button>
      )}
      <div className="match-header">
        <span className="match-date">{dateStr}</span>
        {showVenue && (
          <span className="match-venue">
            {match.city} — {match.venue}
          </span>
        )}
        {match.group && (
          <span className="match-group">Group {match.group}</span>
        )}
      </div>
      <div className="match-body">
        <div
          className={`team home clickable ${isPlaceholder ? "" : "has-score"}`}
          onClick={incHome}
          onContextMenu={decHome}
          title="Click team name +1 | Right-click −1"
        >
          <span className="team-name">
            {flagEmoji(homeTeam?.fifaCode ?? "")} {homeName}
            {homeTeam && (
              <span className="fifa-rank">({homeTeam.ranking})</span>
            )}
          </span>
        </div>
        <div className="match-score">
          <input
            type="number"
            min="0"
            max="99"
            className="score-input"
            value={result?.homeScore ?? ""}
            onChange={handleHomeChange}
            disabled={isPlaceholder}
            placeholder="-"
          />
          <span className="score-colon">:</span>
          <input
            type="number"
            min="0"
            max="99"
            className="score-input"
            value={result?.awayScore ?? ""}
            onChange={handleAwayChange}
            disabled={isPlaceholder}
            placeholder="-"
          />
        </div>
        <div
          className={`team away clickable ${isPlaceholder ? "" : "has-score"}`}
          onClick={incAway}
          onContextMenu={decAway}
          title="Click team name +1 | Right-click −1"
        >
          <span className="team-name">
            {awayName} {flagEmoji(awayTeam?.fifaCode ?? "")}
            {awayTeam && (
              <span className="fifa-rank">({awayTeam.ranking})</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
