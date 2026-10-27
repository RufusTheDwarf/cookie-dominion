import Phaser from 'phaser';
import {
  addCrumbs,
  buyMachine,
  buyUpgrade,
  canClaimMission,
  canRebirth,
  claimMission,
  createInitialState,
  enterFloor,
  exportSaveFile,
  enterWorld,
  getMachine,
  getWorld,
  MACHINES,
  MAX_UPGRADE_LEVEL,
  MISSION_DEFINITIONS,
  machineCost,
  manualCookieValue,
  missionProgress,
  parseImportedSave,
  parseSavedState,
  performRebirth,
  productionPerSecond,
  rebirthCost,
  rebirthMultiplier,
  upgradeCost,
  UPGRADES,
  WORLDS,
  type GameState,
  type MachineId,
  type MissionId,
  type UpgradeId,
  type WorldId,
} from './economy';
import './style.css';

const SAVE_KEY = 'cookie-dominion-save-v1';
const MAP_WIDTH = 1200;
const MAP_HEIGHT = 760;
const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing app root');

app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand"><div class="eyebrow">COOKIE INDUSTRIES // TYCOON LABS</div><h1>COOKIE<span> DOMINION</span></h1><p class="subtitle">Construis ton empire. Automatise la production. Domine chaque monde.</p></div>
      <div class="header-stats"><div><span class="eyebrow">MONDE</span><strong id="world-name">Cookie Valley</strong></div><div><span class="eyebrow">SAUVEGARDE</span><strong id="save-state">LOCALE</strong></div></div>
    </header>
    <section class="panel save-toolbar">
      <div class="save-toolbar-heading"><div><div class="eyebrow">GESTION DE LA PARTIE</div><strong>SAUVEGARDE / CHARGEMENT</strong><small>Export JSON, import d'une autre sauvegarde ou effacement complet.</small></div></div>
      <div class="save-actions">
        <button id="save-now" class="save-action">SAUVEGARDER</button>
        <button id="export-save" class="save-action">EXPORTER DATA</button>
        <button id="copy-save" class="save-action">COPIER</button>
        <button id="import-save" class="save-action">CHARGER TEXTE</button>
        <button id="import-file-button" class="save-action">CHARGER FICHIER</button>
        <button id="erase-save" class="save-action danger">EFFACER LA PARTIE</button>
        <input id="import-file" type="file" accept=".json,.txt,application/json,text/plain" hidden />
      </div>
      <textarea id="save-data-text" rows="3" spellcheck="false" aria-label="Données de sauvegarde" placeholder="Clique sur EXPORTER DATA pour générer une sauvegarde à copier ou conserver. Colle ici un export pour le charger."></textarea>
      <div class="save-toolbar-note">Les données restent dans ce navigateur, sauf si tu exportes le fichier. Le chargement remplace la partie actuelle.</div>
    </section>
    <section class="dashboard">
      <aside class="panel stats-panel">
        <div class="eyebrow">TRÉSORERIE</div><div class="crumb-total" id="crumb-total">0</div><div class="muted">cookies disponibles</div>
        <div class="rule"></div>
        <div class="stat-row"><span>Production</span><strong id="production">0 / s</strong></div>
        <div class="stat-row"><span>Multiplicateur</span><strong id="multiplier">x1</strong></div>
        <div class="stat-row"><span>Rebirths</span><strong id="rebirth-count">0</strong></div>
        <div class="stat-row"><span>Cookies cette vie</span><strong id="run-earned">0</strong></div>
        <button class="primary" id="bake-button">FAIRE UN COOKIE <span>+10</span></button>
        <button id="golden-cookie" class="golden-cookie-button" type="button" disabled>
          <span class="golden-cookie-icon">★</span>
          <span class="golden-cookie-copy"><strong>COOKIE DORÉ</strong><small id="golden-cookie-status">Premier bonus dans 25 s</small></span>
          <span class="golden-cookie-mark">×2</span>
        </button>
        <div class="hint">Attrape le cookie doré avant qu'il disparaisse : récompense immédiate et production doublée pendant 20 secondes.</div>
        <div class="hint">Déplace-toi avec WASD ou les flèches. Approche-toi d'une machine, des escaliers ou du portail et appuie sur E.</div>
        <div class="rule"></div>
        <div class="eyebrow">REBIRTH</div><div class="rebirth-progress"><div id="rebirth-progress"></div></div>
        <p class="objective" id="rebirth-info">Gagne des cookies pour débloquer le rebirth.</p>
        <button class="rebirth-button" id="rebirth-button" disabled>REBIRTH <span id="rebirth-cost">1 500</span></button>
        <p class="hint">Le rebirth remet tes machines et tes cookies à zéro, mais augmente définitivement tes gains.</p>
        <div class="rule"></div>
        <div class="eyebrow">QUÊTES & CONTRATS</div>
        <h2>OBJECTIFS DE L'USINE</h2>
        <p class="panel-intro">Accomplis des missions, réclame tes récompenses et finance ta prochaine expansion.</p>
        <div id="mission-list" class="mission-list"></div>
      </aside>
      <section class="panel map-panel">
        <div class="panel-heading"><div><div class="eyebrow">USINE EN 2D</div><h2 id="floor-title">ÉTAGE 1 — ATELIER</h2></div><div class="live-dot">EN DIRECT</div></div>
        <div class="map-toolbar"><div><strong>TON PERSONNAGE</strong><small>Clique sur un endroit de la carte pour t'y déplacer.</small></div><span id="player-position">Position : …</span></div>
        <div id="game-canvas" class="game-canvas"></div>
        <div class="movement-toolbar">
          <div class="movement-copy"><strong>SE DÉPLACER</strong><small>WASD / flèches, clic sur la carte ou les boutons.</small><small>Approche-toi d'une machine puis appuie sur E.</small></div>
          <div class="dpad" aria-label="Commandes de déplacement">
            <button type="button" class="move-up" data-move="up" aria-label="Aller vers le haut">▲</button>
            <button type="button" class="move-left" data-move="left" aria-label="Aller à gauche">◀</button>
            <button type="button" class="move-down" data-move="down" aria-label="Aller vers le bas">▼</button>
            <button type="button" class="move-right" data-move="right" aria-label="Aller à droite">▶</button>
          </div>
          <button id="interact-button" class="interact-button" type="button"><strong>E</strong><span>INTERAGIR</span></button>
        </div>
        <div class="map-legend"><span><i class="legend-cookie"></i> Cookie en transit</span><span><i class="legend-player"></i> Toi</span><span id="map-hint">Déplacement actif · E pour interagir</span></div>
        <div class="nav-block">
          <div class="nav-heading"><span class="eyebrow">ÉTAGES</span><span class="muted">Escaliers sur la carte ou accès rapide</span></div>
          <div class="nav-buttons">
            <button class="nav-button is-active" data-floor="0">01 · Atelier</button>
            <button class="nav-button" data-floor="1">02 · Production</button>
            <button class="nav-button" data-floor="2">03 · Laboratoire</button>
          </div>
        </div>
        <div class="nav-block">
          <div class="nav-heading"><span class="eyebrow">PORTAILS DES MONDES</span><span class="muted">Chaque monde multiplie les gains</span></div>
          <div class="world-buttons" id="world-buttons"></div>
        </div>
      </section>
      <aside class="panel building-panel">
        <div class="eyebrow">RECHERCHE & DÉVELOPPEMENT</div><h2>AMÉLIORATIONS</h2>
        <p class="panel-intro">Investis tes cookies dans des bonus permanents. Les niveaux sont conservés après un rebirth.</p>
        <div id="upgrade-list" class="upgrade-list"></div>
        <div class="rule"></div>
        <div class="eyebrow">CONSTRUCTION</div><h2>MACHINES</h2>
        <p class="panel-intro">Achète des machines. Elles fabriquent des cookies qui avancent sur le convoyeur jusqu'au collecteur.</p>
        <div class="machine-list" id="machine-list"></div>
        <div class="rule"></div>
        <div class="eyebrow">BOUCLE DE JEU</div>
        <div class="loop-step"><span>01</span><div><strong>Produis</strong><small>Manuellement ou avec tes machines.</small></div></div>
        <div class="loop-step"><span>02</span><div><strong>Automatise</strong><small>Les cookies sont livrés au collecteur.</small></div></div>
        <div class="loop-step"><span>03</span><div><strong>Rebirth</strong><small>Repars vite avec un bonus permanent.</small></div></div>
      </aside>
    </section>
    <footer><span>COOKIE DOMINION // TYCOON PROTOTYPE</span><span>SAUVEGARDE LOCALE · UNE PARTIE PAR NAVIGATEUR</span></footer>
  </main>
