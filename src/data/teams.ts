import type { Team, GroupName } from "./types";

/**
 * 2026 FIFA World Cup — Official Draw Results (December 5, 2025).
 * Groups A-L with all 48 qualified teams and their slot positions.
 *
 * FIFA rankings are from the June 2026 pre-tournament ranking.
 * Flag codes use ISO 3166-1 alpha-2 for flagcdn.com.
 */
export const TEAMS: Team[] = [
  // === Group A ===
  { id: "A1", name: "Mexico", group: "A", fifaCode: "mx", ranking: 14 },
  { id: "A2", name: "South Korea", group: "A", fifaCode: "kr", ranking: 25 },
  { id: "A3", name: "Czech Republic", group: "A", fifaCode: "cz", ranking: 40 },
  { id: "A4", name: "South Africa", group: "A", fifaCode: "za", ranking: 60 },

  // === Group B ===
  { id: "B1", name: "Canada", group: "B", fifaCode: "ca", ranking: 30 },
  { id: "B2", name: "Bosnia & Herz.", group: "B", fifaCode: "ba", ranking: 64 },
  { id: "B3", name: "Qatar", group: "B", fifaCode: "qa", ranking: 56 },
  { id: "B4", name: "Switzerland", group: "B", fifaCode: "ch", ranking: 19 },

  // === Group C ===
  { id: "C1", name: "Brazil", group: "C", fifaCode: "br", ranking: 6 },
  { id: "C2", name: "Morocco", group: "C", fifaCode: "ma", ranking: 7 },
  { id: "C3", name: "Scotland", group: "C", fifaCode: "gb-sct", ranking: 42 },
  { id: "C4", name: "Haiti", group: "C", fifaCode: "ht", ranking: 83 },

  // === Group D ===
  { id: "D1", name: "United States", group: "D", fifaCode: "us", ranking: 17 },
  { id: "D2", name: "Paraguay", group: "D", fifaCode: "py", ranking: 41 },
  { id: "D3", name: "Australia", group: "D", fifaCode: "au", ranking: 27 },
  { id: "D4", name: "Turkey", group: "D", fifaCode: "tr", ranking: 22 },

  // === Group E ===
  { id: "E1", name: "Germany", group: "E", fifaCode: "de", ranking: 10 },
  { id: "E2", name: "Curaçao", group: "E", fifaCode: "cw", ranking: 82 },
  { id: "E3", name: "Ivory Coast", group: "E", fifaCode: "ci", ranking: 33 },
  { id: "E4", name: "Ecuador", group: "E", fifaCode: "ec", ranking: 23 },

  // === Group F ===
  { id: "F1", name: "Netherlands", group: "F", fifaCode: "nl", ranking: 8 },
  { id: "F2", name: "Japan", group: "F", fifaCode: "jp", ranking: 18 },
  { id: "F3", name: "Sweden", group: "F", fifaCode: "se", ranking: 38 },
  { id: "F4", name: "Tunisia", group: "F", fifaCode: "tn", ranking: 45 },

  // === Group G ===
  { id: "G1", name: "Belgium", group: "G", fifaCode: "be", ranking: 9 },
  { id: "G2", name: "Egypt", group: "G", fifaCode: "eg", ranking: 29 },
  { id: "G3", name: "Iran", group: "G", fifaCode: "ir", ranking: 20 },
  { id: "G4", name: "New Zealand", group: "G", fifaCode: "nz", ranking: 85 },

  // === Group H ===
  { id: "H1", name: "Spain", group: "H", fifaCode: "es", ranking: 2 },
  { id: "H2", name: "Cape Verde", group: "H", fifaCode: "cv", ranking: 67 },
  { id: "H3", name: "Saudi Arabia", group: "H", fifaCode: "sa", ranking: 61 },
  { id: "H4", name: "Uruguay", group: "H", fifaCode: "uy", ranking: 16 },

  // === Group I ===
  { id: "I1", name: "France", group: "I", fifaCode: "fr", ranking: 3 },
  { id: "I2", name: "Senegal", group: "I", fifaCode: "sn", ranking: 15 },
  { id: "I3", name: "Iraq", group: "I", fifaCode: "iq", ranking: 57 },
  { id: "I4", name: "Norway", group: "I", fifaCode: "no", ranking: 31 },

  // === Group J ===
  { id: "J1", name: "Argentina", group: "J", fifaCode: "ar", ranking: 1 },
  { id: "J2", name: "Algeria", group: "J", fifaCode: "dz", ranking: 28 },
  { id: "J3", name: "Austria", group: "J", fifaCode: "at", ranking: 24 },
  { id: "J4", name: "Jordan", group: "J", fifaCode: "jo", ranking: 63 },

  // === Group K ===
  { id: "K1", name: "Portugal", group: "K", fifaCode: "pt", ranking: 5 },
  { id: "K2", name: "DR Congo", group: "K", fifaCode: "cd", ranking: 46 },
  { id: "K3", name: "Uzbekistan", group: "K", fifaCode: "uz", ranking: 50 },
  { id: "K4", name: "Colombia", group: "K", fifaCode: "co", ranking: 13 },

  // === Group L ===
  { id: "L1", name: "England", group: "L", fifaCode: "gb-eng", ranking: 4 },
  { id: "L2", name: "Croatia", group: "L", fifaCode: "hr", ranking: 11 },
  { id: "L3", name: "Ghana", group: "L", fifaCode: "gh", ranking: 73 },
  { id: "L4", name: "Panama", group: "L", fifaCode: "pa", ranking: 34 },
];

export const ALL_GROUPS: GroupName[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

export function getTeamsByGroup(group: GroupName): Team[] {
  return TEAMS.filter((t) => t.group === group);
}

export function getTeamById(id: string): Team | undefined {
  return TEAMS.find((t) => t.id === id);
}

/** Return a flagcdn URL for a team's ISO code, or empty. */
export function getFlagUrl(fifaCode: string): string {
  if (!fifaCode || fifaCode.length < 2) return "";
  return `https://flagcdn.com/w40/${fifaCode}.png`;
}

/** Convert an ISO 3166-1 alpha-2 code to an emoji flag. */
export function getFlagEmoji(fifaCode: string): string {
  if (fifaCode === "gb-eng") return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (fifaCode === "gb-sct") return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
  if (!fifaCode || fifaCode.length !== 2) return "";
  const a = fifaCode.toUpperCase().charCodeAt(0) - 65 + 0x1f1e6;
  const b = fifaCode.toUpperCase().charCodeAt(1) - 65 + 0x1f1e6;
  return String.fromCodePoint(a, b);
}
