# Ovenfall (working title)

A browser-first incremental bakery/tycoon prototype. Working title only; name availability is not verified.

## Current scope

- Click or press Space to bake crumbs.
- Buy Brick Ovens for passive production.
- Local autosave and capped offline production.
- Responsive browser UI and Phaser-rendered bakery floor.

This is an early vertical slice, not the complete game. It does not yet include accounts, multiplayer, server persistence, tower defense, missions, exploration mini-games, or a Windows installer.

## Requirements

- Node.js 22+
- npm 10+

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run typecheck
npm test
npm run build
```

## Project decisions

See `docs/PLATFORM_DECISION.md`, `docs/ARCHITECTURE.md`, `docs/RESEARCH.md`, and `docs/ROADMAP.md`.
