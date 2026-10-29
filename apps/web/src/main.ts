import {
  addPerfumeRevenue,
  applyOfflineProgress,
  botanicalExpansionCost,
  canUnlockBotanicalExpansion,
  unlockBotanicalExpansion,
  MAX_BOTANICAL_EXPANSIONS,
  buyMachine,
  buyUpgrade,
  canClaimMission,
  canCraftPerfume,
  canFulfillCustomerOrder,
  canUnlockFloor,
  craftPerfume,
  fulfillCustomerOrder,
  getActiveCustomerOrder,
  getHouseReputation,
  perfumeSalePrice,
  sellPerfume,
  canRebirth,
  canTotalRebirth,
  claimMission,
  createInitialState,
  enterWorld,
  enterFloor,
  floorUnlockCost,
  unlockFloor,
  ESSENCE_PRESTIGE_VALUE,
  essenceMultiplier,
  exportSaveFile,
  getWorld,
  harvestMaterial,
  PERFUME_RECIPES,
  MATERIALS,
  MACHINES,
  MAX_UPGRADE_LEVEL,
  MISSION_DEFINITIONS,
  machineCost,
  missionProgress,
  netProductionPerSecond,
  operatingCostsPerSecond,
  parseImportedSave,
  parseSavedState,
  performRebirth,
  performTotalRebirth,
  productionPerSecond,
  rebirthCost,
  totalRebirthRequiredLevel,
  upgradeCost,
  UPGRADES,
  WORLDS,
  type GameState,
  type MachineId,
  type MissionId,
  type RecipeId,
  type MaterialId,
  type UpgradeId,
  type WorldId,
} from './economy';
import './style.css';
import { createWorkshopScene, type WorkshopScene, type WorkshopStation, type MoveDirection, type WorkshopEffect } from './workshop-scene';


const SAVE_KEY = 'parfum-empire-save-v1';
const BACKUP_SAVE_KEY = 'parfum-empire-save-backup-v1';
const LEGACY_SAVE_KEY = 'cookie-dominion-save-v1';
const SOUND_KEY = 'parfum-empire-sound-enabled-v1';

type SoundEffect = 'harvest' | 'craft' | 'sell' | 'order' | 'purchase' | 'unlock' | 'prestige' | 'mission' | 'level-up';
const SOUND_NOTES: Record<SoundEffect, number[]> = {
  harvest: [660, 880],
  craft: [392, 494, 659],
  sell: [740, 988],
  order: [523, 659, 784, 1046],
  purchase: [440, 554, 659],
  unlock: [330, 440, 554, 740],
  prestige: [392, 494, 587, 784, 988],
  mission: [523, 659, 784],
  'level-up': [659, 784, 988, 1318],
};
const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing app root');

type StoreTab = 'upgrades' | 'contracts' | 'honours' | 'worlds' | 'prestige' | 'save';
let activeTab: StoreTab = 'upgrades';
let statusMessage = 'Récolte ta première matière, puis compose ta fragrance.';
let lastTick = performance.now();
let lastStatsUpdate = 0;
let lastPassiveUiSecond = -1;
let autoSaveElapsed = 0;
let selectedRecipeId: RecipeId = 'green-whisper';
let workshopScene: WorkshopScene | null = null;
let nearbyStation: WorkshopStation | null = null;
let state: GameState;
let saveRecoveryMessage: string | null = null;
let backupNeedsRepair = false;
let soundEnabled = readSoundPreference();
let soundContext: AudioContext | null = null;

const EXPANSION_PLOT_MATERIALS: Partial<Record<WorkshopStation, MaterialId>> = {
  'lavender-plot-2': 'lavender',
  'mint-plot-2': 'mint',
  'rose-plot-2': 'rose',
};
const EXPANSION_PLOT_NAMES = [
  'Second carré de lavande',
  'Seconde parcelle de menthe',
  'Seconde roseraie',
];

function readSoundPreference(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'false';
  } catch {
    return false;
  }
}

function playSound(effect: SoundEffect): void {
  if (!soundEnabled || typeof window.AudioContext !== 'function') return;
  try {
    soundContext ??= new window.AudioContext();
    if (soundContext.state === 'suspended') void soundContext.resume().catch(() => undefined);
    const context = soundContext;
    const notes = SOUND_NOTES[effect];
    notes.forEach((frequency, index) => {
      const start = context.currentTime + index * 0.055;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = effect === 'unlock' || effect === 'prestige' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.025, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.145);
    });
  } catch {
    // Audio is an optional enhancement; the game remains fully playable without it.
  }
}

function normalizeGameState(value: GameState): GameState {
  const unlockedFloors = [...new Set([
    0,
    ...value.unlockedFloors.filter((floor) => Number.isInteger(floor) && floor >= 0 && floor <= 2),
  ])].sort((a, b) => a - b);
  const requestedFloor = Number.isInteger(value.currentFloor) && value.currentFloor >= 0 && value.currentFloor <= 2
    ? value.currentFloor
    : 0;
  return {
    ...value,
    rampBuilt: true,
    currentFloor: unlockedFloors.includes(requestedFloor) ? requestedFloor : 0,
    unlockedFloors,
    lastSavedAt: Date.now(),
  };
}

try {
  const primary = localStorage.getItem(SAVE_KEY);
  const backup = localStorage.getItem(BACKUP_SAVE_KEY);
  const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
  const primaryIsValid = primary !== null && parseImportedSave(primary) !== null;
  const backupIsValid = backup !== null && parseImportedSave(backup) !== null;
  const legacyIsValid = legacy !== null && parseImportedSave(legacy) !== null;

  if (primaryIsValid) {
    state = normalizeGameState(parseSavedState(primary));
  } else if (backupIsValid) {
    state = normalizeGameState(parseSavedState(backup));
    backupNeedsRepair = true;
    saveRecoveryMessage = 'La sauvegarde principale était illisible. La copie de secours a été restaurée.';
  } else if (legacyIsValid) {
    state = normalizeGameState(parseSavedState(legacy));
    backupNeedsRepair = true;
    saveRecoveryMessage = 'Une ancienne sauvegarde a été récupérée. Exporte une copie après vérification.';
  } else {
    state = normalizeGameState(createInitialState());
    if (primary !== null || backup !== null || legacy !== null) {
      backupNeedsRepair = true;
      saveRecoveryMessage = 'Les sauvegardes existantes sont illisibles. Une nouvelle partie a été créée; vérifie tes exports avant de continuer.';
    }
  }
} catch {
  state = normalizeGameState(createInitialState());
  saveRecoveryMessage = 'Le stockage local est indisponible. La progression peut ne pas être conservée.';
}

