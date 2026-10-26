# Implementation status — 2026-10-26

## Current project state

| Path | Purpose | State | Verification |
|---|---|---|---|
| `apps/web/src/main.ts` | Phaser map, keyboard movement, floors, worlds, portals, machines and moving cookies | Implemented in the current tycoon pass | Awaiting CI on this commit and hands-on browser smoke test |
| `apps/web/src/economy.ts` | Machine costs/output, world multipliers, rebirths, save migration and offline progress | Implemented | Awaiting unit test run for this pass |
| `apps/web/src/style.css` | Responsive tycoon HUD and factory panels | Implemented | Source review only; visual viewport test pending |
| `tests/economy.test.ts` | Economy, floor/world locks, rebirth and migration tests | Expanded | Awaiting CI |
| `.devcontainer/devcontainer.json` | Browser-based development environment for Node.js/npm | Present | Codespaces environment creation not manually tested |
| `.github/workflows/ci.yml` | GitHub Actions install, typecheck, test and build | Present | Previous commit passed all steps; latest feature pass pending |
| `docs/ROADMAP.md` | Development milestones | Updated | Source reviewed |

## Design choices in this pass

- Web/Phaser remains the target so the game can run in a browser without a Roblox-only release.
- The game has three floors and three worlds; each machine belongs to a floor.
- Cookie packets visibly travel along the belt to the collector. The value of each delivered packet is credited as spendable cookies.
- Rebirth resets owned machines and spendable/run earnings, keeps lifetime earnings and raises income by ×1.75.
- Choco Moon unlocks after the first rebirth; Galaxy Oven unlocks after the third. Worlds scale costs and production at different rates.
- The existing oven-only local save format is migrated into the new machine format when loaded.

## Verification notes

- Before this feature pass, GitHub Actions passed installation, strict TypeScript checking, Vitest and the Vite production build.
- The new feature pass must pass CI before it is considered technically verified.
- A real browser visual/playtest has not yet been performed by the assistant. Verify movement, stairs, portal access, machine purchases, packet delivery, rebirth and save/load in Codespaces.
- Local builds require Node.js 22+ and npm 10+. The included Codespaces setup is intended for users who do not want to install Node.js on their PC.

## Repository state

- Repository: `RufusTheDwarf/cookie-dominion` (private; default branch `main`).
- Existing `LICENSE` file contains the MIT License. Confirm this remains the intended license before a public release.
