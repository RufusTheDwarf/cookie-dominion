# Ovenfall (working title)

A browser-first 2D bakery tycoon prototype built with Phaser 3 and TypeScript. The game borrows broad incremental-tycoon ideas—automated production lines, escalating machines, prestige resets and unlockable worlds—without copying Sell Lemons' assets or exact layout.

## Play loop

- Move around the factory in 2D with **WASD** or the **arrow keys**.
- Press **E** near a machine to purchase it, near the stairs to change floor, or near the portal to enter the next unlocked world.
- Use the floor and world buttons to travel directly.
- Click **Faire un cookie** or press **Space** to earn starter cookies.
- Buy machines on their floor. Animated cookie packets travel on the conveyor to the collection point and become spendable cookies.
- Reach the run earnings target to rebirth. Rebirth resets the factory for that run but grants a permanent **×1.75** income multiplier.
- Rebirth once to unlock **Choco Moon** (×8 world income, ×5 machine prices); reach three rebirths to unlock **Galaxy Oven** (×65 world income, ×35 machine prices).
- Progress is saved locally in the browser. Offline production is capped at eight hours.

## Current prototype scope

Three traversable floors, three themed worlds, five machine types, conveyor/collector animation, rebirth and permanent income scaling, local save migration and offline earnings. It is an evolving prototype rather than a finished game. It does not yet have multiplayer, accounts, server-backed cross-device saves, quests, combat, or a Windows installer.

## Run in a browser without installing Node.js on your PC

This private repository includes a GitHub Codespaces development container with Node.js 22 and npm. Sign in to GitHub, open this repository, and select **Code → Codespaces → Create codespace on main**. When the environment is ready, run in its integrated terminal:

```bash
npm run dev
```

Open the forwarded port **5173** using **Open in Browser**. Codespaces availability and usage quotas depend on your GitHub account and plan.

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
