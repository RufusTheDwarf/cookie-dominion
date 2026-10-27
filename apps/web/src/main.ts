import Phaser from 'phaser';
import {
  addCrumbs,
  buyMachine,
  buyUpgrade,
  canClaimMission,
  canRebirth,
  canTotalRebirth,
  canCompleteCustomerOrder,
  claimMission,
  createInitialState,
  completeCustomerOrder,
  customerOrderCost,
  customerOrderReward,
  enterFloor,
  exportSaveFile,
  enterWorld,
  ESSENCE_PRESTIGE_VALUE,
  essenceMultiplier,
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
  performTotalRebirth,
  productionPerSecond,
  rebirthCost,
  rebirthMultiplier,
  totalRebirthRequiredLevel,
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
      <div class="brand"><div class="brand-symbol"><span></span><i></i></div><div class="brand-copy"><div class="eyebrow">MAISON DES ESSENCES · TYCOON</div><h1>PARFUM<span> EMPIRE</span></h1><p class="subtitle">Compose. Produis. Deviens une légende du parfum.</p></div></div>
      <div class="header-stats">
        <div class="currency-display"><span>VENTES</span><strong id="crumb-total">0</strong><small>PARFUMS</small></div>
        <div class="hud-stat"><span>PRODUCTION</span><strong id="production">0 <small>/ s</small></strong></div>
        <div class="hud-stat"><span>MULTIPLICATEUR</span><strong id="multiplier">x1</strong></div>
        <div class="hud-stat"><span>REBIRTHS</span><strong id="rebirth-count">0</strong></div>
        <div class="hud-stat essence-stat"><span>ESSENCES</span><strong id="essence-total">0</strong></div>
        <div class="hud-stat empire-value-stat"><span>VALEUR EMPIRE</span><strong id="empire-value">0</strong></div>
        <div class="hud-stat"><span>ASCENSIONS</span><strong id="total-rebirth-count">0</strong></div>
        <div class="world-save"><strong id="world-name">Jardin de Verre</strong><small id="save-state">SAUVEGARDE LOCALE</small></div>
      </div>
    </header>
    <details class="utility-drawer">
      <summary>⚙ Options et sauvegarde</summary>
      <section class="panel save-toolbar">
      <div class="save-toolbar-heading"><div><div class="eyebrow">DONNÉES DE LA PARTIE</div><strong>SAUVEGARDE / CHARGEMENT</strong><small>Export JSON, import d'une autre sauvegarde ou effacement complet.</small></div></div>
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
    </details>
    <section class="dashboard">
      <aside class="panel stats-panel">
        <div class="owner-card">
          <div class="owner-avatar"><span class="avatar-hair"></span><span class="avatar-face">• •</span><span class="avatar-scarf"></span></div>
          <div><div class="eyebrow">TON ATELIER</div><h2>JEUNE PARFUMEUR</h2><small id="owner-rank">Maison indépendante · Rang 1</small></div>
        </div>
        <div class="manual-production">
          <div class="manual-label"><span>CRÉATION MANUELLE</span><strong>+<b id="manual-value">10</b> parfums</strong></div>
          <button class="primary" id="bake-button"><span class="spray-icon">✦</span><span>CRÉER UN PARFUM</span><span class="button-value">+10</span></button>
          <small>Chaque flacon vendu finance la prochaine machine.</small>
        </div>
        <section class="customer-order-card">
          <div class="order-heading"><span class="eyebrow">CLIENT VIP</span><span class="order-count">LIVRAISONS <strong id="orders-completed">0</strong></span></div>
          <h2>Commande spéciale</h2>
          <p id="customer-order-status">Approche-toi du client VIP puis appuie sur E pour livrer.</p>
          <div class="order-numbers">
            <span>COÛT <strong id="customer-order-cost">50 parfums</strong></span>
            <span>PAIEMENT <strong id="customer-order-reward">+125</strong></span>
          </div>
          <small>Le prix et la récompense augmentent à chaque livraison.</small>
        </section>
        <button id="golden-cookie" class="golden-cookie-button" type="button" disabled>
          <span class="golden-cookie-icon">✦</span>
          <span class="golden-cookie-copy"><strong>FLACON MYTHIQUE</strong><small id="golden-cookie-status">Premier parfum rare dans 25 s</small></span>
          <span class="golden-cookie-mark">×2</span>
        </button>
        <div class="rule"></div>
        <section class="prestige-card basic-prestige">
          <div class="prestige-heading"><span class="eyebrow">PRESTIGE I</span><span class="prestige-pill">PERMANENT</span></div>
          <h2>REBIRTH</h2>
          <p class="prestige-desc">Repars de zéro côté machines pour obtenir un multiplicateur de ventes. Tes recherches restent acquises.</p>
          <div class="prestige-meta"><span>Gagné cette vie</span><strong id="run-earned">0 parfums</strong></div>
          <div class="rebirth-progress"><div id="rebirth-progress"></div></div>
          <p class="objective" id="rebirth-info">Produis suffisamment de parfums pour recommencer plus fort.</p>
          <button class="rebirth-button" id="rebirth-button" disabled><span>REBIRTH NORMAL</span><strong id="rebirth-cost">1 500</strong></button>
        </section>
        <section class="prestige-card total-prestige">
          <div class="prestige-heading"><span class="eyebrow">PRESTIGE II</span><span class="prestige-pill ultimate-pill">ENDGAME</span></div>
          <h2>ASCENSION TOTALE</h2>
          <div class="total-rebirth-level"><strong id="total-rebirth-level">REBIRTHS 0 / 10</strong><span id="essence-multiplier">ESSENCE ×1,00</span></div>
          <p class="prestige-desc" id="total-rebirth-info">Chaque Essence originelle vaut 1 000 000 points de valeur d’empire et apporte +75 % de rendement permanent.</p>
          <button class="total-rebirth-button" id="total-rebirth-button" type="button" disabled><span>TOUT SACRIFIER</span><strong id="total-rebirth-reward">+1 ESSENCE</strong></button>
        </section>
        <div class="rule"></div>
        <div class="rule"></div>
        <div class="eyebrow">PETITS OBJECTIFS</div>
        <h2>CONTRATS</h2>
        <p class="panel-intro">Chaque contrat finance la prochaine étape.</p>
        <div id="mission-list" class="mission-list"></div>
      </aside>
      <section class="panel map-panel">
        <div class="panel-heading"><div><div class="eyebrow">LA MANUFACTURE · VUE LIBRE</div><h2 id="floor-title">ÉTAGE 1 — ATELIER</h2></div><div class="live-dot">EN DIRECT</div></div>
        <div class="map-toolbar"><div><strong id="world-tagline">JARDIN DE VERRE</strong><small>Déplace-toi et interagis directement avec les machines.</small></div><span id="player-position">Position : …</span></div>
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
        <div class="map-legend"><span><i class="legend-cookie"></i> Flacons en transit</span><span><i class="legend-player"></i> Toi</span><span id="map-hint">WASD / clic · E pour agir</span></div>
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
        <div class="shop-header"><div><div class="eyebrow">BOUTIQUE DE LA MAISON</div><h2>AMÉLIORATIONS</h2></div><span class="shop-level">LABO<br>LV.01</span></div>
        <p class="panel-intro">Investis dans la formulation, le rendement et les coûts.</p>
        <div id="upgrade-list" class="upgrade-list"></div>
        <div class="rule"></div>
        <div class="shop-section-title"><span class="eyebrow">PRODUCTION</span><h2>ÉQUIPEMENTS</h2></div>
        <p class="panel-intro">Installe tes machines dans l'atelier. Les flacons vendus génèrent des revenus automatiquement.</p>
        <div class="machine-list" id="machine-list"></div>
        <div class="rule"></div>
        <div class="factory-tip"><span>✦</span><div><strong>NOTE DU MAÎTRE PARFUMEUR</strong><small>Une chaîne complète vaut mieux qu'une seule machine de luxe. Monte étage après étage.</small></div></div>
      </aside>
    </section>
    <footer><span>PARFUM EMPIRE · MAISON DES ESSENCES</span><span>PROGRESSION LOCALE · SAUVEGARDE AUTOMATIQUE</span></footer>
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
    setStatus('Import refusé : ce texte ne contient pas une sauvegarde Parfum Empire valide.');
    return false;
  }
  state = imported;
  machineUiKey = '';
  worldUiKey = '';
  upgradeUiKey = '';
  missionUiKey = '';
  render();
  bakeryScene?.loadWorld();
  save();
  $<HTMLTextAreaElement>('save-data-text').value = '';
  setStatus('Sauvegarde chargée. La partie actuelle a été remplacée.');
  return true;
}

