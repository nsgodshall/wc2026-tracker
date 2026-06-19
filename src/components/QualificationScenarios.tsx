import { useMemo } from "react";
import type {
  GroupName,
  GroupStanding,
  Match,
  MatchResult,
} from "../data/types";
import { KNOCKOUT_MATCHES, KNOCKOUT_SLOTS } from "../data/knockout";
import { GROUP_MATCHES } from "../data/schedule";
import { getTeamById } from "../data/teams";
import {
  assignThirdPlaceSlots,
  type ThirdPlaceRank,
} from "../logic/thirdPlace";
import { useApp } from "../state/AppContext";
import {
  computeGroupOutlook,
  getTeamClinchInfo,
  type OutlookStatus,
  type OwnPlacementOutlook,
  type OwnResult,
  type OwnResultOutlook,
  type TeamOutlook,
  type ThirdPlaceOutlook,
} from "../logic/scenarios";
import FlagIcon from "./FlagIcon";

interface Props {
  group: GroupName;
}

interface R32ProjectionLine {
  key: string;
  label: string;
  slotLabel: string;
  matchLabel: string;
  matchCity: string;
  opponentSlotLabel: string;
  opponentTeamId: string | null;
  opponentName: string;
}

interface ProjectedR32Slot {
  label: string;
  description: string;
  teamId: string | null;
  teamName: string | null;
}

interface R32ProjectionModel {
  slots: ProjectedR32Slot[];
  slotIndexByLabel: Map<string, number>;
  slotLabelByTeam: Map<string, string>;
}

const STATUS_META: Record<OutlookStatus, { label: string; cls: string }> = {
  "won-group": { label: "Won group 🏆", cls: "qs-in" },
  "clinched-top2": { label: "Top 2 clinched ✓", cls: "qs-in" },
  alive: { label: "Can qualify", cls: "qs-third" },
  eliminated: { label: "Eliminated ✗", cls: "qs-out" },
};

function verdictClass(r: OwnResultOutlook): string {
  if (r.verdict === "impossible") {
    if (
      r.target === "top2" &&
      r.thirdPlaceVerdict !== undefined &&
      r.thirdPlaceVerdict !== "impossible"
    ) {
      return "qs-third";
    }
    return "qs-out";
  }
  if (r.target === "top3") return "qs-third";
  return r.verdict === "guarantees" ? "qs-in" : "qs-third";
}

function verdictLabel(r: OwnResultOutlook): string {
  if (r.target === "top3") {
    if (r.verdict === "guarantees") return "Locks 3rd";
    if (r.verdict === "possible") return "3rd with help";
    return "Drops to 4th";
  }
  if (r.verdict === "guarantees") return "Clinches top 2";
  if (r.verdict === "possible") return "Top 2 with help";
  if (r.thirdPlaceVerdict === "guarantees") return "Locks 3rd";
  if (r.thirdPlaceVerdict === "possible") return "3rd with help";
  if (r.thirdPlaceVerdict === "impossible") return "Eliminated";
  return "Misses top 2";
}

const RESULT_LABEL: Record<OwnResultOutlook["result"], string> = {
  win: "Win",
  draw: "Draw",
  loss: "Lose",
};