app.innerHTML = `
  <main class="game-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="Parfum Empire, accueil">
        <span class="brand-mark"><img src="/assets/perfume-emblem.svg" alt="" /></span>
        <span class="brand-text">
          <span class="eyebrow">MAISON DES ESSENCES</span>
          <strong>PARFUM <i>EMPIRE</i></strong>
          <small>Compose · Automatise · Domine</small>
        </span>
      </a>
      <div class="header-economy">
        <div class="headline-money">
          <span>TRÉSORERIE</span>
          <strong id="header-money">0</strong>
          <small>pièces disponibles</small>
        </div>
        <div class="header-stat"><span>PRODUCTION NETTE</span><strong id="header-cps">0</strong><small>après entretien / s</small></div>
        <div class="header-stat"><span>MATIÈRES</span><strong id="header-click">0</strong><small>ingrédients en stock</small></div>
        <div class="header-stat"><span>REVENU DU RUN</span><strong id="header-run">0</strong><small>pièces gagnées ce run</small></div>
        <button id="open-settings" class="icon-button" type="button" title="Paramètres et sauvegarde" aria-label="Paramètres et sauvegarde">☷</button>
      </div>
    </header>

    <div class="progress-strip">
      <span class="live-indicator"></span>
      <span id="current-world-line">JARDIN DE VERRE</span>
      <span class="progress-separator">/</span>
      <span id="current-rank">Maison indépendante · Rang 1</span>
      <span id="global-status" role="status">Récolte ta première matière, puis compose ta fragrance.</span>
      <span id="save-indicator">SAUVEGARDE LOCALE</span>
    </div>

    <div class="game-layout">
      <section class="column workshop-column">
        <div class="section-heading workshop-heading">
          <div><span class="eyebrow">01 · CRÉATION</span><h1>Le parfumeur</h1></div>
          <span class="stamped-tag">ATELIER</span>
        </div>
        <div class="workshop-card">
          <div class="workshop-card-topline"><span>ATELIER 2D</span><span id="harvest-mode-label">RÉCOLTE MANUELLE</span></div>
          <div class="workshop-stage-frame workshop-stage" id="workshop-stage-frame">
            <canvas id="workshop-canvas" aria-label="Atelier 2D. Déplace-toi avec ZQSD ou les flèches. Clique au sol pour marcher. Appuie sur E près d'un poste pour interagir." role="img"></canvas>
            <div class="scene-help"><span id="scene-prompt">Déplace-toi vers une parcelle pour récolter.</span><button id="scene-interact" type="button" disabled>INTERAGIR · E</button></div>
            <div class="scene-touch-controls" aria-label="Commandes tactiles"><div class="scene-pad"><button type="button" data-scene-move="up" aria-label="Avancer">↑</button><button type="button" data-scene-move="left" aria-label="Aller à gauche">←</button><button type="button" data-scene-move="down" aria-label="Reculer">↓</button><button type="button" data-scene-move="right" aria-label="Aller à droite">→</button></div><small>Commandes tactiles</small></div>
          </div>
          <section class="floor-navigation" aria-label="Étages de la maison">
            <div class="floor-navigation-heading"><span class="eyebrow">ATELIER VERTICAL</span><strong id="active-floor-label">Artisanat · étage 0</strong></div>
            <div id="floor-buttons" class="floor-buttons"></div>
            <small id="floor-navigation-hint">Approche l'escalier pour ouvrir le prochain étage.</small>
          </section>
          <div class="harvest-summary" aria-live="polite">
            <span class="last-drop-icon"><img id="harvest-last-icon" src="/assets/material-unknown.svg" alt="" /></span>
            <span class="last-drop-copy"><small>DERNIÈRE DÉCOUVERTE</small><strong id="harvest-last-name">Objet inconnu</strong><em id="harvest-last-rarity">La nature réserve une surprise.</em></span>
            <span class="harvest-counter"><strong id="harvest-progress">0</strong><small>en stock</small></span>
          </div>
          <div class="harvest-progress-track"><i id="harvest-progress-bar"></i></div>
          <div id="botanical-expansion-panel" class="botanical-expansion-panel"></div>
          <div class="workshop-instructions">
            <strong>Travaille à chaque poste</strong>
            <span>Approche les parcelles pour récolter une matière précise. Choisis une recette, formule-la au laboratoire et vends le flacon au comptoir.</span>
          </div>
          <div class="material-codex-heading"><span>CARNET BOTANIQUE</span><span id="material-discovered-count">0 découvertes</span></div>
          <div id="material-inventory" class="material-inventory"></div>
          <section class="recipe-workshop" aria-labelledby="recipe-workshop-title">
            <div class="recipe-workshop-heading"><div><span class="eyebrow">FORMULATION ARTISANALE</span><h2 id="recipe-workshop-title">Carnet de formulations</h2></div><span id="perfume-stock-count">0 flacon</span></div>
            <p class="recipe-workshop-intro">Choisis une recette, récolte les ingrédients dans le jardin, puis rejoins le laboratoire pour la composer. Le comptoir sert à vendre les flacons.</p>
            <p class="selected-recipe-note">Recette active : <strong id="selected-recipe-name">Brise verte</strong></p>
            <div id="recipe-list" class="recipe-list"></div>
            <div id="customer-order-panel" class="customer-order-panel"></div>
          </section>
          <div class="workshop-card-footer">
            <span>INTERACTIONS À L’ATELIER</span><strong id="workshop-actions-count">0</strong>
          </div>
        </div>

        </div>


        <div class="mini-metrics">
          <div><span>Revenus cumulés</span><strong id="lifetime-sales">0</strong></div>
        </div>
      </section>

      <section class="column production-column">
        <div class="section-heading">
          <div><span class="eyebrow">02 · AUTOMATISATION</span><h1>La manufacture</h1><p class="heading-note">Chaque équipement produit en continu, même sans clic.</p></div>
          <div class="production-totals"><strong id="factory-cps">0</strong><small>RENDEMENT NET / S</small></div>
        </div>
        <div class="manufacture-banner">
          <div class="banner-stamp"><img src="/assets/perfume-emblem.svg" alt="" /></div>
          <div><span class="eyebrow">RAPPORT DE PRODUCTION</span><strong id="factory-status">La première ligne attend son équipement.</strong><small id="factory-detail">Investis dans une machine pour lancer tes revenus automatiques.</small></div>
        </div>
        <div class="building-list-heading"><span>ÉQUIPEMENTS DE PRODUCTION</span><span id="machine-count">0 INSTALLÉ</span></div>
        <div id="machine-list" class="building-list"></div>
        <div class="factory-footnote"><span class="small-leaf">✦</span><span>Les coûts augmentent à chaque exemplaire acheté. Diversifie ta manufacture pour accélérer le rendement.</span></div>
      </section>

      <aside class="column store-column">
        <div class="section-heading store-title">
          <div><span class="eyebrow">03 · DÉVELOPPEMENT</span><h1>Le bureau</h1></div>
          <span class="folio-number">PE / 01</span>
        </div>
        <nav class="store-tabs" aria-label="Sections du bureau">
          <button class="store-tab is-active" data-tab="upgrades" type="button" aria-selected="true">Recherches</button>
          <button class="store-tab" data-tab="contracts" type="button" aria-selected="false">Contrats</button>
          <button class="store-tab" data-tab="honours" type="button" aria-selected="false">Honneurs</button>
          <button class="store-tab" data-tab="worlds" type="button" aria-selected="false">Collections</button>
          <button class="store-tab" data-tab="prestige" type="button" aria-selected="false">Prestige</button>
          <button class="store-tab" data-tab="save" type="button" aria-selected="false">Données</button>
        </nav>
        <div id="store-content" class="store-content"></div>
      </aside>
    </div>
    <footer class="game-footer">
      <span>PARFUM EMPIRE <i>/</i> MAISON DES ESSENCES</span>
      <span>PRODUCTION CONTINUE · SAUVEGARDE AUTOMATIQUE</span>
      <span id="footer-version">V. 0.4.0 · ATELIER INTERACTIF</span>
    </footer>
    <input id="import-file" type="file" accept=".json,.txt,application/json,text/plain" hidden />
  </main>
`;

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error('Missing element: ' + id);
  return element as T;
}

function format(value: number, maxFractionDigits = 1): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) < 1000) {
    return new Intl.NumberFormat('fr-CH', { maximumFractionDigits: maxFractionDigits }).format(value);
  }
  return new Intl.NumberFormat('fr-CH', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatExact(value: number): string {
  return new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 0 }).format(Math.ceil(value));
}

function machineIcon(machineId: MachineId): string {
  const icons: Record<MachineId, string> = {
    'formulation-table': 'machine-formulation',
    'copper-still': 'machine-still',
    'bottling-line': 'machine-bottling',
    'perfumer-studio': 'machine-lab',
    'astral-extractor': 'machine-extractor',
    'botanical-garden': 'machine-botanical',
    'enfleurage-press': 'machine-enfleurage',
    'luxury-atelier': 'machine-luxury',
    'crystal-distiller': 'machine-crystal',
    'orbital-manufactory': 'machine-orbital',
  };
  return '/assets/' + icons[machineId] + '.svg';
}

function totalMachinesOwned(): number {
  return Object.values(state.machines).reduce(
    (all, worldMachines) => all + Object.values(worldMachines).reduce((sum, count) => sum + count, 0),
    0,
  );
}

function currentWorldMachineTotal(): number {
  return Object.values(state.machines[state.currentWorld]).reduce((sum, count) => sum + count, 0);
}

function tierName(floor: number): string {
  if (floor === 0) return 'ARTISANAT';
  if (floor === 1) return 'MANUFACTURE';
  return 'ESSENCES RARES';
}

function setStatus(message: string): void {
  statusMessage = message;
  const status = byId('global-status');
  status.textContent = message;
  status.classList.remove('status-pop');
  // Restart the short feedback animation when a new game action reports its result.
  void status.offsetWidth;
  status.classList.add('status-pop');
}

function save(): void {
  const now = Date.now();
  state = { ...state, lastSavedAt: now, rampBuilt: true };
  try {
    const previous = localStorage.getItem(SAVE_KEY);
    const previousIsValid = previous !== null && parseImportedSave(previous) !== null;
    if (previousIsValid || backupNeedsRepair) {
      try {
        // Normally keep the previous valid save as a rollback point. After recovery,
        // refresh the backup from the recovered state to avoid replaying old offline time.
        const backupPayload = previousIsValid && !backupNeedsRepair ? previous : JSON.stringify(state);
        localStorage.setItem(BACKUP_SAVE_KEY, backupPayload);
      } catch {
        // Keep attempting the primary save even when there is no room for a backup.
      }
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    backupNeedsRepair = false;
    byId('save-indicator').textContent = 'SAUVEGARDÉ · ' + new Date(now).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });
  } catch {
    byId('save-indicator').textContent = 'SAUVEGARDE INDISPONIBLE';
  }
}

function renderHarvestView(): void {
  const latest = MATERIALS.find((material) => material.id === state.lastHarvestedMaterial);
  const unknownAsset = '/assets/material-unknown.svg';
  const source = latest?.asset ?? unknownAsset;
  const lastIcon = byId<HTMLImageElement>('harvest-last-icon');
  lastIcon.src = source;
  lastIcon.alt = latest?.name ?? 'Matière inconnue';
  byId('harvest-last-name').textContent = latest?.name ?? 'Objet inconnu';
  byId('harvest-last-rarity').textContent = latest
    ? latest.rarity + ' · récoltée à l’atelier'
    : 'Approche une parcelle pour commencer.';
  const ingredientTotal = Object.values(state.ingredients).reduce((sum, count) => sum + count, 0);
  byId('harvest-progress').textContent = format(ingredientTotal, 0);
  byId('harvest-progress-bar').style.width = Math.min(100, ingredientTotal / 20 * 100) + '%';

  const discoveries = MATERIALS.reduce((sum, material) => sum + state.materialDiscoveries[material.id], 0);
  byId('material-discovered-count').textContent = format(discoveries, 0) + ' trouvaille' + (discoveries === 1 ? '' : 's');
  byId('material-inventory').innerHTML = MATERIALS.map((material) => {
    const discoveries = state.materialDiscoveries[material.id];
    const stock = state.ingredients[material.id];
    const known = discoveries > 0;
    const latestClass = material.id === state.lastHarvestedMaterial ? ' is-latest' : '';
    return `
      <div class="material-chip ${known ? 'is-known' : 'is-unknown'}${latestClass}" title="${known ? material.name + ' · en stock : ' + stock + ' · découvertes : ' + discoveries : 'Matière encore inconnue'}">
        <img src="${known ? material.asset : unknownAsset}" alt="" />
        <span>${known ? material.shortName : '???'}</span>
        <strong>${format(stock, 0)}</strong>
      </div>`;
  }).join('');
}