function eraseSave(): void {
  const accepted = window.confirm(
    'Effacer la partie de Parfum Empire sur cet appareil ? Toutes les machines, parfums, essences, rebirths et sauvegardes locales seront réinitialisés.',
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
  status.textContent = 'Prochain bonus dans ' + Math.max(0, Math.ceil((goldenReadyAt - now) / 1000)) + ' s · récupérés : ' + state.goldenCookiesClaimed;
}

function claimGoldenCookie(): void {
  const now = performance.now();
  if (goldenDeadline <= now) return;
  const reward = Math.max(50, productionPerSecond(state) * 10 + manualCookieValue(state) * 10);
  state = addCrumbs(state, reward);
  state = { ...state, goldenCookiesClaimed: state.goldenCookiesClaimed + 1 };
  goldenDeadline = 0;
  goldenBoostUntil = now + 20_000;
  goldenReadyAt = goldenBoostUntil + 45_000 + Math.random() * 25_000;
  goldenUiSecond = -1;
  render();
  renderGoldenCookie(now);
  save();
  bakeryScene?.pulsePlayer();
  setStatus('Flacon mythique récupéré : +' + format(reward) + ' parfums et ventes ×2 pendant 20 secondes.');
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
      : 'Pas assez de parfums pour cette amélioration.');
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
  if (mission) setStatus('Contrat terminé : +' + format(mission.reward) + ' parfums.');
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
  $('manual-value').textContent = format(manualCookieValue(state));
  $('orders-completed').textContent = format(state.ordersCompleted);
  $('customer-order-cost').textContent = format(customerOrderCost(state)) + ' parfums';
  $('customer-order-reward').textContent = '+' + format(customerOrderReward(state)) + ' parfums';
  $('customer-order-status').textContent = canCompleteCustomerOrder(state)
    ? 'Commande prête : rejoins le client sur la carte et appuie sur E pour livrer.'
    : 'Il manque ' + format(customerOrderCost(state) - state.crumbs) + ' parfums pour préparer cette commande.';
  const bakeValue = $('bake-button').querySelector('.button-value');
  if (bakeValue) bakeValue.textContent = '+' + format(manualCookieValue(state));
  $('world-name').textContent = world.name;
  $('world-tagline').textContent = world.tagline.toUpperCase();
  $('essence-total').textContent = format(state.essences);
  $('empire-value').textContent = format(state.lifetimeCrumbs + state.essences * ESSENCE_PRESTIGE_VALUE);
  $('total-rebirth-count').textContent = String(state.totalRebirths);
  $('owner-rank').textContent = 'Maison indépendante · Rang ' + (1 + state.rebirths + state.totalRebirths * 10);
  $('floor-title').textContent = ['ÉTAGE 1 — FORMULATION', 'ÉTAGE 2 — EMBOUTEILLAGE', 'ÉTAGE 3 — EXTRACTION'][state.currentFloor] ?? 'ATELIER';
  $('rebirth-cost').textContent = format(rebirthCost(state.rebirths));
  $('rebirth-button').toggleAttribute('disabled', !canRebirth(state));
  $('rebirth-progress').style.width = Math.min(100, state.runCrumbsEarned / rebirthCost(state.rebirths) * 100) + '%';
  $('rebirth-info').textContent = canRebirth(state)
    ? 'Prêt à recommencer : tes machines seront réinitialisées, mais tes recherches et ton bonus resteront.'
    : 'Encore ' + format(Math.max(0, rebirthCost(state.rebirths) - state.runCrumbsEarned)) + ' parfums gagnés avant le rebirth.';
  const totalRequired = totalRebirthRequiredLevel(state);
  $('total-rebirth-level').textContent = 'REBIRTHS ' + format(state.rebirths) + ' / ' + format(totalRequired);
  $('essence-multiplier').textContent = 'RENDEMENT ×' + format(essenceMultiplier(state));
  $('total-rebirth-reward').textContent = '+' + format(1 + state.totalRebirths) + ' ESSENCE' + (1 + state.totalRebirths > 1 ? 'S' : '');
  $('total-rebirth-button').toggleAttribute('disabled', !canTotalRebirth(state));
  $('total-rebirth-info').textContent = state.rebirths < totalRequired
    ? 'Atteins ' + totalRequired + ' rebirths normaux. Progression : ' + state.rebirths + ' / ' + totalRequired + '. Une Essence vaut 1 000 000 points de valeur d’empire et ajoute +75 % de rendement.'
    : canTotalRebirth(state)
      ? 'Ascension prête : tout sera effacé sauf tes Essences originelles et ton nombre d’ascensions. Tu recevras ' + (1 + state.totalRebirths) + ' essence(s).'
      : 'Chaque essence vaut 1 000 000 points de valeur d’empire et ajoute +75 % de rendement. Gagne encore ' + format(Math.max(0, rebirthCost(state.rebirths) - state.runCrumbsEarned)) + ' parfums avant l’ascension totale.';
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

function completeVipOrder(): void {
  const previous = state;
  const materialCost = customerOrderCost(state);
  const payout = customerOrderReward(state);
  state = completeCustomerOrder(state);
  if (state === previous) {
    setStatus('Le client attend sa commande. Il te manque ' + format(Math.max(0, materialCost - state.crumbs)) + ' parfums pour la préparer.');
    return;
  }
  render();
  save();
  bakeryScene?.pulsePlayer();
  setStatus('Commande VIP livrée ! +' + format(payout) + ' parfums bruts. Le client repasse bientôt.');
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
      : 'Pas assez de parfums pour cet équipement.');
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
    setStatus('Pas encore prêt pour le rebirth normal.');
    return;
  }
  state = next;
  render();
  bakeryScene?.loadWorld();
  setStatus('Rebirth normal ! Tes recherches restent acquises et tes ventes gagnent en puissance.');
  save();
}

