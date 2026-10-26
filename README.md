# Ovenfall (working title)

A browser-first incremental bakery/tycoon prototype. Working title only; name availability is not verified.

## Current scope

- Click or press Space to bake crumbs.
- Buy Brick Ovens for passive production.
- Local autosave and capped offline production.
- Responsive browser UI and Phaser-rendered bakery floor.

This is an early vertical slice, not the complete game. It does not yet include accounts, multiplayer, server persistence, tower defense, missions, exploration mini-games, or a Windows installer.

## Run in a browser without installing Node.js locally

This repository includes a GitHub Codespaces development container with Node.js 22 and npm. Sign in to GitHub, open this repository, select **Code → Codespaces → Create codespace on main**. Once it finishes preparing the environment, open the terminal and run:

```bash
npm run dev
```

Vite should forward port 5173 and offer **Open in Browser**. Codespaces availability and usage quotas depend on your GitHub account and plan.

## Run locally

Requirements: Node.js 22+ and npm 10+.

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
