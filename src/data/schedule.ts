import type { Match } from "./types";

/**
 * Official 2026 FIFA World Cup group schedule.
 * Source: FIFA match schedule published December 6, 2025.
 *
 * Match pairings:
 *   MD1: 1v2, 3v4
 *   MD2: 1v3, 4v2  (where 4v2 = position 4 vs position 2)
 *   MD3: 4v1, 2v3
 */
const GROUP_MATCHES_UNSORTED: Match[] = [
  // ===== MD1: June 11–17 =====

  // Jun 11 – Group A
  {
    id: "G01",
    homeTeamId: "A1",
    awayTeamId: "A4",
    date: "2026-06-11",
    time: "13:00",
    venue: "Mexico City Stadium",
    city: "Mexico City",
    group: "A",
    round: "group",
  }, // Mexico v South Africa (opener)
  {
    id: "G02",
    homeTeamId: "A2",
    awayTeamId: "A3",
    date: "2026-06-11",
    time: "20:00",
    venue: "Estadio Guadalajara",
    city: "Guadalajara",
    group: "A",
    round: "group",
  }, // South Africa v South Korea

  // Jun 12 – Groups B, D (hosts Canada & USA open)
  {
    id: "G03",
    homeTeamId: "B1",
    awayTeamId: "B2",
    date: "2026-06-12",
    time: "15:00",
    venue: "Toronto Stadium",
    city: "Toronto",
    group: "B",
    round: "group",
  }, // Canada v Bosnia
  {
    id: "G04",
    homeTeamId: "D1",
    awayTeamId: "D2",
    date: "2026-06-12",
    time: "18:00",
    venue: "Los Angeles Stadium",
    city: "Los Angeles",
    group: "D",
    round: "group",
  }, // USA v Paraguay

  // Jun 13 – Groups B, C, D
  {
    id: "G05",
    homeTeamId: "B3",
    awayTeamId: "B4",
    date: "2026-06-13",
    time: "12:00",
    venue: "San Francisco Bay Area Stadium",
    city: "San Francisco Bay Area",
    group: "B",
    round: "group",
  }, // Qatar v Switzerland
  {
    id: "G06",
    homeTeamId: "C1",
    awayTeamId: "C2",
    date: "2026-06-13",
    time: "18:00",
    venue: "New York New Jersey Stadium",
    city: "New York/New Jersey",
    group: "C",
    round: "group",
  }, // Brazil v Morocco
  {
    id: "G07",
    homeTeamId: "C3",
    awayTeamId: "C4",
    date: "2026-06-13",
    time: "21:00",
    venue: "Boston Stadium",
    city: "Boston",
    group: "C",
    round: "group",
  }, // Scotland v Haiti (actually Haiti v Scotland in real schedule - but we list Haiti as C4 home)
  {
    id: "G08",
    homeTeamId: "D3",
    awayTeamId: "D4",
    date: "2026-06-13",
    time: "21:00",
    venue: "BC Place Vancouver",
    city: "Vancouver",
    group: "D",
    round: "group",
  }, // Australia v Turkey

  // Jun 14 – Groups E, F
  {
    id: "G09",
    homeTeamId: "E1",
    awayTeamId: "E2",
    date: "2026-06-14",
    time: "12:00",
    venue: "Houston Stadium",
    city: "Houston",
    group: "E",
    round: "group",
  }, // Germany v Curaçao
  {
    id: "G10",
    homeTeamId: "E3",
    awayTeamId: "E4",
    date: "2026-06-14",
    time: "19:00",
    venue: "Philadelphia Stadium",
    city: "Philadelphia",
    group: "E",
    round: "group",
  }, // Ivory Coast v Ecuador
  {
    id: "G11",
    homeTeamId: "F1",
    awayTeamId: "F2",
    date: "2026-06-14",
    time: "15:00",
    venue: "Dallas Stadium",
    city: "Dallas",
    group: "F",
    round: "group",
  }, // Netherlands v Japan
  {
    id: "G12",
    homeTeamId: "F3",
    awayTeamId: "F4",
    date: "2026-06-14",
    time: "20:00",
    venue: "Estadio Monterrey",
    city: "Monterrey",
    group: "F",
    round: "group",
  }, // Sweden v Tunisia

  // Jun 15 – Groups G, H
  {
    id: "G13",
    homeTeamId: "G1",
    awayTeamId: "G2",
    date: "2026-06-15",
    time: "12:00",
    venue: "Seattle Stadium",
    city: "Seattle",
    group: "G",
    round: "group",
  }, // Belgium v Egypt
  {
    id: "G14",
    homeTeamId: "G3",
    awayTeamId: "G4",
    date: "2026-06-15",
    time: "18:00",
    venue: "Los Angeles Stadium",
    city: "Los Angeles",
    group: "G",
    round: "group",
  }, // Iran v New Zealand
  {
    id: "G15",
    homeTeamId: "H1",
    awayTeamId: "H2",
    date: "2026-06-15",
    time: "12:00",
    venue: "Atlanta Stadium",
    city: "Atlanta",
    group: "H",
    round: "group",
  }, // Spain v Cape Verde
  {
    id: "G16",
    homeTeamId: "H3",
    awayTeamId: "H4",
    date: "2026-06-15",
    time: "18:00",
    venue: "Miami Stadium",
    city: "Miami",
    group: "H",
    round: "group",
  }, // Saudi Arabia v Uruguay

  // Jun 16 – Groups I, J
  {
    id: "G17",
    homeTeamId: "I1",
    awayTeamId: "I2",
    date: "2026-06-16",
    time: "15:00",
    venue: "New York New Jersey Stadium",
    city: "New York/New Jersey",
    group: "I",
    round: "group",
  }, // France v Senegal
  {
    id: "G18",
    homeTeamId: "I3",
    awayTeamId: "I4",
    date: "2026-06-16",
    time: "18:00",
    venue: "Boston Stadium",
    city: "Boston",
    group: "I",
    round: "group",
  }, // Iraq v Norway
  {
    id: "G19",
    homeTeamId: "J1",
    awayTeamId: "J2",
    date: "2026-06-16",
    time: "20:00",
    venue: "Kansas City Stadium",
    city: "Kansas City",
    group: "J",
    round: "group",
  }, // Argentina v Algeria
  {
    id: "G20",
    homeTeamId: "J3",
    awayTeamId: "J4",
    date: "2026-06-16",
    time: "21:00",
    venue: "San Francisco Bay Area Stadium",
    city: "San Francisco Bay Area",
    group: "J",
    round: "group",
  }, // Austria v Jordan

  // Jun 17 – Groups K, L
  {
    id: "G21",
    homeTeamId: "K1",
    awayTeamId: "K2",
    date: "2026-06-17",
    time: "12:00",
    venue: "Houston Stadium",
    city: "Houston",
    group: "K",
    round: "group",
  }, // Portugal v DR Congo
  {
    id: "G22",
    homeTeamId: "K3",
    awayTeamId: "K4",
    date: "2026-06-17",
    time: "20:00",
    venue: "Mexico City Stadium",
    city: "Mexico City",
    group: "K",
    round: "group",
  }, // Uzbekistan v Colombia
  {
    id: "G23",
    homeTeamId: "L1",
    awayTeamId: "L2",
    date: "2026-06-17",
    time: "15:00",
    venue: "Dallas Stadium",
    city: "Dallas",
    group: "L",
    round: "group",
  }, // England v Croatia
  {
    id: "G24",
    homeTeamId: "L3",
    awayTeamId: "L4",
    date: "2026-06-17",
    time: "19:00",
    venue: "Toronto Stadium",
    city: "Toronto",
    group: "L",
    round: "group",
  }, // Ghana v Panama

  // ===== MD2: June 18–23 =====

  // Jun 18 – Groups A, B
  {
    id: "G25",
    homeTeamId: "A3",
    awayTeamId: "A4",
    date: "2026-06-18",
    time: "12:00",
    venue: "Atlanta Stadium",
    city: "Atlanta",
    group: "A",
    round: "group",
  }, // Czech Rep v South Africa
  {
    id: "G26",
    homeTeamId: "B4",
    awayTeamId: "B2",
    date: "2026-06-18",
    time: "12:00",
    venue: "Los Angeles Stadium",
    city: "Los Angeles",
    group: "B",
    round: "group",
  }, // Switzerland v Bosnia
  {
    id: "G27",
    homeTeamId: "B1",
    awayTeamId: "B3",
    date: "2026-06-18",
    time: "15:00",
    venue: "BC Place Vancouver",
    city: "Vancouver",
    group: "B",
    round: "group",
  }, // Canada v Qatar
  {
    id: "G28",
    homeTeamId: "A1",
    awayTeamId: "A2",
    date: "2026-06-18",
    time: "19:00",
    venue: "Estadio Guadalajara",
    city: "Guadalajara",
    group: "A",
    round: "group",
  }, // Mexico v South Korea

  // Jun 19 – Groups C, D
  {
    id: "G29",
    homeTeamId: "C1",
    awayTeamId: "C4",
    date: "2026-06-19",
    time: "20:30",
    venue: "Philadelphia Stadium",
    city: "Philadelphia",
    group: "C",
    round: "group",
  }, // Brazil v Haiti
  {
    id: "G30",
    homeTeamId: "C3",
    awayTeamId: "C2",
    date: "2026-06-19",
    time: "18:00",
    venue: "Boston Stadium",
    city: "Boston",
    group: "C",
    round: "group",
  }, // Scotland v Morocco
  {
    id: "G31",
    homeTeamId: "D4",
    awayTeamId: "D2",
    date: "2026-06-19",
    time: "20:00",
    venue: "San Francisco Bay Area Stadium",
    city: "San Francisco Bay Area",
    group: "D",
    round: "group",
  }, // Turkey v Paraguay
  {
    id: "G32",
    homeTeamId: "D1",
    awayTeamId: "D3",
    date: "2026-06-19",
    time: "12:00",
    venue: "Seattle Stadium",
    city: "Seattle",
    group: "D",
    round: "group",
  }, // USA v Australia

  // Jun 20 – Groups E, F
  {
    id: "G33",
    homeTeamId: "E1",
    awayTeamId: "E3",
    date: "2026-06-20",
    time: "16:00",
    venue: "Toronto Stadium",
    city: "Toronto",
    group: "E",
    round: "group",
  }, // Germany v Ivory Coast
  {
    id: "G34",
    homeTeamId: "E4",
    awayTeamId: "E2",
    date: "2026-06-20",
    time: "19:00",
    venue: "Kansas City Stadium",
    city: "Kansas City",
    group: "E",
    round: "group",
  }, // Ecuador v Curaçao
  {
    id: "G35",
    homeTeamId: "F1",
    awayTeamId: "F3",
    date: "2026-06-20",
    time: "12:00",
    venue: "Houston Stadium",
    city: "Houston",
    group: "F",
    round: "group",
  }, // Netherlands v Sweden
  {
    id: "G36",
    homeTeamId: "F4",
    awayTeamId: "F2",
    date: "2026-06-20",
    time: "22:00",
    venue: "Estadio Monterrey",
    city: "Monterrey",
    group: "F",
    round: "group",
  }, // Tunisia v Japan

  // Jun 21 – Groups G, H
  {
    id: "G37",
    homeTeamId: "G1",
    awayTeamId: "G3",
    date: "2026-06-21",
    time: "12:00",
    venue: "Los Angeles Stadium",
    city: "Los Angeles",
    group: "G",
    round: "group",
  }, // Belgium v Iran
  {
    id: "G38",
    homeTeamId: "G4",
    awayTeamId: "G2",
    date: "2026-06-21",
    time: "18:00",
    venue: "BC Place Vancouver",
    city: "Vancouver",
    group: "G",
    round: "group",
  }, // New Zealand v Egypt
  {
    id: "G39",
    homeTeamId: "H1",
    awayTeamId: "H3",
    date: "2026-06-21",
    time: "12:00",
    venue: "Atlanta Stadium",
    city: "Atlanta",
    group: "H",
    round: "group",
  }, // Spain v Saudi Arabia
  {
    id: "G40",
    homeTeamId: "H4",
    awayTeamId: "H2",
    date: "2026-06-21",
    time: "18:00",
    venue: "Miami Stadium",
    city: "Miami",
    group: "H",
    round: "group",
  }, // Uruguay v Cape Verde

  // Jun 22 – Groups I, J
  {
    id: "G41",
    homeTeamId: "I1",
    awayTeamId: "I3",
    date: "2026-06-22",
    time: "17:00",
    venue: "Philadelphia Stadium",
    city: "Philadelphia",
    group: "I",
    round: "group",
  }, // France v Iraq
  {
    id: "G42",
    homeTeamId: "I4",
    awayTeamId: "I2",
    date: "2026-06-22",
    time: "20:00",
    venue: "New York New Jersey Stadium",
    city: "New York/New Jersey",
    group: "I",
    round: "group",
  }, // Norway v Senegal
  {
    id: "G43",
    homeTeamId: "J1",
    awayTeamId: "J3",
    date: "2026-06-22",
    time: "12:00",
    venue: "Dallas Stadium",
    city: "Dallas",
    group: "J",
    round: "group",
  }, // Argentina v Austria
  {
    id: "G44",
    homeTeamId: "J4",
    awayTeamId: "J2",
    date: "2026-06-22",
    time: "20:00",
    venue: "San Francisco Bay Area Stadium",
    city: "San Francisco Bay Area",
    group: "J",
    round: "group",
  }, // Jordan v Algeria

  // Jun 23 – Groups K, L
  {
    id: "G45",
    homeTeamId: "K1",
    awayTeamId: "K3",
    date: "2026-06-23",
    time: "12:00",
    venue: "Houston Stadium",
    city: "Houston",
    group: "K",
    round: "group",
  }, // Portugal v Uzbekistan
  {
    id: "G46",
    homeTeamId: "K4",
    awayTeamId: "K2",
    date: "2026-06-23",
    time: "20:00",
    venue: "Estadio Guadalajara",
    city: "Guadalajara",
    group: "K",
    round: "group",
  }, // Colombia v DR Congo
  {
    id: "G47",
    homeTeamId: "L1",
    awayTeamId: "L3",
    date: "2026-06-23",
    time: "16:00",
    venue: "Boston Stadium",
    city: "Boston",
    group: "L",
    round: "group",
  }, // England v Ghana
  {
    id: "G48",
    homeTeamId: "L4",
    awayTeamId: "L2",
    date: "2026-06-23",
    time: "19:00",
    venue: "Toronto Stadium",
    city: "Toronto",
    group: "L",
    round: "group",
  }, // Panama v Croatia

  // ===== MD3: June 24–27 =====

  // Jun 24 – Groups A, B, C
  {
    id: "G49",
    homeTeamId: "A3",
    awayTeamId: "A1",
    date: "2026-06-24",
    time: "19:00",
    venue: "Mexico City Stadium",
    city: "Mexico City",
    group: "A",
    round: "group",
  }, // Czech Rep v Mexico
  {
    id: "G50",
    homeTeamId: "A4",
    awayTeamId: "A2",
    date: "2026-06-24",
    time: "19:00",
    venue: "Estadio Monterrey",
    city: "Monterrey",
    group: "A",
    round: "group",
  }, // South Africa v South Korea
  {
    id: "G51",
    homeTeamId: "B4",
    awayTeamId: "B1",
    date: "2026-06-24",
    time: "12:00",
    venue: "BC Place Vancouver",
    city: "Vancouver",
    group: "B",
    round: "group",
  }, // Switzerland v Canada
  {
    id: "G52",
    homeTeamId: "B2",
    awayTeamId: "B3",
    date: "2026-06-24",
    time: "12:00",
    venue: "Seattle Stadium",
    city: "Seattle",
    group: "B",
    round: "group",
  }, // Bosnia v Qatar
  {
    id: "G53",
    homeTeamId: "C3",
    awayTeamId: "C1",
    date: "2026-06-24",
    time: "18:00",
    venue: "Miami Stadium",
    city: "Miami",
    group: "C",
    round: "group",
  }, // Scotland v Brazil
  {
    id: "G54",
    homeTeamId: "C2",
    awayTeamId: "C4",
    date: "2026-06-24",
    time: "18:00",
    venue: "Atlanta Stadium",
    city: "Atlanta",
    group: "C",
    round: "group",
  }, // Morocco v Haiti

  // Jun 25 – Groups D, E, F
  {
    id: "G55",
    homeTeamId: "D4",
    awayTeamId: "D1",
    date: "2026-06-25",
    time: "19:00",
    venue: "Los Angeles Stadium",
    city: "Los Angeles",
    group: "D",
    round: "group",
  }, // Turkey v USA
  {
    id: "G56",
    homeTeamId: "D2",
    awayTeamId: "D3",
    date: "2026-06-25",
    time: "19:00",
    venue: "San Francisco Bay Area Stadium",
    city: "San Francisco Bay Area",
    group: "D",
    round: "group",
  }, // Paraguay v Australia
  {
    id: "G57",
    homeTeamId: "E2",
    awayTeamId: "E3",
    date: "2026-06-25",
    time: "16:00",
    venue: "Philadelphia Stadium",
    city: "Philadelphia",
    group: "E",
    round: "group",
  }, // Curaçao v Ivory Coast
  {
    id: "G58",
    homeTeamId: "E4",
    awayTeamId: "E1",
    date: "2026-06-25",
    time: "16:00",
    venue: "New York New Jersey Stadium",
    city: "New York/New Jersey",
    group: "E",
    round: "group",
  }, // Ecuador v Germany
  {
    id: "G59",
    homeTeamId: "F2",
    awayTeamId: "F3",
    date: "2026-06-25",
    time: "18:00",
    venue: "Dallas Stadium",
    city: "Dallas",
    group: "F",
    round: "group",
  }, // Japan v Sweden
  {
    id: "G60",
    homeTeamId: "F4",
    awayTeamId: "F1",
    date: "2026-06-25",
    time: "18:00",
    venue: "Kansas City Stadium",
    city: "Kansas City",
    group: "F",
    round: "group",
  }, // Tunisia v Netherlands

  // Jun 26 – Groups G, H, I
  {
    id: "G61",
    homeTeamId: "G2",
    awayTeamId: "G3",
    date: "2026-06-26",
    time: "20:00",
    venue: "Seattle Stadium",
    city: "Seattle",
    group: "G",
    round: "group",
  }, // Egypt v Iran
  {
    id: "G62",
    homeTeamId: "G4",
    awayTeamId: "G1",
    date: "2026-06-26",
    time: "20:00",
    venue: "BC Place Vancouver",
    city: "Vancouver",
    group: "G",
    round: "group",
  }, // New Zealand v Belgium
  {
    id: "G63",
    homeTeamId: "H2",
    awayTeamId: "H3",
    date: "2026-06-26",
    time: "19:00",
    venue: "Houston Stadium",
    city: "Houston",
    group: "H",
    round: "group",
  }, // Cape Verde v Saudi Arabia
  {
    id: "G64",
    homeTeamId: "H4",
    awayTeamId: "H1",
    date: "2026-06-26",
    time: "18:00",
    venue: "Estadio Guadalajara",
    city: "Guadalajara",
    group: "H",
    round: "group",
  }, // Uruguay v Spain
  {
    id: "G65",
    homeTeamId: "I4",
    awayTeamId: "I1",
    date: "2026-06-26",
    time: "15:00",
    venue: "Boston Stadium",
    city: "Boston",
    group: "I",
    round: "group",
  }, // Norway v France
  {
    id: "G66",
    homeTeamId: "I2",
    awayTeamId: "I3",
    date: "2026-06-26",
    time: "15:00",
    venue: "Toronto Stadium",
    city: "Toronto",
    group: "I",
    round: "group",
  }, // Senegal v Iraq

  // Jun 27 – Groups J, K, L
  {
    id: "G67",
    homeTeamId: "J2",
    awayTeamId: "J3",
    date: "2026-06-27",
    time: "21:00",
    venue: "Kansas City Stadium",
    city: "Kansas City",
    group: "J",
    round: "group",
  }, // Algeria v Austria
  {
    id: "G68",
    homeTeamId: "J4",
    awayTeamId: "J1",
    date: "2026-06-27",
    time: "21:00",
    venue: "Dallas Stadium",
    city: "Dallas",
    group: "J",
    round: "group",
  }, // Jordan v Argentina
  {
    id: "G69",
    homeTeamId: "K4",
    awayTeamId: "K1",
    date: "2026-06-27",
    time: "19:30",
    venue: "Miami Stadium",
    city: "Miami",
    group: "K",
    round: "group",
  }, // Colombia v Portugal
  {
    id: "G70",
    homeTeamId: "K2",
    awayTeamId: "K3",
    date: "2026-06-27",
    time: "19:30",
    venue: "Atlanta Stadium",
    city: "Atlanta",
    group: "K",
    round: "group",
  }, // DR Congo v Uzbekistan
  {
    id: "G71",
    homeTeamId: "L4",
    awayTeamId: "L1",
    date: "2026-06-27",
    time: "17:00",
    venue: "New York New Jersey Stadium",
    city: "New York/New Jersey",
    group: "L",
    round: "group",
  }, // Panama v England
  {
    id: "G72",
    homeTeamId: "L2",
    awayTeamId: "L3",
    date: "2026-06-27",
    time: "17:00",
    venue: "Philadelphia Stadium",
    city: "Philadelphia",
    group: "L",
    round: "group",
  }, // Croatia v Ghana
];

export const GROUP_MATCHES: Match[] = [...GROUP_MATCHES_UNSORTED].sort((a, b) =>
  groupMatchStartKey(a).localeCompare(groupMatchStartKey(b)),
);

function groupMatchStartKey(match: Match): string {
  return `${match.date}T${match.time ?? "99:99"}-${match.id}`;
}
