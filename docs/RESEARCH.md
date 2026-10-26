# Initial technical research

Research date: 2026-10-26. The links below are official documentation consulted for the initial platform decision.

- Phaser overview: https://docs.phaser.io/ — Phaser is a browser-oriented 2D game framework with WebGL/Canvas rendering and JavaScript/TypeScript support. It is not a full 3D engine.
- Phaser installation: https://docs.phaser.io/phaser/getting-started/installation — official npm installation and project setup.
- Roblox remote events: https://create.roblox.com/docs/scripting/events/remote — Roblox provides client/server communication primitives; the server should validate important gameplay outcomes.
- Roblox data stores: https://create.roblox.com/docs/cloud-services/data-stores — server-side persistent data support; Studio access should be separated from live data.
- Roblox security boundary: https://create.roblox.com/docs/scripting/security/client-server-boundary — client-provided values must be validated, especially for persistent player data.
- Roblox discovery: https://create.roblox.com/docs/production/promotion/discovery — discovery signals include engagement, retention, monetization and intentional co-play; visibility is not guaranteed.
- Cloudflare Durable Objects WebSockets: https://developers.cloudflare.com/durable-objects/best-practices/websockets/ — one room object can coordinate WebSocket clients and can hibernate while idle.
- Cloudflare Durable Objects limits: https://developers.cloudflare.com/durable-objects/platform/limits/ — resource and storage limits must be checked against the planned workload.
- Tauri Windows installer: https://v2.tauri.app/distribute/windows-installer/ — supports MSI/NSIS setup builds; native packaging must be built and verified on an appropriate environment.
- GitHub create repository: https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository — remote repository creation requires an authenticated account and permissions.

No external benchmark was run. No trademark or domain availability was verified. Cost estimates are deferred until a deployment and concurrency target are defined.

## Preliminary name search

- `Cookie Dominion`: an existing Roblox experience surfaced in search: https://medal.tv/games/roblox/experiences/1b6aRmDIKQmTlS/cookie-dominion
- `Crumb Empire`: an existing browser clicker surfaced in search: https://itch.io/games-like/4608922/crumb-empire
- `CrumbKeep`: an existing baking app surfaced in search: https://apps.apple.com/ch/app/crumbkeep-sauerteig-brot/id6788656504?platform=vision
- `Ovenfall`, `Doughbound`, `Crumbforge Dominion`: no obvious exact-title game result appeared in the quick search used for this shortlist. This is not legal or trademark clearance.
