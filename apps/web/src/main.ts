import {
  addPerfumeRevenue,
  buyMachine,
  buyUpgrade,
  canClaimMission,
  canCompleteCustomerOrder,
  canCraftPerfume,
  canRebirth,
  canTotalRebirth,
  claimMission,
  completeCustomerOrder,
  createInitialState,
  customerOrderCost,
  customerOrderReward,
  craftPerfume,
  enterWorld,
  ESSENCE_PRESTIGE_VALUE,
  essenceMultiplier,
  exportSaveFile,
  getWorld,
  harvestIngredient,
  perfumeSalePrice,
  PERFUME_RECIPES,
  MATERIALS,
  MACHINES,
  MAX_UPGRADE_LEVEL,
  MISSION_DEFINITIONS,
  machineCost,
  missionProgress,
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
  type UpgradeId,
  type WorldId,
} from './economy';
import './style.css';

const SAVE_KEY = 'parfum-empire-save-v1';
const LEGACY_SAVE_KEY = 'cookie-dominion-save-v1';
const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing app root');

type StoreTab = 'upgrades' | 'contracts' | 'honours' | 'worlds' | 'prestige' | 'save';
let activeTab: StoreTab = 'upgrades';
let statusMessage = 'Ta première fragrance t’attend. Clique sur le flacon pour commencer.';
let lastTick = performance.now();
let lastStatsUpdate = 0;
let lastPassiveUiSecond = -1;
let autoSaveElapsed = 0;
let rareNextAt = performance.now() + 24_000;
let rareExpiresAt = 0;
let rareBoostUntil = 0;
let rareUiSecond = -1;
let state: GameState;

function normalizeClickerState(value: GameState): GameState {
  return {
    ...value,
    rampBuilt: true,
    currentFloor: 0,
    unlockedFloors: [0],
    lastSavedAt: Date.now(),
  };
}