function doTotalRebirth(): void {
  if (!canTotalRebirth(state)) {
    setStatus('Il faut atteindre le niveau requis et terminer le run avant l’ascension.');
    return;
  }
  const reward = 1 + state.totalRebirths;
  const accepted = window.confirm(
    'ASCENSION TOTALE\n\nCette action efface les parfums, les machines, les mondes débloqués, les recherches et les contrats. Tu recevras ' +
    reward + ' Essence(s) originelle(s), conservées après le reset. Chaque essence augmente durablement la production de 75 %.\n\nContinuer ?',
  );
  if (!accepted) return;
  state = performTotalRebirth(state);
  machineUiKey = '';
  worldUiKey = '';
  upgradeUiKey = '';
  missionUiKey = '';
  activeMoveControls.clear();
  render();
  bakeryScene?.loadWorld();
  save();
  setStatus('Ascension totale réussie. Nouvelle maison, nouvelles essences, nouveau départ.');
}

$('bake-button').addEventListener('click', bake);
$('rebirth-button').addEventListener('click', doRebirth);
$('total-rebirth-button').addEventListener('click', doTotalRebirth);
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
    this.drawCharacters(world.accent);
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
    const shadow = this.add.ellipse(0, 33, 49, 15, 0x31523a, 0.25);
    const glow = this.add.ellipse(0, 1, 45, 62, 0xfff5cb, 0.26).setStrokeStyle(2, 0xffffff, 0.7);
    const legLeft = this.add.rectangle(-8, 27, 11, 25, 0x34435a).setStrokeStyle(2, 0x223747);
    const legRight = this.add.rectangle(8, 27, 11, 25, 0x34435a).setStrokeStyle(2, 0x223747);
    const shoeLeft = this.add.rectangle(-8, 40, 16, 8, 0x27372e).setStrokeStyle(2, 0xf8f4dd);
    const shoeRight = this.add.rectangle(8, 40, 16, 8, 0x27372e).setStrokeStyle(2, 0xf8f4dd);
    const body = this.add.rectangle(0, 3, 34, 36, 0xfff6e3).setStrokeStyle(2, 0x324c39);
    const apron = this.add.rectangle(0, 10, 25, 28, accent).setStrokeStyle(2, 0x31563d);
    const apronPocket = this.add.rectangle(0, 15, 12, 8, 0xffe99a).setStrokeStyle(1, 0x31563d);
    const strapLeft = this.add.rectangle(-9, -5, 4, 12, 0x4f6f4d);
    const strapRight = this.add.rectangle(9, -5, 4, 12, 0x4f6f4d);
    const armLeft = this.add.rectangle(-22, 5, 9, 23, 0xf4c79f).setStrokeStyle(2, 0x6b5140);
    const armRight = this.add.rectangle(22, 5, 9, 23, 0xf4c79f).setStrokeStyle(2, 0x6b5140);
    const neck = this.add.rectangle(0, -17, 12, 9, 0xeab38c);
    const head = this.add.rectangle(0, -31, 27, 27, 0xf0bd91).setStrokeStyle(2, 0x5d4437);
    const hair = this.add.rectangle(0, -43, 30, 10, 0x49302a).setStrokeStyle(2, 0x302821);
    const hairLock = this.add.rectangle(-9, -36, 9, 13, 0x49302a).setStrokeStyle(1, 0x302821);
    const eyeLeft = this.add.rectangle(-6, -29, 3, 4, 0x243a2a);
    const eyeRight = this.add.rectangle(6, -29, 3, 4, 0x243a2a);
    const nose = this.add.rectangle(0, -24, 4, 3, 0xd99c75);
    const collar = this.add.rectangle(0, -14, 12, 5, 0xfffdf0).setStrokeStyle(1, 0x324c39);
    const miniBottle = this.add.rectangle(28, 5, 10, 15, 0x81d8c3).setStrokeStyle(2, 0x24543e);
    const bottleNeck = this.add.rectangle(28, -5, 5, 5, 0xffefb5).setStrokeStyle(1, 0x24543e);
    const bottleCap = this.add.rectangle(28, -9, 7, 4, 0xb88752).setStrokeStyle(1, 0x553d29);
    const bottleLabel = this.add.rectangle(28, 6, 6, 5, 0xfff0b8);
    const tag = this.add.text(0, -64, '▼ TOI · PARFUMEUR', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#183d29',
      backgroundColor: '#fff6bf', padding: { x: 7, y: 4 }, stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5);
    const player = this.add.container(x, y, [
      shadow, glow, legLeft, legRight, shoeLeft, shoeRight, body, apron, apronPocket,
      strapLeft, strapRight, armLeft, armRight, neck, head, hair, hairLock, eyeLeft,
      eyeRight, nose, collar, miniBottle, bottleNeck, bottleCap, bottleLabel, tag,
    ]);
    player.setDepth(y);
    this.tweens.add({ targets: tag, y: -68, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: glow, alpha: 0.16, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return player;
  }

  private createNpc(x: number, y: number, coatColor: number, hairColor: number, role: string, isClient: boolean): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 32, 45, 14, 0x31523a, 0.24);
    const legLeft = this.add.rectangle(-7, 25, 10, 22, 0x465065).setStrokeStyle(2, 0x2c3d43);
    const legRight = this.add.rectangle(7, 25, 10, 22, 0x465065).setStrokeStyle(2, 0x2c3d43);
    const shoeLeft = this.add.rectangle(-7, 37, 14, 7, 0xfff4dd).setStrokeStyle(2, 0x384b3a);
    const shoeRight = this.add.rectangle(7, 37, 14, 7, 0xfff4dd).setStrokeStyle(2, 0x384b3a);
    const torso = this.add.rectangle(0, 3, 32, 33, coatColor).setStrokeStyle(2, 0x304a36);
    const shirt = this.add.rectangle(0, 4, 9, 23, isClient ? 0xffe5ab : 0xfff7df);
    const head = this.add.rectangle(0, -27, 25, 25, isClient ? 0xd99e73 : 0xe9b789).setStrokeStyle(2, 0x5d4437);
    const hair = this.add.rectangle(0, -39, 28, 9, hairColor).setStrokeStyle(2, 0x41352b);
    const sideHair = this.add.rectangle(10, -32, 7, 12, hairColor);
    const eyeLeft = this.add.rectangle(-5, -26, 3, 4, 0x243a2a);
    const eyeRight = this.add.rectangle(5, -26, 3, 4, 0x243a2a);
    const mouth = this.add.rectangle(0, -20, 5, 2, 0x995b50);
    const neck = this.add.rectangle(0, -14, 9, 5, 0xe2aa81);
    const parts: Phaser.GameObjects.GameObject[] = [
      shadow, legLeft, legRight, shoeLeft, shoeRight, torso, shirt, neck, head, hair, sideHair, eyeLeft, eyeRight, mouth,
    ];
    if (isClient) {
      parts.push(
        this.add.rectangle(23, 10, 17, 21, 0xd8b77a).setStrokeStyle(2, 0x654c30),
        this.add.rectangle(23, 0, 9, 5, 0x8f6e40),
        this.add.rectangle(23, 10, 11, 10, 0xfff0c1),
      );
    } else {
      parts.push(
        this.add.rectangle(-16, 3, 7, 22, 0xe8b184).setStrokeStyle(1, 0x684b3c),
        this.add.rectangle(17, 3, 7, 22, 0xe8b184).setStrokeStyle(1, 0x684b3c),
        this.add.rectangle(17, 13, 9, 13, 0x7fd4c0).setStrokeStyle(2, 0x285740),
        this.add.rectangle(17, 4, 5, 4, 0xffe8a2),
      );
    }
    const nameTag = this.add.text(0, -59, role, {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '10px', fontStyle: 'bold',
      color: '#234632', backgroundColor: isClient ? '#ffe4a0' : '#dcf4dd',
      padding: { x: 6, y: 3 }, stroke: '#ffffff', strokeThickness: 2,
    }).setOrigin(0.5);
    parts.push(nameTag);
    const npc = this.add.container(x, y, parts);
    npc.setDepth(y);
    this.tweens.add({ targets: nameTag, y: -62, duration: 700 + x % 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return npc;
  }

  private drawCharacters(accent: number): void {
    this.createNpc(760, 360, 0x8a6fc1, 0x402c41, 'MILA · PARFUMEUSE', false);
    this.createNpc(680, 565, 0xffc96e, 0x8d4d37, 'CLIENT VIP', true);
    const orderRing = this.add.ellipse(680, 601, 68, 23, 0xffd84e, 0.18).setStrokeStyle(3, 0xc18a23, 0.82);
    orderRing.setDepth(564);
    this.tweens.add({ targets: orderRing, scaleX: 1.18, alpha: 0.45, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const orderBubble = this.add.text(680, 485, 'E  ·  LIVRER', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '11px', fontStyle: 'bold',
      color: '#3d351e', backgroundColor: '#ffe77c', padding: { x: 9, y: 6 },
      stroke: '#fffdf0', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(590);
    this.tweens.add({ targets: orderBubble, y: 480, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const display = this.add.container(330, 165);
    display.add(this.add.rectangle(0, 5, 135, 58, 0xf7f2d9).setStrokeStyle(2, accent));
    display.add(this.add.rectangle(0, -29, 139, 8, accent).setStrokeStyle(2, 0x31543c));
    for (let i = 0; i < 5; i += 1) {
      const x = -46 + i * 23;
      const hue = [0x7ed6c0, 0xdda6df, 0xffce7a, 0x9fc5f1, 0xf29eae][i]!;
      display.add(this.add.rectangle(x, -1, 12, 22, hue).setStrokeStyle(1, 0x39563f));
      display.add(this.add.rectangle(x, -16, 5, 5, 0xffefb7).setStrokeStyle(1, 0x39563f));
      display.add(this.add.rectangle(x, -21, 7, 4, 0x9b7248).setStrokeStyle(1, 0x584129));
    }
    display.add(this.add.text(0, 22, 'COLLECTION SIGNATURE', {fontFamily:'Trebuchet MS, sans-serif',fontSize:'9px',fontStyle:'bold',color:'#31543c'}).setOrigin(0.5));
    display.setDepth(2);
  }

  private drawConveyor(accent: number, belt: number): void {
    this.add.rectangle(600, 475, 710, 68, 0x3a684b).setStrokeStyle(3, 0x254b34);
    this.add.rectangle(600, 475, 690, 48, belt).setStrokeStyle(2, accent);
    const rails = this.add.graphics();
    rails.lineStyle(3, 0xfbf2d4, 0.8);
    rails.lineBetween(252, 451, 948, 451);
    rails.lineBetween(252, 499, 948, 499);
    const stripes = this.add.graphics();
    stripes.lineStyle(5, 0x34694a, 0.7);
    for (let x = 265; x < 940; x += 32) {
      stripes.lineBetween(x, 456, x + 12, 494);
    }
    this.add.text(600, 520, 'LIGNE D’EMBOUTEILLAGE', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '11px', color: '#2d5439',
      backgroundColor: '#f6efda', padding: { x: 8, y: 4 }, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2);
  }

  private drawCollector(accent: number): void {
    const collector = this.add.container(1000, 470);
    collector.add(this.add.rectangle(0, 7, 116, 104, 0xf8f1da).setStrokeStyle(3, 0x24452f));
    collector.add(this.add.rectangle(0, -18, 80, 36, accent).setStrokeStyle(3, 0x24452f));
    collector.add(this.add.rectangle(0, -25, 22, 11, 0xfff4d2).setStrokeStyle(2, 0x24452f));
    collector.add(this.add.rectangle(0, -38, 13, 7, 0xa9824f).setStrokeStyle(2, 0x24452f));
    collector.add(this.add.rectangle(0, -18, 53, 18, 0x9ce2cd).setStrokeStyle(2, 0x285540));
    collector.add(this.add.text(0, -18, 'PE', {fontFamily:'Trebuchet MS, sans-serif',fontSize:'11px',fontStyle:'bold',color:'#254732'}).setOrigin(0.5));
    collector.add(this.add.text(0, 28, 'VENTES', {fontFamily:'Trebuchet MS, sans-serif',fontSize:'11px',fontStyle:'bold',color:'#355b3b'}).setOrigin(0.5));
    collector.setDepth(5);
    this.collectorLabel = this.add.text(1000, 403, '0 / s', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '12px', fontStyle: 'bold',
      color: '#274831', backgroundColor: '#ffed9a', padding: {x:7,y:4}, stroke:'#ffffff',strokeThickness:2,
    }).setOrigin(0.5).setDepth(6);
  }

  private drawPortal(accent: number): void {
    const portal = this.add.container(1000, 190);
    portal.add(this.add.ellipse(0, 0, 104, 112, 0xfff4d8).setStrokeStyle(4, 0x24452f));
    portal.add(this.add.ellipse(0, 0, 82, 95, 0xbbead0).setStrokeStyle(7, accent));
    portal.add(this.add.ellipse(0, 0, 57, 70, 0xffd0e0).setStrokeStyle(3, 0xffffff));
    portal.add(this.add.rectangle(0, -4, 14, 38, 0xe6fff1).setStrokeStyle(2, accent));
    portal.add(this.add.rectangle(0, 9, 33, 18, 0x7d59b3).setStrokeStyle(2, 0x49376f));
    portal.add(this.add.text(0, 72, 'NOUVEAU MONDE', {fontFamily:'Trebuchet MS, sans-serif',fontSize:'10px',fontStyle:'bold',color:'#294a34',backgroundColor:'#fff7d9',padding:{x:5,y:3}}).setOrigin(0.5));
    portal.setDepth(4);
    this.tweens.add({targets:portal.list.slice(1,3),scaleX:1.08,duration:950,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  }

  private drawStairs(accent: number): void {
    const stairs = this.add.graphics();
    stairs.fillStyle(0xfff4d8, 1);
    stairs.fillRoundedRect(990, 575, 95, 74, 9);
    stairs.lineStyle(3, accent, 0.9);
    stairs.strokeRoundedRect(990, 575, 95, 74, 9);
    stairs.lineStyle(3, 0x6e9870, 0.9);
    for (let y = 584; y <= 639; y += 11) stairs.lineBetween(1002, y, 1073, y);
    this.add.text(1037, 660, 'ÉTAGES · E', {fontFamily:'Trebuchet MS, sans-serif',fontSize:'10px',fontStyle:'bold',color:'#2e5438',backgroundColor:'#fff4d8',padding:{x:4,y:2}}).setOrigin(0.5).setDepth(4);
  }

  private drawFloorDecoration(accent: number): void {
    const props = this.add.graphics();
    props.fillStyle(0xeff6dd, 1);
    props.fillRoundedRect(112, 185, 82, 315, 11);
    props.lineStyle(3, accent, 0.75);
    props.strokeRoundedRect(112, 185, 82, 315, 11);
    props.fillStyle(0x658f6b, 1);
    props.fillRoundedRect(120, 193, 66, 18, 5);
    this.add.text(153, 204, 'HERBIER', {fontFamily:'Trebuchet MS, sans-serif',fontSize:'8px',fontStyle:'bold',color:'#fff6dc'}).setOrigin(0.5);
    const leaves = this.add.graphics();
    const leafColors = [0x6bab78, 0x9bc878, 0x3d8a65];
    for (let i = 0; i < 8; i += 1) {
      const y = 234 + i * 27;
      leaves.fillStyle(leafColors[i % leafColors.length]!, 1);
      leaves.fillEllipse(142, y, 17, 9);
      leaves.fillEllipse(163, y + 6, 15, 8);
      leaves.lineStyle(1, 0x46774a, 0.8);
      leaves.lineBetween(137, y + 5, 171, y + 6);
    }
    this.add.text(153, 478, 'NOTES\nNATURELLES', {fontFamily:'Trebuchet MS, sans-serif',fontSize:'8px',fontStyle:'bold',color:'#466747',align:'center'}).setOrigin(0.5);
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
      g.fillStyle(0x668f70, 0.18);
      g.fillRoundedRect(x - 77, y - 48, 154, 112, 12);
      g.fillStyle(0xfffae6, 1);
      g.fillRoundedRect(x - 72, y - 55, 144, 111, 12);
      g.lineStyle(3, owned > 0 ? world.accent : 0x81967c, owned > 0 ? 1 : 0.75);
      g.strokeRoundedRect(x - 72, y - 55, 144, 111, 12);
      g.fillStyle(owned > 0 ? world.belt : 0xe4ebd9, 1);
      g.fillRoundedRect(x - 65, y - 47, 130, 18, 6);
      this.machineObjects.push(g);
      const frame = this.add.rectangle(x, y - 8, 78, 48, owned > 0 ? world.belt : 0xd8e2d0)
        .setStrokeStyle(3, owned > 0 ? world.accent : 0x849780, 0.95);
      const pipeTop = this.add.rectangle(x, y - 42, 13, 12, 0xd3ad72).setStrokeStyle(2, 0x6c5638);
      const pipeNeck = this.add.rectangle(x, y - 31, 7, 11, 0x91cfc0).setStrokeStyle(1, 0x315b48);
      const liquid = this.add.rectangle(x, y - 3, 29, 22, owned > 0 ? 0x79d5be : 0xb8c9bb).setStrokeStyle(2, 0x3e7657);
      const label = this.add.rectangle(x, y - 3, 22, 10, 0xfff0b7);
      const sideBottleLeft = this.add.rectangle(x - 28, y - 9, 11, 23, 0xc8a0dd).setStrokeStyle(1, 0x614779);
      const sideBottleRight = this.add.rectangle(x + 28, y - 9, 11, 23, 0x9ccbf0).setStrokeStyle(1, 0x43617d);
      const heat = this.add.circle(x, y - 3, 5, owned > 0 ? 0xffd45b : 0x9aa99a);
      const title = this.add.text(x, y + 29, machine.name.toUpperCase(), {
        fontFamily:'Trebuchet MS, sans-serif',fontSize:'9px',fontStyle:'bold',color:'#294833',align:'center',wordWrap:{width:138},
      }).setOrigin(0.5);
      const count = this.add.text(x, y - 65, owned > 0 ? '×' + owned + ' ACTIVES' : 'À DÉBLOQUER', {
        fontFamily:'Trebuchet MS, sans-serif',fontSize:'8px',fontStyle:'bold',color: owned > 0 ? '#fff8d8' : '#5b765b',
        backgroundColor: owned > 0 ? '#2f7c51' : '#e5edda',padding:{x:6,y:3},stroke:'#fffdf0',strokeThickness:1,
      }).setOrigin(0.5);
      for (const object of [frame, pipeTop, pipeNeck, liquid, label, sideBottleLeft, sideBottleRight, heat, title, count]) {
        object.setDepth(6);
        this.machineObjects.push(object);
      }
      if (owned > 0) {
        const glow = this.add.circle(x, y - 4, 30, world.accent, 0.12);
        glow.setDepth(5);
        this.machineObjects.push(glow);
        this.tweens.add({targets:heat,alpha:0.35,scale:1.35,duration:480,yoyo:true,repeat:-1});
        this.tweens.add({targets:liquid,scaleY:0.78,duration:700,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
      }
    }
    if (this.collectorLabel) {
      this.collectorLabel.setText(format(productionPerSecond(state)) + ' / s');
    }
  }

  private makePacket(x: number, y: number, accent: number): Phaser.GameObjects.Container {
    const glint = this.add.rectangle(-3, -1, 3, 10, 0xffffff, 0.82);
    const body = this.add.rectangle(0, 2, 16, 22, accent).setStrokeStyle(2, 0x31543c);
    const neck = this.add.rectangle(0, -11, 7, 5, 0xfff1b7).setStrokeStyle(1, 0x31543c);
    const cap = this.add.rectangle(0, -16, 9, 5, 0xb88a50).setStrokeStyle(1, 0x60482f);
    const label = this.add.rectangle(2, 4, 9, 8, 0xfff2c4).setStrokeStyle(1, 0x31543c);
    const initials = this.add.text(2, 4, 'P', {fontFamily:'Trebuchet MS, sans-serif',fontSize:'7px',fontStyle:'bold',color:'#31543c'}).setOrigin(0.5);
    const packet = this.add.container(x, y, [glint, body, neck, cap, label, initials]).setDepth(15);
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
    if (Phaser.Math.Distance.Between(playerX, playerY, 680, 565) < 92) {
      completeVipOrder();
      return;
    }
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
    setStatus('Un flacon mythique apparaît ! Récupère-le avant qu’il disparaisse.');
  } else if (goldenDeadline > 0 && now >= goldenDeadline) {
    goldenDeadline = 0;
    goldenReadyAt = now + 45_000 + Math.random() * 25_000;
    setStatus('Le flacon mythique a disparu. Un autre arrivera bientôt.');
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