function renderBotanicalExpansion(): void {
  const level = state.outsideExpansions;
  const maxed = level >= MAX_BOTANICAL_EXPANSIONS;
  const cost = botanicalExpansionCost(state);
  const canAfford = canUnlockBotanicalExpansion(state);
  const nextName = EXPANSION_PLOT_NAMES[level] ?? '';
  const stateClass = maxed ? 'is-complete' : canAfford ? 'is-ready' : '';
  byId('botanical-expansion-panel').innerHTML =
    '<section class="botanical-expansion-card ' + stateClass + '">' +
      '<div class="botanical-expansion-heading"><span class="eyebrow">EXTENSIONS DU JARDIN</span><strong>' +
        level + ' / ' + MAX_BOTANICAL_EXPANSIONS + '</strong></div>' +
      '<p>' + (maxed
        ? 'Toutes les parcelles supplémentaires sont ouvertes.'
        : nextName + ' sera accessible après achat.') + '</p>' +
      '<button type="button" data-buy-botanical-expansion="true" ' + (canAfford ? '' : 'disabled') + '>' +
        '<span>' + (maxed ? 'JARDIN COMPLET' : 'DÉBLOQUER LA PARCELLE') + '</span>' +
        '<b>' + (maxed ? 'MAX' : format(cost)) + '</b>' +
      '</button>' +
    '</section>';
}

function renderPreservingFocus(
  container: HTMLElement,
  markup: string,
  actionAttributes: string[] = [],
): void {
  const activeElement = document.activeElement;
  const focusedButton = activeElement instanceof HTMLElement && container.contains(activeElement)
    ? activeElement.closest<HTMLButtonElement>('button')
    : null;
  const focusedId = focusedButton?.id ?? '';
  const focusAttribute = focusedButton
    ? actionAttributes.find((attribute) => focusedButton.hasAttribute(attribute))
    : undefined;
  const focusValue = focusAttribute ? focusedButton?.getAttribute(focusAttribute) : null;

  container.innerHTML = markup;

  let replacement: HTMLElement | undefined;
  if (focusedId) {
    replacement = Array.from(container.querySelectorAll<HTMLElement>('[id]'))
      .find((element) => element.id === focusedId);
  } else if (focusAttribute && focusValue !== null) {
    replacement = Array.from(container.querySelectorAll<HTMLElement>('[' + focusAttribute + ']'))
      .find((element) => element.getAttribute(focusAttribute) === focusValue);
  }
  replacement?.focus({ preventScroll: true });
}

function renderStats(): void {
  const world = getWorld(state.currentWorld);
  const grossCps = productionPerSecond(state);
  const upkeepCps = operatingCostsPerSecond(state);
  const cps = netProductionPerSecond(state);
  byId('header-money').textContent = format(state.perfumeRevenue);
  byId('header-money').title = formatExact(state.perfumeRevenue) + ' pièces';
  byId('header-cps').textContent = format(cps);
  byId('header-click').textContent = format(Object.values(state.ingredients).reduce((sum, count) => sum + count, 0), 0);
  byId('header-run').textContent = format(state.runPerfumeRevenue);
  byId('factory-cps').textContent = format(cps);
  byId('workshop-actions-count').textContent = format(state.gatherClicks, 0);
  byId('lifetime-sales').textContent = format(state.lifetimePerfumeRevenue);
  byId('current-world-line').textContent = world.name.toUpperCase();
  byId('current-rank').textContent = 'Maison indépendante · Rang ' + (1 + state.rebirths + state.totalRebirths * 10);
  byId('harvest-mode-label').textContent = 'RÉCOLTE MANUELLE';
  byId('global-status').textContent = statusMessage;
  byId('factory-status').textContent = currentWorldMachineTotal() === 0
    ? 'La première ligne attend son équipement.'
    : currentWorldMachineTotal() + ' équipement(s) en service dans cette collection.';
  byId('factory-detail').textContent = grossCps > 0
    ? 'Brut : ' + format(grossCps) + ' / s. Entretien : ' + format(upkeepCps, 3) + ' / s. Net : ' + format(cps, 3) + ' / s.'
    : 'Vends tes premiers flacons ou investis dans une machine pour lancer les revenus automatiques.';
  byId('machine-count').textContent = format(currentWorldMachineTotal(), 0) + ' INSTALLÉ' + (currentWorldMachineTotal() > 1 ? 'S' : '');
}

function renderMachines(): void {
  const list = byId('machine-list');
  const current = state.machines[state.currentWorld];
  const catalog = MACHINES.filter((machine) => machine.floor === state.currentFloor);
  const markup = catalog.map((machine) => {
    const owned = current[machine.id];
    const cost = machineCost(state, machine.id);
    const canAfford = state.perfumeRevenue >= cost;
    const world = getWorld(state.currentWorld);
    const perSecond = (machine.payout / machine.cycleSeconds) *
      world.incomeMultiplier *
      (1 + state.upgrades.production * 0.2) *
      (1.6 ** state.rebirths) *
      essenceMultiplier(state);
    const upkeepPerSecond = machine.cost * world.costMultiplier / 600;
    return `
      <article class="building-row ${owned > 0 ? 'is-owned' : ''} ${canAfford ? 'can-buy' : 'is-expensive'}">
        <div class="building-portrait"><img src="${machineIcon(machine.id)}" alt="" loading="lazy" /></div>
        <div class="building-info">
          <div class="building-title-line"><h3>${machine.name}</h3><span class="building-tier">${tierName(machine.floor)}</span></div>
          <p>${machine.description}</p>
          <div class="building-output"><span>PRODUCTION NETTE</span><strong>${format(perSecond - upkeepPerSecond)} / s</strong></div>
          <div class="building-output"><span>ENTRETIEN</span><strong>${format(upkeepPerSecond, 3)} / s</strong></div>
          <div class="building-price-line"><span>PROCHAIN COÛT</span><strong>${format(cost)}</strong></div>
        </div>
        <div class="building-buy-side">
          <strong class="building-owned">${format(owned, 0)}</strong>
          <button class="buy-building" type="button" data-buy-machine="${machine.id}" ${canAfford ? '' : 'disabled'}>
            <span>INVESTIR</span><b>${format(cost)}</b>
          </button>
        </div>
      </article>`;
  }).join('');
  renderPreservingFocus(list, markup, ['data-buy-machine']);
}

function renderUpgrades(): string {
  const ids = Object.keys(UPGRADES) as UpgradeId[];
  return `
    <div class="tab-panel-heading"><span class="eyebrow">LABORATOIRE DE RECHERCHE</span><h2>Améliorations</h2><p>Les recherches sont permanentes pendant les rebirths normaux. Choisis les spécialités de ta maison.</p></div>
    <div class="upgrade-list">${ids.map((id) => {
      const definition = UPGRADES[id];
      const level = state.upgrades[id];
      const cost = upgradeCost(state, id);
      const maxed = level >= MAX_UPGRADE_LEVEL;
      const canAfford = state.perfumeRevenue >= cost && !maxed;
      return `
        <article class="upgrade-row ${level > 0 ? 'is-owned' : ''}">
          <div class="upgrade-stamp">${id === 'production' ? '×' : id === 'clickPower' ? '✦' : id === 'discount' ? '−' : id === 'rareBonus' ? '◇' : '↗'}</div>
          <div class="upgrade-info"><h3>${definition.name}</h3><p>${definition.description}</p><small>${definition.effect}</small><div class="level-track" aria-label="Niveau ${level} sur ${MAX_UPGRADE_LEVEL}">${Array.from({ length: MAX_UPGRADE_LEVEL }, (_, index) => `<i class="${index < level ? 'filled' : ''}"></i>`).join('')}</div></div>
          <div class="upgrade-action"><span>NV. ${level}/${MAX_UPGRADE_LEVEL}</span><button type="button" data-buy-upgrade="${id}" ${canAfford ? '' : 'disabled'}>${maxed ? 'MAX' : format(cost)}</button></div>
        </article>`;
    }).join('')}</div>
    <div class="research-note"><span>NOTE DU PARFUMEUR</span><p>Le rendement se cumule : automatisation, récoltes ciblées, précision d’extraction et finition des flacons se renforcent mutuellement.</p></div>`;
}

