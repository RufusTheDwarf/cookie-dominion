<div align="center">

# Ovenfall

**Working title // not final, not trademark-cleared.**

A browser-first incremental bakery/tycoon prototype.

[![GitHub last commit](https://img.shields.io/github/last-commit/RufusTheDwarf/cookie-dominion?style=flat-square)](https://github.com/RufusTheDwarf/cookie-dominion/commits/main)
[![GitHub repo size](https://img.shields.io/github/repo-size/RufusTheDwarf/cookie-dominion?style=flat-square)](https://github.com/RufusTheDwarf/cookie-dominion)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Phaser 3](https://img.shields.io/badge/Phaser-3-8A2BE2?style=flat-square)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Status](https://img.shields.io/badge/status-vertical%20slice-F6C453?style=flat-square)](#current-scope)
[![License](https://img.shields.io/badge/license-TBD-lightgrey?style=flat-square)](#license)

</div>

---

## Current scope

This repository is an **early vertical slice**, not the complete game. It validates the core loop:

- Click or press **Space** to bake crumbs.
- Buy **Brick Ovens** for passive production.
- Local autosave and capped offline production.
- Responsive browser UI and Phaser-rendered bakery floor.

**Not yet included:** accounts, multiplayer, server persistence, tower defense, missions, exploration mini-games, or a Windows installer.

---

## Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript |
| Game engine | Phaser 3 |
| Build tool | Vite |
| Tests | Vitest |
| Hosting | Static web client (no backend yet) |

The platform decision and trade-offs are documented in [`docs/PLATFORM_DECISION.md`](docs/PLATFORM_DECISION.md).

---

## Quick start

### Option A // GitHub Codespaces (no local Node.js install)

This repository includes a development container with Node.js 22 and npm.

1. Sign in to GitHub.
2. Open this repository.
3. Select **Code → Codespaces → Create codespace on main**.
4. Wait for the environment to finish preparing.
5. In the terminal, run:

```bash
npm run dev
```

Vite should forward port `5173` and offer **Open in Browser**.

> Codespaces availability and usage quotas depend on your GitHub account and plan.

### Option B // Local install

**Requirements:** Node.js **22+** and npm **10+**.

```bash
npm install
npm run dev
```

---

## Verify the project

```bash
npm run typecheck
npm test
npm run build
```

These commands correspond to the scripts currently defined in `package.json`.

---

## Documentation

- [`docs/PLATFORM_DECISION.md`](docs/PLATFORM_DECISION.md) // why Web + Phaser was chosen over Roblox, and the associated trade-offs.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) // module layout and technical structure.
- [`docs/RESEARCH.md`](docs/RESEARCH.md) // background research and references.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) // phased plan from vertical slice to multiplayer and packaging.
- [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md) // what is actually implemented, with CI verification notes.

---

## Roadmap (summary)

The project is being built in narrow, validated phases rather than attempting the full feature set at once.

| Phase | Focus |
|---|---|
| 0–2 | Tools inspection, platform choice, preliminary architecture, vertical-slice scope |
| 3 | Validate click-to-earn, building purchase, passive production, save/load, offline cap |
| 4 | CI, unit tests, browser smoke test, performance baseline |
| 5 | Expand economy and data-driven buildings/missions |
| 6 | Tower defense and exploration activities |
| 7 | Authoritative multiplayer sessions |
| 8 | Deploy Web build and test with external players |
| 9 | Decide whether Tauri packaging has sufficient value |

The detailed acceptance criteria for the current slice are in [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## Known limitations

- This is a **vertical slice**, not a complete game.
- The name **Ovenfall** is a working title; trademark/domain/app-store clearance has not been performed.
- Multiplayer, tower defense, missions, exploration, and the Windows installer are **planned but not yet implemented**.
- The project currently targets a static web build; no backend or authoritative server exists yet.

---

## License

See [`LICENSE`](LICENSE) for the current license status. No final license has been chosen at this stage.

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution guidelines and the current definition of done for the vertical slice.

---

<div align="center">

**Authors**

[![RufusTheDwarf](https://img.shields.io/badge/author-RufusTheDwarf-3D405B?style=flat-square&logo=github&logoColor=white)](https://github.com/RufusTheDwarf)
[![ChatGPT](https://img.shields.io/badge/co--author-ChatGPT-10A37F?style=flat-square&logo=openai&logoColor=white)](https://chatgpt.com/)

<sub>Made by <a href="https://github.com/RufusTheDwarf">RufusTheDwarf</a> with <a href="https://chatgpt.com/">ChatGPT</a>.</sub>

</div>