export default function QualificationScenarios({ group }: Props) {
  const { results, getTeamName, allStandings, thirdPlaceRanks } = useApp();

  const outlook = useMemo(
    () => computeGroupOutlook(group, results, getTeamName, allStandings),
    [group, results, getTeamName, allStandings],
  );

  const clinchInfo = useMemo(
    () => getTeamClinchInfo(group, results),
    [group, results],
  );

  const groupMatches = useMemo(
    () => GROUP_MATCHES.filter((m) => m.group === group),
    [group],
  );

  const r32Projection = useMemo(
    () => buildR32Projection(allStandings, thirdPlaceRanks, getTeamName),
    [allStandings, thirdPlaceRanks, getTeamName],
  );
  const anyPlayed = groupMatches.some((m) => hasCompleteResult(m.id, results));
  const hasClinchOpportunity = [...clinchInfo.values()].some(
    (c) => c.clinchByMatch.size > 0,
  );
  const hasScenarioContent =
    outlook.teams.some(
      (t) => t.status !== "alive" || t.ownResults.length > 0,
    ) || hasClinchOpportunity;

  if (!anyPlayed) {
    return (
      <div className="qual-scenarios">
        <div className="qs-title">What each team needs</div>
        <div className="qs-subtitle">
          Top-2 clinches are exact. Best-third notes are live snapshots, not
          clinches.
        </div>
        <div className="qs-note">
          Enter results to unlock clinches, eliminations, and final-game paths.
        </div>
      </div>
    );
  }

  return (
    <div className="qual-scenarios">
      <div className="qs-title">What each team needs</div>
      <div className="qs-subtitle">
        Top-2 clinches are exact. Best-third notes are live snapshots, not
        clinches.
      </div>
      {!hasScenarioContent && (
        <div className="qs-note">
          No clinches or eliminations yet. Exact paths appear as the group
          reaches decisive games.
        </div>
      )}
      {outlook.teams.map((t) => {
        const meta = STATUS_META[t.status];
        const showOwnResults = t.status === "alive" && t.ownResults.length > 0;
        const showPlacementResults = t.placementResults.length > 0;
        const ownResultsOpponentId = showOwnResults
          ? t.ownResults[0].opponentId
          : null;
        const placementOpponentId = showPlacementResults
          ? t.placementResults[0].opponentId
          : null;
        const ownResultsOpponentName = ownResultsOpponentId
          ? getTeamName(ownResultsOpponentId)
          : null;
        const placementOpponentName = placementOpponentId
          ? getTeamName(placementOpponentId)
          : null;
        const clinchLine =
          !showOwnResults && !showPlacementResults
            ? nextClinchLine(t.teamId, clinchInfo, getTeamName)
            : null;
        const statusLine = settledStatusLine(t);
        const showThirdPlace = shouldShowThirdPlace(t, outlook.finalMatchday);
        const r32Lines = r32ProjectionLines(t, group, r32Projection);

        return (
          <div key={t.teamId} className="qs-team-block">
            <div className="qs-row">
              <span className="qs-team">
                <FlagIcon
                  code={getTeamById(t.teamId)?.fifaCode ?? ""}
                  size={14}
                />
                <span className="qs-team-name-text">{t.teamName}</span>
              </span>
              <span className={`qs-badge ${meta.cls}`}>{meta.label}</span>
              {t.status === "alive" && t.minPosition !== t.maxPosition && (
                <span className="qs-range">
                  group range {ordinal(t.minPosition)}–{ordinal(t.maxPosition)}
                </span>
              )}
            </div>

            {statusLine && <div className="qs-status-line">{statusLine}</div>}

            {ownResultsOpponentName && (
              <div className="qs-detail">
                <div className="qs-detail-head">
                  Final group game vs{" "}
                  <InlineTeam
                    teamId={ownResultsOpponentId}
                    name={ownResultsOpponentName}
                  />
                  {t.ownResults[0]?.target && (
                    <span className="qs-target-tag">
                      {t.ownResults[0].target === "top2"
                        ? "top-2 path"
                        : "3rd-place path"}
                    </span>
                  )}
                </div>
                {t.ownResults.map((r) => {
                  return (
                    <div key={r.result} className="qs-line">
                      <span className="qs-result">
                        {RESULT_LABEL[r.result]}
                      </span>
                      <span className={`qs-badge ${verdictClass(r)}`}>
                        {verdictLabel(r)}
                      </span>
                      {r.condition && (
                        <span className="qs-cond">if {r.condition}</span>
                      )}
                      {r.marginText && (
                        <span className="qs-cond">{r.marginText}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {placementOpponentName && (
              <div className="qs-detail qs-placement-detail">
                <div className="qs-detail-head">
                  1st/2nd scenarios vs{" "}
                  <InlineTeam
                    teamId={placementOpponentId}
                    name={placementOpponentName}
                  />
                  <span className="qs-target-tag">group slot</span>
                </div>
                {t.placementResults.map((r) => (
                  <div key={r.result} className="qs-line">
                    <span className="qs-result">{RESULT_LABEL[r.result]}</span>
                    <span className={`qs-badge ${placementClass(r)}`}>
                      {placementLabel(r)}
                    </span>
                    {r.winGroupCondition && (
                      <span className="qs-cond">if {r.winGroupCondition}</span>
                    )}
                    {r.minPosition === 1 && r.maxPosition === 2 && (
                      <span className="qs-cond">otherwise runner-up</span>
                    )}
                    {r.scorelineDependent && (
                      <span className="qs-cond">
                        scoreline/tiebreakers can decide
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {clinchLine && (
              <div className="qs-clinch-line">
                Next clinch chance: top 2 with{" "}
                <strong>{clinchLine.results}</strong> vs{" "}
                <InlineTeam
                  teamId={clinchLine.opponentId}
                  name={clinchLine.opponent}
                />
              </div>
            )}

            {r32Lines.length > 0 && (
              <div className="qs-r32">
                <div className="qs-detail-head">
                  Round of 32 projection
                  <span className="qs-target-tag">current standings</span>
                </div>
                {r32Lines.map((line) => (
                  <div key={line.key} className="qs-r32-line">
                    <span className="qs-r32-label">{line.label}</span>
                    <span className="qs-r32-opponent">
                      <span className="qs-r32-slot">{line.slotLabel}</span>
                      <span className="qs-muted">vs</span>
                      {line.opponentTeamId && (
                        <FlagIcon
                          code={
                            getTeamById(line.opponentTeamId)?.fifaCode ?? ""
                          }
                          size={13}
                        />
                      )}
                      <span>{line.opponentName}</span>
                    </span>
                    <span className="qs-cond">
                      {line.matchLabel} · {line.matchCity} · opponent slot{" "}
                      {line.opponentSlotLabel}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {showThirdPlace && t.thirdPlace && (
              <div className="qs-third-place">
                <div className="qs-tp-range">
                  If they finish 3rd: {pointsRange(t.thirdPlace)} in the
                  best-third table.
                </div>
                {t.thirdPlace.estimate && (
                  <>
                    <div className="qs-tp-estimate">
                      <span
                        className={`qs-badge ${thirdSnapshotClass(
                          t.thirdPlace,
                        )}`}
                      >
                        {thirdSnapshotLabel(t.thirdPlace)}
                      </span>
                      {thirdSnapshotContext(t.thirdPlace) && (
                        <span className="qs-cond">
                          {thirdSnapshotContext(t.thirdPlace)}
                        </span>
                      )}
                    </div>
                    <div className="qs-snapshot-note">
                      {thirdSnapshotNote(t.thirdPlace)}
                    </div>
                  </>
                )}
              </div>
            )}

            {t.tiebreakUndecided && (
              <div className="qs-note">
                Level on all implemented tiebreakers — final order needs fair
                play / drawing of lots.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function hasCompleteResult(
  matchId: string,
  results: Map<string, MatchResult>,
): boolean {
  const result = results.get(matchId);
  return !!result && result.homeScore !== null && result.awayScore !== null;
}

function buildR32Projection(
  allStandings: Map<GroupName, GroupStanding[]>,
  thirdPlaceRanks: ThirdPlaceRank[],
  getTeamName: (id: string) => string,
): R32ProjectionModel {
  const slots: ProjectedR32Slot[] = KNOCKOUT_SLOTS.map((slot) => ({
    label: slot.label,
    description: slot.description,
    teamId: null,
    teamName: null,
  }));
  const slotIndexByLabel = new Map<string, number>();
  slots.forEach((slot, index) => slotIndexByLabel.set(slot.label, index));

  const setSlotTeam = (slotLabel: string, teamId: string | undefined) => {
    if (!teamId) return;
    const index = slotIndexByLabel.get(slotLabel);
    if (index === undefined) return;
    slots[index].teamId = teamId;
    slots[index].teamName = getTeamName(teamId);
  };

  for (const [groupName, standings] of allStandings) {
    setSlotTeam(`1${groupName}`, standings[0]?.teamId);
    setSlotTeam(`2${groupName}`, standings[1]?.teamId);
  }

  const thirdPlaceMapping = KNOCKOUT_SLOTS.map((slot, index) => ({
    koSlotIndex: index,
    candidateGroups: parseThirdPlaceGroups(slot.label),
  })).filter((slot) => slot.candidateGroups.length > 0);

  for (const assignment of assignThirdPlaceSlots(
    thirdPlaceRanks,
    thirdPlaceMapping,
  )) {
    if (!assignment.assignedTeamId) continue;
    const slot = slots[assignment.koSlotIndex];
    slot.teamId = assignment.assignedTeamId;
    slot.teamName = getTeamName(assignment.assignedTeamId);
  }

  const slotLabelByTeam = new Map<string, string>();
  for (const slot of slots) {
    if (slot.teamId) slotLabelByTeam.set(slot.teamId, slot.label);
  }

  return { slots, slotIndexByLabel, slotLabelByTeam };
}

function r32ProjectionLines(
  team: TeamOutlook,
  group: GroupName,
  projection: R32ProjectionModel,
): R32ProjectionLine[] {
  const lines: R32ProjectionLine[] = [];
  const add = (label: string, slotLabel: string) => {
    const line = r32LineForSlot(label, slotLabel, projection);
    if (line && !lines.some((existing) => existing.key === line.key)) {
      lines.push(line);
    }
  };

  if (team.status === "won-group") {
    add("As group winner", `1${group}`);
    return lines;
  }

  if (team.status === "clinched-top2") {
    if (team.minPosition === 1 && team.maxPosition === 2) {
      add("If 1st", `1${group}`);
      add("If 2nd", `2${group}`);
      return lines;
    }
    if (team.minPosition === 2 && team.maxPosition === 2) {
      add("As runner-up", `2${group}`);
      return lines;
    }
  }

  const currentSlotLabel = projection.slotLabelByTeam.get(team.teamId);
  if (currentSlotLabel) {
    add(
      currentSlotLabel.startsWith("3") ? "Currently 3rd" : "Currently",
      currentSlotLabel,
    );
  }

  return lines;
}

function r32LineForSlot(
  label: string,
  slotLabel: string,
  projection: R32ProjectionModel,
): R32ProjectionLine | null {
  const slotIndex = projection.slotIndexByLabel.get(slotLabel);
  if (slotIndex === undefined) return null;
  const match = KNOCKOUT_MATCHES.find(
    (candidate) =>
      candidate.round === "r32" &&
      (candidate.homeSlotIndex === slotIndex ||
        candidate.awaySlotIndex === slotIndex),
  );
  if (!match) return null;

  const opponentSlotIndex =
    match.homeSlotIndex === slotIndex
      ? match.awaySlotIndex
      : match.homeSlotIndex;
  const opponentSlot = projection.slots[opponentSlotIndex];
  if (!opponentSlot) return null;

  return {
    key: `${label}-${slotLabel}-${match.id}`,
    label,
    slotLabel,
    matchLabel: match.label,
    matchCity: match.city,
    opponentSlotLabel: opponentSlot.label,
    opponentTeamId: opponentSlot.teamId,
    opponentName: opponentSlot.teamName ?? opponentSlot.description,
  };
}

function parseThirdPlaceGroups(label: string): GroupName[] {
  return label
    .split("/")
    .map((part) => part.trim().replace(/^3/, ""))
    .filter((part): part is GroupName =>
      ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].includes(
        part,
      ),
    );
}

function settledStatusLine(t: TeamOutlook): string | null {
  if (t.status === "won-group") {
    return t.remainingForTeam > 0
      ? "Group winner locked; remaining game only affects table stats."
      : "Qualified as group winner.";
  }
  if (t.status === "clinched-top2") {
    if (t.minPosition === 2 && t.maxPosition === 2)
      return "Runner-up spot locked.";
    return t.placementResults.length > 0
      ? "Top-2 place clinched; 1st/2nd scenarios below."
      : "Top-2 place confirmed.";
  }
  if (t.status === "eliminated") {
    return "Cannot finish in the top 3, so they cannot reach the knockouts.";
  }
  return null;
}

function placementClass(r: OwnPlacementOutlook): string {
  if (r.minPosition === 1 && r.maxPosition === 1) return "qs-in";
  if (r.minPosition === 2 && r.maxPosition === 2) return "qs-snapshot";
  return "qs-third";
}

function placementLabel(r: OwnPlacementOutlook): string {
  if (r.minPosition === 1 && r.maxPosition === 1) return "Wins group";
  if (r.minPosition === 2 && r.maxPosition === 2) return "Runner-up";
  if (r.minPosition === 1 && r.maxPosition === 2) return "Can win group";
  return `Can finish ${ordinal(r.minPosition)}–${ordinal(r.maxPosition)}`;
}

function shouldShowThirdPlace(t: TeamOutlook, finalMatchday: boolean): boolean {
  if (!t.thirdPlace) return false;
  return (
    finalMatchday ||
    t.minPosition > 2 ||
    t.ownResults.some((result) => result.target === "top3")
  );
}

function pointsRange(thirdPlace: ThirdPlaceOutlook): string {
  const range =
    thirdPlace.minPoints === thirdPlace.maxPoints
      ? `${thirdPlace.minPoints}`
      : `${thirdPlace.minPoints}–${thirdPlace.maxPoints}`;
  return `${range} pts`;
}

function thirdSnapshotLabel(thirdPlace: ThirdPlaceOutlook): string {
  const tooEarly = (thirdPlace.otherGroupsStarted ?? 8) < 8;
  if (tooEarly) return "Best-third cut too early";
  if (thirdPlace.estimate === "qualifies") return "Currently above cut";
  if (thirdPlace.estimate === "bubble") return "On the bubble";
  return "Currently below cut";
}

function thirdSnapshotClass(thirdPlace: ThirdPlaceOutlook): string {
  if ((thirdPlace.otherGroupsStarted ?? 8) < 8) return "qs-snapshot";
  if (thirdPlace.estimate === "eliminated") return "qs-out";
  return "qs-snapshot";
}

function thirdSnapshotContext(thirdPlace: ThirdPlaceOutlook): string | null {
  if (thirdPlace.cutLinePoints === undefined) return null;

  const started = thirdPlace.otherGroupsStarted ?? thirdPlace.otherGroupsTotal;
  const complete = thirdPlace.otherGroupsComplete ?? 0;
  const total = thirdPlace.otherGroupsTotal ?? 11;

  if ((started ?? 0) < 8) {
    return `${started ?? 0}/${total} other groups have results`;
  }

  return `Current 8th-best 3rd: ${thirdPlace.cutLinePoints} pts (${complete}/${total} other groups complete)`;
}

function thirdSnapshotNote(thirdPlace: ThirdPlaceOutlook): string {
  const complete = thirdPlace.otherGroupsComplete ?? 0;
  const total = thirdPlace.otherGroupsTotal ?? 11;
  const started = thirdPlace.otherGroupsStarted ?? total;

  if (started < 8) {
    return "Not a clinch — too many other groups are unplayed for the cut line to mean much yet.";
  }
  if (complete < total) {
    return "Snapshot only — the best-third cut can move as other groups finish.";
  }
  return "Other groups are complete; this still assumes they finish 3rd in this group.";
}

function InlineTeam({
  teamId,
  name,
}: {
  teamId: string | null;
  name: string | null;
}) {
  if (!teamId || !name) return null;
  return (
    <span className="qs-inline-team">
      <FlagIcon code={getTeamById(teamId)?.fifaCode ?? ""} size={12} />
      <span>{name}</span>
    </span>
  );
}

function nextClinchLine(
  teamId: string,
  clinchInfo: ReturnType<typeof getTeamClinchInfo>,
  getTeamName: (id: string) => string,
): { results: string; opponentId: string; opponent: string } | null {
  const info = clinchInfo.get(teamId);
  if (!info || info.alreadyThrough || info.clinchByMatch.size === 0)
    return null;

  const entries = [...info.clinchByMatch.entries()]
    .map(([matchId, results]) => ({
      match: GROUP_MATCHES.find((m) => m.id === matchId),
      results,
    }))
    .filter((x): x is { match: Match; results: OwnResult[] } => !!x.match)
    .sort((a, b) => matchSortKey(a.match).localeCompare(matchSortKey(b.match)));

  const next = entries[0];
  if (!next) return null;
  const opponentId =
    next.match.homeTeamId === teamId
      ? next.match.awayTeamId
      : next.match.homeTeamId;
  return {
    results: formatOwnResults(next.results),
    opponentId,
    opponent: getTeamName(opponentId),
  };
}

function formatOwnResults(results: OwnResult[]): string {
  const order: OwnResult[] = ["win", "draw", "loss"];
  const sorted = [...results].sort(
    (a, b) => order.indexOf(a) - order.indexOf(b),
  );
  const labels = sorted.map((r) => RESULT_LABEL[r].toLowerCase());
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return "any result";
}

function matchSortKey(match: Match): string {
  return `${match.date}T${match.time ?? "99:99"}-${match.id}`;
}

function ordinal(n: number): string {
  return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
}
