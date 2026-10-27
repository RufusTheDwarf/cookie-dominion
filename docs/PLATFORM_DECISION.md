# Platform decision — Parfum Empire

## Decision

Use an independent browser game built with TypeScript, Phaser 3 and Vite. The target is a 2D top-down tycoon with movement, an equipment shop, world progression and a Roblox-inspired level of visual clarity. Phaser is a 2D framework; do not promise full 3D.

## Why

- Browser access makes the prototype easy to run and share.
- Phaser supports WebGL/Canvas rendering and TypeScript.
- A browser-first build validates the game loop before spending time on multiplayer, deployment infrastructure or desktop packaging.
- Building outside Roblox keeps the project independent, but means the project owns deployment, accounts, networking and any future server-authoritative economy.

## Preliminary stack

- Client: TypeScript + Phaser 3 + Vite.
- Tests: Vitest for deterministic domain rules; browser E2E remains future work.
- Hosting: static web client first; no remote backend yet.
- Local save: browser LocalStorage with JSON export/import.
- Multiplayer candidate: WebSocket sessions on Cloudflare Durable Objects or a small Node.js service, to be evaluated only after the single-player loop is validated.
- Windows: consider Tauri after the browser build is stable.

## Working title

The UI currently uses **Parfum Empire**. The repository slug remains `cookie-dominion` to avoid a potentially disruptive repository rename during active development.

This is a working title, not a trademark, company-name, domain or app-store clearance.
