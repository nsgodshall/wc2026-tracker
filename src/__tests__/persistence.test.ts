import { describe, it, expect, beforeEach } from "vitest";
import type { MatchResult } from "../data/types";

// Mirror the persistence logic from AppContext
const STORAGE_KEY = "wc2026-scores";

function saveResults(results: Map<string, MatchResult>) {
  const arr = Array.from(results.entries());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function loadResults(): Map<string, MatchResult> {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing !== null && existing !== "[]" && existing !== "__reset__") {
    try {
      const arr: [string, MatchResult][] = JSON.parse(existing);
      return new Map(arr);
    } catch {
      /* ignore */
    }
  }
  return new Map();
}

describe("persistence (localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads empty Map when nothing is stored", () => {
    const results = loadResults();
    expect(results).toBeInstanceOf(Map);
    expect(results.size).toBe(0);
  });

  it("saves and loads results correctly", () => {
    const results = new Map<string, MatchResult>();
    results.set("G01", { matchId: "G01", homeScore: 2, awayScore: 0 });
    results.set("G11", { matchId: "G11", homeScore: 2, awayScore: 2 });

    saveResults(results);

    const loaded = loadResults();
    expect(loaded.size).toBe(2);
    expect(loaded.get("G01")?.homeScore).toBe(2);
    expect(loaded.get("G01")?.awayScore).toBe(0);
    expect(loaded.get("G11")?.homeScore).toBe(2);
    expect(loaded.get("G11")?.awayScore).toBe(2);
  });

  it("handles null scores", () => {
    const results = new Map<string, MatchResult>();
    results.set("G01", { matchId: "G01", homeScore: null, awayScore: 3 });
    results.set("G02", { matchId: "G02", homeScore: 1, awayScore: null });

    saveResults(results);

    const loaded = loadResults();
    expect(loaded.get("G01")?.homeScore).toBeNull();
    expect(loaded.get("G01")?.awayScore).toBe(3);
    expect(loaded.get("G02")?.homeScore).toBe(1);
    expect(loaded.get("G02")?.awayScore).toBeNull();
  });

  it("survives empty Map save/load roundtrip", () => {
    const empty = new Map<string, MatchResult>();
    saveResults(empty);
    const loaded = loadResults();
    expect(loaded.size).toBe(0);
  });

  it("handles 0-0 scores correctly (not treated as null)", () => {
    const results = new Map<string, MatchResult>();
    results.set("G15", { matchId: "G15", homeScore: 0, awayScore: 0 });

    saveResults(results);

    const loaded = loadResults();
    const match = loaded.get("G15")!;
    expect(match.homeScore).toBe(0);
    expect(match.awayScore).toBe(0);
    // 0 is not null — a 0-0 draw is a valid result
  });

  it("handles many scores (all 72 group matches)", () => {
    const results = new Map<string, MatchResult>();
    for (let i = 1; i <= 72; i++) {
      const id = `G${String(i).padStart(2, "0")}`;
      results.set(id, { matchId: id, homeScore: i % 5, awayScore: i % 3 });
    }

    saveResults(results);
    const loaded = loadResults();

    expect(loaded.size).toBe(72);
    expect(loaded.get("G01")?.homeScore).toBe(1);
    expect(loaded.get("G72")?.awayScore).toBe(0); // 72 % 3 = 0
  });

  it("returns empty Map when localStorage is corrupted", () => {
    localStorage.setItem(STORAGE_KEY, "not valid json {{{");
    const loaded = loadResults();
    expect(loaded.size).toBe(0);
  });

  it("load returns empty when key is absent, save then load returns data", () => {
    // First load: nothing stored
    expect(loadResults().size).toBe(0);

    // Save some data
    const results = new Map<string, MatchResult>();
    results.set("G01", { matchId: "G01", homeScore: 3, awayScore: 1 });
    saveResults(results);

    // Second load: data present
    const loaded = loadResults();
    expect(loaded.size).toBe(1);
    expect(loaded.get("G01")?.homeScore).toBe(3);
  });
});
