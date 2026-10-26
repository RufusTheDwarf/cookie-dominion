# Roadmap

- [x] Phase 0: inspect available local tools and identify GitHub access blocker.
- [x] Phase 1: compare Web and Roblox; choose Web/Phaser for portability and independent distribution.
- [x] Phase 2: record platform, architecture and initial vertical-slice decisions.
- [x] Phase 3: click-to-earn, deterministic machine economy, local save migration and capped offline earnings.
- [x] Phase 4: CI workflow, economy tests, TypeScript check and production build.
- [x] Phase 5: first 2D tycoon slice with movement, three floors, visible conveyor deliveries, collector, three worlds and rebirth progression.
- [ ] Phase 6: hands-on browser smoke test, tune movement/camera/UI and verify the game on desktop and mobile viewports.
- [ ] Phase 7: add further factory lines, upgrades and world-specific objectives.
- [ ] Phase 8: design and test authoritative multiplayer sessions and server-backed saves.
- [ ] Phase 9: deploy a public browser build and gather playtest feedback.
- [ ] Phase 10: decide whether Tauri packaging has sufficient value.

## Current slice acceptance criteria

- Player can move in 2D with keyboard controls.
- Player can travel among three floors and unlocked worlds.
- Clicking or pressing Space earns starter cookies.
- Machine purchases are gated by the current floor and displayed price.
- Owned machines generate animated cookie packets on a conveyor; deliveries are credited as spendable cookies at the collector.
- Rebirth resets the current factory run while increasing the permanent income multiplier and unlocking worlds at configured milestones.
- Progress is saved locally and loaded on restart.
- Offline production is capped at eight hours.
- Legacy oven-only saves migrate, and corrupted saves do not crash startup.
- CI runs typecheck, unit tests and a production build on pushes to main.
