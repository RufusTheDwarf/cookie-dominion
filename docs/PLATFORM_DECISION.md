# Platform decision — 2026-10-26

## Decision

Use an independent Web game built with TypeScript, Phaser 3, and Vite. The initial gameplay target is a polished 2D top-down / management hybrid. Do not promise full 3D: Phaser is a 2D framework. Revisit the engine only if true 3D becomes a hard requirement.

## Why

- The project owner wants browser access, GitHub-owned source, and a credible path to a Windows build.
- Web delivery avoids a mandatory launcher and allows fast sharing for early validation.
- Phaser supports WebGL/Canvas rendering and TypeScript, with a mature official guide and npm installation path.
- Roblox reduces multiplayer and persistence infrastructure work, but binds the released experience to Roblox and does not produce an independent Windows game.
- The first milestone should validate the core loop before spending time on real-time multiplayer, packaging, or content scale.

## Trade-offs

- The team owns networking, authoritative game state, deployment, abuse protection, and persistent player accounts.
- Phaser is 2D; 3D exploration would require a different renderer/engine and a larger technical scope.
- Discovery is not built in. Use a browser-playable build, short clips, community feedback, and measurable retention tests.

## Preliminary stack

- Client: TypeScript + Phaser 3 + Vite.
- Tests: Vitest for deterministic domain logic; browser E2E later.
- Hosting: static web client first; no backend until the vertical slice is validated.
- Multiplayer candidate: WebSocket sessions on Cloudflare Durable Objects or a small Node.js service. Decide after session protocol and expected concurrency are specified.
- Local save: versioned localStorage for prototype; IndexedDB/server persistence later.
- Windows: Tauri considered after browser build is stable; produce the installer only on a verified build environment.
- GitHub: private repository initially; no license chosen yet.

## Name

Do not finalize `Cookie Dominion`: a web search found an existing Roblox experience using that exact title (https://medal.tv/games/roblox/experiences/1b6aRmDIKQmTlS/cookie-dominion). `Crumb Empire` also appears as an existing browser clicker game (https://itch.io/games-like/4608922/crumb-empire), and `CrumbKeep` is used by a baking app/game listing.

Candidate shortlist:

- `Ovenfall` — preferred working title; an exact-phrase search did not surface an obvious game match in the results reviewed.
- `Doughbound` — backup candidate; exact-phrase search did not surface an obvious game match in the results reviewed.
- `Crumbforge Dominion` — backup candidate; exact-phrase search did not surface an obvious game match in the results reviewed.

This is only a preliminary public-web collision check, not trademark, company-name, domain, app-store, or legal clearance. Use `Ovenfall` as the UI working title for now; retain the existing repository slug until the name is approved.