function renderContracts(): string {
  return `
    <div class="tab-panel-heading"><span class="eyebrow">CAHIER DES OBJECTIFS</span><h2>Contrats de la maison</h2><p>Les contrats récompensent les étapes de croissance. Chaque contrat ne peut être réclamé qu'une seule fois.</p></div>
    <div class="contract-list">${MISSION_DEFINITIONS.map((mission) => {
      const progress = missionProgress(state, mission);
      const done = state.claimedMissions.includes(mission.id);
      const ready = canClaimMission(state, mission.id);
      return `
        <article class="contract-row ${done ? 'is-claimed' : ready ? 'is-ready' : ''}">
          <div class="contract-seal">${done ? '✓' : ready ? '!' : '○'}</div>
          <div class="contract-info"><div class="contract-heading"><h3>${mission.name}</h3><span>${format(progress, 0)} / ${format(mission.target, 0)}</span></div><p>${mission.description}</p><div class="contract-progress"><i style="width:${Math.min(100, progress / mission.target * 100)}%"></i></div><small>RÉCOMPENSE · +${format(mission.reward)} parfums</small></div>
          <button type="button" data-claim-mission="${mission.id}" ${ready ? '' : 'disabled'}>${done ? 'RÉCLAMÉ' : 'RÉCLAMER'}</button>
        </article>`;
    }).join('')}</div>`;
}

function achievements() {
  const machines = totalMachinesOwned();
  const criteria = [
    { name: 'Première note', description: 'Récolter une première matière botanique.', unlocked: state.gatherClicks >= 1 },
    { name: 'Le nez se forme', description: 'Générer 100 pièces de revenus cumulés.', unlocked: state.lifetimePerfumeRevenue >= 100 },
    { name: 'Premier investissement', description: 'Installer un premier équipement.', unlocked: machines >= 1 },
    { name: 'Petite manufacture', description: 'Posséder 10 équipements au total.', unlocked: machines >= 10 },
    { name: 'Ligne industrielle', description: 'Posséder 50 équipements au total.', unlocked: machines >= 50 },
    { name: 'Recherche appliquée', description: 'Acheter une première amélioration.', unlocked: Object.values(state.upgrades).some((level) => level > 0) },
    { name: 'Première vente', description: 'Vendre un flacon au comptoir.', unlocked: state.perfumesSold >= 1 },
    { name: 'Première collection', description: 'Ouvrir une deuxième collection.', unlocked: state.unlockedWorlds.length >= 2 },
    { name: 'Maison internationale', description: 'Ouvrir la troisième collection.', unlocked: state.unlockedWorlds.length >= 3 },
    { name: 'Nouvelle génération', description: 'Effectuer un rebirth normal.', unlocked: state.rebirths >= 1 },
    { name: 'Un million de notes', description: 'Générer un million de pièces de revenus cumulés.', unlocked: state.lifetimePerfumeRevenue >= 1_000_000 },
    { name: 'Essence originelle', description: 'Gagner une première Essence permanente.', unlocked: state.essences >= 1 },
  ];
  return criteria;
}

function renderHonours(): string {
  const items = achievements();
  const unlocked = items.filter((item) => item.unlocked).length;
  return `
    <div class="tab-panel-heading"><span class="eyebrow">REGISTRE DES DISTINCTIONS</span><h2>Honneurs</h2><p>La progression révèle les distinctions de la maison. Les honneurs se débloquent automatiquement.</p></div>
    <div class="honour-summary"><strong>${unlocked}<span>/ ${items.length}</span></strong><div><b>Distinctions obtenues</b><small>${Math.round(unlocked / items.length * 100)} % du registre complété</small><div class="contract-progress"><i style="width:${unlocked / items.length * 100}%"></i></div></div></div>
    <div class="honour-list">${items.map((item, index) => `
      <article class="honour-row ${item.unlocked ? 'is-unlocked' : 'is-locked'}"><div class="honour-number">${item.unlocked ? '✦' : String(index + 1).padStart(2, '0')}</div><div><h3>${item.name}</h3><p>${item.description}</p></div><span class="honour-state">${item.unlocked ? 'OBTENU' : 'VERROUILLÉ'}</span></article>`).join('')}</div>`;
}

function renderWorlds(): string {
  return `
    <div class="tab-panel-heading"><span class="eyebrow">COLLECTIONS OLFACTIVES</span><h2>Les maisons</h2><p>Chaque collection possède son propre stock d'équipements et un multiplicateur de revenus. Les collections rares se débloquent avec le prestige.</p></div>
    <div class="world-list">${WORLDS.map((world) => {
      const unlocked = state.unlockedWorlds.includes(world.id);
      const selected = state.currentWorld === world.id;
      const count = Object.values(state.machines[world.id]).reduce((sum, value) => sum + value, 0);
      return `
        <article class="world-card ${selected ? 'is-selected' : ''} ${unlocked ? '' : 'is-locked'}">
          <div class="world-swatch" style="--world-accent:#${world.accent.toString(16).padStart(6, '0')};--world-bg:#${world.background.toString(16).padStart(6, '0')}"><img src="/assets/perfume-emblem.svg" alt="" /></div>
          <div class="world-info"><span class="eyebrow">${unlocked ? selected ? 'COLLECTION ACTIVE' : 'COLLECTION OUVERTE' : 'VERROUILLÉE · REBIRTH ' + world.unlockRebirths}</span><h3>${world.name}</h3><p>${world.tagline}</p><small>RENDEMENT ×${format(world.incomeMultiplier, 0)} · ${format(count, 0)} ÉQUIPEMENTS</small></div>
          <button type="button" data-enter-world="${world.id}" ${unlocked && !selected ? '' : 'disabled'}>${selected ? 'ACTIVE' : unlocked ? 'OUVRIR' : 'FERMÉ'}</button>
        </article>`;
    }).join('')}</div>
    <div class="research-note"><span>CHANGEMENT DE COLLECTION</span><p>Tu peux revenir à une collection déjà ouverte. Les équipements de chaque maison continuent d'y être sauvegardés, mais seule la collection active génère les revenus affichés.</p></div>`;
}

function renderPrestige(): string {
  const nextCost = rebirthCost(state.rebirths);
  const progress = Math.min(100, state.runPerfumeRevenue / nextCost * 100);
  const required = totalRebirthRequiredLevel(state);
  const totalReady = canTotalRebirth(state);
  return `
    <div class="tab-panel-heading"><span class="eyebrow">PRESTIGE ET RÉINITIALISATION</span><h2>La renommée</h2><p>Recommence pour accroître durablement la puissance de tes prochaines maisons.</p></div>
    <article class="prestige-card normal-prestige">
      <div class="prestige-topline"><span class="eyebrow">PRESTIGE I</span><span class="prestige-status">PERMANENT</span></div>
      <h3>Rebirth normal</h3><p>Réinitialise le stock et les équipements de production. Chaque rebirth multiplie la production par 1,6 et ouvre de nouvelles collections. Les recherches sont conservées.</p>
      <div class="prestige-numbers"><span><small>REBIRTHS</small><strong>${format(state.rebirths, 0)}</strong></span><span><small>PROGRESSION</small><strong>${Math.round(progress)} %</strong></span><span><small>OBJECTIF</small><strong>${format(nextCost)}</strong></span></div>
      <div class="contract-progress"><i style="width:${progress}%"></i></div>
      <p class="prestige-hint">${canRebirth(state) ? 'La maison peut maintenant effectuer un rebirth.' : 'Encore ' + format(Math.max(0, nextCost - state.runPerfumeRevenue)) + ' parfums gagnés pendant ce run.'}</p>
      <button id="rebirth-button" class="prestige-button" type="button" ${canRebirth(state) ? '' : 'disabled'}>EFFECTUER LE REBIRTH <span>×1,6</span></button>
    </article>
    <article class="prestige-card total-prestige">
      <div class="prestige-topline"><span class="eyebrow">PRESTIGE II</span><span class="prestige-status">ENDGAME</span></div>
      <h3>Ascension totale</h3><p>Sacrifie les progrès normaux pour obtenir des Essences originelles, conservées définitivement. Chaque essence ajoute 75 % de production et 1 000 000 points de valeur d'empire.</p>
      <div class="prestige-numbers"><span><small>ASCENSIONS</small><strong>${format(state.totalRebirths, 0)}</strong></span><span><small>ESSENCES</small><strong>${format(state.essences, 0)}</strong></span><span><small>RENDEMENT</small><strong>×${format(essenceMultiplier(state), 2)}</strong></span></div>
      <div class="total-rebirth-level">REQUIS : ${format(state.rebirths, 0)} / ${format(required, 0)} rebirths normaux</div>
      <button id="total-rebirth-button" class="prestige-button danger-button" type="button" ${totalReady ? '' : 'disabled'}>TOUT SACRIFIER <span>+${format(1 + state.totalRebirths, 0)} ESSENCE(S)</span></button>
      <small class="warning-note">Cette opération efface le stock, les équipements, les recherches, les contrats et les collections ouvertes.</small>
    </article>
    <div class="empire-value">VALEUR TOTALE DE L'EMPIRE <strong>${format(state.lifetimePerfumeRevenue + state.essences * ESSENCE_PRESTIGE_VALUE)}</strong></div>`;
}