try {
  const saved = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(LEGACY_SAVE_KEY);
  state = normalizeClickerState(parseSavedState(saved));
} catch {
  state = normalizeClickerState(createInitialState());
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
        <div class="header-stat"><span>PRODUCTION</span><strong id="header-cps">0</strong><small>par seconde</small></div>
        <div class="header-stat"><span>MATIÈRES</span><strong id="header-click">0</strong><small>ingrédients en stock</small></div>
        <div class="header-stat"><span>VIE DU RUN</span><strong id="header-run">0</strong><small>produits cumulés</small></div>
        <button id="open-settings" class="icon-button" type="button" title="Paramètres et sauvegarde" aria-label="Paramètres et sauvegarde">☷</button>
      </div>
    </header>

    <div class="progress-strip">
      <span class="live-indicator"></span>
      <span id="current-world-line">JARDIN DE VERRE</span>
      <span class="progress-separator">/</span>
      <span id="current-rank">Maison indépendante · Rang 1</span>
      <span id="global-status" role="status">Ta première fragrance t’attend.</span>
      <span id="save-indicator">SAUVEGARDE LOCALE</span>
    </div>

    <div class="clicker-layout">
      <section class="column click-column">
        <div class="section-heading click-heading">
          <div><span class="eyebrow">01 · CRÉATION</span><h1>Le parfumeur</h1></div>
          <span class="stamped-tag">ATELIER</span>
        </div>
        <div class="click-card">
          <div class="click-card-topline"><span>RÉCOLTE BOTANIQUE</span><span id="click-multiplier">BUTIN ALÉATOIRE</span></div>
          <div class="clicker-stage" id="clicker-stage">
            <div class="bottle-halo" aria-hidden="true"></div>
            <div class="bottle-orbit orbit-one" aria-hidden="true"></div>
            <div class="bottle-orbit orbit-two" aria-hidden="true"></div>
            <button id="perfume-clicker" class="perfume-clicker" type="button" aria-label="Récolter une matière botanique aléatoire">
              <img src="/assets/material-unknown.svg" alt="Matière inconnue" draggable="false" />
            </button>
            <div class="crafted-flacon-pop" id="crafted-flacon-pop" aria-hidden="true"><img src="/assets/bottle-product.svg" alt="" /></div>
            <span class="stage-caption">RÉCOLTE · COMBINAISONS · VENTES</span>
          </div>
          <div class="harvest-summary" aria-live="polite">
            <span class="last-drop-icon"><img id="harvest-last-icon" src="/assets/material-unknown.svg" alt="" /></span>
            <span class="last-drop-copy"><small>DERNIÈRE DÉCOUVERTE</small><strong id="harvest-last-name">Objet inconnu</strong><em id="harvest-last-rarity">La nature réserve une surprise.</em></span>
            <span class="harvest-counter"><strong id="harvest-progress">0</strong><small>en stock</small></span>
          </div>
          <div class="harvest-progress-track"><i id="harvest-progress-bar"></i></div>
          <div class="click-instructions">
            <strong>Récolte des matières premières</strong>
            <span>Chaque clic donne une matière. Combine les ingrédients dans une recette, puis vends le flacon.</span>
          </div>
          <div class="material-codex-heading"><span>CARNET BOTANIQUE</span><span id="material-discovered-count">0 découvertes</span></div>
          <div id="material-inventory" class="material-inventory"></div>
          <section class="recipe-workshop" aria-labelledby="recipe-workshop-title">
            <div class="recipe-workshop-heading"><div><span class="eyebrow">FORMULATION ARTISANALE</span><h2 id="recipe-workshop-title">Combinaisons & ventes</h2></div><span id="perfume-stock-count">0 flacon</span></div>
            <p class="recipe-workshop-intro">Les premiers parfums valent peu. Récolte les matières, compose une recette et vends les flacons pour financer la manufacture.</p>
            <div id="recipe-list" class="recipe-list"></div>
          </section>
          <div class="click-card-footer">
            <span>RÉCOLTES EFFECTUÉES</span><strong id="session-clicks">0</strong>
          </div>
        </div>

        <button id="rare-flacon" class="rare-event" type="button" disabled>
          <span class="rare-event-art"><img src="/assets/bottle-rare.svg" alt="" /></span>
          <span class="rare-event-copy"><span class="eyebrow">ÉVÉNEMENT RARE</span><strong id="rare-event-title">Flacon mythique</strong><small id="rare-flacon-status">Arrive dans 24 secondes</small></span>
          <span class="rare-event-badge" id="rare-event-mark">×2</span>
        </button>
        <div id="boost-status" class="boost-status" hidden>
          <span class="boost-symbol">✦</span><span><strong>ÉCLAT MYTHIQUE ACTIF</strong><small id="boost-countdown">Production doublée</small></span>
          <div class="boost-progress"><i id="boost-progress-bar"></i></div>
        </div>

        <section class="order-card">
          <div class="section-heading compact-heading"><div><span class="eyebrow">VENTES PRIVÉES</span><h2>Commande VIP</h2></div><span class="order-seal">VIP</span></div>
          <p>Prépare un lot spécial pour la clientèle de la maison. Les contrats deviennent plus lucratifs à chaque livraison.</p>
          <div class="order-values">
            <span><small>LOT À PRÉPARER</small><strong id="order-cost">120</strong></span>
            <span><small>PAIEMENT</small><strong id="order-reward">216</strong></span>
            <span><small>LIVRAISONS</small><strong id="order-count">0</strong></span>
          </div>
          <button id="complete-order" class="secondary-button" type="button">LIVRER LA COMMANDE <span>↗</span></button>
        </section>

        <div class="mini-metrics">
          <div><span>Ventes cumulées</span><strong id="lifetime-sales">0</strong></div>
          <div><span>Flacons mythiques</span><strong id="rare-count">0</strong></div>
        </div>
      </section>

      <section class="column production-column">
        <div class="section-heading">
          <div><span class="eyebrow">02 · AUTOMATISATION</span><h1>La manufacture</h1><p class="heading-note">Chaque équipement produit en continu, même sans clic.</p></div>
          <div class="production-totals"><strong id="factory-cps">0</strong><small>PAR SECONDE</small></div>
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
      <span>PARFUM EMPIRE <i>—</i> MAISON DES ESSENCES</span>
      <span>PRODUCTION CONTINUE · SAUVEGARDE AUTOMATIQUE</span>
      <span id="footer-version">V. 0.4.0 · BOTANICAL CLICKER</span>
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
  byId('global-status').textContent = message;
}