`;

let state: GameState;
try {
  state = parseSavedState(localStorage.getItem(SAVE_KEY));
} catch {
  state = parseSavedState(null);
}
let saveTimer = 0;
let statusTimer = 0;
let renderTimer = 0;
let previousFrame = performance.now();
let goldenReadyAt = performance.now() + 25_000;
let goldenDeadline = 0;
let goldenBoostUntil = 0;
let goldenCookiesClaimed = 0;
let goldenUiSecond = -1;
type MoveDirection = 'up' | 'down' | 'left' | 'right';
const activeMoveControls = new Set<MoveDirection>();
let machineUiKey = '';
let worldUiKey = '';
let upgradeUiKey = '';
let missionUiKey = '';
let bakeryScene: TycoonScene | undefined;

const $ = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error('Missing element: ' + id);
  return element as T;
};
const format = (value: number) =>
  new Intl.NumberFormat('fr-CH', { maximumFractionDigits: value >= 100 ? 0 : 1 }).format(value);

function setStatus(message: string): void {
  $('map-hint').textContent = message;
  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => {
    $('map-hint').textContent = 'WASD / flèches · E : interagir';
  }, 2600);
}

function save(): void {
  state.lastSavedAt = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    $('save-state').textContent = 'SAUVÉE';
  } catch {
    $('save-state').textContent = 'ERREUR';
    setStatus('Sauvegarde indisponible dans ce navigateur.');
  }
}

function exportSave(): void {
  save();
  $<HTMLTextAreaElement>('save-data-text').value = exportSaveFile(state, state.lastSavedAt);
  $<HTMLTextAreaElement>('save-data-text').focus();
  $<HTMLTextAreaElement>('save-data-text').select();
  setStatus('Export généré. Copie le texte ou utilise le bouton COPIER.');
}

async function copySave(): Promise<void> {
  const text = $<HTMLTextAreaElement>('save-data-text').value;
  if (!text.trim()) {
    exportSave();
  }
  const textarea = $<HTMLTextAreaElement>('save-data-text');
  try {
    await navigator.clipboard.writeText(textarea.value);
    setStatus('Sauvegarde copiée dans le presse-papiers.');
  } catch {
    textarea.focus();
    textarea.select();
    setStatus('Sélectionne le texte puis fais Ctrl+C.');
  }
}

function loadSaveText(raw: string): boolean {
  const imported = parseImportedSave(raw);
  if (!imported) {
    setStatus('Import refusé : ce texte ne contient pas une sauvegarde Ovenfall valide.');
    return false;
  }
  state = imported;
  machineUiKey = '';
  worldUiKey = '';
  render();
  bakeryScene?.loadWorld();
  save();
  $<HTMLTextAreaElement>('save-data-text').value = '';
  setStatus('Sauvegarde chargée. La partie actuelle a été remplacée.');
  return true;
}

function eraseSave(): void {
  const accepted = window.confirm(
    'Effacer définitivement la sauvegarde Ovenfall de ce navigateur ? Cette action réinitialise les cookies, machines, rebirths et mondes débloqués. Exporte une sauvegarde avant de continuer si tu veux la conserver.',
  );
  if (!accepted) return;
  state = createInitialState();
  machineUiKey = '';
  worldUiKey = '';
  activeMoveControls.clear();
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    setStatus('Le navigateur a refusé l’effacement de sa mémoire locale.');
  }
  $<HTMLTextAreaElement>('save-data-text').value = '';
  render();
  bakeryScene?.loadWorld();
  save();
  setStatus('Partie effacée : nouvelle usine créée.');
}

$('save-now').addEventListener('click', () => {
  save();
  setStatus('Partie sauvegardée sur cet appareil.');
});
$('export-save').addEventListener('click', exportSave);
$('copy-save').addEventListener('click', () => { void copySave(); });
$('import-save').addEventListener('click', () => {
  const textarea = $<HTMLTextAreaElement>('save-data-text');
  if (!textarea.value.trim()) {
    setStatus('Colle d’abord les données de sauvegarde dans le champ.');
    textarea.focus();
    return;
  }
  if (window.confirm('Charger cette sauvegarde et remplacer la partie actuelle ?')) {
    loadSaveText(textarea.value);
  }
});
$('import-file-button').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async (event) => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const raw = await file.text();
    if (window.confirm('Charger « ' + file.name + ' » et remplacer la partie actuelle ?')) {
      loadSaveText(raw);
    }
  } catch {
    setStatus('Impossible de lire ce fichier de sauvegarde.');
  } finally {
    input.value = '';
  }
});
$('erase-save').addEventListener('click', eraseSave);

document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => {
  const direction = button.dataset.move as MoveDirection;
  const release = () => {
    activeMoveControls.delete(direction);
    button.classList.remove('is-pressed');
  };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    activeMoveControls.add(direction);
    button.classList.add('is-pressed');
    try { button.setPointerCapture(event.pointerId); } catch { /* Some browsers do not support capture. */ }
  });
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
});
window.addEventListener('blur', () => {
  activeMoveControls.clear();
  document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => button.classList.remove('is-pressed'));
});
$('interact-button').addEventListener('click', () => bakeryScene?.requestInteract());
$('golden-cookie').addEventListener('click', claimGoldenCookie);

function renderGoldenCookie(now: number): void {
  const button = $<HTMLButtonElement>('golden-cookie');
  const status = $('golden-cookie-status');
  const second = Math.floor(now / 1000);
  if (second === goldenUiSecond) return;
  goldenUiSecond = second;

  if (now < goldenBoostUntil) {
    button.disabled = true;
    button.classList.add('is-boosted');
    button.classList.remove('is-ready');
    status.textContent = 'BOOST ×2 · ' + Math.ceil((goldenBoostUntil - now) / 1000) + ' s restantes';
    return;
  }

  button.classList.remove('is-boosted');
  const remaining = goldenDeadline - now;
  if (remaining > 0) {
    button.disabled = false;
    button.classList.add('is-ready');
    status.textContent = 'DISPONIBLE · ' + Math.ceil(remaining / 1000) + ' s pour le prendre';
    return;
  }

  button.disabled = true;
  button.classList.remove('is-ready');
  status.textContent = 'Prochain bonus dans ' + Math.max(0, Math.ceil((goldenReadyAt - now) / 1000)) + ' s · récupérés : ' + goldenCookiesClaimed;
}

function claimGoldenCookie(): void {
  const now = performance.now();
  if (goldenDeadline <= now) return;
  const reward = Math.max(50, productionPerSecond(state) * 10 + manualCookieValue(state) * 10);
  state = addCrumbs(state, reward);
  goldenDeadline = 0;
  goldenBoostUntil = now + 20_000;
  goldenReadyAt = goldenBoostUntil + 45_000 + Math.random() * 25_000;
  goldenUiSecond = -1;
  goldenCookiesClaimed += 1;
  render();
  renderGoldenCookie(now);
  save();
  bakeryScene?.pulsePlayer();
  setStatus('Cookie doré récupéré : +' + format(reward) + ' cookies et production ×2 pendant 20 secondes.');
}

function renderUpgradeCards(): void {
  const signature = (Object.keys(UPGRADES) as UpgradeId[]).map((id) =>
    [id, state.upgrades[id], upgradeCost(state, id), state.crumbs >= upgradeCost(state, id) ? 1 : 0].join(':'),
  ).join('|');
  if (signature === upgradeUiKey) return;
  upgradeUiKey = signature;
  $('upgrade-list').innerHTML = (Object.keys(UPGRADES) as UpgradeId[]).map((id) => {
    const upgrade = UPGRADES[id];
    const level = state.upgrades[id];
    const maxed = level >= MAX_UPGRADE_LEVEL;
    const cost = upgradeCost(state, id);
    return `
      <button class="upgrade-card ${maxed ? 'is-maxed' : ''}" data-upgrade="${id}" ${maxed || state.crumbs < cost ? 'disabled' : ''}>
        <span class="upgrade-level">${String(level).padStart(2, '0')}<small>/${MAX_UPGRADE_LEVEL}</small></span>
        <span class="upgrade-copy"><strong>${upgrade.name}</strong><small>${upgrade.effect}</small><small>${upgrade.description}</small></span>
        <span class="upgrade-cost">${maxed ? 'MAX' : format(cost)}</span>
      </button>`;
  }).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach((button) => {
    button.addEventListener('click', () => buyUpgradeById(button.dataset.upgrade as UpgradeId));
  });
}

function renderMissionCards(): void {
  const readyIds = MISSION_DEFINITIONS.filter((mission) => canClaimMission(state, mission.id)).map((mission) => mission.id);
  const signature = [...state.claimedMissions, 'ready:' + readyIds.join(',')].join('|');
  if (signature !== missionUiKey) {
    missionUiKey = signature;
    $('mission-list').innerHTML = MISSION_DEFINITIONS.map((mission) => {
      const claimed = state.claimedMissions.includes(mission.id);
      const ready = canClaimMission(state, mission.id);
      const progress = missionProgress(state, mission);
      return `
        <article class="mission-card ${claimed ? 'is-claimed' : ready ? 'is-ready' : ''}">
          <div class="mission-topline"><strong>${mission.name}</strong><span>${claimed ? 'TERMINÉ' : '+' + format(mission.reward) + ' 🍪'}</span></div>
          <p>${mission.description}</p>
          <div class="mission-progress"><i id="mission-bar-${mission.id}" style="width:${Math.min(100, progress / mission.target * 100)}%"></i></div>
          <div class="mission-bottomline"><small id="mission-count-${mission.id}">${format(progress)} / ${format(mission.target)}</small>
          <button type="button" data-mission="${mission.id}" ${claimed || !ready ? 'disabled' : ''}>${claimed ? 'RÉCLAMÉ' : ready ? 'RÉCUPÉRER' : 'EN COURS'}</button></div>
        </article>`;
    }).join('');
    document.querySelectorAll<HTMLButtonElement>('[data-mission]').forEach((button) => {
      button.addEventListener('click', () => claimMissionReward(button.dataset.mission as MissionId));
    });
  }

  for (const mission of MISSION_DEFINITIONS) {
    const progress = missionProgress(state, mission);
    const count = document.getElementById('mission-count-' + mission.id);
    const bar = document.getElementById('mission-bar-' + mission.id);
    if (count) count.textContent = format(progress) + ' / ' + format(mission.target);
    if (bar) bar.style.width = Math.min(100, progress / mission.target * 100) + '%';
  }
}

function buyUpgradeById(upgradeId: UpgradeId): void {
  const previous = state;
  state = buyUpgrade(state, upgradeId);
  if (state === previous) {
    setStatus(state.upgrades[upgradeId] >= MAX_UPGRADE_LEVEL
      ? 'Cette amélioration est déjà au niveau maximal.'
      : 'Pas assez de cookies pour cette amélioration.');
    return;
  }
  render();
  save();
  const upgrade = UPGRADES[upgradeId];
  setStatus(upgrade.name + ' améliorée au niveau ' + state.upgrades[upgradeId] + '.');
}

function claimMissionReward(missionId: MissionId): void {
  const previous = state;
  state = claimMission(state, missionId);
  if (state === previous) {
    setStatus('Cette mission n’est pas encore terminée.');
    return;
  }
  const mission = MISSION_DEFINITIONS.find((item) => item.id === missionId);
  render();
  save();
  if (mission) setStatus('Contrat terminé : +' + format(mission.reward) + ' cookies.');
}

function renderMachineCards(): void {
  const signature = [
    state.currentWorld,
    state.currentFloor,
    ...MACHINES.map((machine) => [
      machine.id,
      state.machines[state.currentWorld][machine.id],
      machineCost(state, machine.id),
      state.crumbs >= machineCost(state, machine.id) ? 1 : 0,
    ].join(':')),
  ].join('|');
  if (signature === machineUiKey) return;
  machineUiKey = signature;
  $('machine-list').innerHTML = MACHINES.map((machine) => {
    const owned = state.machines[state.currentWorld][machine.id];
    const cost = machineCost(state, machine.id);
    const inaccessible = machine.floor !== state.currentFloor;
    const canAfford = state.crumbs >= cost;
    return `
      <button class="machine-card ${inaccessible ? 'is-locked' : ''}" data-machine="${machine.id}" ${inaccessible || !canAfford ? 'disabled' : ''}>
        <span class="machine-icon">${machine.short}</span>
        <span class="machine-copy"><strong>${machine.name}</strong><small>${machine.description}</small><small>Étage ${machine.floor + 1} · Possédés : ${owned}</small></span>
        <span class="machine-cost">${inaccessible ? 'ÉTAGE ' + (machine.floor + 1) : format(cost)}</span>
      </button>`;
  }).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-machine]').forEach((button) => {
    button.addEventListener('click', () => buyMachineById(button.dataset.machine as MachineId));
  });
}

function renderWorldButtons(): void {
  const signature = [
    state.currentWorld,
    ...WORLDS.map((world) => state.unlockedWorlds.includes(world.id) ? world.id : 'locked-' + world.id),
  ].join('|');
  if (signature === worldUiKey) return;
  worldUiKey = signature;
  $('world-buttons').innerHTML = WORLDS.map((world) => {
    const unlocked = state.unlockedWorlds.includes(world.id);
    const active = state.currentWorld === world.id;
    return `<button class="world-button ${active ? 'is-active' : ''}" data-world="${world.id}" ${unlocked ? '' : 'disabled'}>
      <span class="world-dot" style="--world-accent:#${world.accent.toString(16).padStart(6, '0')}"></span>
      <span><strong>${world.name}</strong><small>${unlocked ? world.tagline : 'Rebirth requis : ' + world.unlockRebirths}</small></span>
      <span class="world-status">${active ? 'ICI' : unlocked ? 'ENTRER' : 'VERROUILLÉ'}</span>
    </button>`;
  }).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-world]').forEach((button) => {
    button.addEventListener('click', () => changeWorld(button.dataset.world as WorldId));
  });
}

function render(): void {
  const world = getWorld(state.currentWorld);
  $('crumb-total').textContent = format(state.crumbs);
  $('production').textContent = format(productionPerSecond(state)) + ' / s';
  $('multiplier').textContent = 'x' + format(rebirthMultiplier(state) * world.incomeMultiplier);
  $('rebirth-count').textContent = String(state.rebirths);
  $('run-earned').textContent = format(state.runCrumbsEarned);
  const bakeValue = $('bake-button').querySelector('span');
  if (bakeValue) bakeValue.textContent = '+' + format(manualCookieValue(state));
  $('world-name').textContent = world.name;
  $('floor-title').textContent = ['ÉTAGE 1 — ATELIER', 'ÉTAGE 2 — PRODUCTION', 'ÉTAGE 3 — LABORATOIRE'][state.currentFloor] ?? 'USINE';
  $('rebirth-cost').textContent = format(rebirthCost(state.rebirths));
  $('rebirth-button').toggleAttribute('disabled', !canRebirth(state));
  $('rebirth-progress').style.width = Math.min(100, state.runCrumbsEarned / rebirthCost(state.rebirths) * 100) + '%';
  $('rebirth-info').textContent = canRebirth(state)
    ? 'Ton usine est prête à renaître. Tu gagneras un multiplicateur permanent x' + format(rebirthMultiplier({ rebirths: state.rebirths + 1 }))
    : 'Encore ' + format(Math.max(0, rebirthCost(state.rebirths) - state.runCrumbsEarned)) + ' cookies gagnés avant le rebirth.';
  document.querySelectorAll<HTMLButtonElement>('[data-floor]').forEach((button) => {
    const floor = Number(button.dataset.floor);
    button.classList.toggle('is-active', floor === state.currentFloor);
  });
  renderUpgradeCards();
  renderMissionCards();
  renderMachineCards();
  renderWorldButtons();
}

function bake(): void {
  state = addCrumbs(state, manualCookieValue(state));
  render();
  bakeryScene?.pulsePlayer();
  saveSoon();
}

function saveSoon(): void {
  saveTimer = Math.max(saveTimer, 7.5);
}

function buyMachineById(machineId: MachineId): void {
  const previous = state;
  state = buyMachine(state, machineId);
  if (state === previous) {
    const machine = getMachine(machineId);
    setStatus(machine.floor !== state.currentFloor
      ? 'Passe à l’étage ' + (machine.floor + 1) + ' pour acheter cette machine.'
      : 'Pas assez de cookies pour cette machine.');
    return;
  }
  render();
  setStatus(getMachine(machineId).name + ' installée. La ligne de production démarre.');
  bakeryScene?.refreshMachines();
  save();
}

function changeWorld(worldId: WorldId): void {
  const next = enterWorld(state, worldId);
  if (next === state) {
    const world = getWorld(worldId);
    setStatus('Il faut ' + world.unlockRebirths + ' rebirth(s) pour ouvrir ce portail.');
    return;
  }
  state = next;
  render();
  bakeryScene?.loadWorld();
  setStatus('Bienvenue dans ' + getWorld(worldId).name + ' !');
  save();
}

function changeFloor(floor: number): void {
  state = enterFloor(state, floor);
  render();
  bakeryScene?.loadFloor();
  save();
}

function doRebirth(): void {
  const next = performRebirth(state);
  if (next === state) {
    setStatus('Pas encore prêt pour le rebirth.');
    return;
  }
  state = next;
  render();
  bakeryScene?.loadWorld();
  setStatus('Rebirth ! Tes gains permanents ont augmenté. Le monde Choco Moon est disponible.');
  save();
}

$('bake-button').addEventListener('click', bake);
$('rebirth-button').addEventListener('click', doRebirth);
document.querySelectorAll<HTMLButtonElement>('[data-floor]').forEach((button) => {
  button.addEventListener('click', () => changeFloor(Number(button.dataset.floor)));
});
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLButtonElement)) {
    event.preventDefault();
    bake();
  }
});
window.addEventListener('beforeunload', save);

class TycoonScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'E', Phaser.Input.Keyboard.Key>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private machineObjects: Phaser.GameObjects.GameObject[] = [];
  private packets = new Set<Phaser.GameObjects.Container>();
  private spawnEvent?: Phaser.Time.TimerEvent;
  private collectorLabel?: Phaser.GameObjects.Text;
  private moveTarget: { x: number; y: number } | null = null;
  private interactRequested = false;
  private lastPositionUpdate = 0;

  constructor() {
    super('TycoonScene');
  }

  create(): void {
    bakeryScene = this;
    const world = getWorld(state.currentWorld);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.add.rectangle(MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH, MAP_HEIGHT, world.background);
    const floor = this.add.graphics();
    floor.fillStyle(world.floorColor, 1);
    floor.fillRoundedRect(70, 70, 1060, 620, 18);
    floor.lineStyle(4, world.accent, 0.75);
    floor.strokeRoundedRect(70, 70, 1060, 620, 18);
    floor.lineStyle(1, world.accent, 0.14);
    for (let x = 88; x < 1120; x += 36) floor.lineBetween(x, 80, x, 680);
    for (let y = 88; y < 680; y += 36) floor.lineBetween(80, y, 1120, y);
    floor.lineStyle(6, 0x130f0c, 0.85);
    floor.strokeRect(89, 89, 1022, 582);

    this.add.text(110, 105, world.name.toUpperCase() + ' / FLOOR 0' + (state.currentFloor + 1), {
      fontFamily: 'monospace', fontSize: '15px', color: '#' + world.accent.toString(16).padStart(6, '0'),
      letterSpacing: 2, fontStyle: 'bold',
    }).setDepth(3);

    this.drawConveyor(world.accent, world.belt);
    this.drawCollector(world.accent);
    this.drawPortal(world.accent);
    this.drawStairs(world.accent);
    this.drawFloorDecoration(world.accent);
    this.refreshMachines();

    this.player = this.createPlayer(260, 390, world.accent);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const point = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.moveTarget = {
        x: Phaser.Math.Clamp(point.x, 110, 1090),
        y: Phaser.Math.Clamp(point.y, 115, 655),
      };
    });
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input unavailable');
    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys('W,A,S,D,E') as Record<'W' | 'A' | 'S' | 'D' | 'E', Phaser.Input.Keyboard.Key>;

    this.spawnEvent = this.time.addEvent({
      delay: 650,
      loop: true,
      callback: () => this.spawnCookiePacket(),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.spawnEvent?.remove();
      this.packets.forEach((packet) => packet.destroy());
      this.packets.clear();
    });
  }

  update(_time: number, delta: number): void {
    if (!this.player?.active) return;
    const speed = 260;
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown || activeMoveControls.has('left')) vx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown || activeMoveControls.has('right')) vx += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown || activeMoveControls.has('up')) vy -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown || activeMoveControls.has('down')) vy += 1;
    if (vx !== 0 || vy !== 0) {
      this.moveTarget = null;
    } else if (this.moveTarget) {
      const dx = this.moveTarget.x - this.player.x;
      const dy = this.moveTarget.y - this.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 8) {
        this.moveTarget = null;
      } else {
        vx = dx / distance;
        vy = dy / distance;
      }
    }
    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }
    this.player.x = Phaser.Math.Clamp(this.player.x + vx * speed * delta / 1000, 110, 1090);
    this.player.y = Phaser.Math.Clamp(this.player.y + vy * speed * delta / 1000, 115, 655);
    if (this.moveTarget && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y) < 8) {
      this.moveTarget = null;
    }
    this.player.setDepth(this.player.y);
    if (this.time.now - this.lastPositionUpdate > 120) {
      $('player-position').textContent = 'Position : ' + Math.round(this.player.x) + ' · ' + Math.round(this.player.y);
      this.lastPositionUpdate = this.time.now;
    }
    this.checkInteract();
  }

  private createPlayer(x: number, y: number, accent: number): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 18, 54, 20, 0x070605, 0.56);
    const glow = this.add.circle(0, 0, 35, 0xa6e2b1, 0.16).setStrokeStyle(3, 0xffe6b5, 0.95);
    const body = this.add.rectangle(0, 8, 30, 38, accent).setStrokeStyle(3, 0xf9e5c5);
    const belt = this.add.rectangle(0, 15, 27, 5, 0x25170f);
    const head = this.add.circle(0, -18, 15, 0xf1c39b).setStrokeStyle(3, 0x3d291b);
    const hair = this.add.arc(0, -23, 15, 190, 350, false, 0x38231b).setStrokeStyle(5, 0x38231b);
    const face = this.add.text(0, -18, '• •', { fontFamily: 'monospace', fontSize: '11px', color: '#2e2118', fontStyle: 'bold' }).setOrigin(0.5);
    const tag = this.add.text(0, -58, '▼ TOI', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
      backgroundColor: '#24563e', padding: { x: 8, y: 4 }, stroke: '#102015', strokeThickness: 3,
    }).setOrigin(0.5);
    const player = this.add.container(x, y, [shadow, glow, body, belt, head, hair, face, tag]);
    player.setDepth(y);
    this.tweens.add({ targets: tag, y: -63, duration: 480, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return player;
  }

  private drawConveyor(accent: number, belt: number): void {
    this.add.rectangle(600, 475, 700, 62, 0x100e0c).setStrokeStyle(3, accent, 0.7);
    this.add.rectangle(600, 475, 684, 48, belt).setStrokeStyle(1, 0xffffff, 0.15);
    const stripes = this.add.graphics();
    stripes.lineStyle(3, 0xe4d1b2, 0.25);
    for (let x = 260; x < 940; x += 28) stripes.lineBetween(x, 454, x - 7, 496);
    this.add.text(420, 506, 'CONVOYEUR AUTOMATIQUE', {
      fontFamily: 'monospace', fontSize: '11px', color: '#e5d1b3', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(2);
  }

  private drawCollector(accent: number): void {
    const collector = this.add.container(1000, 470);
    collector.add(this.add.rectangle(0, 8, 112, 105, 0x12100e).setStrokeStyle(3, accent));
    collector.add(this.add.rectangle(0, -12, 90, 45, accent, 0.9));
    collector.add(this.add.rectangle(0, -12, 65, 22, 0x211811).setStrokeStyle(2, 0xf7e0b1));
    collector.add(this.add.text(0, -12, 'COOKIE', {fontFamily:'monospace',fontSize:'10px',fontStyle:'bold',color:'#fff0d9'}).setOrigin(0.5));
    collector.add(this.add.text(0, 34, 'COLLECTEUR', {fontFamily:'monospace',fontSize:'10px',color:'#f3d7a6'}).setOrigin(0.5));
    collector.setDepth(5);
    this.collectorLabel = this.add.text(1000, 410, '0 / s', {
      fontFamily: 'monospace', fontSize: '12px', color: '#fff0d9', backgroundColor: '#15100c', padding: {x:6,y:4},
    }).setOrigin(0.5).setDepth(6);
  }

  private drawPortal(accent: number): void {
    const portal = this.add.container(1000, 190);
    portal.add(this.add.ellipse(0, 0, 102, 112, 0x08090c, 0.8));
    portal.add(this.add.ellipse(0, 0, 82, 100, accent, 0.3).setStrokeStyle(6, accent));
    portal.add(this.add.ellipse(0, 0, 52, 75, 0x11101a, 0.8).setStrokeStyle(2, 0xffffff, 0.55));
    portal.add(this.add.text(0, 72, 'PORTAIL', {fontFamily:'monospace',fontSize:'12px',color:'#fff0d9',fontStyle:'bold'}).setOrigin(0.5));
    portal.setDepth(4);
  }

  private drawStairs(accent: number): void {
    const stairs = this.add.graphics();
    stairs.fillStyle(0x15110e, 1);
    stairs.fillRoundedRect(990, 575, 95, 74, 8);
    stairs.lineStyle(3, accent, 0.85);
    for (let y = 584; y <= 639; y += 11) stairs.lineBetween(1002, y, 1073, y);
    this.add.text(1037, 659, 'ESCALIERS · E', {fontFamily:'monospace',fontSize:'10px',color:'#fff0d9'}).setOrigin(0.5).setDepth(4);
  }

  private drawFloorDecoration(accent: number): void {
    const props = this.add.graphics();
    props.fillStyle(0x100e0c, 0.75);
    props.fillRoundedRect(115, 190, 75, 310, 8);
    props.lineStyle(2, accent, 0.65);
    props.strokeRoundedRect(115, 190, 75, 310, 8);
    this.add.text(152, 345, 'F\nA\nB', {fontFamily:'monospace',fontSize:'15px',color:'#ffffff',align:'center'}).setOrigin(0.5).setDepth(3);
    this.add.text(140, 525, 'USINE', {fontFamily:'monospace',fontSize:'10px',color:'#c9b59b'}).setDepth(3);
  }

  refreshMachines(): void {
    this.machineObjects.forEach((object) => object.destroy());
    this.machineObjects = [];
    const worldMachines = state.machines[state.currentWorld];
    for (const machine of MACHINES.filter((item) => item.floor === state.currentFloor)) {
      const owned = worldMachines[machine.id];
      const world = getWorld(state.currentWorld);
      const x = machine.x;
      const y = 292;
      const g = this.add.graphics();
      g.fillStyle(0x100e0c, 0.8);
      g.fillRoundedRect(x - 76, y - 54, 152, 118, 10);
      g.lineStyle(2, owned > 0 ? world.accent : 0x74634f, owned > 0 ? 0.9 : 0.4);
      g.strokeRoundedRect(x - 76, y - 54, 152, 118, 10);
      this.machineObjects.push(g);
      const frame = this.add.rectangle(x, y - 12, 88, 55, owned > 0 ? world.belt : 0x40372d)
        .setStrokeStyle(3, owned > 0 ? world.accent : 0x7a6855, 0.9);
      const mouth = this.add.rectangle(x, y - 3, 38, 25, 0x1a120d).setStrokeStyle(2, 0xdda666);
      const heat = this.add.circle(x, y - 5, 7, owned > 0 ? 0xffb03e : 0x5f574b);
      const title = this.add.text(x, y + 28, machine.name.toUpperCase(), {
        fontFamily:'monospace',fontSize:'9px',color:'#fff0d9',align:'center',wordWrap:{width:140},
      }).setOrigin(0.5);
      const count = this.add.text(x, y - 65, owned > 0 ? 'x' + owned : 'À CONSTRUIRE', {
        fontFamily:'monospace',fontSize:'10px',color: owned > 0 ? '#a8e5a4' : '#b7a38d',backgroundColor:'#17110c',padding:{x:5,y:3},
      }).setOrigin(0.5);
      for (const object of [frame, mouth, heat, title, count]) {
        object.setDepth(6);
        this.machineObjects.push(object);
      }
      if (owned > 0) {
        const glow = this.add.circle(x, y - 5, 14, world.accent, 0.1);
        glow.setDepth(5);
        this.machineObjects.push(glow);
        this.tweens.add({targets:heat,alpha:0.4,scale:0.75,duration:550,yoyo:true,repeat:-1});
      }
    }
    if (this.collectorLabel) {
      this.collectorLabel.setText(format(productionPerSecond(state)) + ' / s');
    }
  }

  private makePacket(x: number, y: number, accent: number): Phaser.GameObjects.Container {
    const crumbs = [
      this.add.circle(0, 0, 10, 0xb96b37).setStrokeStyle(2, accent),
      this.add.circle(-3, -3, 2, 0x3b2014),
      this.add.circle(4, 1, 2, 0x3b2014),
    ];
    const packet = this.add.container(x, y, crumbs).setDepth(15);
    this.packets.add(packet);
    return packet;
  }

  private spawnCookiePacket(): void {
    if (!this.scene.isActive()) return;
    const active = MACHINES.filter((machine) => {
      return machine.floor === state.currentFloor && state.machines[state.currentWorld][machine.id] > 0;
    });
    if (active.length === 0) return;
    const machine = active[Phaser.Math.Between(0, active.length - 1)]!;
    const sourceX = machine.x;
    const world = getWorld(state.currentWorld);
    const packet = this.makePacket(sourceX, 370, world.accent);
    this.tweens.chain({
      targets: packet,
      tweens: [
        { x: sourceX, y: 475, duration: 180, ease: 'Linear' },
        { x: 930, y: 475, duration: 720, ease: 'Linear' },
        {
          x: 984, y: 475, duration: 150, ease: 'Linear',
          onComplete: () => {
            packet.destroy();
            this.packets.delete(packet);
            if (this.collectorLabel?.active) {
              this.tweens.add({ targets: this.collectorLabel, scale: 1.08, duration: 90, yoyo: true });
            }
          },
        },
      ],
    });
  }

  requestInteract(): void {
    this.interactRequested = true;
  }

  private checkInteract(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    const pressed = Phaser.Input.Keyboard.JustDown(this.keys.E) || this.interactRequested;
    this.interactRequested = false;
    if (!pressed) return;
    const playerX = this.player.x;
    const playerY = this.player.y;
    if (Phaser.Math.Distance.Between(playerX, playerY, 1037, 612) < 105) {
      const nextFloor = (state.currentFloor + 1) % 3;
      changeFloor(nextFloor);
      setStatus('Tu arrives à l’étage ' + (nextFloor + 1) + '.');
      return;
    }
    if (Phaser.Math.Distance.Between(playerX, playerY, 1000, 190) < 110) {
      const nextWorld = WORLDS.find((world) =>
        world.unlockRebirths > 0 && world.unlockRebirths > getWorld(state.currentWorld).unlockRebirths &&
        state.unlockedWorlds.includes(world.id),
      );
      if (nextWorld) changeWorld(nextWorld.id);
      else {
        const nextLocked = WORLDS.find((world) => !state.unlockedWorlds.includes(world.id));
        if (nextLocked) setStatus('Rebirth ' + nextLocked.unlockRebirths + ' requis pour ' + nextLocked.name + '.');
        else changeWorld('cookie-valley');
      }
      return;
    }
    const nearby = MACHINES.filter((machine) => machine.floor === state.currentFloor)
      .map((machine) => ({ machine, distance: Phaser.Math.Distance.Between(playerX, playerY, machine.x, 292) }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (nearby && nearby.distance < 110) {
      buyMachineById(nearby.machine.id);
    } else {
      setStatus('Approche-toi d’une machine, des escaliers ou du portail.');
    }
  }

  pulsePlayer(): void {
    if (!this.player?.active) return;
    this.tweens.add({targets:this.player,scale:0.92,duration:60,yoyo:true,ease:'Quad.easeOut'});
  }

  loadWorld(): void {
    this.scene.restart();
  }

  loadFloor(): void {
    this.scene.restart();
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-canvas',
  width: 960,
  height: 540,
  backgroundColor: '#19140f',
  render: { antialias: true, pixelArt: false },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TycoonScene],
});

function animationTick(now: number): void {
  const elapsed = Math.min(1, Math.max(0, (now - previousFrame) / 1000));
  previousFrame = now;
  if (goldenDeadline === 0 && now >= goldenReadyAt && now >= goldenBoostUntil) {
    goldenDeadline = now + 12_000;
    goldenReadyAt = Number.POSITIVE_INFINITY;
    setStatus('Un cookie doré est apparu ! Réclame-le avant qu’il disparaisse.');
  } else if (goldenDeadline > 0 && now >= goldenDeadline) {
    goldenDeadline = 0;
    goldenReadyAt = now + 45_000 + Math.random() * 25_000;
    setStatus('Le cookie doré a disparu. Un autre arrivera bientôt.');
  }
  renderGoldenCookie(now);
  const boostMultiplier = now < goldenBoostUntil ? 2 : 1;
  const production = productionPerSecond(state) * boostMultiplier;
  if (production > 0 && elapsed > 0) {
    state = addCrumbs(state, production * elapsed);
  }
  saveTimer += elapsed;
  renderTimer += elapsed;
  if (saveTimer >= 8) {
    save();
    saveTimer = 0;
  }
  if (renderTimer >= 0.12) {
    render();
    renderTimer = 0;
  }
  requestAnimationFrame(animationTick);
}
render();
requestAnimationFrame(animationTick);