function renderSavePanel(): string {
  return `
    <div class="tab-panel-heading"><span class="eyebrow">ARCHIVES DE LA MAISON</span><h2>Sauvegarde</h2><p>La partie est stockée dans ce navigateur. Exporte un fichier pour déplacer ta progression ou en conserver une copie.</p></div>
    <div class="save-panel-actions">
      <button id="save-now" class="secondary-button" type="button">SAUVEGARDER MAINTENANT</button>
      <button id="export-save" class="secondary-button" type="button">EXPORTER EN JSON</button>
      <button id="import-file-button" class="secondary-button" type="button">IMPORTER UN FICHIER</button>
      <button id="copy-save" class="secondary-button" type="button">COPIER LE TEXTE</button>
    </div>
    <label class="save-text-label" for="save-data-text">TEXTE DE SAUVEGARDE</label>
    <textarea id="save-data-text" rows="7" spellcheck="false" placeholder="Clique sur EXPORTER EN JSON ou colle ici une sauvegarde à importer."></textarea>
    <div class="save-panel-actions"><button id="import-save" class="secondary-button" type="button">IMPORTER LE TEXTE COLLÉ</button><button id="erase-save" class="secondary-button danger-outline" type="button">EFFACER LA PARTIE</button></div>
    <label class="theme-toggle"><span><strong>Mode sombre</strong><small>Réduit la luminosité de l'interface.</small></span><input id="dark-mode-toggle" type="checkbox" ${document.body.classList.contains('theme-dark') ? 'checked' : ''} /></label>
    <label class="theme-toggle"><span><strong>Effets sonores</strong><small>Notes synthétiques pour les récoltes, ventes et améliorations.</small></span><input id="sound-enabled-toggle" type="checkbox" ${soundEnabled ? 'checked' : ''} /></label>
    <p class="save-warning">Importer remplace la partie actuelle. Vérifie que tu as exporté tes progrès avant de réinitialiser.</p>`;
}

function renderFloorNavigation(): void {
  const names = ['Artisanat', 'Manufacture', 'Essences rares'];
  const shortNames = ['ÉTAGE 0', 'ÉTAGE 1', 'ÉTAGE 2'];
  byId('active-floor-label').textContent = names[state.currentFloor] + ' · étage ' + state.currentFloor;
  byId('floor-buttons').innerHTML = names.map((name, floor) => {
    const unlocked = state.unlockedFloors.includes(floor);
    const active = state.currentFloor === floor;
    const cost = floor === 0 ? 0 : floorUnlockCost(floor);
    const label = active || unlocked ? name.toUpperCase() : name.toUpperCase() + ' · ' + format(cost);
    return '<button type="button" data-enter-floor="' + floor + '" class="floor-choice ' +
      (active ? 'is-active' : '') + (unlocked ? '' : ' is-locked') + '"' +
      (unlocked && !active ? '' : ' disabled') + ' aria-current="' + (active ? 'true' : 'false') + '">' +
      '<span>' + shortNames[floor] + '</span><strong>' + label + '</strong></button>';
  }).join('');
  const nextFloor = state.currentFloor + 1;
  if (nextFloor > 2) {
    byId('floor-navigation-hint').textContent = 'Dernier étage atteint. Utilise l’escalier descendant ou les boutons ci-dessus.';
    return;
  }
  if (state.unlockedFloors.includes(nextFloor)) {
    byId('floor-navigation-hint').textContent = 'L’escalier montant mène à l’étage suivant. ' +
      (state.currentFloor > 0 ? 'L’escalier descendant ramène à l’étage ' + (state.currentFloor - 1) + '. ' : '') +
      'Les revenus automatisés continuent dans les étages non actifs.';
    return;
  }
  const requiredMachines = nextFloor === 1 ? 2 : 1;
  const installed = MACHINES.filter((machine) => machine.floor === state.currentFloor)
    .reduce((total, machine) => total + state.machines[state.currentWorld][machine.id], 0);
  const missingMachines = Math.max(0, requiredMachines - installed);
  const cost = floorUnlockCost(nextFloor);
  const missingCash = Math.max(0, cost - state.perfumeRevenue);
  const requirements: string[] = [];
  if (missingMachines > 0) requirements.push(missingMachines + ' équipement(s) supplémentaire(s)');
  if (missingCash > 0) requirements.push(format(missingCash) + ' pièces');
  byId('floor-navigation-hint').textContent = 'Près de l’escalier montant : ouvre ' + names[nextFloor] +
    (requirements.length ? ' après avoir obtenu ' + requirements.join(' et ') + '.' : ' dès maintenant.') +
    (state.currentFloor > 0 ? ' L’escalier descendant ramène à l’étage ' + (state.currentFloor - 1) + '.' : '');
}

function renderStore(): void {
  const content = byId('store-content');
  const panels: Record<StoreTab, () => string> = {
    upgrades: renderUpgrades,
    contracts: renderContracts,
    honours: renderHonours,
    worlds: renderWorlds,
    prestige: renderPrestige,
    save: renderSavePanel,
  };
  renderPreservingFocus(content, panels[activeTab](), [
    'data-buy-upgrade', 'data-claim-mission', 'data-enter-world',
  ]);
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
    const selected = button.dataset.tab === activeTab;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-selected', String(selected));
  });
}


function renderSceneSelection(): void {
  const prompt = byId('scene-prompt');
  const button = byId<HTMLButtonElement>('scene-interact');
  const stationNames: Record<WorkshopStation, string> = {
    lavender: 'Parcelle de lavande', mint: 'Parcelle de menthe', rose: 'Roseraie',
    bergamot: 'Bergamotiers', sandalwood: 'Bois de santal', jasmine: 'Jardin de jasmin',
    resin: 'Résine ambrée', laboratory: 'Laboratoire de formulation', counter: 'Comptoir de vente',
    stairs: 'Escalier montant',
    'stairs-down': 'Escalier descendant',
    'lavender-plot-2': 'Parcelle agrandie de lavande',
    'mint-plot-2': 'Parcelle agrandie de menthe',
    'rose-plot-2': 'Parcelle agrandie de rose',
  };
  const order = getActiveCustomerOrder(state);
  const selectedRecipeIsOrder = selectedRecipeId === order.recipeId;
  const orderReady = selectedRecipeIsOrder && canFulfillCustomerOrder(state);
  button.disabled = nearbyStation === null;
  if (!nearbyStation) {
    prompt.textContent = 'Marche jusqu’à un poste, puis appuie sur E ou Interagir.';
  } else if (nearbyStation === 'laboratory') {
    prompt.textContent = stationNames[nearbyStation] + ' · composer la recette active';
  } else if (nearbyStation === 'counter') {
    prompt.textContent = stationNames[nearbyStation] + ' · ' + (
      selectedRecipeIsOrder
        ? orderReady
          ? 'livrer la commande de ' + order.customer
          : 'préparer ' + order.quantity + ' flacon(s) pour ' + order.customer
        : 'vendre la recette active'
    );
  } else if (nearbyStation === 'stairs') {
    prompt.textContent = stationNames[nearbyStation] + ' · ouvrir ou rejoindre l’étage ' + (state.currentFloor + 1);
  } else if (nearbyStation === 'stairs-down') {
    prompt.textContent = stationNames[nearbyStation] + ' · rejoindre l’étage ' + (state.currentFloor - 1);
  } else {
    prompt.textContent = stationNames[nearbyStation] + ' · récolter une matière choisie';
  }
  button.textContent = nearbyStation === 'laboratory'
    ? 'FORMULER · E'
    : nearbyStation === 'counter'
      ? selectedRecipeIsOrder ? (orderReady ? 'LIVRER · E' : 'COMMANDE · E') : 'VENDRE · E'
      : nearbyStation === 'stairs'
        ? 'MONTER · E'
        : nearbyStation === 'stairs-down'
          ? 'DESCENDRE · E'
          : 'INTERAGIR · E';
}

