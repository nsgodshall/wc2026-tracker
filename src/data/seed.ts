import type { MatchResult } from "./types";

/**
 * Actual MD1 results from the 2026 World Cup (June 11–17).
 * 24 matches across all 12 groups.
 *
 * Source: FIFA official match reports.
 */

// Group A — Jun 11
// Mexico       2–0  South Africa
// South Korea  2–1  Czech Republic

// Group B — Jun 12–13
// Canada       1–1  Bosnia & Herz.
// Qatar        1–1  Switzerland

// Group C — Jun 13
// Brazil       1–1  Morocco
// Haiti        0–1  Scotland

// Group D — Jun 12–13
// United States 4–1  Paraguay
// Australia    2–0  Turkey

// Group E — Jun 14
// Germany      7–1  Curaçao
// Ivory Coast  1–0  Ecuador

// Group F — Jun 14
// Netherlands  2–2  Japan
// Sweden       5–1  Tunisia

// Group G — Jun 15
// Belgium      1–1  Egypt
// Iran         2–2  New Zealand

// Group H — Jun 15
// Spain        0–0  Cape Verde
// Saudi Arabia 1–1  Uruguay

// Group I — Jun 16
// France       3–1  Senegal
// Iraq         1–4  Norway

// Group J — Jun 16
// Argentina    3–0  Algeria
// Austria      3–1  Jordan

// Group K — Jun 17
// Portugal     1–1  DR Congo
// Uzbekistan   1–3  Colombia

// Group L — Jun 17
// England      4–2  Croatia
// Ghana        1–0  Panama

export const SEED_RESULTS: MatchResult[] = [
  // MD1
  { matchId: "G01", homeScore: 2, awayScore: 0 },  // Mexico v South Africa
  { matchId: "G02", homeScore: 2, awayScore: 1 },  // South Korea v Czech Republic
  { matchId: "G03", homeScore: 1, awayScore: 1 },  // Canada v Bosnia
  { matchId: "G04", homeScore: 4, awayScore: 1 },  // USA v Paraguay
  { matchId: "G05", homeScore: 1, awayScore: 1 },  // Qatar v Switzerland
  { matchId: "G06", homeScore: 1, awayScore: 1 },  // Brazil v Morocco
  { matchId: "G07", homeScore: 0, awayScore: 1 },  // Haiti v Scotland
  { matchId: "G08", homeScore: 2, awayScore: 0 },  // Australia v Turkey
  { matchId: "G09", homeScore: 7, awayScore: 1 },  // Germany v Curaçao
  { matchId: "G10", homeScore: 1, awayScore: 0 },  // Ivory Coast v Ecuador
  { matchId: "G11", homeScore: 2, awayScore: 2 },  // Netherlands v Japan
  { matchId: "G12", homeScore: 5, awayScore: 1 },  // Sweden v Tunisia
  { matchId: "G13", homeScore: 1, awayScore: 1 },  // Belgium v Egypt
  { matchId: "G14", homeScore: 2, awayScore: 2 },  // Iran v New Zealand
  { matchId: "G15", homeScore: 0, awayScore: 0 },  // Spain v Cape Verde
  { matchId: "G16", homeScore: 1, awayScore: 1 },  // Saudi Arabia v Uruguay
  { matchId: "G17", homeScore: 3, awayScore: 1 },  // France v Senegal
  { matchId: "G18", homeScore: 1, awayScore: 4 },  // Iraq v Norway
  { matchId: "G19", homeScore: 3, awayScore: 0 },  // Argentina v Algeria
  { matchId: "G20", homeScore: 3, awayScore: 1 },  // Austria v Jordan
  { matchId: "G21", homeScore: 1, awayScore: 1 },  // Portugal v DR Congo
  { matchId: "G22", homeScore: 1, awayScore: 3 },  // Uzbekistan v Colombia
  { matchId: "G23", homeScore: 4, awayScore: 2 },  // England v Croatia
  { matchId: "G24", homeScore: 1, awayScore: 0 },  // Ghana v Panama
];
