import type { KnockoutSlot } from "./types";

/**
 * Official 2026 FIFA World Cup knockout bracket.
 * Match numbers M73–M104 correspond to FIFA's official numbering.
 *
 * Third-place slot labels use the official FIFA Annex C candidate groups.
 */

export interface KnockoutMatchDef {
  id: string;
  round: "r32" | "r16" | "qf" | "sf" | "3rd" | "final";
  label: string;
  date: string;
  venue: string;
  city: string;
  homeSlotIndex: number;
  awaySlotIndex: number;
}

export const KNOCKOUT_SLOTS: KnockoutSlot[] = [
  // R32 slots 0–31 (in match order: M73–M88)
  {
    label: "2A",
    description: "Runner-up Group A",
    teamId: null,
    teamName: null,
  }, // 0  → M73
  {
    label: "2B",
    description: "Runner-up Group B",
    teamId: null,
    teamName: null,
  }, // 1  → M73
  { label: "1E", description: "Winner Group E", teamId: null, teamName: null }, // 2  → M74
  {
    label: "3A/B/C/D/F",
    description: "Best 3rd — A, B, C, D, or F",
    teamId: null,
    teamName: null,
  }, // 3 → M74
  { label: "1F", description: "Winner Group F", teamId: null, teamName: null }, // 4  → M75
  {
    label: "2C",
    description: "Runner-up Group C",
    teamId: null,
    teamName: null,
  }, // 5  → M75
  { label: "1C", description: "Winner Group C", teamId: null, teamName: null }, // 6  → M76
  {
    label: "2F",
    description: "Runner-up Group F",
    teamId: null,
    teamName: null,
  }, // 7  → M76
  { label: "1I", description: "Winner Group I", teamId: null, teamName: null }, // 8  → M77
  {
    label: "3C/D/F/G/H",
    description: "Best 3rd — C, D, F, G, or H",
    teamId: null,
    teamName: null,
  }, // 9 → M77
  {
    label: "2E",
    description: "Runner-up Group E",
    teamId: null,
    teamName: null,
  }, // 10 → M78
  {
    label: "2I",
    description: "Runner-up Group I",
    teamId: null,
    teamName: null,
  }, // 11 → M78
  { label: "1A", description: "Winner Group A", teamId: null, teamName: null }, // 12 → M79
  {
    label: "3C/E/F/H/I",
    description: "Best 3rd — C, E, F, H, or I",
    teamId: null,
    teamName: null,
  }, // 13 → M79
  { label: "1L", description: "Winner Group L", teamId: null, teamName: null }, // 14 → M80
  {
    label: "3E/H/I/J/K",
    description: "Best 3rd — E, H, I, J, or K",
    teamId: null,
    teamName: null,
  }, // 15 → M80
  { label: "1D", description: "Winner Group D", teamId: null, teamName: null }, // 16 → M81
  {
    label: "3B/E/F/I/J",
    description: "Best 3rd — B, E, F, I, or J",
    teamId: null,
    teamName: null,
  }, // 17 → M81
  { label: "1G", description: "Winner Group G", teamId: null, teamName: null }, // 18 → M82
  {
    label: "3A/E/H/I/J",
    description: "Best 3rd — A, E, H, I, or J",
    teamId: null,
    teamName: null,
  }, // 19 → M82
  {
    label: "2K",
    description: "Runner-up Group K",
    teamId: null,
    teamName: null,
  }, // 20 → M83
  {
    label: "2L",
    description: "Runner-up Group L",
    teamId: null,
    teamName: null,
  }, // 21 → M83
  { label: "1H", description: "Winner Group H", teamId: null, teamName: null }, // 22 → M84
  {
    label: "2J",
    description: "Runner-up Group J",
    teamId: null,
    teamName: null,
  }, // 23 → M84
  { label: "1B", description: "Winner Group B", teamId: null, teamName: null }, // 24 → M85
  {
    label: "3E/F/G/I/J",
    description: "Best 3rd — E, F, G, I, or J",
    teamId: null,
    teamName: null,
  }, // 25 → M85
  { label: "1J", description: "Winner Group J", teamId: null, teamName: null }, // 26 → M86
  {
    label: "2H",
    description: "Runner-up Group H",
    teamId: null,
    teamName: null,
  }, // 27 → M86
  { label: "1K", description: "Winner Group K", teamId: null, teamName: null }, // 28 → M87
  {
    label: "3D/E/I/J/L",
    description: "Best 3rd — D, E, I, J, or L",
    teamId: null,
    teamName: null,
  }, // 29 → M87
  {
    label: "2D",
    description: "Runner-up Group D",
    teamId: null,
    teamName: null,
  }, // 30 → M88
  {
    label: "2G",
    description: "Runner-up Group G",
    teamId: null,
    teamName: null,
  }, // 31 → M88
];

