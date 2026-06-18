import React from "react";
import { useApp } from "../state/AppContext";
import { KNOCKOUT_MATCHES, ROUND_NAMES } from "../data/knockout";
import { getTeamById } from "../data/teams";
import FlagIcon from "./FlagIcon";
import { useMemo, useCallback } from "react";
import type { KnockoutSlot, MatchResult } from "../data/types";

const ROUND_KEYS = ["r32", "r16", "qf", "sf", "final"] as const;

export default function KnockoutBracket() {
  const { knockoutSlots, getResult: _getResult, setScore } = useApp();

  const byRound = useMemo(() => {
    const map = new Map<string, typeof KNOCKOUT_MATCHES>();
    for (const r of ROUND_KEYS) {
      map.set(
        r,
        KNOCKOUT_MATCHES.filter((m) => m.round === r),
      );
    }
    return map;
  }, []);

  const thirdPlaceMatch = KNOCKOUT_MATCHES.find((m) => m.round === "3rd");

  const getResult = useCallback(
    (id: string): MatchResult | undefined => _getResult(id),
    [_getResult],
  );

  return (
    <div className="bracket-shell">
      <h2 className="bracket-title">Knockout Stage</h2>
      <div className="bracket-tree">
        {ROUND_KEYS.map((round, ri) => {
          const matches = byRound.get(round)!;
          const hasNext = ri < ROUND_KEYS.length - 1;
          return (
            <React.Fragment key={round}>
              <div className={`bt-round bt-${round}`}>
                <div className="bt-round-label">{ROUND_NAMES[round]}</div>
                <div className="bt-matches">
                  {matches.map((km) => (
                    <BracketNode
                      key={km.id}
                      matchId={km.id}
                      label={km.label}
                      homeSlot={knockoutSlots[km.homeSlotIndex]}
                      awaySlot={knockoutSlots[km.awaySlotIndex]}
                      getResult={getResult}
                      setScore={setScore}
                    />
                  ))}
                </div>
              </div>
              {hasNext && (
                <div className="bt-connector">
                  <div className="bt-lines" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      {thirdPlaceMatch && (
        <div className="bt-third">
          <BracketNode
            matchId={thirdPlaceMatch.id}
            label="3rd Place"
            homeSlot={knockoutSlots[thirdPlaceMatch.homeSlotIndex]}
            awaySlot={knockoutSlots[thirdPlaceMatch.awaySlotIndex]}
            getResult={getResult}
            setScore={setScore}
          />
        </div>
      )}
    </div>
  );
}

function BracketNode({
  matchId,
  label,
  homeSlot,
  awaySlot,
  getResult,
  setScore,
}: {
  matchId: string;
  label: string;
  homeSlot: KnockoutSlot;
  awaySlot: KnockoutSlot;
  getResult: (id: string) => MatchResult | undefined;
  setScore: ReturnType<typeof useApp>["setScore"];
}) {
  const result = getResult(matchId);
  const homeTeam = homeSlot?.teamId ? getTeamById(homeSlot.teamId) : null;
  const awayTeam = awaySlot?.teamId ? getTeamById(awaySlot.teamId) : null;
  const isPlaceholder = !homeSlot?.teamId && !awaySlot?.teamId;

  const hs = result?.homeScore ?? 0;
  const as = result?.awayScore ?? 0;
  const played = result?.homeScore !== null && result?.awayScore !== null;

  const flag = (code: string) => <FlagIcon code={code} size={16} />;

  const short = (team: typeof homeTeam, slot: KnockoutSlot) => {
    if (team) {
      if (team.fifaCode === "gb-eng") return "ENG";
      if (team.fifaCode === "gb-sct") return "SCO";
      return team.fifaCode.toUpperCase();
    }
    return slot?.label?.slice(0, 3) ?? "—";
  };

  return (
    <div className={`bt-node ${played ? "played" : ""}`}>
      <div className="bt-node-label">{label}</div>
      {played && (
        <button
          className="match-clear-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setScore(matchId, null, null);
          }}
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
      <div className="bt-slot">
        <button
          className={`bt-team ${played && hs > as ? "won" : played && hs < as ? "lost" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setScore(matchId, hs + 1, result?.awayScore ?? 0);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setScore(matchId, Math.max(0, hs - 1), result?.awayScore ?? 0);
          }}
          title="Click +1 | Right-click −1"
          disabled={isPlaceholder}
        >
          {flag(homeTeam?.fifaCode ?? "")}
          <span className="bt-code">{short(homeTeam, homeSlot)}</span>
        </button>
        <span className="bt-score">
          <span className="bt-s">{result?.homeScore ?? "–"}</span>
          <span className="bt-s">{result?.awayScore ?? "–"}</span>
        </span>
        <button
          className={`bt-team ${played && as > hs ? "won" : played && as < hs ? "lost" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setScore(matchId, result?.homeScore ?? 0, as + 1);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setScore(matchId, result?.homeScore ?? 0, Math.max(0, as - 1));
          }}
          title="Click +1 | Right-click −1"
          disabled={isPlaceholder}
        >
          <span className="bt-code">{short(awayTeam, awaySlot)}</span>
          {flag(awayTeam?.fifaCode ?? "")}
        </button>
      </div>
    </div>
  );
}
