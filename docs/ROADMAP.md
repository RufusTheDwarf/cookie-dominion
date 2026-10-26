# Roadmap

- [x] Phase 0: inspect available local tools and identify GitHub access blocker.
- [x] Phase 1: compare Web and Roblox; choose Web/Phaser for portability and independent distribution.
- [x] Phase 2: write preliminary architecture and a narrow vertical-slice scope.
- [ ] Phase 3: validate click-to-earn, building purchase, passive production, save/load and offline cap.
- [ ] Phase 4: CI, unit tests, browser smoke test and performance baseline.
- [ ] Phase 5: expand economy and data-driven buildings/missions.
- [ ] Phase 6: implement tower defense and exploration activities.
- [ ] Phase 7: design and test authoritative multiplayer sessions.
- [ ] Phase 8: deploy Web build and test with external players.
- [ ] Phase 9: decide whether Tauri packaging has sufficient value.

## Acceptance criteria for the current slice

- Player can earn crumbs by clicking or pressing Space.
- Player can buy a Brick Oven if they can afford its displayed cost.
- Owned ovens generate passive income.
- Progress is saved locally and loaded on restart.
- Offline production is capped at eight hours.
- Invalid/corrupt save data does not crash startup.