export const KNOCKOUT_MATCHES: KnockoutMatchDef[] = [
  // === Round of 32 (M73–M88) ===
  {
    id: "K01",
    round: "r32",
    label: "M73",
    date: "2026-06-28",
    venue: "Los Angeles Stadium",
    city: "Los Angeles",
    homeSlotIndex: 0,
    awaySlotIndex: 1,
  },
  {
    id: "K02",
    round: "r32",
    label: "M74",
    date: "2026-06-29",
    venue: "Boston Stadium",
    city: "Boston",
    homeSlotIndex: 2,
    awaySlotIndex: 3,
  },
  {
    id: "K03",
    round: "r32",
    label: "M75",
    date: "2026-06-29",
    venue: "Estadio Monterrey",
    city: "Monterrey",
    homeSlotIndex: 4,
    awaySlotIndex: 5,
  },
  {
    id: "K04",
    round: "r32",
    label: "M76",
    date: "2026-06-29",
    venue: "Houston Stadium",
    city: "Houston",
    homeSlotIndex: 6,
    awaySlotIndex: 7,
  },
  {
    id: "K05",
    round: "r32",
    label: "M77",
    date: "2026-06-30",
    venue: "New York New Jersey Stadium",
    city: "New York/New Jersey",
    homeSlotIndex: 8,
    awaySlotIndex: 9,
  },
  {
    id: "K06",
    round: "r32",
    label: "M78",
    date: "2026-06-30",
    venue: "Dallas Stadium",
    city: "Dallas",
    homeSlotIndex: 10,
    awaySlotIndex: 11,
  },
  {
    id: "K07",
    round: "r32",
    label: "M79",
    date: "2026-06-30",
    venue: "Mexico City Stadium",
    city: "Mexico City",
    homeSlotIndex: 12,
    awaySlotIndex: 13,
  },
  {
    id: "K08",
    round: "r32",
    label: "M80",
    date: "2026-07-01",
    venue: "Atlanta Stadium",
    city: "Atlanta",
    homeSlotIndex: 14,
    awaySlotIndex: 15,
  },
  {
    id: "K09",
    round: "r32",
    label: "M81",
    date: "2026-07-01",
    venue: "San Francisco Bay Area Stadium",
    city: "San Francisco Bay Area",
    homeSlotIndex: 16,
    awaySlotIndex: 17,
  },
  {
    id: "K10",
    round: "r32",
    label: "M82",
    date: "2026-07-01",
    venue: "Seattle Stadium",
    city: "Seattle",
    homeSlotIndex: 18,
    awaySlotIndex: 19,
  },
  {
    id: "K11",
    round: "r32",
    label: "M83",
    date: "2026-07-02",
    venue: "Toronto Stadium",
    city: "Toronto",
    homeSlotIndex: 20,
    awaySlotIndex: 21,
  },
  {
    id: "K12",
    round: "r32",
    label: "M84",
    date: "2026-07-02",
    venue: "Los Angeles Stadium",
    city: "Los Angeles",
    homeSlotIndex: 22,
    awaySlotIndex: 23,
  },
  {
    id: "K13",
    round: "r32",
    label: "M85",
    date: "2026-07-02",
    venue: "BC Place Vancouver",
    city: "Vancouver",
    homeSlotIndex: 24,
    awaySlotIndex: 25,
  },
  {
    id: "K14",
    round: "r32",
    label: "M86",
    date: "2026-07-03",
    venue: "Miami Stadium",
    city: "Miami",
    homeSlotIndex: 26,
    awaySlotIndex: 27,
  },
  {
    id: "K15",
    round: "r32",
    label: "M87",
    date: "2026-07-03",
    venue: "Kansas City Stadium",
    city: "Kansas City",
    homeSlotIndex: 28,
    awaySlotIndex: 29,
  },
  {
    id: "K16",
    round: "r32",
    label: "M88",
    date: "2026-07-03",
    venue: "Dallas Stadium",
    city: "Dallas",
    homeSlotIndex: 30,
    awaySlotIndex: 31,
  },

  // === Round of 16 (M89–M96) ===
  // M89 = W74 vs W77, M90 = W73 vs W75
  {
    id: "K17",
    round: "r16",
    label: "M89",
    date: "2026-07-04",
    venue: "Philadelphia Stadium",
    city: "Philadelphia",
    homeSlotIndex: 32,
    awaySlotIndex: 33,
  },
  {
    id: "K18",
    round: "r16",
    label: "M90",
    date: "2026-07-04",
    venue: "Houston Stadium",
    city: "Houston",
    homeSlotIndex: 34,
    awaySlotIndex: 35,
  },
  // M91 = W76 vs W78, M92 = W79 vs W80
  {
    id: "K19",
    round: "r16",
    label: "M91",
    date: "2026-07-05",
    venue: "New York New Jersey Stadium",
    city: "New York/New Jersey",
    homeSlotIndex: 36,
    awaySlotIndex: 37,
  },
  {
    id: "K20",
    round: "r16",
    label: "M92",
    date: "2026-07-05",
    venue: "Mexico City Stadium",
    city: "Mexico City",
    homeSlotIndex: 38,
    awaySlotIndex: 39,
  },
  // M93 = W83 vs W84, M94 = W81 vs W82
  {
    id: "K21",
    round: "r16",
    label: "M93",
    date: "2026-07-06",
    venue: "Dallas Stadium",
    city: "Dallas",
    homeSlotIndex: 40,
    awaySlotIndex: 41,
  },
  {
    id: "K22",
    round: "r16",
    label: "M94",
    date: "2026-07-06",
    venue: "Seattle Stadium",
    city: "Seattle",
    homeSlotIndex: 42,
    awaySlotIndex: 43,
  },
  // M95 = W86 vs W88, M96 = W85 vs W87
  {
    id: "K23",
    round: "r16",
    label: "M95",
    date: "2026-07-07",
    venue: "Atlanta Stadium",
    city: "Atlanta",
    homeSlotIndex: 44,
    awaySlotIndex: 45,
  },
  {
    id: "K24",
    round: "r16",
    label: "M96",
    date: "2026-07-07",
    venue: "BC Place Vancouver",
    city: "Vancouver",
    homeSlotIndex: 46,
    awaySlotIndex: 47,
  },

  // === Quarterfinals (M97–M100) ===
  {
    id: "K25",
    round: "qf",
    label: "M97",
    date: "2026-07-09",
    venue: "Boston Stadium",
    city: "Boston",
    homeSlotIndex: 48,
    awaySlotIndex: 49,
  },
  {
    id: "K26",
    round: "qf",
    label: "M98",
    date: "2026-07-10",
    venue: "Los Angeles Stadium",
    city: "Los Angeles",
    homeSlotIndex: 50,
    awaySlotIndex: 51,
  },
  {
    id: "K27",
    round: "qf",
    label: "M99",
    date: "2026-07-11",
    venue: "Miami Stadium",
    city: "Miami",
    homeSlotIndex: 52,
    awaySlotIndex: 53,
  },
  {
    id: "K28",
    round: "qf",
    label: "M100",
    date: "2026-07-11",
    venue: "Kansas City Stadium",
    city: "Kansas City",
    homeSlotIndex: 54,
    awaySlotIndex: 55,
  },

  // === Semifinals (M101–M102) ===
  {
    id: "K29",
    round: "sf",
    label: "M101",
    date: "2026-07-14",
    venue: "Dallas Stadium",
    city: "Dallas",
    homeSlotIndex: 56,
    awaySlotIndex: 57,
  },
  {
    id: "K30",
    round: "sf",
    label: "M102",
    date: "2026-07-15",
    venue: "Atlanta Stadium",
    city: "Atlanta",
    homeSlotIndex: 58,
    awaySlotIndex: 59,
  },

  // === Third place (M103) & Final (M104) ===
  {
    id: "K31",
    round: "3rd",
    label: "M103",
    date: "2026-07-18",
    venue: "Miami Stadium",
    city: "Miami",
    homeSlotIndex: 60,
    awaySlotIndex: 61,
  },
  {
    id: "K32",
    round: "final",
    label: "M104",
    date: "2026-07-19",
    venue: "New York New Jersey Stadium",
    city: "New York/New Jersey",
    homeSlotIndex: 62,
    awaySlotIndex: 63,
  },
];

export const ROUND_NAMES: Record<string, string> = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarterfinals",
  sf: "Semifinals",
  "3rd": "Third Place",
  final: "Final",
};
