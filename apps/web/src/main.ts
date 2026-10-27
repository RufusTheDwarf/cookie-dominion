import Phaser from 'phaser';
import {
  addCrumbs,
  buyMachine,
  buyUpgrade,
  canClaimMission,
  canUnlockFloor,
  canRebirth,
  canTotalRebirth,
  canCompleteCustomerOrder,
  claimMission,
  createInitialState,
  completeCustomerOrder,
  customerOrderCost,
  customerOrderReward,
  enterFloor,
  floorUnlockCost,
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
  unlockFloor,
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
const DARK_MODE_KEY = 'parfum-empire-dark-mode-v1';
const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing app root');

app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand"><div class="brand-symbol"><span></span><i></i></div><div class="brand-copy"><div class="eyebrow">MAISON DES ESSENCES · TYCOON</div><h1>PARFUM<span> EMPIRE</span></h1><p class="subtitle">Compose. Produis. Deviens une légende du parfum.</p></div></div>
      <button id="open-menu-button" class="pause-menu-button" type="button" aria-label="Ouvrir le menu">MENU</button>
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
        <div class="eyebrow">PETITS OBJECTIFS</div>
        <h2>CONTRATS</h2>
        <p class="panel-intro">Chaque contrat finance la prochaine étape.</p>
        <div id="mission-list" class="mission-list"></div>
      </aside>
      <section class="panel map-panel">
        <div class="panel-heading"><div><div class="eyebrow">LA MANUFACTURE · VUE LIBRE</div><h2 id="floor-title">ÉTAGE 1 — ATELIER</h2></div><div class="live-dot">EN DIRECT</div></div>
        <div class="map-toolbar"><div><strong id="world-tagline">JARDIN DE VERRE</strong><small>Déplace-toi et interagis directement avec les machines.</small></div><span id="player-position">Position : …</span></div>
        <section id="tutorial-banner" class="tutorial-banner">
          <div class="tutorial-copy"><span id="tutorial-step-label" class="eyebrow">GUIDE DE DÉPART</span><strong id="tutorial-title">Construis ton premier accès</strong><p id="tutorial-text">Approche-toi du bouton jaune et appuie sur E.</p></div>
          <button id="tutorial-dismiss" type="button" aria-label="Masquer le tutoriel">×</button>
        </section>
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
            <button class="nav-button" data-floor="1" hidden disabled>02 · Escaliers</button>
            <button class="nav-button" data-floor="2" hidden disabled>03 · Laboratoire</button>
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
    <div id="main-menu" class="main-menu" role="dialog" aria-modal="true" aria-labelledby="menu-title">
      <div class="menu-card">
        <div class="menu-emblem" aria-hidden="true"><span>PE</span><i></i><b></b></div>
        <div class="eyebrow">MAISON DES ESSENCES · TYCOON 2D</div>
        <h1 id="menu-title">PARFUM <span>EMPIRE</span></h1>
        <p class="menu-subtitle">Pars d’un atelier vide. Construis ta maison de parfum, équipe tes lignes et développe ton empire.</p>
        <div class="menu-actions">
          <button id="menu-play" class="menu-primary">JOUER</button>
          <button id="menu-new-game" class="menu-secondary">NOUVELLE PARTIE</button>
          <button id="menu-load-save" class="menu-secondary">CHARGER / IMPORTER</button>
          <button id="menu-settings" class="menu-secondary">PARAMÈTRES</button>
        </div>
        <section id="menu-settings-panel" class="menu-subpanel" hidden>
          <h2>Paramètres</h2>
          <label class="theme-setting"><span><strong>Mode sombre</strong><small>Assombrit les panneaux et les menus.</small></span><input id="dark-mode-toggle" type="checkbox" /><span class="theme-switch" aria-hidden="true"></span></label>
          <button id="menu-settings-back" class="menu-tertiary">RETOUR</button>
        </section>
        <section id="menu-import-panel" class="menu-subpanel" hidden>
          <h2>Charger une partie</h2>
          <p>Importe un fichier JSON ou colle ici une sauvegarde exportée.</p>
          <button id="menu-import-file" class="menu-secondary">CHOISIR UN FICHIER JSON</button>
          <textarea id="menu-import-text" rows="4" spellcheck="false" placeholder="Colle les données de sauvegarde ici…"></textarea>
          <div class="menu-import-actions"><button id="menu-import-confirm" class="menu-primary">IMPORTER</button><button id="menu-import-back" class="menu-tertiary">RETOUR</button></div>
        </section>
        <small class="menu-footer">WASD / flèches pour bouger · E pour interagir · Sauvegarde locale</small>
      </div>
    </div>
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
let gameIsPaused = true;
let tutorialDismissed = false;
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

function applyDarkMode(enabled: boolean): void {
  document.documentElement.classList.toggle('theme-dark', enabled);
  const toggle = document.getElementById('dark-mode-toggle') as HTMLInputElement | null;
  if (toggle) toggle.checked = enabled;
  try { localStorage.setItem(DARK_MODE_KEY, String(enabled)); } catch { /* Theme preference is optional. */ }
}

try {
  applyDarkMode(localStorage.getItem(DARK_MODE_KEY) === 'true');
} catch {
  applyDarkMode(false);
}

function startGame(newGame = false): void {
  if (newGame) {
    const hasProgress = state.lifetimeCrumbs > 0 || state.rebirths > 0 || state.rampBuilt ||
      Object.values(state.machines).some((worldMachines) => Object.values(worldMachines).some((count) => count > 0));
    if (hasProgress && !window.confirm('Créer une nouvelle partie ? La progression actuelle sera remplacée. Pense à exporter ta sauvegarde avant de continuer.')) return;
    state = createInitialState();
    machineUiKey = '';
    worldUiKey = '';
    upgradeUiKey = '';
    missionUiKey = '';
    tutorialDismissed = false;
    render();
    bakeryScene?.loadWorld();
    save();
  }
  gameIsPaused = false;
  $('main-menu').classList.add('is-hidden');
  render();
  if (!state.rampBuilt) {
    setStatus('Bienvenue ! Déplace-toi vers le bouton jaune et appuie sur E pour construire la rampe.');
  } else {
    setStatus('Partie chargée. Reprends le développement de ta maison de parfum.');
  }
}

function showMenuPanel(panel: 'settings' | 'import' | null): void {
  $('menu-settings-panel').toggleAttribute('hidden', panel !== 'settings');
  $('menu-import-panel').toggleAttribute('hidden', panel !== 'import');
}

$('menu-play').textContent = state.rampBuilt || state.lifetimeCrumbs > 0 ? 'CONTINUER' : 'JOUER';
$('menu-play').addEventListener('click', () => startGame(false));
$('open-menu-button').addEventListener('click', () => {
  gameIsPaused = true;
  $('menu-play').textContent = 'REPRENDRE';
  showMenuPanel(null);
  $('main-menu').classList.remove('is-hidden');
});
$('menu-new-game').addEventListener('click', () => startGame(true));
$('menu-load-save').addEventListener('click', () => showMenuPanel('import'));
$('menu-settings').addEventListener('click', () => showMenuPanel('settings'));
$('menu-settings-back').addEventListener('click', () => showMenuPanel(null));
$('menu-import-back').addEventListener('click', () => showMenuPanel(null));
$('menu-import-file').addEventListener('click', () => $('import-file').click());
$('menu-import-confirm').addEventListener('click', () => {
  const raw = $<HTMLTextAreaElement>('menu-import-text').value;
  if (!raw.trim()) {
    setStatus('Colle d’abord les données de sauvegarde.');
    return;
  }
  if (window.confirm('Importer cette sauvegarde et remplacer la partie actuelle ?')) {
    if (loadSaveText(raw)) {
      $<HTMLTextAreaElement>('menu-import-text').value = '';
      startGame(false);
    }
  }
});
$('dark-mode-toggle').addEventListener('change', (event) => {
  applyDarkMode((event.currentTarget as HTMLInputElement).checked);
});

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
    state.unlockedFloors.join(','),
    ...MACHINES.map((machine) => [
      machine.id,
      state.machines[state.currentWorld][machine.id],
      machineCost(state, machine.id),
      state.crumbs >= machineCost(state, machine.id) ? 1 : 0,
    ].join(':')),
  ].join('|');
  if (signature === machineUiKey) return;
  machineUiKey = signature;
  $('machine-list').innerHTML = MACHINES.filter((machine) => state.unlockedFloors.includes(machine.floor)).map((machine) => {
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
  document.documentElement.classList.toggle('workshop-unbuilt', !state.rampBuilt);
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
    const unlocked = state.unlockedFloors.includes(floor);
    button.hidden = !unlocked;
    button.disabled = !unlocked;
    button.classList.toggle('is-active', floor === state.currentFloor);
    if (floor === 1) button.textContent = '02 · Atelier haut';
    if (floor === 2) button.textContent = '03 · Laboratoire';
  });
  renderUpgradeCards();
  renderMissionCards();
  renderMachineCards();
  renderWorldButtons();
  renderTutorial();}

