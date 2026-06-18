# ⚽ 2026 FIFA World Cup Tracker

Live group stage tracker for the 2026 World Cup with tiebreakers, 3rd-place qualification, and a full knockout bracket.

## Features

- **48 teams, 12 groups** — official draw results with real team names, FIFA rankings, and flag emojis
- **Live standings** — points, goal difference, head-to-head tiebreakers with slick FLIP animations
- **72-match schedule** — real FIFA dates, venues, and pairings, filterable by group
- **3rd-place ranking** — top 8 of 12 advance, with full qualification criteria
- **Knockout bracket** — 32-team bracket tree with flag-centric nodes, winner propagation, and connector lines
- **Score entry** — click team names to +1, right-click to −1, or type directly
- **Persistence** — all scores saved to localStorage, survive refreshes and restarts
- **Today's matches** — header banner shows matches scheduled for the current date
- **Pre-filled MD1** — all 24 opening matches seeded with real scores (75 goals)

## Tech

React 19 + TypeScript + Vite · 41 tests (vitest) · CSS grid & FLIP animations · localStorage persistence

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npx vitest run
```