function interactWithStation(station: WorkshopStation): void {
  const expansionMaterial = EXPANSION_PLOT_MATERIALS[station];
  if (MATERIALS.some((material) => material.id === station) || expansionMaterial) {
    const material: MaterialId = expansionMaterial ?? (station as MaterialId);
    const result = harvestMaterial(state, material);
    if (result.state === state) {
      playGameEffect('failure', 'RIEN À RÉCOLTER');
      setStatus('Cette parcelle ne fournit rien pour le moment.');
      return;
    }
    playSound('harvest');
    if (typeof navigator.vibrate === 'function') navigator.vibrate(12);
    state = result.state;
    const definition = MATERIALS.find((item) => item.id === material)!;
    renderAll();
    playGameEffect('harvest', undefined, ['#harvest-last-icon', '#harvest-progress-bar', '#material-inventory .is-latest', '#header-click']);
    floatText('+' + definition.name);
    setStatus('Récolte ciblée : ' + definition.name + '. Retourne au laboratoire pour formuler.');
    saveSoon();
    return;
  }
  const recipe = PERFUME_RECIPES.find((item) => item.id === selectedRecipeId)!;
  if (station === 'laboratory') {
    if (!canCraftPerfume(state, selectedRecipeId)) {
      const missing = Object.entries(recipe.ingredients)
        .filter(([id, amount]) => state.ingredients[id as MaterialId] < (amount ?? 0))
        .map(([id, amount]) => {
          const material = MATERIALS.find((item) => item.id === id)!;
          return material.name + ' × ' + Math.max(0, (amount ?? 0) - state.ingredients[material.id]);
        });
      playGameEffect('failure', 'INGRÉDIENTS MANQUANTS', ['#recipe-list']);
      setStatus('Formulation impossible. Il manque ' + missing.join(', ') + '. Récolte ces matières dans le jardin.');
      return;
    }
    state = craftPerfume(state, selectedRecipeId);
    playSound('craft');
    renderAll();
    playGameEffect('craft', 'FLACON FORMULÉ', ['#perfume-stock-count', '.recipe-row.is-current-recipe .recipe-bottle', '#customer-order-panel']);
    setStatus(recipe.name + ' formulé au laboratoire. Le flacon attend au comptoir.');
    saveSoon();
    return;
  }
  if (station === 'stairs-down') {
    const targetFloor = state.currentFloor - 1;
    if (targetFloor < 0 || !state.unlockedFloors.includes(targetFloor)) {
      setStatus('Cet étage inférieur n’est pas accessible depuis cet escalier.');
      return;
    }
    state = enterFloor(state, targetFloor);
    playSound('unlock');
    renderAll();
    playGameEffect('floor', 'ÉTAGE ' + targetFloor, ['#active-floor-label', '#floor-buttons']);
    setStatus('Tu es redescendu à l’étage ' + targetFloor + ' · ' +
      ['Artisanat', 'Manufacture', 'Essences rares'][targetFloor] + '.');
    saveSoon();
    return;
  }
  if (station === 'stairs') {
    const targetFloor = state.currentFloor + 1;
    if (targetFloor > 2) {
      setStatus('Tu es au dernier étage. Utilise le sélecteur des étages pour redescendre.');
      return;
    }
    if (!state.unlockedFloors.includes(targetFloor)) {
      const requiredMachines = targetFloor === 1 ? 2 : 1;
      const installed = MACHINES.filter((machine) => machine.floor === state.currentFloor)
        .reduce((total, machine) => total + state.machines[state.currentWorld][machine.id], 0);
      if (installed < requiredMachines) {
        setStatus('Pour ouvrir l’étage ' + targetFloor + ', installe encore ' +
          (requiredMachines - installed) + ' équipement(s) à l’étage actuel.');
        return;
      }
      const cost = floorUnlockCost(targetFloor);
      if (state.perfumeRevenue < cost) {
        setStatus('L’accès à l’étage ' + targetFloor + ' coûte ' + format(cost) +
          ' pièces. Il t’en manque ' + format(cost - state.perfumeRevenue) + '.');
        return;
      }
      if (!canUnlockFloor(state, targetFloor)) {
        setStatus('Cet étage ne peut pas encore être ouvert depuis l’escalier.');
        return;
      }
      state = unlockFloor(state, targetFloor);
      playSound('unlock');
    }
    state = enterFloor(state, targetFloor);
    renderAll();
    playGameEffect('floor', 'ÉTAGE ' + targetFloor + ' OUVERT', ['#active-floor-label', '#floor-buttons']);
    setStatus('Étage ouvert : ' + ['Artisanat', 'Manufacture', 'Essences rares'][targetFloor] +
      '. Les machines de cet étage sont maintenant accessibles.');
    saveSoon();
    return;
  }
  const order = getActiveCustomerOrder(state);
  if (selectedRecipeId === order.recipeId) {
    const available = state.perfumeStock[selectedRecipeId];
    if (available < order.quantity) {
      setStatus('Commande de ' + order.customer + ' : ' + order.quantity + ' flacon(s) de ' + recipe.name +
        ' requis, ' + available + ' disponible(s). Prépare les flacons au laboratoire avant de revenir au comptoir.');
      return;
    }
    const reputationBefore = getHouseReputation(state);
    state = fulfillCustomerOrder(state);
    const reputationAfter = getHouseReputation(state);
    playSound('order');
    renderAll();
    playGameEffect('order', undefined, ['#header-money', '#lifetime-sales', '#customer-order-panel', '#perfume-stock-count']);
    if (reputationAfter.rank > reputationBefore.rank) {
      window.setTimeout(() => playSound('level-up'), 220);
      playGameEffect('level-up', 'RANG DE RÉPUTATION ' + reputationAfter.rank, ['.customer-reputation', '#customer-order-panel']);
    }
    setStatus('Commande #' + order.orderNumber + ' livrée à ' + order.customer + ' : ' +
      order.quantity + ' × ' + recipe.name + ', prime comprise : +' + format(order.reward) + ' pièces.');
    floatText('+' + format(order.reward) + ' pièces');
    saveSoon();
    return;
  }
  if (state.perfumeStock[selectedRecipeId] <= 0) {
    setStatus('Aucun flacon de ' + recipe.name + ' en stock. Compose cette recette au laboratoire avant de la vendre.');
    return;
  }
  const price = perfumeSalePrice(state, selectedRecipeId);
  state = sellPerfume(state, selectedRecipeId);
  playSound('sell');
  renderAll();
  playGameEffect('sell', undefined, ['#header-money', '#header-run', '#lifetime-sales', '#perfume-stock-count']);
  setStatus(recipe.name + ' vendu au comptoir pour ' + format(price) + ' pièces.');
  saveSoon();
}


function currentCustomerVisual() {
  const order = getActiveCustomerOrder(state);
  return {
    name: order.customer,
    orderNumber: order.orderNumber,
    quantity: order.quantity,
    stock: state.perfumeStock[order.recipeId],
    ready: canFulfillCustomerOrder(state),
  };
}

function renderAll(): void {
  workshopScene?.setEnvironment(getWorld(state.currentWorld), state.currentFloor, MACHINES.map((machine) => ({
    id: machine.id, short: machine.short, name: machine.name, floor: machine.floor,
    count: state.machines[state.currentWorld][machine.id],
  })), state.outsideExpansions, currentCustomerVisual());
  renderStats();
  renderFloorNavigation();
  renderHarvestView();
  renderBotanicalExpansion();
  renderRecipeWorkshop();
  renderSceneSelection();
  renderMachines();
  renderStore();
}

let gameAnimationSequence = 0;

function animateUiElements(selectors: string[], effect: WorkshopEffect): void {
  const sequence = ++gameAnimationSequence;
  for (const selector of selectors) {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      element.classList.remove('game-feedback-pulse');
      for (const className of Array.from(element.classList)) {
        if (className.startsWith('game-feedback--')) element.classList.remove(className);
      }
      element.dataset.feedbackSequence = String(sequence);
      void element.offsetWidth;
      element.classList.add('game-feedback-pulse', 'game-feedback--' + effect);
      window.setTimeout(() => {
        if (element.dataset.feedbackSequence !== String(sequence)) return;
        element.classList.remove('game-feedback-pulse', 'game-feedback--' + effect);
        delete element.dataset.feedbackSequence;
      }, effect === 'ascension' || effect === 'rebirth' || effect === 'world' ? 1400 : 820);
    });
  }
}

function playGameEffect(effect: WorkshopEffect, label?: string, selectors: string[] = []): void {
  const stage = byId('workshop-stage-frame');
  const sequence = ++gameAnimationSequence;
  workshopScene?.playEffect(effect);
  for (const className of Array.from(stage.classList)) {
    if (className.startsWith('game-effect--')) stage.classList.remove(className);
  }
  stage.dataset.gameEffectSequence = String(sequence);
  stage.classList.remove('game-effect-active');
  void stage.offsetWidth;
  stage.classList.add('game-effect-active', 'game-effect--' + effect);
  window.setTimeout(() => {
    if (stage.dataset.gameEffectSequence !== String(sequence)) return;
    stage.classList.remove('game-effect-active', 'game-effect--' + effect);
    delete stage.dataset.gameEffectSequence;
  }, effect === 'ascension' || effect === 'rebirth' || effect === 'world' ? 1450 : 850);

  stage.querySelector('.game-action-label')?.remove();
  if (label) {
    const chip = document.createElement('div');
    chip.className = 'game-action-label game-action-label--' + effect;
    chip.textContent = label;
    chip.setAttribute('aria-hidden', 'true');
    stage.appendChild(chip);
    window.setTimeout(() => chip.remove(), 1300);
  }
  animateUiElements(selectors, effect);
}

function saveSoon(): void {
  autoSaveElapsed = Math.max(autoSaveElapsed, 8);
}

function floatText(label: string, event?: MouseEvent): void {
  const stage = byId('workshop-stage-frame');
  const rect = stage.getBoundingClientRect();
  const floating = document.createElement('span');
  floating.className = 'floating-reward floating-material';
  floating.textContent = label;
  const x = event ? event.clientX - rect.left : rect.width * 0.54;
  const y = event ? event.clientY - rect.top : rect.height * 0.5;
  floating.style.left = Math.max(12, Math.min(rect.width - 130, x)) + 'px';
  floating.style.top = Math.max(12, Math.min(rect.height - 28, y)) + 'px';
  stage.appendChild(floating);
  window.setTimeout(() => floating.remove(), 950);
}