function bake(): void {
  if (gameIsPaused || !state.rampBuilt) return;
  state = addCrumbs(state, manualCookieValue(state));
  render();
  bakeryScene?.pulsePlayer();
  saveSoon();
}

function completeVipOrder(): void {
  if (!state.rampBuilt) return;
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
  setStatus('Commande VIP livrée ! +' + format(payout) + ' parfums. La prochaine commande est disponible quand tu reviens voir le client.');
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
  const next = enterFloor(state, floor);
  if (next === state) {
    setStatus('Cet étage est encore fermé. Construis les escaliers depuis l’étage précédent.');
    return;
  }
  state = next;
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
  if (event.code === 'Escape' && !gameIsPaused) {
    gameIsPaused = true;
    $('menu-play').textContent = 'REPRENDRE';
    showMenuPanel(null);
    $('main-menu').classList.remove('is-hidden');
    return;
  }
  if (gameIsPaused) return;
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
  private exteriorWalls?: Phaser.GameObjects.Graphics;
  private constructionButtonObjects: Phaser.GameObjects.GameObject[] = [];
  private isBuildingRamp = false;
  private productionLayoutDrawn = false;
  private exteriorButtonObjects: Phaser.GameObjects.GameObject[] = [];
  private extensionObjects: Phaser.GameObjects.GameObject[] = [];
  private playerFaceParts?: { leftEye: Phaser.GameObjects.Ellipse; rightEye: Phaser.GameObjects.Ellipse; nose: Phaser.GameObjects.Ellipse; hairLock: Phaser.GameObjects.Ellipse };
  private playerLimbs?: { leftLeg: Phaser.GameObjects.Ellipse; rightLeg: Phaser.GameObjects.Ellipse; leftArm: Phaser.GameObjects.Ellipse; rightArm: Phaser.GameObjects.Ellipse };
  private facing: MoveDirection = 'down';
  private walkPhase = 0;
  private moveTarget: { x: number; y: number } | null = null;
  private interactRequested = false;
  private lastPositionUpdate = 0;

  constructor() {
    super('TycoonScene');
  }

  create(): void {
    bakeryScene = this;
    this.isBuildingRamp = false;
    this.productionLayoutDrawn = false;
    this.machineObjects = [];
    this.constructionButtonObjects = [];
    this.exteriorButtonObjects = [];
    this.extensionObjects = [];
    this.packets = new Set<Phaser.GameObjects.Container>();
    this.collectorLabel = undefined;
    const world = getWorld(state.currentWorld);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.add.rectangle(MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH, MAP_HEIGHT, world.background);
    const floor = this.add.graphics();
    floor.fillStyle(world.floorColor, 1);
    floor.fillRect(70, 70, 1060, 620);
    floor.lineStyle(2, 0x625842, 0.28);
    floor.strokeRect(70, 70, 1060, 620);
    // Quiet plank seams instead of a uniform tile grid; slight alternation keeps the room handmade.
    floor.lineStyle(1, 0x6a5b44, 0.16);
    for (let y = 116; y < 685; y += 48) {
      floor.lineBetween(72, y, 1128, y);
      const offset = (Math.floor(y / 48) % 2) * 45;
      for (let x = 115 + offset; x < 1120; x += 135) {
        floor.lineBetween(x, y - 48, x, y);
      }
    }
    floor.fillStyle(0x77674e, 0.05);
    for (let index = 0; index < 74; index += 1) {
      const x = 88 + ((index * 137) % 1010);
      const y = 88 + ((index * 79) % 580);
      floor.fillCircle(x, y, index % 3 === 0 ? 2 : 1);
    }
    this.exteriorWalls = this.add.graphics().setDepth(8);

    this.add.text(110, 105, world.name.toUpperCase() + ' / FLOOR 0' + (state.currentFloor + 1), {
      fontFamily: 'monospace', fontSize: '15px', color: '#' + world.accent.toString(16).padStart(6, '0'),
      letterSpacing: 2, fontStyle: 'bold',
    }).setDepth(3);

    if (state.rampBuilt) {
      this.drawBuiltRamp();
      this.drawFloorDecoration(world.accent);
      this.drawExteriorExtensions(world.accent);
      this.refreshMachines();
      if (state.unlockedWorlds.length > 1) this.drawPortal(world.accent);
      if (state.currentFloor < 2 && state.unlockedFloors.includes(state.currentFloor + 1)) this.drawStairs(world.accent);
    } else {
      this.drawRampBuildButton();
    }

    this.player = this.createPlayer(260, 390, world.accent);
    this.updateExteriorWalls();
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
      callback: () => this.spawnActiveProducts(),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.spawnEvent?.remove();
      this.packets.forEach((packet) => packet.destroy());
      this.packets.clear();
    });
  }

  update(_time: number, delta: number): void {
    if (gameIsPaused || !this.player?.active) return;
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
    const isWalking = vx !== 0 || vy !== 0;
    if (isWalking) {
      if (Math.abs(vx) > Math.abs(vy)) this.setFacing(vx < 0 ? 'left' : 'right');
      else this.setFacing(vy < 0 ? 'up' : 'down');
      this.walkPhase += delta * 0.018;
      if (this.playerLimbs) {
        const swing = Math.sin(this.walkPhase) * 0.34;
        this.playerLimbs.leftLeg.rotation = swing;
        this.playerLimbs.rightLeg.rotation = -swing;
        this.playerLimbs.leftArm.rotation = -swing * 0.7;
        this.playerLimbs.rightArm.rotation = swing * 0.7;
      }
    } else if (this.playerLimbs) {
      this.playerLimbs.leftLeg.rotation = 0;
      this.playerLimbs.rightLeg.rotation = 0;
      this.playerLimbs.leftArm.rotation = 0;
      this.playerLimbs.rightArm.rotation = 0;
    }
    this.player.x = Phaser.Math.Clamp(this.player.x + vx * speed * delta / 1000, 110, 1090);
    this.player.y = Phaser.Math.Clamp(this.player.y + vy * speed * delta / 1000, 115, 655);
    if (this.moveTarget && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y) < 8) {
      this.moveTarget = null;
    }
    this.player.setDepth(this.player.y);
    this.updateExteriorWalls();
    if (this.time.now - this.lastPositionUpdate > 120) {
      $('player-position').textContent = 'Position : ' + Math.round(this.player.x) + ' · ' + Math.round(this.player.y);
      this.lastPositionUpdate = this.time.now;
    }
    this.updateInteractionPrompt();
    this.checkInteract();
  }

  private createPlayer(x: number, y: number, accent: number): Phaser.GameObjects.Container {
    const ink = 0x413a30;
    const skin = 0xd9a77f;
    const shadow = this.add.ellipse(0, 33, 36, 10, 0x443c2c, 0.22);
    const legLeft = this.add.ellipse(-7, 24, 12, 26, 0x596454).setStrokeStyle(2, ink);
    const legRight = this.add.ellipse(7, 24, 12, 26, 0x596454).setStrokeStyle(2, ink);
    const shoeLeft = this.add.ellipse(-8, 37, 17, 9, 0x4a3a31).setStrokeStyle(2, ink);
    const shoeRight = this.add.ellipse(8, 37, 17, 9, 0x4a3a31).setStrokeStyle(2, ink);
    const body = this.add.ellipse(0, 2, 33, 40, 0xe6d5b4).setStrokeStyle(2, ink);
    const apron = this.add.ellipse(0, 10, 25, 29, accent).setStrokeStyle(2, ink);
    const apronBib = this.add.rectangle(0, -2, 16, 15, accent).setStrokeStyle(1, ink);
    const apronPocket = this.add.rectangle(0, 15, 11, 8, 0xd8b875).setStrokeStyle(1, ink);
    const strapLeft = this.add.line(-9, -7, 0, 0, 1, 13, 0x65523e).setLineWidth(3);
    const strapRight = this.add.line(9, -7, 0, 0, -1, 13, 0x65523e).setLineWidth(3);
    const armLeft = this.add.ellipse(-20, 5, 11, 23, skin).setStrokeStyle(2, ink);
    const armRight = this.add.ellipse(20, 5, 11, 23, skin).setStrokeStyle(2, ink);
    const cuffLeft = this.add.ellipse(-20, 15, 12, 8, 0xe4d2af).setStrokeStyle(1, ink);
    const cuffRight = this.add.ellipse(20, 15, 12, 8, 0xe4d2af).setStrokeStyle(1, ink);
    const neck = this.add.ellipse(0, -17, 11, 9, skin).setStrokeStyle(1, ink);
    const head = this.add.ellipse(0, -30, 28, 30, skin).setStrokeStyle(2, ink);
    const hair = this.add.ellipse(0, -42, 31, 14, 0x4c382c).setStrokeStyle(2, ink);
    const hairLock = this.add.ellipse(-10, -35, 10, 17, 0x4c382c).setStrokeStyle(1, ink);
    const hairCurl = this.add.ellipse(8, -41, 12, 8, 0x6c4a34).setStrokeStyle(1, ink);
    const browLeft = this.add.ellipse(-6, -32, 5, 2, 0x5a4232);
    const browRight = this.add.ellipse(6, -32, 5, 2, 0x5a4232);
    const eyeLeft = this.add.ellipse(-6, -28, 3, 4, ink);
    const eyeRight = this.add.ellipse(6, -28, 3, 4, ink);
    const cheekLeft = this.add.ellipse(-10, -24, 4, 2, 0xc8806b, 0.7);
    const cheekRight = this.add.ellipse(10, -24, 4, 2, 0xc8806b, 0.7);
    const nose = this.add.ellipse(0, -23, 3, 4, 0xc48664);
    const collar = this.add.ellipse(0, -14, 13, 6, 0xf3e7cf).setStrokeStyle(1, ink);
    const bottle = this.add.ellipse(27, 6, 11, 16, 0x739d8c).setStrokeStyle(2, ink);
    const bottleLabel = this.add.rectangle(27, 7, 7, 5, 0xe7d6a8).setStrokeStyle(1, ink);
    const bottleNeck = this.add.rectangle(27, -4, 5, 5, 0xd5bf8d).setStrokeStyle(1, ink);
    const bottleCap = this.add.rectangle(27, -8, 7, 4, 0x6d503b).setStrokeStyle(1, ink);
    this.playerFaceParts = { leftEye: eyeLeft, rightEye: eyeRight, nose, hairLock };
    this.playerLimbs = { leftLeg, rightLeg, leftArm, rightArm };
    const player = this.add.container(x, y, [
      shadow, legLeft, legRight, shoeLeft, shoeRight, body, apron, apronBib, apronPocket,
      strapLeft, strapRight, armLeft, armRight, cuffLeft, cuffRight, neck, head, hair, hairLock,
      hairCurl, browLeft, browRight, eyeLeft, eyeRight, cheekLeft, cheekRight, nose, collar,
      bottle, bottleLabel, bottleNeck, bottleCap,
    ]);
    player.setDepth(y);
    return player;
  }

  private createNpc(x: number, y: number, coatColor: number, hairColor: number, role: string, isClient: boolean): Phaser.GameObjects.Container {
    const ink = 0x433b30;
    const shadow = this.add.ellipse(0, 31, 34, 10, 0x40382c, 0.2);
    const legLeft = this.add.ellipse(-7, 24, 11, 22, 0x576454).setStrokeStyle(1.5, ink);
    const legRight = this.add.ellipse(7, 24, 11, 22, 0x576454).setStrokeStyle(1.5, ink);
    const shoeLeft = this.add.ellipse(-7, 36, 15, 7, 0x4a3b30).setStrokeStyle(1, ink);
    const shoeRight = this.add.ellipse(7, 36, 15, 7, 0x4a3b30).setStrokeStyle(1, ink);
    const torso = this.add.ellipse(0, 3, 31, 35, coatColor).setStrokeStyle(2, ink);
    const shirt = this.add.ellipse(0, 4, 10, 22, 0xe9ddc2).setStrokeStyle(1, ink);
    const armLeft = this.add.ellipse(-17, 5, 9, 20, isClient ? 0xd7a078 : 0xd2a27c).setStrokeStyle(1, ink);
    const armRight = this.add.ellipse(17, 5, 9, 20, isClient ? 0xd7a078 : 0xd2a27c).setStrokeStyle(1, ink);
    const neck = this.add.ellipse(0, -14, 9, 7, isClient ? 0xd7a078 : 0xe0b08a).setStrokeStyle(1, ink);
    const head = this.add.ellipse(0, -27, 25, 27, isClient ? 0xc99069 : 0xe0b08a).setStrokeStyle(2, ink);
    const hair = this.add.ellipse(0, -38, 28, 13, hairColor).setStrokeStyle(1.5, ink);
    const sideHair = this.add.ellipse(9, -31, 9, 15, hairColor).setStrokeStyle(1, ink);
    const fringe = this.add.ellipse(-5, -36, 12, 8, hairColor);
    const eyeLeft = this.add.ellipse(-5, -26, 2.5, 3.5, ink);
    const eyeRight = this.add.ellipse(5, -26, 2.5, 3.5, ink);
    const cheek = this.add.ellipse(isClient ? 8 : -8, -22, 4, 2, 0xc27f69, 0.7);
    const mouth = this.add.ellipse(0, -19, 4, 1.5, 0x8c5947);
    const parts: Phaser.GameObjects.GameObject[] = [
      shadow, legLeft, legRight, shoeLeft, shoeRight, torso, shirt, armLeft, armRight,
      neck, head, hair, sideHair, fringe, eyeLeft, eyeRight, cheek, mouth,
    ];
    if (isClient) {
      const parcel = this.add.rectangle(22, 9, 17, 20, 0xb99a68).setStrokeStyle(2, ink);
      const parcelTop = this.add.rectangle(22, -2, 8, 5, 0x7d6340).setStrokeStyle(1, ink);
      const parcelMark = this.add.rectangle(22, 9, 10, 8, 0xe9d9b7).setStrokeStyle(1, ink);
      parts.push(parcel, parcelTop, parcelMark);
    } else {
      const bottle = this.add.ellipse(19, 12, 10, 14, 0x718d76).setStrokeStyle(1.5, ink);
      const cap = this.add.rectangle(19, 3, 5, 4, 0xb58b4d).setStrokeStyle(1, ink);
      parts.push(bottle, cap);
    }
    const nameTag = this.add.text(0, -55, role, {
      fontFamily: 'Georgia, serif', fontSize: '10px', fontStyle: 'bold',
      color: '#36352a', backgroundColor: '#e8dec5',
      padding: { x: 5, y: 3 }, stroke: '#e8dec5', strokeThickness: 1,
    }).setOrigin(0.5);
    parts.push(nameTag);
    const npc = this.add.container(x, y, parts);
    npc.setDepth(y);
    return npc;
  }

  private drawCharacters(): void {
    this.createNpc(760, 360, 0x6c7960, 0x45362c, 'MILA · PARFUMEUSE', false);
    this.createNpc(680, 565, 0xa85e49, 0x644430, 'CLIENT VIP', true);

    const deliveryMat = this.add.graphics().setDepth(560);
    deliveryMat.fillStyle(0x6c765b, 0.22);
    deliveryMat.fillEllipse(680, 601, 67, 22);
    deliveryMat.lineStyle(1, 0x575e43, 0.65);
    deliveryMat.strokeEllipse(680, 601, 67, 22);
    this.add.text(680, 493, 'COMMANDE À LIVRER', {
      fontFamily: 'Georgia, serif', fontSize: '10px', fontStyle: 'bold',
      color: '#40392d', backgroundColor: '#e8dec5', padding: { x: 6, y: 4 },
    }).setOrigin(0.5).setDepth(590);

    const display = this.add.container(330, 165).setDepth(2);
    display.add(this.add.rectangle(0, 13, 137, 15, 0x7d6246).setStrokeStyle(2, 0x433b30));
    display.add(this.add.rectangle(0, -5, 135, 25, 0xb08b5f).setStrokeStyle(2, 0x433b30));
    display.add(this.add.rectangle(0, -18, 141, 5, 0x514637).setStrokeStyle(1, 0x433b30));
    const hues = [0x82937c, 0xb66c55, 0xc3a268, 0x777d84, 0x9d8666];
    for (let i = 0; i < 5; i += 1) {
      const x = -46 + i * 23;
      display.add(this.add.ellipse(x, -4, 13, 21, hues[i]!).setStrokeStyle(1, 0x453e32));
      display.add(this.add.rectangle(x, -18, 5, 5, 0xd7c198).setStrokeStyle(1, 0x453e32));
      display.add(this.add.rectangle(x, -22, 7, 4, 0x66503b).setStrokeStyle(1, 0x453e32));
      display.add(this.add.rectangle(x, -3, 8, 5, 0xe2d4b5).setStrokeStyle(1, 0x453e32));
    }
    display.add(this.add.text(0, 29, 'ÉCHANTILLONS', {fontFamily:'Georgia, serif',fontSize:'9px',fontStyle:'bold',color:'#3f3b30'}).setOrigin(0.5));
  }

  private drawConveyor(belt: number): void {
    const line = this.add.graphics().setDepth(2);
    line.fillStyle(0x5c4635, 1);
    line.fillRect(245, 447, 710, 57);
    line.lineStyle(2, 0x40382e, 1);
    line.strokeRect(245, 447, 710, 57);
    line.fillStyle(belt, 1);
    line.fillRect(252, 452, 696, 45);
    line.lineStyle(1, 0x523f30, 0.8);
    for (let x = 263; x < 945; x += 34) {
      line.lineBetween(x, 454, x + 5, 495);
    }
    line.lineStyle(2, 0xddd0ae, 0.9);
    line.lineBetween(250, 449, 950, 449);
    line.lineBetween(250, 500, 950, 500);
    for (let x = 260; x < 945; x += 58) {
      const roller = this.add.ellipse(x, 503, 8, 8, 0x796c54).setStrokeStyle(1, 0x40382e).setDepth(2);

    }
    const label = this.add.text(600, 526, 'LIGNE D’EMBOUTEILLAGE', {
      fontFamily: 'Georgia, serif', fontSize: '10px', color: '#45392e',
      backgroundColor: '#e8dec5', padding: { x: 7, y: 3 }, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2);
  }

  private drawCollector(accent: number): void {
    const ink = 0x40382e;
    const collector = this.add.container(1000, 470).setDepth(5);
    collector.add(this.add.ellipse(0, 53, 99, 12, 0x40382e, 0.16));
    collector.add(this.add.rectangle(0, 13, 105, 76, 0x8e7654).setStrokeStyle(2, ink));
    collector.add(this.add.rectangle(0, -15, 87, 21, accent).setStrokeStyle(2, ink));
    collector.add(this.add.rectangle(0, -26, 29, 6, 0xd7c39c).setStrokeStyle(1, ink));
    collector.add(this.add.rectangle(0, -35, 13, 9, 0xa8844f).setStrokeStyle(1, ink));
    collector.add(this.add.rectangle(0, 11, 60, 25, 0xddd0ae).setStrokeStyle(1, ink));
    collector.add(this.add.text(0, 11, 'VENTES', {fontFamily:'Georgia, serif',fontSize:'10px',fontStyle:'bold',color:'#40382e'}).setOrigin(0.5));
    this.collectorLabel = this.add.text(1000, 402, '0 / s', {
      fontFamily: 'Georgia, serif', fontSize: '12px', fontStyle: 'bold',
      color: '#40382e', backgroundColor: '#e8dec5', padding: {x:6,y:3},
    }).setOrigin(0.5).setDepth(6);
  }

  private drawPortal(accent: number): void {
    const portal = this.add.container(1000, 190).setDepth(4);
    portal.add(this.add.ellipse(0, 0, 94, 102, 0x9b997d).setStrokeStyle(3, 0x453e32));
    portal.add(this.add.ellipse(0, 0, 72, 83, 0x6f8270).setStrokeStyle(4, 0x453e32));
    portal.add(this.add.ellipse(0, 0, 48, 59, 0xd0c3a3).setStrokeStyle(2, accent));
    portal.add(this.add.ellipse(0, 0, 30, 40, 0x5e6955).setStrokeStyle(1, 0x453e32));
    portal.add(this.add.rectangle(0, 70, 98, 19, 0xe8dec5).setStrokeStyle(1, 0x453e32));
    portal.add(this.add.text(0, 70, 'PASSAGE', {fontFamily:'Georgia, serif',fontSize:'10px',fontStyle:'bold',color:'#40382e'}).setOrigin(0.5));
  }

  private drawStairs(accent: number): void {
    const stairs = this.add.graphics().setDepth(4);
    stairs.fillStyle(0x554334, 0.18);
    stairs.fillRect(988, 575, 100, 76);
    stairs.fillStyle(0x8b6c4a, 1);
    stairs.fillRect(990, 569, 96, 72);
    stairs.lineStyle(2, 0x40382e, 1);
    stairs.strokeRect(990, 569, 96, 72);
    stairs.fillStyle(0xc0a47a, 1);
    for (let y = 578; y <= 632; y += 11) {
      stairs.fillRect(998, y, 80, 5);
      stairs.lineStyle(1, 0x5e4835, 0.9);
      stairs.lineBetween(998, y + 5, 1078, y + 5);
    }
    this.add.text(1037, 660, 'ÉTAGES · E', {fontFamily:'Georgia, serif',fontSize:'10px',fontStyle:'bold',color:'#40382e',backgroundColor:'#e8dec5',padding:{x:5,y:3}}).setOrigin(0.5).setDepth(4);
  }

  private drawFloorDecoration(): void {
    const shelf = this.add.graphics().setDepth(2);
    shelf.fillStyle(0x8d6b49, 1);
    shelf.fillRect(113, 189, 80, 302);
    shelf.lineStyle(2, 0x453b2e, 1);
    shelf.strokeRect(113, 189, 80, 302);
    shelf.fillStyle(0xceb98d, 1);
    shelf.fillRect(120, 197, 66, 287);
    shelf.lineStyle(2, 0x8c6846, 1);
    shelf.lineBetween(121, 280, 185, 280);
    shelf.lineBetween(121, 363, 185, 363);
    shelf.lineBetween(121, 444, 185, 444);
    this.add.text(153, 207, 'HERBIER', {fontFamily:'Georgia, serif',fontSize:'9px',fontStyle:'bold',color:'#40382e'}).setOrigin(0.5).setDepth(3);
    const leaves = this.add.graphics().setDepth(3);
    const leafColors = [0x778b68, 0x9aa07a, 0x5c765a];
    for (let i = 0; i < 7; i += 1) {
      const y = 238 + i * 35;
      const x = 139 + (i % 2) * 13;
      leaves.lineStyle(2, 0x5b6346, 0.9);
      leaves.lineBetween(x + 7, y + 14, x + 6, y - 9);
      leaves.fillStyle(leafColors[i % leafColors.length]!, 1);
      leaves.fillEllipse(x, y, 12, 8);
      leaves.fillEllipse(x + 13, y - 4, 12, 8);
    }
    for (let i = 0; i < 4; i += 1) {
      const x = 135 + i * 14;
      this.add.ellipse(x, 315, 9, 20, [0x7e9180, 0xa96750, 0xc0a269, 0x657881][i]!).setStrokeStyle(1, 0x453b2e).setDepth(3);
      this.add.rectangle(x, 302, 4, 5, 0xc0a269).setStrokeStyle(1, 0x453b2e).setDepth(3);
      // Decorative shelf items are independent of the machine station lifecycle.
    }
    this.add.text(153, 470, 'NOTES\nNATURELLES', {fontFamily:'Georgia, serif',fontSize:'8px',fontStyle:'bold',color:'#554a38',align:'center'}).setOrigin(0.5).setDepth(3);
  }

  refreshMachines(): void {
    this.machineObjects.forEach((object) => {
      this.tweens.killTweensOf(object);
      object.destroy();
    });
    this.machineObjects = [];
    const worldMachines = state.machines[state.currentWorld];
    const world = getWorld(state.currentWorld);
    const ink = 0x443b30;

    const keep = (object: Phaser.GameObjects.GameObject) => {
      object.setDepth(5);
      this.machineObjects.push(object);
      return object;
    };

    for (const machine of MACHINES.filter((item) => item.floor === state.currentFloor)) {
      const owned = worldMachines[machine.id];
      const x = machine.x;
      const y = 292;
      const wood = this.add.graphics();
      wood.fillStyle(0x4e4132, 0.13);
      wood.fillEllipse(x, y + 49, 110, 12);
      wood.fillStyle(0x77573d, 1);
      wood.fillRect(x - 42, y + 19, 8, 36);
      wood.fillRect(x + 34, y + 19, 8, 36);
      wood.fillStyle(0x98744f, 1);
      wood.fillRect(x - 54, y + 7, 108, 16);
      wood.lineStyle(2, ink, 1);
      wood.strokeRect(x - 54, y + 7, 108, 16);
      wood.lineStyle(1, 0x5b4532, 0.65);
      wood.lineBetween(x - 49, y + 13, x + 49, y + 13);
      keep(wood);

      const blueprint = owned === 0;
      const stationParts: Phaser.GameObjects.GameObject[] = [];
      const fill = blueprint ? 0xc8bfa8 : world.belt;
      const detail = blueprint ? 0x9d9278 : 0x776548;
      const addEllipse = (px: number, py: number, w: number, h: number, color: number, stroke = ink) => {
        const object = this.add.ellipse(px, py, w, h, color).setStrokeStyle(2, stroke);
        stationParts.push(object);
        return object;
      };
      const addRect = (px: number, py: number, w: number, h: number, color: number, stroke = ink) => {
        const object = this.add.rectangle(px, py, w, h, color).setStrokeStyle(1.5, stroke);
        stationParts.push(object);
        return object;
      };

      if (machine.id === 'hand-mixer') {
        addEllipse(x, y - 12, 47, 28, fill);
        addEllipse(x, y - 13, 37, 18, owned ? 0x9ba083 : 0xd8cbb0, ink);
        addEllipse(x + 2, y - 14, 20, 8, owned ? 0x777d5d : 0xc8b99a, ink);
        addRect(x, y - 32, 4, 26, detail);
        addEllipse(x, y - 43, 10, 5, 0xb49b6a);
        addEllipse(x - 27, y - 6, 9, 15, 0x9b7256);
        addRect(x - 27, y - 18, 4, 5, 0xc4a674);
        addEllipse(x + 27, y - 7, 9, 15, 0x80927d);
        addRect(x + 27, y - 19, 4, 5, 0xc4a674);
      } else if (machine.id === 'brick-oven') {
        addEllipse(x, y - 10, 40, 47, blueprint ? 0xc7b69a : 0xb28058);
        addEllipse(x, y - 11, 27, 30, blueprint ? 0xd8cbb0 : 0x8e6345);
        addRect(x, y - 40, 12, 13, 0xc0a574);
        addRect(x, y - 48, 18, 5, 0x6d5039);
        addRect(x, y + 6, 22, 11, 0xddd0ad);
        addRect(x + 27, y - 2, 9, 22, 0x899681);
      } else if (machine.id === 'conveyor-oven') {
        for (let index = 0; index < 3; index += 1) {
          const bx = x - 25 + index * 25;
          addEllipse(bx, y - 10, 14, 24, index === 1 && owned ? 0x9b7154 : fill);
          addRect(bx, y - 26, 6, 7, 0xc1a371);
          addRect(bx, y - 32, 9, 4, 0x6b4f37);
          addRect(bx, y - 8, 7, 5, 0xe0d2af);
        }
        addRect(x, y - 40, 64, 5, detail);
      } else if (machine.id === 'frosting-lab') {
        addRect(x, y - 4, 60, 30, fill);
        addEllipse(x - 17, y - 20, 19, 28, 0x839482);
        addRect(x - 17, y - 39, 7, 10, 0xc4ab7c);
        addEllipse(x + 15, y - 19, 19, 30, 0xb77e58);
        addRect(x + 15, y - 39, 7, 10, 0xc4ab7c);
        addRect(x, y - 42, 7, 21, detail);
        addEllipse(x, y - 46, 15, 6, 0xc4ab7c);
      } else {
        addEllipse(x, y - 10, 39, 43, 0x6e7e76);
        addEllipse(x, y - 17, 26, 32, owned ? 0x78958a : 0xc9c0ab);
        addRect(x, y - 42, 12, 10, 0xb59a69);
        addEllipse(x, y - 47, 16, 7, 0xc9b98f);
        addRect(x - 26, y - 2, 9, 19, 0x9b7458);
        addRect(x + 26, y - 2, 9, 19, 0x9b7458);
      }
      stationParts.forEach((object) => keep(object));

      const title = this.add.text(x, y + 39, machine.name, {
        fontFamily: 'Georgia, serif', fontSize: '11px', fontStyle: 'bold',
        color: blueprint ? '#6d634e' : '#35392d', align: 'center', wordWrap: { width: 148 },
      }).setOrigin(0.5).setDepth(6);
      const status = this.add.text(x, y - 67, blueprint ? 'PLAN · ' + format(machineCost(state, machine.id)) : '×' + owned + ' EN SERVICE', {
        fontFamily: 'Georgia, serif', fontSize: '9px', fontStyle: 'bold',
        color: blueprint ? '#5f5948' : '#eee3c9',
        backgroundColor: blueprint ? '#e4d8bd' : '#4a5d45',
        padding: { x: 5, y: 3 },
      }).setOrigin(0.5).setDepth(6);
      this.machineObjects.push(title, status);

      if (owned > 0) {
        const steam = this.add.graphics().setDepth(4);
        steam.lineStyle(1.5, 0xe9ddc5, 0.7);
        steam.lineBetween(x - 8, y - 47, x - 12, y - 54);
        steam.lineBetween(x + 2, y - 48, x + 5, y - 57);
        this.machineObjects.push(steam);
      }
    }

    const activeOnFloor = MACHINES.filter((machine) =>
      machine.floor === state.currentFloor && worldMachines[machine.id] > 0,
    ).length;
    if (activeOnFloor > 0 && !this.productionLayoutDrawn) {
      this.drawConveyor(world.belt);
      this.drawCollector(world.accent);
      this.drawCharacters();
      this.productionLayoutDrawn = true;
    }
    if (this.collectorLabel) {
      this.collectorLabel.setText(format(productionPerSecond(state)) + ' / s');
    }
    this.constructionButtonObjects.forEach((object) => object.destroy());
    this.constructionButtonObjects = [];
    if (state.rampBuilt && state.currentFloor < 2 && !state.unlockedFloors.includes(state.currentFloor + 1)) {
      this.drawFloorBuildPad();
    }
    this.refreshExteriorBuildButtons();
  }

  private makePacket(x: number, y: number, accent: number): Phaser.GameObjects.Container {
    const ink = 0x453d31;
    const shadow = this.add.ellipse(0, 10, 18, 5, ink, 0.18);
    const body = this.add.ellipse(0, 2, 17, 22, accent).setStrokeStyle(1.5, ink);
    const glass = this.add.ellipse(-3, 0, 4, 13, 0xeee2c6, 0.5);
    const shoulder = this.add.ellipse(0, -8, 10, 5, accent).setStrokeStyle(1, ink);
    const neck = this.add.rectangle(0, -12, 6, 6, 0xc6ac7a).setStrokeStyle(1, ink);
    const cap = this.add.rectangle(0, -16, 8, 4, 0x6e5137).setStrokeStyle(1, ink);
    const label = this.add.rectangle(2, 3, 8, 6, 0xe9d9b8).setStrokeStyle(1, ink);
    const packet = this.add.container(x, y, [shadow, body, glass, shoulder, neck, cap, label]).setDepth(15);
    this.packets.add(packet);
    return packet;
  }

  private spawnActiveProducts(): void {
    if (!this.scene.isActive() || gameIsPaused || !state.rampBuilt || this.packets.size >= 24) return;
    const active = MACHINES.filter((machine) =>
      machine.floor === state.currentFloor && state.machines[state.currentWorld][machine.id] > 0,
    );
    const world = getWorld(state.currentWorld);
    for (const machine of active) {
      const count = Math.min(2, state.machines[state.currentWorld][machine.id]);
      for (let index = 0; index < count; index += 1) {
        this.time.delayedCall(index * 105, () => {
          if (this.scene.isActive() && this.packets.size < 24) this.spawnCookiePacket(machine, index, count, world.accent);
        });
      }
    }
  }

  private spawnCookiePacket(machine: (typeof MACHINES)[number], index: number, count: number, accent: number): void {
    const laneOffset = (index - (count - 1) / 2) * 12;
    const sourceX = machine.x + (index - (count - 1) / 2) * 13;
    const targetY = 475 + laneOffset;
    const packet = this.makePacket(sourceX, 352, accent);
    packet.setRotation((index % 2 ? -0.08 : 0.08));
    this.tweens.chain({
      targets: packet,
      tweens: [
        { x: sourceX, y: targetY, duration: 310, ease: 'Bounce.easeOut' },
        { x: 930, y: targetY, duration: Math.max(500, (930 - sourceX) * 1.1), ease: 'Linear' },
        {
          x: 984, y: 475, duration: 150, ease: 'Quad.easeIn',
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
    if (!state.rampBuilt) {
      if (this.isBuildingRamp) {
        setStatus('La rampe est en cours de construction…');
        return;
      }
      if (Phaser.Math.Distance.Between(playerX, playerY, 382, 566) < 92) {
        this.isBuildingRamp = true;
        setStatus('Les planches sont posées une par une…');
        this.animateRampConstruction();
      } else {
        setStatus('Approche-toi du bouton jaune près du bas de l’atelier, puis appuie sur E.');
      }
      return;
    }
    const buildPad = this.exteriorBuildPad();
    if (buildPad && Phaser.Math.Distance.Between(playerX, playerY, buildPad.x, buildPad.y) < 94) {
      this.buyExteriorBuild(buildPad.cost);
      return;
    }
    if (Phaser.Math.Distance.Between(playerX, playerY, 680, 565) < 92) {
      completeVipOrder();
      return;
    }
    if (state.currentFloor < 2 && Phaser.Math.Distance.Between(playerX, playerY, 1037, 612) < 105) {
      const nextFloor = state.currentFloor + 1;
      if (state.unlockedFloors.includes(nextFloor)) {
        changeFloor(nextFloor);
        setStatus('Tu montes à l’étage ' + (nextFloor + 1) + '.');
        return;
      }
      if (!this.floorBuildRequirementReached()) {
        setStatus(nextFloor === 1
          ? 'Installe deux équipements au rez-de-chaussée pour construire les escaliers.'
          : 'Installe au moins un équipement à l’étage 2 pour poursuivre la construction.');
        return;
      }
      const opened = unlockFloor(state, nextFloor);
      if (opened === state) {
        setStatus('Les escaliers coûtent ' + format(floorUnlockCost(nextFloor)) + ' parfums. Il t’en manque ' + format(Math.max(0, floorUnlockCost(nextFloor) - state.crumbs) + '.'));
        return;
      }
      state = opened;
      render();
      save();
      this.constructionButtonObjects.forEach((object) => object.destroy());
      this.constructionButtonObjects = [];
      this.drawStairs(getWorld(state.currentWorld).accent);
      setStatus('Escaliers construits ! Le nouvel étage est maintenant accessible.');
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

  private setFacing(direction: MoveDirection): void {
    if (this.facing === direction || !this.playerFaceParts) return;
    this.facing = direction;
    const { leftEye, rightEye, nose, hairLock } = this.playerFaceParts;
    const front = direction !== 'up';
    leftEye.setVisible(front);
    rightEye.setVisible(front);
    nose.setVisible(front);
    if (direction === 'left') {
      leftEye.setPosition(-10, -29);
      rightEye.setPosition(-3, -29);
      nose.setPosition(-13, -24);
      hairLock.setPosition(-11, -36);
    } else if (direction === 'right') {
      leftEye.setPosition(3, -29);
      rightEye.setPosition(10, -29);
      nose.setPosition(13, -24);
      hairLock.setPosition(11, -36);
    } else {
      leftEye.setPosition(-6, -29);
      rightEye.setPosition(6, -29);
      nose.setPosition(0, -24);
      hairLock.setPosition(-9, -36);
    }
  }

  private drawBuiltRamp(): void {
    const ramp = this.add.graphics().setDepth(1);
    ramp.fillStyle(0x51412f, 0.2);
    ramp.fillPoints([{x:196,y:575},{x:320,y:511},{x:359,y:530},{x:233,y:596}], true);
    ramp.fillStyle(0x8e6749, 1);
    ramp.fillPoints([{x:198,y:568},{x:320,y:507},{x:350,y:523},{x:226,y:585}], true);
    ramp.lineStyle(2, 0x4e3d2e, 0.95);
    ramp.lineBetween(198, 568, 226, 585);
    ramp.lineBetween(320, 507, 350, 523);
    for (let index = 0; index < 6; index += 1) {
      const x = 211 + index * 19;
      const y = 570 - index * 9;
      this.add.rectangle(x, y, 34, 11, index % 2 ? 0x98714e : 0x8e6749)
        .setStrokeStyle(2, 0x4e3d2e)
        .setRotation(-0.38)
        .setDepth(2);
    }
    ramp.lineStyle(1, 0xd7b58b, 0.55);
    ramp.lineBetween(205, 566, 324, 506);
  }

  private floorBuildRequirementReached(): boolean {
    const nextFloor = state.currentFloor + 1;
    if (nextFloor > 2) return false;
    const owned = MACHINES.filter((machine) => machine.floor === state.currentFloor)
      .reduce((sum, machine) => sum + state.machines[state.currentWorld][machine.id], 0);
    return owned >= (nextFloor === 1 ? 2 : 1);
  }

  private drawFloorBuildPad(): void {
    if (!this.floorBuildRequirementReached()) return;
    const floor = state.currentFloor + 1;
    const cost = floorUnlockCost(floor);
    const pad = this.add.container(1037, 612).setDepth(7);
    pad.add(this.add.ellipse(0, 12, 96, 25, 0x3e3428, 0.15));
    const plaque = this.add.graphics();
    plaque.fillStyle(0xd8c49d, 1);
    plaque.fillRect(-46, -19, 92, 40);
    plaque.lineStyle(2, 0x635341, 1);
    plaque.strokeRect(-46, -19, 92, 40);
    plaque.lineStyle(1, 0x9c7950, 1);
    plaque.lineBetween(-38, -10, 38, -10);
    pad.add(plaque);
    pad.add(this.add.text(0, -3, 'ESCALIERS', {fontFamily:'Georgia, serif',fontSize:'10px',fontStyle:'bold',color:'#493b2a'}).setOrigin(0.5));
    pad.add(this.add.text(0, 29, 'ÉTAGE ' + (floor + 1) + ' · ' + format(cost), {fontFamily:'Georgia, serif',fontSize:'10px',fontStyle:'bold',color:'#f3e5c8',backgroundColor:'#3d4b3b',padding:{x:7,y:4}}).setOrigin(0.5));
    pad.add(this.add.text(0, -43, 'E · CONSTRUIRE', {fontFamily:'Georgia, serif',fontSize:'10px',fontStyle:'bold',color:'#332d22',backgroundColor:'#e8dcc1',padding:{x:5,y:3}}).setOrigin(0.5));
    this.constructionButtonObjects.push(pad);
  }

  private drawRampBuildButton(): void {
    const pad = this.add.container(382, 566).setDepth(10);
    pad.add(this.add.ellipse(0, 19, 105, 19, 0x463a2b, 0.14));
    const sign = this.add.graphics();
    sign.fillStyle(0xd9c6a0, 1);
    sign.fillRect(-55, -20, 110, 40);
    sign.lineStyle(2, 0x514334, 1);
    sign.strokeRect(-55, -20, 110, 40);
    sign.lineStyle(1, 0x9f8258, 0.9);
    sign.lineBetween(-46, -11, 46, -11);
    pad.add(sign);
    pad.add(this.add.text(0, -4, 'CHANTIER 01', {fontFamily:'Georgia, serif',fontSize:'10px',fontStyle:'bold',color:'#45392b'}).setOrigin(0.5));
    pad.add(this.add.text(0, 9, 'E · MONTER LA RAMPE', {fontFamily:'Georgia, serif',fontSize:'8px',fontStyle:'bold',color:'#754535'}).setOrigin(0.5));
    this.constructionButtonObjects.push(pad);
    const instruction = this.add.text(382, 604, 'La première construction est gratuite', {
      fontFamily: 'Georgia, serif', fontSize: '10px', fontStyle: 'italic',
      color: '#4f4637', backgroundColor: '#e8dec5', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(10);
    this.constructionButtonObjects.push(instruction);
  }

  private animateRampConstruction(): void {
    this.constructionButtonObjects.forEach((item) => item.destroy());
    this.constructionButtonObjects = [];
    const pieces: Phaser.GameObjects.Rectangle[] = [];
    for (let index = 0; index < 6; index += 1) {
      const x = 211 + index * 19;
      const y = 570 - index * 9;
      const plank = this.add.rectangle(x, y, 34, 11, 0x8e6749)
        .setStrokeStyle(2, 0x4e3d2e)
        .setRotation(-0.38)
        .setDepth(2)
        .setAlpha(0)
        .setScale(0.88);
      pieces.push(plank);
      this.tweens.add({
        targets: plank,
        alpha: 1,
        scale: 1,
        duration: 170,
        delay: index * 160,
        ease: 'Sine.easeOut',
      });
    }
    const progress = this.add.text(260, 515, 'POSE DES PLANCHES…', {
      fontFamily: 'Georgia, serif', fontSize: '12px', fontStyle: 'bold',
      color: '#493b2a', backgroundColor: '#e8dcc1', padding: { x: 8, y: 5 },
    }).setOrigin(0.5).setDepth(20);
    this.constructionButtonObjects.push(progress);
    this.time.delayedCall(1250, () => {
      if (!this.scene.isActive()) return;
      this.constructionButtonObjects.forEach((object) => object.destroy());
      this.constructionButtonObjects = [];
      this.isBuildingRamp = false;
      state.rampBuilt = true;
      save();
      render();
      this.drawFloorDecoration();
      this.drawExteriorExtensions(getWorld(state.currentWorld).accent);
      this.refreshMachines();
      setStatus('La rampe est prête. La manufacture se développera à chaque nouvel achat.');
    });
  }

  private totalMachinesInCurrentWorld(): number {
    return Object.values(state.machines[state.currentWorld]).reduce((sum, count) => sum + count, 0);
  }

  private exteriorBuildPad(): { x: number; y: number; cost: number; kind: 'walls' | 'extension' } | null {
    const owned = this.totalMachinesInCurrentWorld();
    if (!state.wallsBuilt) return state.rampBuilt && owned >= 1 ? { x: 925, y: 330, cost: 250, kind: 'walls' } : null;
    if (state.outsideExpansions < 3 && owned >= state.outsideExpansions + 2) {
      return { x: 925 + (state.outsideExpansions % 2) * 70, y: 330 + Math.floor(state.outsideExpansions / 2) * 84, cost: [750, 1800, 4200][state.outsideExpansions]!, kind: 'extension' };
    }
    return null;
  }

  refreshExteriorBuildButtons(): void {
    this.exteriorButtonObjects.forEach((item) => item.destroy());
    this.exteriorButtonObjects = [];
    const build = this.exteriorBuildPad();
    if (!build) return;
    const pad = this.add.container(build.x, build.y).setDepth(8);
    pad.add(this.add.ellipse(0, 14, 82, 28, 0x1e3629, 0.22));
    pad.add(this.add.ellipse(0, 0, 76, 34, 0xffdc62).setStrokeStyle(3, 0x6f5b22));
    pad.add(this.add.rectangle(0, 0, 48, 12, 0xfff8d4).setStrokeStyle(1, 0x6f5b22));
    pad.add(this.add.text(0, 0, 'E · ACHETER', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '8px', fontStyle: 'bold', color: '#48391b' }).setOrigin(0.5));
    pad.add(this.add.text(0, -35, build.kind === 'walls' ? 'MURS · 250' : 'EXTENSION · ' + format(build.cost), { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '8px', fontStyle: 'bold', color: '#213c2b', backgroundColor: '#fff9dc', padding: { x: 5, y: 3 } }).setOrigin(0.5));
    this.tweens.add({ targets: pad, scale: 1.04, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.exteriorButtonObjects.push(pad);
  }

  private drawExteriorExtensions(accent: number): void {
    this.extensionObjects.forEach((object) => object.destroy());
    this.extensionObjects = [];
    const count = state.outsideExpansions;
    if (count < 1) return;
    const graphics = this.add.graphics().setDepth(1);
    this.extensionObjects.push(graphics);
    graphics.fillStyle(0xb6a47e, 0.8);
    graphics.fillRoundedRect(845, 465, 145 + (count > 1 ? 95 : 0), 92, 12);
    graphics.lineStyle(3, accent, 0.9);
    graphics.strokeRoundedRect(845, 465, 145 + (count > 1 ? 95 : 0), 92, 12);
    for (let index = 0; index < count; index += 1) {
      const x = 880 + index * 62;
      graphics.fillStyle(0x6b785e, 1);
      graphics.fillRoundedRect(x - 18, 486, 36, 30, 5);
      graphics.fillStyle([0x9bd8c2, 0xd8a9e0, 0xffd58b][index % 3]!, 1);
      graphics.fillRoundedRect(x - 10, 480, 20, 30, 5);
      graphics.fillStyle(0xffefb8, 1);
      graphics.fillRect(x - 4, 473, 8, 8);
      graphics.fillStyle(0x93734a, 1);
      graphics.fillRect(x - 6, 469, 12, 5);
    }
    const marker = this.add.text(918, 535, 'EXTENSION ' + count + '/3', {fontFamily:'Georgia, serif',fontSize:'9px',fontStyle:'bold',color:'#273f2c',backgroundColor:'#f9f0d0',padding:{x:6,y:3}}).setOrigin(0.5).setDepth(2);
    this.extensionObjects.push(marker);
  }

  private updateInteractionPrompt(): void {
    const hint = $('map-hint');
    const action = $('interact-button').querySelector('span');
    if (!state.rampBuilt) {
      const nearRamp = Phaser.Math.Distance.Between(this.player.x, this.player.y, 382, 566) < 92;
      hint.textContent = nearRamp ? 'APPUIE SUR E POUR CONSTRUIRE LA RAMPE' : 'APPROCHE LE BOUTON JAUNE · E POUR CONSTRUIRE';
      if (action) action.textContent = nearRamp ? 'CONSTRUIRE' : 'INTERAGIR';
      return;
    }
    const build = this.exteriorBuildPad();
    if (build && Phaser.Math.Distance.Between(this.player.x, this.player.y, build.x, build.y) < 96) {
      hint.textContent = build.kind === 'walls' ? 'E · CONSTRUIRE LES MURS' : 'E · CONSTRUIRE L’EXTENSION';
      if (action) action.textContent = 'ACHETER';
      return;
    }
    if (state.currentFloor < 2 && Phaser.Math.Distance.Between(this.player.x, this.player.y, 1037, 612) < 105) {
      const nextFloor = state.currentFloor + 1;
      hint.textContent = state.unlockedFloors.includes(nextFloor)
        ? 'E · MONTER À L’ÉTAGE SUIVANT'
        : 'E · CONSTRUIRE LES ESCALIERS · ' + format(floorUnlockCost(nextFloor));
      if (action) action.textContent = state.unlockedFloors.includes(nextFloor) ? 'MONTER' : 'CONSTRUIRE';
      return;
    }
    if (action) action.textContent = 'INTERAGIR';
  }

  private buyExteriorBuild(cost: number): void {
    const build = this.exteriorBuildPad();
    if (!build) return;
    if (state.crumbs < cost) {
      setStatus('Il manque ' + format(cost - state.crumbs) + ' parfums pour cet achat.');
      return;
    }
    state.crumbs -= cost;
    if (build.kind === 'walls') state.wallsBuilt = true;
    else state.outsideExpansions += 1;
    render();
    save();
    if (build.kind === 'extension') this.drawExteriorExtensions(getWorld(state.currentWorld).accent);
    this.refreshExteriorBuildButtons();
    this.updateExteriorWalls();
    setStatus(build.kind === 'walls' ? 'Murs posés. Tu peux maintenant lire la limite du magasin depuis l’extérieur.' : 'Extension extérieure construite. Un nouvel espace est maintenant ouvert.');
  }

  private updateExteriorWalls(): void {
    if (!this.exteriorWalls || !this.player) return;
    this.exteriorWalls.clear();
    const outside = this.player.x > 835 || this.player.y < 140 || this.player.y > 625;
    if (!outside || !state.wallsBuilt) return;
    this.exteriorWalls.fillStyle(0x9d927b, 1);
    this.exteriorWalls.fillRect(95, 132, 725, 14);
    this.exteriorWalls.fillRect(95, 642, 725, 14);
    this.exteriorWalls.fillRect(95, 132, 14, 524);
    this.exteriorWalls.fillRect(812, 132, 14, 290);
    this.exteriorWalls.fillRect(812, 530, 14, 126);
    this.exteriorWalls.lineStyle(3, 0x4b5146, 0.9);
    this.exteriorWalls.strokeRect(95, 132, 724, 524);
    this.exteriorWalls.fillStyle(0x5e7560, 0.18);
    this.exteriorWalls.fillRect(836, 150, 260, 490);
  }

  pulsePlayer(): void {
    if (!this.player?.active) return;
    this.tweens.add({ targets: this.player, y: this.player.y - 2, duration: 75, yoyo: true, ease: 'Sine.easeOut' });
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
  if (gameIsPaused) {
    previousFrame = now;
    requestAnimationFrame(animationTick);
    return;
  }
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
function renderTutorial(): void {
  const banner = $('tutorial-banner');
  banner.hidden = tutorialDismissed;
  if (tutorialDismissed) return;
  const owned = Object.values(state.machines).reduce((sum, machines) =>
    sum + Object.values(machines).reduce((worldSum, count) => worldSum + count, 0), 0);
  let step = 1;
  let title = 'Les commandes';
  let copy = 'Déplace-toi avec WASD ou les flèches. Tu peux aussi cliquer sur un point de la carte. Appuie sur E près d’un objet pour interagir.';
  if (!state.rampBuilt) {
    step = 1;
    title = 'Construis ton premier accès';
    copy = 'Déplace-toi vers le bouton jaune près du bas de l’atelier. Quand tu es proche, appuie sur E : la rampe se construira avec une animation.';
  } else if (owned === 0) {
    step = 2;
    title = 'Lance la production';
    copy = 'Ouvre Équipements, achète ta première machine, puis approche-toi d’un bouton de construction extérieur quand il apparaît. Les gains sont volontairement progressifs.';
  } else if (!state.claimedMissions.includes('first-machine')) {
    step = 3;
    title = 'Réclame les contrats';
    copy = 'Consulte Contrats dans le panneau de gauche. Quand une mission est terminée, réclame sa récompense : elle finance la suite.';
  } else {
    step = 4;
    title = 'Développe ta maison';
    copy = 'Améliore les machines, livre les commandes VIP avec E, débloque les étages, puis utilise le rebirth pour accélérer les prochains runs. La sauvegarde est automatique.';
  }
  $('tutorial-step-label').textContent = 'GUIDE DE DÉPART · ' + step + '/4';
  $('tutorial-title').textContent = title;
  $('tutorial-text').textContent = copy;
}
$('tutorial-dismiss').addEventListener('click', () => {
  tutorialDismissed = true;
  $('tutorial-banner').hidden = true;
});

render();
requestAnimationFrame(animationTick);
