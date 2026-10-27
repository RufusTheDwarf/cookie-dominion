# Architecture — Parfum Empire

## Current vertical slice

- `apps/web/src/economy.ts`: deterministic perfume economy, equipment catalog, missions, normal rebirth, total ascension, essence bonuses and validated save parsing.
- `apps/web/src/main.ts`: Phaser scene, custom-drawn characters and perfume equipment, input, HUD binding and autosave loop.
- `apps/web/src/style.css`: game-oriented responsive HUD, progression cards and mobile controls.
- `tests/economy.test.ts`: unit tests for economy, progression, prestige and persistence.

## Layers

1. **Domain:** economy, machine data, missions, world progression and prestige rules. Independent from rendering.
2. **Client:** Phaser scenes, input, character art, animations and HUD.
3. **Persistence:** validated browser-local save and JSON import/export. Server-side profiles may be added when accounts or multiplayer exist.
4. **Multiplayer (future):** validated protocol, session registry, authoritative room state, reconnect tokens, rate limits and server-side reward validation.
5. **Delivery:** static browser deployment first, CI checks, then consider desktop packaging after the web version is stable.

## Current limitations

No accounts, online multiplayer, cloud saves, combat, external analytics or Windows installer. The game has two prestige levels; total ascension resets normal progression and rewards persistent Essences originelles.