function renderRecipeWorkshop(): void {
  const totalStock = Object.values(state.perfumeStock).reduce((sum, count) => sum + count, 0);
  byId('perfume-stock-count').textContent = format(totalStock, 0) + ' flacon' + (totalStock === 1 ? '' : 's');
  byId('selected-recipe-name').textContent = PERFUME_RECIPES.find((recipe) => recipe.id === selectedRecipeId)?.name ?? 'Aucune';
  byId('recipe-list').innerHTML = PERFUME_RECIPES.map((recipe) => {
    const stock = state.perfumeStock[recipe.id];
    const ingredients = Object.entries(recipe.ingredients).map(([id, amount]) => {
      const material = MATERIALS.find((item) => item.id === id)!;
      return '<span class="recipe-ingredient" title="' + material.name + ' × ' + amount + '"><img src="' + material.asset + '" alt="" /><small>×' + amount + '</small></span>';
    }).join('');
    const canCraft = canCraftPerfume(state, recipe.id);
    const price = perfumeSalePrice(state, recipe.id);
    const selected = selectedRecipeId === recipe.id;
    return `
      <article class="recipe-row ${stock > 0 ? 'has-stock' : ''} ${selected ? 'is-current-recipe' : ''}">
        <div class="recipe-bottle"><img src="/assets/bottle-product.svg" alt="" /></div>
        <div class="recipe-info"><h3>${recipe.name}</h3><p>${recipe.description}</p><div class="recipe-ingredients">${ingredients}</div><small>VENTE · ${format(price)} pièces · STOCK ${format(stock, 0)}</small></div>
        <div class="recipe-actions"><button type="button" data-select-recipe="${recipe.id}" class="${selected ? 'is-selected' : ''}">${selected ? 'RECETTE CHOISIE' : 'CHOISIR'}</button><small>${canCraft ? 'Ingrédients disponibles' : 'Ingrédients manquants'}</small></div>
      </article>`;
  }).join('');
  renderCustomerOrder();
}

function renderCustomerOrder(): void {
  const order = getActiveCustomerOrder(state);
  const recipe = PERFUME_RECIPES.find((item) => item.id === order.recipeId)!;
  const stock = state.perfumeStock[order.recipeId];
  const ready = canFulfillCustomerOrder(state);
  const reputation = getHouseReputation(state);
  const initials = order.customer.split(' ').map((part) => part[0]).join('');
  byId('customer-order-panel').innerHTML =
    '<article class="customer-order-card ' + (ready ? 'is-ready' : '') + '">' +
      '<div class="customer-order-topline"><span class="eyebrow">COMMANDE CLIENT #' + format(order.orderNumber, 0) + '</span><span class="customer-order-premium">+' + order.premiumPercent + ' %</span></div>' +
      '<div class="customer-order-client"><span class="customer-order-initials" aria-hidden="true">' + initials + '</span>' +
        '<span class="customer-order-identity"><strong>' + order.customer + '</strong><small>' + order.atelier + '</small></span></div>' +
      '<div class="customer-reputation">' +
        '<div class="customer-reputation-heading"><span>RÉPUTATION DE LA MAISON</span><strong>Rang ' + reputation.rank + ' / ' + reputation.maxRank + '</strong></div>' +
        '<div class="customer-reputation-track" role="progressbar" aria-label="Progression de la réputation" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + reputation.progressPercent + '"><i style="width:' + reputation.progressPercent + '%"></i></div>' +
        '<small>' + format(reputation.points, 0) + ' points · ' + (reputation.rank >= reputation.maxRank ? 'rang maximal atteint' : format(100 - reputation.pointsIntoRank, 0) + ' points avant le rang suivant') + '</small>' +
      '</div>' +
      '<p class="customer-order-request">' + order.request + '</p>' +
      '<div class="customer-order-data">' +
        '<span><small>FORMULE</small><strong>' + recipe.name + '</strong></span>' +
        '<span><small>QUANTITÉ</small><strong>' + order.quantity + ' flacon' + (order.quantity > 1 ? 's' : '') + '</strong></span>' +
        '<span><small>EN STOCK</small><strong>' + stock + ' / ' + order.quantity + '</strong></span></div>' +
      '<div class="customer-order-payout">' +
        '<span><small>VENTE NORMALE</small><strong>' + format(order.normalValue) + ' pièces</strong></span>' +
        '<span><small>PAIEMENT CLIENT</small><strong>' + format(order.reward) + ' pièces</strong></span></div>' +
      '<p class="customer-order-hint">' + (ready
        ? 'Prête à livrer. Sélectionne cette formule et interagis avec le comptoir.'
        : 'Prépare la quantité demandée, puis livre la commande au comptoir. La prime est versée une seule fois.') + '</p>' +
    '</article>';
}

function buyMachineById(machineId: MachineId): void {
  const previous = state;
  state = buyMachine(state, machineId);
  if (state === previous) {
    setStatus('Il te faut encore ' + format(Math.max(0, machineCost(state, machineId) - state.perfumeRevenue)) + ' parfums pour cet équipement.');
    return;
  }
  playSound('purchase');
  renderAll();
  playGameEffect('purchase', 'ÉQUIPEMENT INSTALLÉ', ['[data-buy-machine="' + machineId + '"]', '#machine-count', '#factory-cps', '#header-money']);
  setStatus(getMachineLabel(machineId) + ' installé : la production automatique augmente.');
  saveSoon();
}

function getMachineLabel(machineId: MachineId): string {
  return MACHINES.find((machine) => machine.id === machineId)?.name ?? 'Équipement';
}

function buyUpgradeById(upgradeId: UpgradeId): void {
  const previous = state;
  state = buyUpgrade(state, upgradeId);
  if (state === previous) {
    const cost = upgradeCost(state, upgradeId);
    setStatus(state.upgrades[upgradeId] >= MAX_UPGRADE_LEVEL
      ? 'Cette recherche a atteint son niveau maximal.'
      : 'Fonds insuffisants : il manque ' + format(Math.max(0, cost - state.perfumeRevenue)) + ' parfums.');
    return;
  }
  playSound('purchase');
  renderAll();
  playGameEffect('purchase', 'RECHERCHE AMÉLIORÉE', ['[data-buy-upgrade="' + upgradeId + '"]', '#header-money', '#header-cps']);
  setStatus('Recherche appliquée : ' + UPGRADES[upgradeId].name + '.');
  saveSoon();
}

function claimContract(missionId: MissionId): void {
  if (!canClaimMission(state, missionId)) return;
  state = claimMission(state, missionId);
  const mission = MISSION_DEFINITIONS.find((item) => item.id === missionId);
  playSound('mission');
  renderAll();
  playGameEffect('mission', 'CONTRAT ACCOMPLI', ['#header-money', '#store-content .mission-row', '#header-run']);
  setStatus('Contrat réclamé : +' + format(mission?.reward ?? 0) + ' parfums.');
  saveSoon();
}

function switchWorld(worldId: WorldId): void {
  if (!state.unlockedWorlds.includes(worldId)) {
    const world = getWorld(worldId);
    setStatus('Cette collection requiert ' + world.unlockRebirths + ' rebirth(s) normaux.');
    return;
  }
  state = enterWorld(state, worldId);
  renderAll();
  playGameEffect('world', getWorld(worldId).name.toUpperCase(), ['#current-world-line', '#store-content']);
  setStatus('Collection active : ' + getWorld(worldId).name + '.');
  saveSoon();
}

function doRebirth(): void {
  if (!canRebirth(state)) return;
  const accepted = window.confirm(
    'REBIRTH NORMAL\n\nTu perdras le stock du run et tous les équipements de production. Les recherches et ventes cumulées resteront acquises. Le multiplicateur de production augmentera de 60 %.\n\nContinuer ?',
  );
  if (!accepted) return;
  state = normalizeGameState(performRebirth(state));
  playSound('prestige');
  renderAll();
  playGameEffect('rebirth', 'REBIRTH · +60 % DE PRODUCTION', ['#header-cps', '#current-rank', '#header-money', '#store-content']);
  setStatus('Rebirth effectué. La prochaine maison produira 60 % plus vite.');
  save();
}

function doTotalRebirth(): void {
  if (!canTotalRebirth(state)) return;
  const reward = 1 + state.totalRebirths;
  const accepted = window.confirm(
    'ASCENSION TOTALE\n\nCette action efface les parfums, équipements, recherches, contrats et collections ouvertes. Tu recevras ' +
    reward + ' Essence(s) originelle(s), conservées définitivement.\n\nContinuer ?',
  );
  if (!accepted) return;
  state = normalizeGameState(performTotalRebirth(state));
  playSound('prestige');
  renderAll();
  playGameEffect('ascension', 'ASCENSION · ESSENCE ORIGINELLE', ['#header-cps', '#current-rank', '#header-money', '#store-content']);
  setStatus('Ascension accomplie. Les Essences originelles renforcent définitivement tes prochaines maisons.');
  save();
}

function exportSave(): string {
  const raw = exportSaveFile(state, Date.now());
  byId<HTMLTextAreaElement>('save-data-text').value = raw;
  return raw;
}

function downloadSave(): void {
  const raw = exportSave();
  const file = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'parfum-empire-save.json';
  link.click();
  URL.revokeObjectURL(url);
  playGameEffect('save', 'EXPORT PRÊT', ['#save-indicator', '#store-content']);
  setStatus('Sauvegarde JSON exportée.');
}

