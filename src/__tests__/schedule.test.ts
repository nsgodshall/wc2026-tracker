import { describe, expect, it } from "vitest";
import { GROUP_MATCHES } from "../data/schedule";
import type { Match } from "../data/types";

describe("group schedule", () => {
  it("is ordered by kickoff date and time", () => {
    const keys = GROUP_MATCHES.map(matchStartKey);
    expect(keys).toEqual([...keys].sort());
  });
});

function matchStartKey(match: Match): string {
  return `${match.date}T${match.time ?? "99:99"}-${match.id}`;
}
