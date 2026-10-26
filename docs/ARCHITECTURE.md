# Preliminary architecture

## Current vertical slice

- `apps/web/src/economy.ts`: deterministic game rules and validated save parsing.
- `apps/web/src/main.ts`: Phaser scene, input, UI binding, autosave loop.
- `apps/web/src/style.css`: responsive interface.
- `tests/`: unit tests for economy and persistence rules.

## Target layers

1. Domain: economy, building data, missions, progression, combat simulation; independent of rendering.
2. Client: Phaser scenes, input, rendering, audio, accessibility and HUD.
3. Persistence: versioned local save first; server profile persistence when accounts/multiplayer are introduced.
4. Multiplayer: validated protocol, session registry, authoritative room state, reconnect tokens, rate limits, server-side reward validation.
5. Delivery: static client deployment, CI checks, then Tauri packaging once the Web version is stable.

## Non-goals for the first slice

No accounts, online multiplayer, remote persistence, tower defense, prestige, external analytics, or Windows installer. These are not represented as complete.