function applyImportedSave(raw: string): void {
  const imported = parseImportedSave(raw);
  if (!imported) {
    playGameEffect('failure', 'IMPORT REFUSÉ');
    setStatus('Fichier invalide. La partie actuelle n’a pas été modifiée.');
    return;
  }
  state = normalizeGameState(imported);
  renderAll();
  save();
  playGameEffect('unlock', 'SAUVEGARDE IMPORTÉE', ['#header-money', '#header-cps', '#save-indicator']);
  setStatus('Sauvegarde importée avec succès.');
}

function eraseSave(): void {
  if (!window.confirm('Effacer définitivement la progression locale et recommencer depuis zéro ?')) return;
  state = normalizeGameState(createInitialState());
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(BACKUP_SAVE_KEY);
    localStorage.removeItem(LEGACY_SAVE_KEY);
  } catch {
    // The game remains playable without persistent storage.
  }
  renderAll();
  save();
  playGameEffect('ascension', 'NOUVELLE PARTIE', ['#header-money', '#header-cps', '#store-content']);
  setStatus('Nouvelle partie créée. Ta maison repart de zéro.');
}

// Keep native Tab and Enter/Space behavior available to keyboard users.
app.addEventListener('click', (event) => {
  if (!(event instanceof MouseEvent)) return;
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>('button') : null;
  if (!target) return;

  if (target.dataset.selectRecipe) {
    selectedRecipeId = target.dataset.selectRecipe as RecipeId;
    renderRecipeWorkshop();
    renderSceneSelection();
    playGameEffect('selection', undefined, ['.recipe-row.is-current-recipe', '#selected-recipe-name']);
    setStatus('Recette active : ' + (PERFUME_RECIPES.find((recipe) => recipe.id === selectedRecipeId)?.name ?? selectedRecipeId) + '. Rejoins le laboratoire pour composer ou le comptoir pour vendre.');
    return;
  }
  if (target.dataset.sceneMove) {
    if (target.dataset.holdMoved === 'true') {
      target.dataset.holdMoved = 'false';
    } else {
      workshopScene?.move(target.dataset.sceneMove as MoveDirection);
    }
    return;
  }
  if (target.id === 'scene-interact') {
    workshopScene?.interact();
    return;
  }
  if (target.id === 'open-settings') {
    activeTab = 'save';
    renderStore();
    return;
  }
  if (target.dataset.tab) {
    activeTab = target.dataset.tab as StoreTab;
    renderStore();
    animateUiElements(['#store-content'], 'selection');
    return;
  }
  if (target.dataset.buyMachine) {
    buyMachineById(target.dataset.buyMachine as MachineId);
    return;
  }
  if (target.dataset.buyBotanicalExpansion !== undefined) {
    const previous = state;
    state = unlockBotanicalExpansion(state);
    if (state === previous) {
      setStatus('Il faut plus de pièces pour ouvrir la prochaine parcelle botanique.');
      return;
    }
    const plotName = EXPANSION_PLOT_NAMES[state.outsideExpansions - 1] ?? 'nouvelle parcelle';
    playSound('unlock');
    renderAll();
    setStatus(plotName + ' est maintenant accessible dans le jardin.');
    saveSoon();
    return;
  }
  if (target.dataset.buyUpgrade) {
    buyUpgradeById(target.dataset.buyUpgrade as UpgradeId);
    return;
  }
  if (target.dataset.claimMission) {
    claimContract(target.dataset.claimMission as MissionId);
    return;
  }
  if (target.dataset.enterFloor !== undefined) {
    const floor = Number(target.dataset.enterFloor);
    if (Number.isInteger(floor) && state.unlockedFloors.includes(floor)) {
      state = enterFloor(state, floor);
      renderAll();
      playGameEffect('floor', 'ÉTAGE ' + floor, ['#active-floor-label', '#floor-buttons']);
      setStatus('Tu es maintenant à l’étage ' + floor + ' : ' +
        ['Artisanat', 'Manufacture', 'Essences rares'][floor] + '.');
      saveSoon();
    }
    return;
  }
  if (target.dataset.enterWorld) {
    switchWorld(target.dataset.enterWorld as WorldId);
    return;
  }
  if (target.id === 'rebirth-button') {
    doRebirth();
    return;
  }
  if (target.id === 'total-rebirth-button') {
    doTotalRebirth();
    return;
  }
  if (target.id === 'save-now') {
    save();
    playGameEffect('save', 'PROGRESSION SAUVEGARDÉE', ['#save-indicator', '#header-money']);
    setStatus('Progression sauvegardée localement.');
    return;
  }
  if (target.id === 'export-save') {
    downloadSave();
    return;
  }
  if (target.id === 'copy-save') {
    const raw = exportSave();
    if (!navigator.clipboard?.writeText) {
      setStatus('Le texte JSON est prêt dans la zone de sauvegarde : copie-le manuellement.');
    } else {
      void navigator.clipboard.writeText(raw).then(
        () => setStatus('Sauvegarde copiée dans le presse-papiers.'),
        () => setStatus('Le texte JSON est prêt dans la zone de sauvegarde : copie-le manuellement.'),
      );
    }
    return;
  }
  if (target.id === 'import-file-button') {
    byId<HTMLInputElement>('import-file').click();
    return;
  }
  if (target.id === 'import-save') {
    const raw = byId<HTMLTextAreaElement>('save-data-text').value.trim();
    if (raw) applyImportedSave(raw);
    else setStatus('Colle d’abord les données JSON dans la zone de texte.');
    return;
  }
  if (target.id === 'erase-save') {
    eraseSave();
  }
});

app.addEventListener('change', (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.id === 'dark-mode-toggle') {
    document.body.classList.toggle('theme-dark', target.checked);
  }
  if (target instanceof HTMLInputElement && target.id === 'sound-enabled-toggle') {
    soundEnabled = target.checked;
    try {
      localStorage.setItem(SOUND_KEY, String(soundEnabled));
    } catch {
      // The preference remains active for this tab even without storage.
    }
    if (soundEnabled) playSound('unlock');
    animateUiElements(['#open-settings'], 'selection');
    setStatus(soundEnabled ? 'Effets sonores activés.' : 'Effets sonores désactivés.');
  }
});

byId<HTMLInputElement>('import-file').addEventListener('change', async (event) => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  applyImportedSave(await file.text());
  input.value = '';
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    save();
    return;
  }

  const revenueBeforeCatchUp = state.perfumeRevenue;
  state = applyOfflineProgress(state, Date.now());
  const revenueGained = state.perfumeRevenue - revenueBeforeCatchUp;
  save();
  renderAll();
  if (revenueGained > 0) {
    playGameEffect('level-up', 'REVENUS HORS LIGNE · +' + format(revenueGained), ['#header-money', '#header-run', '#factory-cps']);
    setStatus('Pendant ton absence, la manufacture a généré ' + format(revenueGained) + ' pièces nettes.');
  }
});
window.addEventListener('beforeunload', save);

function gameTick(now: number): void {
  const elapsed = Math.min(1, Math.max(0, (now - lastTick) / 1000));
  lastTick = now;
  if (elapsed > 0 && document.visibilityState === 'visible') {
    const cps = netProductionPerSecond(state);
    if (cps > 0) state = addPerfumeRevenue(state, cps * elapsed);
    autoSaveElapsed += elapsed;
    if (autoSaveElapsed >= 10) {
      save();
      autoSaveElapsed = 0;
    }
    const second = Math.floor(now / 1000);
    if (now - lastStatsUpdate >= 100 || second !== lastPassiveUiSecond) {
      renderStats();
      lastStatsUpdate = now;
    }
    if (second !== lastPassiveUiSecond) {
      lastPassiveUiSecond = second;
      renderMachines();
      if (activeTab !== 'save') renderStore();
    }
  }
  requestAnimationFrame(gameTick);
}

renderAll();
workshopScene = createWorkshopScene(byId<HTMLCanvasElement>('workshop-canvas'), interactWithStation, (station) => {
  nearbyStation = station;
  renderSceneSelection();
});
workshopScene.setEnvironment(getWorld(state.currentWorld), state.currentFloor, MACHINES.map((machine) => ({
  id: machine.id, short: machine.short, name: machine.name, floor: machine.floor,
  count: state.machines[state.currentWorld][machine.id],
})), state.outsideExpansions, currentCustomerVisual());
renderFloorNavigation();

// Hold a direction on touchscreens for continuous movement, while preserving tap-to-step.
const touchControls = document.querySelector<HTMLElement>('.scene-touch-controls');
let touchMoveInterval: ReturnType<typeof setInterval> | null = null;
const stopTouchMovement = (): void => {
  if (touchMoveInterval !== null) clearInterval(touchMoveInterval);
  touchMoveInterval = null;
};
touchControls?.addEventListener('pointerdown', (event) => {
  const button = event.target instanceof Element
    ? event.target.closest<HTMLButtonElement>('[data-scene-move]')
    : null;
  if (!button || button.disabled) return;
  event.preventDefault();
  stopTouchMovement();
  button.dataset.holdMoved = 'true';
  const direction = button.dataset.sceneMove as MoveDirection;
  workshopScene?.move(direction);
  touchMoveInterval = setInterval(() => workshopScene?.move(direction), 115);
});
window.addEventListener('pointerup', stopTouchMovement);
window.addEventListener('pointercancel', stopTouchMovement);
window.addEventListener('blur', stopTouchMovement);
save();
if (saveRecoveryMessage) setStatus(saveRecoveryMessage);
requestAnimationFrame(gameTick);
