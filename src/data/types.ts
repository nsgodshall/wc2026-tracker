export type GroupName =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export interface Team {
  id: string;
  name: string;
  group: GroupName;
  fifaCode: string; // ISO 3166-1 alpha-2 for flag
  ranking: number; // FIFA World Ranking (pre-tournament)
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  venue: string;
  city: string;
  group?: GroupName;
  round: "group" | "r32" | "r16" | "qf" | "sf" | "3rd" | "final";
  knockoutLabel?: string;
}

export interface MatchResult {
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
}

export interface GroupStanding {
  teamId: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  fairPlayPts: number;
}

export interface KnockoutSlot {
  label: string;
  description: string;
  teamId: string | null;
  teamName: string | null;
}