function save(): void {
  const now = Date.now();
  state = { ...state, lastSavedAt: now, currentFloor: 0, unlockedFloors: [0], rampBuilt: true };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
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
    ? latest.rarity + ' · nouvelle trouvaille'
    : 'Le prochain clic révélera une matière.';
  const ingredientTotal = Object.values(state.ingredients).reduce((sum, count) => sum + count, 0);
  byId('harvest-progress').textContent = format(ingredientTotal, 0);
  byId('harvest-progress-bar').style.width = Math.min(100, ingredientTotal / 20 * 100) + '%';

  const mainButton = byId<HTMLButtonElement>('perfume-clicker');
  const mainImage = mainButton.querySelector<HTMLImageElement>('img');
  if (mainImage) {
    mainImage.src = source;
    mainImage.alt = latest ? latest.name : 'Matière botanique inconnue';
  }
  mainButton.setAttribute('aria-label', 'Récolter une matière botanique aléatoire. Les ingrédients restent en stock jusqu’à la composition manuelle.');

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

function renderStats(): void {
  const world = getWorld(state.currentWorld);
  const cps = productionPerSecond(state);
  byId('header-money').textContent = format(state.perfumeRevenue);
  byId('header-money').title = formatExact(state.perfumeRevenue) + ' pièces';
  byId('header-cps').textContent = format(cps);
  byId('header-click').textContent = format(Object.values(state.ingredients).reduce((sum, count) => sum + count, 0), 0);
  byId('header-run').textContent = format(state.runPerfumeRevenue);
  byId('factory-cps').textContent = format(cps);
  byId('session-clicks').textContent = format(state.gatherClicks, 0);
  byId('lifetime-sales').textContent = format(state.lifetimePerfumeRevenue);
  byId('rare-count').textContent = format(state.rareFlaconsClaimed, 0);
  byId('current-world-line').textContent = world.name.toUpperCase();
  byId('current-rank').textContent = 'Maison indépendante · Rang ' + (1 + state.rebirths + state.totalRebirths * 10);
  byId('click-multiplier').textContent = state.upgrades.clickPower > 0 ? '+' + (state.upgrades.clickPower * 8) + '% BUTIN BONUS' : 'BUTIN ALÉATOIRE';
  byId('global-status').textContent = statusMessage;
  byId('order-count').textContent = format(state.ordersCompleted, 0);
  byId('order-cost').textContent = format(customerOrderCost(state));
  byId('order-reward').textContent = format(customerOrderReward(state));
  byId('factory-status').textContent = currentWorldMachineTotal() === 0
    ? 'La première ligne attend son équipement.'
    : currentWorldMachineTotal() + ' équipement(s) en service dans cette collection.';
  byId('factory-detail').textContent = cps > 0
    ? format(cps) + ' pièces sont générées chaque seconde.'
    : 'Vends tes premiers flacons ou investis dans une machine pour lancer les revenus automatiques.';
  byId('machine-count').textContent = format(currentWorldMachineTotal(), 0) + ' INSTALLÉ' + (currentWorldMachineTotal() > 1 ? 'S' : '');
  byId('complete-order').toggleAttribute('disabled', !canCompleteCustomerOrder(state));
  byId('complete-order').title = canCompleteCustomerOrder(state)
    ? 'Livrer cette commande et recevoir ' + formatExact(customerOrderReward(state)) + ' parfums.'
    : 'Il manque ' + formatExact(Math.max(0, customerOrderCost(state) - state.perfumeRevenue)) + ' parfums pour préparer le lot.';
  renderRareFlacon(performance.now());
}

function renderMachines(): void {
  const list = byId('machine-list');
  const current = state.machines[state.currentWorld];
  const catalog = MACHINES;
  list.innerHTML = catalog.map((machine, index) => {
    const owned = current[machine.id];
    const cost = machineCost(state, machine.id);
    const canAfford = state.perfumeRevenue >= cost;
    const perSecond = (machine.payout / machine.cycleSeconds) *
      getWorld(state.currentWorld).incomeMultiplier *
      (1 + state.upgrades.production * 0.2) *
      (1.6 ** state.rebirths) *
      essenceMultiplier(state);
    const locked = owned === 0 && !canAfford && index > 1;
    return `
      <article class="building-row ${owned > 0 ? 'is-owned' : ''} ${canAfford ? 'can-buy' : 'is-expensive'} ${locked ? 'is-locked' : ''}">
        <div class="building-portrait"><img src="${machineIcon(machine.id)}" alt="" loading="lazy" /></div>
        <div class="building-info">
          <div class="building-title-line"><h3>${machine.name}</h3><span class="building-tier">${tierName(machine.floor)}</span></div>
          <p>${machine.description}</p>
          <div class="building-output"><span>PRODUCTION</span><strong>${format(perSecond)} / s</strong></div>
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
    <div class="research-note"><span>NOTE DU PARFUMEUR</span><p>Le rendement se cumule : automatisation, gestes de formulation, négociation VIP et durée des flacons mythiques se renforcent mutuellement.</p></div>`;
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
    { name: 'Première note', description: 'Créer ou vendre ton premier parfum.', unlocked: state.lifetimePerfumeRevenue >= 1 },
    { name: 'Le nez se forme', description: 'Produire 100 parfums cumulés.', unlocked: state.lifetimePerfumeRevenue >= 100 },
    { name: 'Premier investissement', description: 'Installer un premier équipement.', unlocked: machines >= 1 },
    { name: 'Petite manufacture', description: 'Posséder 10 équipements au total.', unlocked: machines >= 10 },
    { name: 'Ligne industrielle', description: 'Posséder 50 équipements au total.', unlocked: machines >= 50 },
    { name: 'Recherche appliquée', description: 'Acheter une première amélioration.', unlocked: Object.values(state.upgrades).some((level) => level > 0) },
    { name: 'Client satisfait', description: 'Terminer une commande VIP.', unlocked: state.ordersCompleted >= 1 },
    { name: 'Pièce de collection', description: 'Récupérer un flacon mythique.', unlocked: state.rareFlaconsClaimed >= 1 },
    { name: 'Maison internationale', description: 'Ouvrir une deuxième collection.', unlocked: state.unlockedWorlds.length >= 2 },
    { name: 'Nouvelle génération', description: 'Effectuer un rebirth normal.', unlocked: state.rebirths >= 1 },
    { name: 'Un million de notes', description: 'Produire un million de parfums.', unlocked: state.lifetimePerfumeRevenue >= 1_000_000 },
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
    <p class="save-warning">Importer remplace la partie actuelle. Vérifie que tu as exporté tes progrès avant de réinitialiser.</p>`;
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
  content.innerHTML = panels[activeTab]();
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
    const selected = button.dataset.tab === activeTab;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-selected', String(selected));
  });
}

function renderRareFlacon(now: number): void {
  const button = byId<HTMLButtonElement>('rare-flacon');
  const status = byId('rare-flacon-status');
  const boostPanel = byId('boost-status');
  const second = Math.floor(now / 1000);
  if (second === rareUiSecond) return;
  rareUiSecond = second;

  if (state.lifetimePerfumeRevenue < 1) {
    button.hidden = false;
    button.disabled = true;
    button.classList.remove('is-ready');
    boostPanel.hidden = true;
    rareNextAt = now + 24_000;
    byId('rare-event-title').textContent = 'Flacon mythique';
    status.textContent = 'Débloqué après ta première fragrance';
    return;
  }

  if (now < rareBoostUntil) {
    const remaining = rareBoostUntil - now;
    button.disabled = true;
    button.hidden = true;
    button.classList.remove('is-ready');
    byId('rare-event-title').textContent = 'Production doublée';
    status.textContent = 'Bonus actif · ' + Math.ceil(remaining / 1000) + ' s restantes';
    boostPanel.hidden = false;
    byId('boost-countdown').textContent = 'Production ×2 pendant ' + Math.ceil(remaining / 1000) + ' s';
    byId('boost-progress-bar').style.width = Math.min(100, remaining / (20_000 + state.upgrades.rareBonus * 3_000) * 100) + '%';
    return;
  }

  boostPanel.hidden = true;
  button.hidden = false;
  if (rareExpiresAt === 0 && now >= rareNextAt) {
    rareExpiresAt = now + 12_000;
  }
  if (rareExpiresAt > 0 && now < rareExpiresAt) {
    button.disabled = false;
    button.classList.add('is-ready');
    byId('rare-event-title').textContent = 'Flacon mythique repéré !';
    status.textContent = 'Clique avant qu’il ne disparaisse · ' + Math.ceil((rareExpiresAt - now) / 1000) + ' s';
    return;
  }
  if (rareExpiresAt > 0 && now >= rareExpiresAt) {
    rareExpiresAt = 0;
    rareNextAt = now + 32_000 + Math.random() * 24_000;
  }
  button.disabled = true;
  button.classList.remove('is-ready');
  byId('rare-event-title').textContent = 'Flacon mythique';
  status.textContent = 'Arrive dans ' + Math.max(0, Math.ceil((rareNextAt - now) / 1000)) + ' secondes';
}

function renderAll(): void {
  renderStats();
  renderHarvestView();
  renderRecipeWorkshop();
  renderMachines();
  renderStore();
}

function saveSoon(): void {
  autoSaveElapsed = Math.max(autoSaveElapsed, 8);
}

function floatReward(amount: number, event?: MouseEvent, noun = 'parfums'): void {
  const stage = byId('clicker-stage');
  const rect = stage.getBoundingClientRect();
  const floating = document.createElement('span');
  floating.className = 'floating-reward';
  floating.textContent = '+' + format(amount) + ' ' + noun;
  const x = event ? event.clientX - rect.left : rect.width * 0.56;
  const y = event ? event.clientY - rect.top : rect.height * 0.48;
  floating.style.left = Math.max(18, Math.min(rect.width - 80, x)) + 'px';
  floating.style.top = Math.max(15, Math.min(rect.height - 35, y)) + 'px';
  stage.appendChild(floating);
  window.setTimeout(() => floating.remove(), 950);
}

function floatText(label: string, event?: MouseEvent): void {
  const stage = byId('clicker-stage');
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

function formulate(event?: MouseEvent): void {
  const result = harvestIngredient(state);
  state = result.state;
  const discovered = result.materials
    .map((id) => MATERIALS.find((item) => item.id === id)!)
    .filter(Boolean);
  discovered.forEach((material, index) => floatText('+' + material.name, event && index === 0 ? event : undefined));
  const ingredientTotal = Object.values(state.ingredients).reduce((sum, count) => sum + count, 0);
  const names = discovered.map((material) => material.name).join(' et ');
  setStatus('Récolte : ' + names + '. Tu as ' + ingredientTotal + ' matière(s) en stock. Choisis une combinaison, compose le flacon, puis vends-le.');
  const clicker = byId('perfume-clicker');
  clicker.classList.remove('is-clicking');
  void clicker.offsetWidth;
  clicker.classList.add('is-clicking');
  window.setTimeout(() => clicker.classList.remove('is-clicking'), 220);
  renderStats();
  renderHarvestView();
  renderRecipeWorkshop();
  saveSoon();
}

function renderRecipeWorkshop(): void {
  const totalStock = Object.values(state.perfumeStock).reduce((sum, count) => sum + count, 0);
  byId('perfume-stock-count').textContent = format(totalStock, 0) + ' flacon' + (totalStock === 1 ? '' : 's');
  byId('recipe-list').innerHTML = PERFUME_RECIPES.map((recipe) => {
    const stock = state.perfumeStock[recipe.id];
    const ingredients = Object.entries(recipe.ingredients).map(([id, amount]) => {
      const material = MATERIALS.find((item) => item.id === id)!;
      return '<span class="recipe-ingredient" title="' + material.name + ' × ' + amount + '"><img src="' + material.asset + '" alt="" /><small>×' + amount + '</small></span>';
    }).join('');
    const canCraft = canCraftPerfume(state, recipe.id);
    const price = perfumeSalePrice(state, recipe.id);
    return `
      <article class="recipe-row ${stock > 0 ? 'has-stock' : ''}">
        <div class="recipe-bottle"><img src="/assets/bottle-product.svg" alt="" /></div>
        <div class="recipe-info"><h3>${recipe.name}</h3><p>${recipe.description}</p><div class="recipe-ingredients">${ingredients}</div><small>VENTE · ${format(price)} pièce${price === 1 ? '' : 's'} · STOCK ${format(stock, 0)}</small></div>
        <div class="recipe-actions"><button type="button" data-craft-recipe="${recipe.id}" ${canCraft ? '' : 'disabled'}>COMPOSER</button><button type="button" data-sell-recipe="${recipe.id}" ${stock > 0 ? '' : 'disabled'}>VENDRE +${format(price)}</button></div>
      </article>`;
  }).join('');
}

function craftRecipeById(recipeId: RecipeId): void {
  const next = craftPerfume(state, recipeId);
  if (next === state) {
    setStatus('Il manque des matières pour cette recette. Récolte les ingrédients illustrés sur la carte.');
    return;
  }
  state = next;
  const recipe = PERFUME_RECIPES.find((item) => item.id === recipeId)!;
  const pop = byId('crafted-flacon-pop');
  pop.classList.remove('is-visible');
  void pop.offsetWidth;
  pop.classList.add('is-visible');
  window.setTimeout(() => pop.classList.remove('is-visible'), 760);
  renderAll();
  setStatus(recipe.name + ' composé. Flacons en stock : ' + state.perfumeStock[recipeId] + '. Vends-le pour gagner des pièces.');
  saveSoon();
}

function sellRecipeById(recipeId: RecipeId, event?: MouseEvent): void {
  const stockBefore = state.perfumeStock[recipeId];
  if (stockBefore <= 0) {
    setStatus('Aucun flacon de cette recette en stock. Compose-en un avant de le vendre.');
    return;
  }
  const price = perfumeSalePrice(state, recipeId);
  state = sellPerfume(state, recipeId);
  renderAll();
  floatReward(price, event, 'pièces');
  const recipe = PERFUME_RECIPES.find((item) => item.id === recipeId)!;
  setStatus(recipe.name + ' vendu pour ' + format(price) + ' pièces. Les premières ventes rapportent peu : diversifie tes recettes et développe ta manufacture.');
  saveSoon();
}

function buyMachineById(machineId: MachineId): void {
  const previous = state;
  state = buyMachine(state, machineId);
  if (state === previous) {
    setStatus('Il te faut encore ' + format(Math.max(0, machineCost(state, machineId) - state.perfumeRevenue)) + ' parfums pour cet équipement.');
    return;
  }
  renderAll();
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
  renderAll();
  setStatus('Recherche appliquée : ' + UPGRADES[upgradeId].name + '.');
  saveSoon();
}

function claimContract(missionId: MissionId): void {
  if (!canClaimMission(state, missionId)) return;
  state = claimMission(state, missionId);
  const mission = MISSION_DEFINITIONS.find((item) => item.id === missionId);
  renderAll();
  setStatus('Contrat réclamé : +' + format(mission?.reward ?? 0) + ' parfums.');
  saveSoon();
}

function deliverOrder(): void {
  if (!canCompleteCustomerOrder(state)) {
    setStatus('Commande non préparée : il manque ' + format(Math.max(0, customerOrderCost(state) - state.perfumeRevenue)) + ' parfums.');
    return;
  }
  const payout = customerOrderReward(state);
  state = completeCustomerOrder(state);
  renderAll();
  setStatus('Commande VIP livrée automatiquement : +' + format(payout) + ' parfums.');
  saveSoon();
}

function collectRareFlacon(): void {
  const now = performance.now();
  if (state.lifetimePerfumeRevenue < 1 || rareExpiresAt <= now || now < rareBoostUntil) return;
  const reward = Math.max(1, Math.ceil(productionPerSecond(state) * 5 + state.lifetimePerfumeRevenue * 0.1));
  state = addPerfumeRevenue(state, reward);
  state = { ...state, rareFlaconsClaimed: state.rareFlaconsClaimed + 1 };
  rareExpiresAt = 0;
  rareBoostUntil = now + 20_000 + state.upgrades.rareBonus * 3_000;
  rareNextAt = rareBoostUntil + 32_000 + Math.random() * 24_000;
  rareUiSecond = -1;
  renderAll();
  renderRareFlacon(now);
  floatReward(reward);
  setStatus('Flacon mythique récupéré : +' + format(reward) + ' parfums et production ×2.');
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
  setStatus('Collection active : ' + getWorld(worldId).name + '.');
  saveSoon();
}

function doRebirth(): void {
  if (!canRebirth(state)) return;
  const accepted = window.confirm(
    'REBIRTH NORMAL\n\nTu perdras le stock du run et tous les équipements de production. Les recherches et ventes cumulées resteront acquises. Le multiplicateur de production augmentera de 60 %.\n\nContinuer ?',
  );
  if (!accepted) return;
  state = normalizeClickerState(performRebirth(state));
  renderAll();
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
  state = normalizeClickerState(performTotalRebirth(state));
  renderAll();
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
  setStatus('Sauvegarde JSON exportée.');
}

function applyImportedSave(raw: string): void {
  const imported = parseImportedSave(raw);
  if (!imported) {
    setStatus('Fichier invalide. La partie actuelle n’a pas été modifiée.');
    return;
  }
  state = normalizeClickerState(imported);
  rareExpiresAt = 0;
  rareBoostUntil = 0;
  rareNextAt = performance.now() + 24_000;
  renderAll();
  save();
  setStatus('Sauvegarde importée avec succès.');
}

function eraseSave(): void {
  if (!window.confirm('Effacer définitivement la progression locale et recommencer depuis zéro ?')) return;
  state = normalizeClickerState(createInitialState());
  rareExpiresAt = 0;
  rareBoostUntil = 0;
  rareNextAt = performance.now() + 24_000;
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(LEGACY_SAVE_KEY);
  } catch {
    // The game remains playable without persistent storage.
  }
  renderAll();
  save();
  setStatus('Nouvelle partie créée. Ta maison repart de zéro.');
}

// The game is pointer-operated: keyboard focus must not automate rapid purchases or harvesting.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if ((event.key === 'Enter' || event.key === ' ') && event.target instanceof HTMLButtonElement) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

app.addEventListener('click', (event) => {
  if (!(event instanceof MouseEvent) || event.detail === 0) return;
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>('button') : null;
  if (!target) return;

  if (target.id === 'perfume-clicker') {
    formulate(event instanceof MouseEvent ? event : undefined);
    return;
  }
  if (target.dataset.craftRecipe) {
    craftRecipeById(target.dataset.craftRecipe as RecipeId);
    return;
  }
  if (target.dataset.sellRecipe) {
    sellRecipeById(target.dataset.sellRecipe as RecipeId, event instanceof MouseEvent ? event : undefined);
    return;
  }
  if (target.id === 'rare-flacon') {
    collectRareFlacon();
    return;
  }
  if (target.id === 'complete-order') {
    deliverOrder();
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
    return;
  }
  if (target.dataset.buyMachine) {
    buyMachineById(target.dataset.buyMachine as MachineId);
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
});

byId<HTMLInputElement>('import-file').addEventListener('change', async (event) => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  applyImportedSave(await file.text());
  input.value = '';
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save();
});
window.addEventListener('beforeunload', save);

function gameTick(now: number): void {
  const elapsed = Math.min(1, Math.max(0, (now - lastTick) / 1000));
  lastTick = now;
  if (elapsed > 0) {
    const cps = productionPerSecond(state);
    const activeProductionMultiplier = now < rareBoostUntil ? 2 : 1;
    if (cps > 0) state = addPerfumeRevenue(state, cps * elapsed * activeProductionMultiplier);
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
save();
requestAnimationFrame(gameTick);
