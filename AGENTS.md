# Notes for coding agents

## Project intent

Parfum Empire is a small management game, not an idle clicker. Keep the player's actions grounded in the workshop: walk to a specific garden bed, harvest a chosen ingredient, select a formula, craft it in the laboratory, and sell it at the counter.

## Code map

- `apps/web/src/main.ts` owns page composition, UI state, saves, progression menus, and wiring between the economy and the workshop scene.
- `apps/web/src/economy.ts` owns the game rules. Keep it independent of DOM and canvas APIs.
- `apps/web/src/workshop-scene.ts` owns the 2D scene, player movement, station proximity, drawing, and keyboard/touch navigation. It reports station interactions to the main app instead of mutating the economy directly.
- `apps/web/src/style.css` owns responsive presentation.
- `tests/economy.test.ts` tests game rules, recipe crafting, deterministic harvesting, sales, progression, and save migration.

## Rules for changes

1. Prefer deterministic actions over random drops, timed popups, and click farming.
2. Do not put economy calculations inside the scene renderer. Add or change domain functions in `economy.ts` and test them.
3. Keep old save fields when removing a feature if they are needed to import existing saves. Legacy fields must not reappear in the active interface.
4. Keep the game playable on touchscreens. Keyboard controls are an enhancement, not the only input method.
5. Do not add fake security through renamed or hidden client files. Browser-delivered JavaScript can be inspected. For meaningful anti-cheat protection, move authoritative currency, inventory, and progression validation to a server.
6. Keep interface copy concise and natural. Avoid generic marketing language and avoid em dashes in new user-facing text.
7. Before finishing, run `npm run typecheck`, `npm test`, and `npm run build`.

## Current game loop

Explore the garden, harvest a specific ingredient from its fixed plot, choose one of the known recipes, formulate it at the laboratory, then sell the bottle at the shop counter. Machines and research expand the business after the player has earned the first sales.
