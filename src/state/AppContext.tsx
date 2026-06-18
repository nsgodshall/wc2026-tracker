import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type {
  MatchResult,
  Match,
  GroupStanding,
  GroupName,
  KnockoutSlot,
} from "../data/types";
import { GROUP_MATCHES } from "../data/schedule";
import { TEAMS, ALL_GROUPS } from "../data/teams";
import { KNOCKOUT_MATCHES } from "../data/knockout";
import { computeGroupStandings } from "../logic/standings";
import { resolveKnockoutBracket } from "../logic/knockoutResolver";
import {
  computeThirdPlaceRanking,
  type ThirdPlaceRank,
} from "../logic/thirdPlace";

import { SEED_RESULTS } from "../data/seed";

const STORAGE_KEY_SCORES = "wc2026-scores";
const STORAGE_KEY_TEAMS = "wc2026-teamNames";

// --- State ---
interface AppState {
  results: Map<string, MatchResult>;
}

type Action =
  | {
      type: "SET_SCORE";
      matchId: string;
      homeScore: number | null;
      awayScore: number | null;
    }
  | { type: "RESET_ALL" }
  | { type: "LOAD"; results: Map<string, MatchResult> };

/** Load results: localStorage > seed (first visit only) > empty */
function loadResults(): Map<string, MatchResult> {
  const existing = localStorage.getItem(STORAGE_KEY_SCORES);
  // "__reset__" is the explicit reset marker; "[]" or null means no data yet
  if (existing !== null && existing !== "[]" && existing !== "__reset__") {
    try {
      const arr: [string, MatchResult][] = JSON.parse(existing);
      return new Map(arr);
    } catch {
      /* ignore */
    }
  }
  // No saved data: seed with real MD1 scores on first visit
  const seed = new Map<string, MatchResult>();
  for (const r of SEED_RESULTS) seed.set(r.matchId, r);
  return seed;
}

/** Save results to localStorage */
function saveResults(results: Map<string, MatchResult>) {
  try {
    const arr = Array.from(results.entries());
    localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(arr));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_SCORE": {
      const next = new Map(state.results);
      if (action.homeScore !== null || action.awayScore !== null) {
        next.set(action.matchId, {
          matchId: action.matchId,
          homeScore: action.homeScore,
          awayScore: action.awayScore,
        });
      } else {
        next.delete(action.matchId);
      }
      saveResults(next);
      return { ...state, results: next };
    }
    case "RESET_ALL":
      localStorage.setItem(STORAGE_KEY_SCORES, "__reset__");
      localStorage.removeItem(STORAGE_KEY_TEAMS);
      return { results: new Map() };
    case "LOAD": {
      const loaded = action.results;
      // Only save to localStorage if we actually loaded something (not first empty state)
      if (loaded.size > 0) saveResults(loaded);
      return { ...state, results: loaded };
    }
    default:
      return state;
  }
}

// --- Derived data ---
interface AppContextValue {
  results: Map<string, MatchResult>;
  setScore: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
  ) => void;
  resetAll: () => void;
  allStandings: Map<GroupName, GroupStanding[]>;
  thirdPlaceRanks: ThirdPlaceRank[];
  knockoutSlots: KnockoutSlot[];
  allMatches: Match[];
  getTeamName: (id: string) => string;
  getResult: (matchId: string) => MatchResult | undefined;
  teamNames: Map<string, string>;
  setTeamName: (teamId: string, name: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { results: new Map() });

  // Hydrate from localStorage on mount (or seed with real results)
  useEffect(() => {
    dispatch({ type: "LOAD", results: loadResults() });
  }, []);

  // Team names with localStorage persistence
  const [teamNames, setTeamNames] = React.useState<Map<string, string>>(() => {
    const m = new Map<string, string>();
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TEAMS);
      if (raw) {
        const saved = JSON.parse(raw) as [string, string][];
        for (const [k, v] of saved) m.set(k, v);
      }
    } catch {
      /* ignore */
    }
    // Fill in any missing with defaults
    for (const t of TEAMS) {
      if (!m.has(t.id)) m.set(t.id, t.name);
    }
    return m;
  });

  useEffect(() => {
    try {
      const arr = Array.from(teamNames.entries());
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(arr));
    } catch {
      /* ignore */
    }
  }, [teamNames]);

  const setScore = useCallback(
    (matchId: string, homeScore: number | null, awayScore: number | null) => {
      dispatch({ type: "SET_SCORE", matchId, homeScore, awayScore });
    },
    [],
  );

  const resetAll = useCallback(() => {
    dispatch({ type: "RESET_ALL" });
  }, []);

  const setTeamName = useCallback((teamId: string, name: string) => {
    setTeamNames((prev) => {
      const next = new Map(prev);
      next.set(teamId, name || `${teamId} - TBD`);
      return next;
    });
  }, []);

  const getTeamName = useCallback(
    (id: string) =>
      teamNames.get(id) ?? TEAMS.find((t) => t.id === id)?.name ?? id,
    [teamNames],
  );

  const getResult = useCallback(
    (matchId: string) => state.results.get(matchId),
    [state.results],
  );

  // Derived: group standings
  const allStandings = useMemo(() => {
    const map = new Map<GroupName, GroupStanding[]>();
    for (const group of ALL_GROUPS) {
      map.set(group, computeGroupStandings(group, state.results));
    }
    return map;
  }, [state.results]);

  // Derived: third place ranks
  const thirdPlaceRanks = useMemo(
    () => computeThirdPlaceRanking(allStandings),
    [allStandings],
  );

  // Derived: knockout slots
  const { slots: knockoutSlots } = useMemo(
    () => resolveKnockoutBracket(state.results),
    [state.results],
  );

  // All matches (group + knockout)
  const allMatches = useMemo(() => {
    const knockoutWithSlots = KNOCKOUT_MATCHES.map((km) => {
      const hSlot = knockoutSlots[km.homeSlotIndex];
      const aSlot = knockoutSlots[km.awaySlotIndex];
      return {
        id: km.id,
        homeTeamId: hSlot?.teamId ?? `slot_${km.homeSlotIndex}`,
        awayTeamId: aSlot?.teamId ?? `slot_${km.awaySlotIndex}`,
        date: km.date,
        venue: km.venue,
        city: km.city,
        round: km.round,
        knockoutLabel: km.label,
      };
    });
    return [...GROUP_MATCHES, ...knockoutWithSlots];
  }, [knockoutSlots]);

  const value: AppContextValue = {
    results: state.results,
    setScore,
    resetAll,
    allStandings,
    thirdPlaceRanks,
    knockoutSlots,
    allMatches,
    getTeamName,
    getResult,
    teamNames,
    setTeamName,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
