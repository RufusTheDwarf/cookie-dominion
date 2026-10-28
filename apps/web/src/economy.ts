export type WorldId = 'glass-garden' | 'amber-house' | 'astral-palace';
export type MachineId = 'formulation-table' | 'copper-still' | 'bottling-line' | 'perfumer-studio' | 'astral-extractor' | 'botanical-garden' | 'enfleurage-press' | 'luxury-atelier' | 'crystal-distiller' | 'orbital-manufactory';
export type UpgradeId = 'production' | 'clickPower' | 'discount' | 'rareBonus' | 'orders';
export type MaterialId = 'lavender' | 'mint' | 'rose' | 'bergamot' | 'sandalwood' | 'jasmine' | 'resin';

export interface MaterialDefinition {
  id: MaterialId;
  name: string;
  shortName: string;
  rarity: 'Commune' | 'Inhabituelle' | 'Rare' | 'Très rare';
  weight: number;
  color: string;
  asset: string;
}

export type MaterialStock = Record<MaterialId, number>;
export interface HarvestResult {
  state: GameState;
  materials: MaterialId[];
  perfumesCreated: number;
}
export type MissionId = 'first-machine' | 'industrialist' | 'lifetime-perfumer' | 'world-explorer' | 'galactic-empire' | 'first-order';

export interface UpgradeLevels {
  production: number;
  clickPower: number;
  discount: number;
  rareBonus: number;
  orders: number;
}

export interface MissionDefinition {
  id: MissionId;
  name: string;
  description: string;
  target: number;
  reward: number;
  kind: 'machines' | 'lifetime' | 'worlds' | 'orders';
}

export interface WorldDefinition {
  id: WorldId;
  name: string;
  tagline: string;
  unlockRebirths: number;
  costMultiplier: number;
  incomeMultiplier: number;
  background: number;
  floorColor: number;
  accent: number;
  belt: number;
}

export interface MachineDefinition {
  id: MachineId;
  name: string;
  short: string;
  description: string;
  floor: number;
  x: number;
  cost: number;
  payout: number;
  cycleSeconds: number;
}

export type WorldMachines = Record<MachineId, number>;
export type MachineSave = Record<WorldId, WorldMachines>;

export interface GameState {
  perfumeRevenue: number;
  lifetimePerfumeRevenue: number;
  runPerfumeRevenue: number;
  /** Number of click actions made while gathering raw materials. */
  gatherClicks: number;
  /** Ingredients waiting to be blended, always fewer than ten after a harvest. */
  harvestProgress: number;
  /** Current raw-material stock; ten units are consumed to make one perfume. */
  ingredients: MaterialStock;
  /** Lifetime discoveries, used by the botanical collection display. */
  materialDiscoveries: MaterialStock;
  lastHarvestedMaterial: MaterialId | null;
  machines: MachineSave;
  rebirths: number;
  currentWorld: WorldId;
  currentFloor: number;
  unlockedFloors: number[];
  unlockedWorlds: WorldId[];
  upgrades: UpgradeLevels;
  claimedMissions: MissionId[];
  rareFlaconsClaimed: number;
  ordersCompleted: number;
  totalRebirths: number;
  essences: number;
  rampBuilt: boolean;
  wallsBuilt: boolean;
  outsideExpansions: number;
  lastSavedAt: number;
}

export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;
/** The opening plot is a one-time purchase; an empty new game receives this amount. */
export const STARTING_LAND_COST = 1_000;
export const INGREDIENTS_PER_PERFUME = 10;
export const TOTAL_REBIRTH_BASE_LEVEL = 10;
export const TOTAL_REBIRTH_LEVEL_STEP = 5;
export const ESSENCE_PRODUCTION_BONUS = 0.75;
export const ESSENCE_PRESTIGE_VALUE = 1_000_000;
export const CUSTOMER_ORDER_BASE_COST = 8;
export const CUSTOMER_ORDER_COST_GROWTH = 1.65;
export const CUSTOMER_ORDER_REWARD_MULTIPLIER = 1.8;
export const REBIRTH_BASE_COST = 10000;
export const REBIRTH_COST_GROWTH = 1.65;
export const REBIRTH_MULTIPLIER = 1.6;
export const MACHINE_COST_GROWTH = 1.35;
export const MAX_UPGRADE_LEVEL = 10;

export const MATERIALS: MaterialDefinition[] = [
  { id: 'lavender', name: 'Lavande', shortName: 'LAVANDE', rarity: 'Commune', weight: 0.30, color: '#798e64', asset: '/assets/material-lavender.svg' },
  { id: 'mint', name: 'Menthe', shortName: 'MENTHE', rarity: 'Commune', weight: 0.25, color: '#6f9c77', asset: '/assets/material-mint.svg' },
  { id: 'rose', name: 'Pétales de rose', shortName: 'ROSE', rarity: 'Inhabituelle', weight: 0.18, color: '#b96e7b', asset: '/assets/material-rose.svg' },
  { id: 'bergamot', name: 'Bergamote', shortName: 'BERGAMOTE', rarity: 'Inhabituelle', weight: 0.14, color: '#b5a849', asset: '/assets/material-bergamot.svg' },
  { id: 'sandalwood', name: 'Bois de santal', shortName: 'SANTAL', rarity: 'Rare', weight: 0.075, color: '#a66b4c', asset: '/assets/material-sandalwood.svg' },
  { id: 'jasmine', name: 'Jasmin', shortName: 'JASMIN', rarity: 'Rare', weight: 0.04, color: '#e0cfa1', asset: '/assets/material-jasmine.svg' },
  { id: 'resin', name: 'Résine ambrée', shortName: 'RÉSINE', rarity: 'Très rare', weight: 0.015, color: '#c28a42', asset: '/assets/material-resin.svg' },
];

const MATERIAL_IDS = MATERIALS.map((material) => material.id);

function emptyMaterialStock(): MaterialStock {
  return { lavender: 0, mint: 0, rose: 0, bergamot: 0, sandalwood: 0, jasmine: 0, resin: 0 };
}

function parseMaterialStock(value: unknown): MaterialStock {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const stock = emptyMaterialStock();
  for (const id of MATERIAL_IDS) {
    const count = source[id];
    stock[id] = Number.isSafeInteger(count) && (count as number) >= 0 ? count as number : 0;
  }
  return stock;
}

function isMaterialId(value: unknown): value is MaterialId {
  return typeof value === 'string' && MATERIAL_IDS.includes(value as MaterialId);
}

export const UPGRADES: Record<UpgradeId, { name: string; description: string; baseCost: number; growth: number; effect: string }> = {
  production: {
    name: 'Concentré Absolu',
    description: 'Toutes tes machines produisent 20 % de parfums en plus par niveau.',
    baseCost: 300,
    growth: 1.85,
    effect: '+20 % parfums / niveau',
  },
  clickPower: {
    name: 'Instinct du botaniste',
    description: 'Chaque niveau augmente de 8 % la chance de trouver une matière botanique supplémentaire.',
    baseCost: 45,
    growth: 1.8,
    effect: '+8 % de chance de récolte bonus / niveau',
  },
  discount: {
    name: 'Contrats verriers',
    description: 'Réduit le prix des équipements de 5 % par niveau.',
    baseCost: 500,
    growth: 2,
    effect: '−5 % prix des machines / niveau',
  },
  rareBonus: {
    name: 'Vaporisateur de précision',
    description: 'Prolonge le bonus de production du flacon mythique.',
    baseCost: 900,
    growth: 2.15,
    effect: '+3 s de bonus rare / niveau',
  },
  orders: {
    name: 'Accords commerciaux',
    description: 'Augmente la marge des commandes VIP.',
    baseCost: 750,
    growth: 1.95,
    effect: '+10 % de paiement VIP / niveau',
  },
};

export const MISSION_DEFINITIONS: MissionDefinition[] = [
  { id: 'first-machine', name: 'Premier atelier', description: 'Installe ton premier équipement.', target: 1, reward: 2, kind: 'machines' },
  { id: 'industrialist', name: 'Maison en expansion', description: 'Possède 5 équipements.', target: 5, reward: 15, kind: 'machines' },
  { id: 'lifetime-perfumer', name: 'Mille flacons vendus', description: 'Vends 1 000 parfums au total.', target: 1000, reward: 500, kind: 'lifetime' },
  { id: 'world-explorer', name: 'Nez voyageur', description: 'Déverrouille un deuxième monde.', target: 2, reward: 150, kind: 'worlds' },
  { id: 'galactic-empire', name: 'Grand nez de l’Empire', description: 'Déverrouille les trois mondes.', target: 3, reward: 1000, kind: 'worlds' },
  { id: 'first-order', name: 'Premier client VIP', description: 'Livre ta première commande au client VIP.', target: 1, reward: 8, kind: 'orders' },
];

const MISSION_IDS: MissionId[] = MISSION_DEFINITIONS.map((mission) => mission.id);

export const WORLDS: WorldDefinition[] = [
  {
    id: 'glass-garden',
    name: 'Jardin de Verre',
    tagline: 'Les premières notes fraîches',
    unlockRebirths: 0,
    costMultiplier: 1,
    incomeMultiplier: 1,
    background: 0x9da88f,
    floorColor: 0xe3d5b7,
    accent: 0x4b5a43,
    belt: 0xa46f4e,
  },
  {
    id: 'amber-house',
    name: 'Maison d’Ambre',
    tagline: 'Bois précieux et vanille noire',
    unlockRebirths: 1,
    costMultiplier: 5,
    incomeMultiplier: 8,
    background: 0x827a80,
    floorColor: 0xd2c3a6,
    accent: 0x5b4d54,
    belt: 0x9a715c,
  },
  {
    id: 'astral-palace',
    name: 'Palais Astral',
    tagline: 'Les essences les plus rares',
    unlockRebirths: 3,
    costMultiplier: 35,
    incomeMultiplier: 65,
    background: 0x718a87,
    floorColor: 0xc2d0be,
    accent: 0x3a5c58,
    belt: 0xb18c53,
  },
];

export const MACHINES: MachineDefinition[] = [
  {
    id: 'formulation-table',
    name: 'Table de formulation',
    short: 'FORM',
    description: 'Mélange les premières notes parfumées',
    floor: 0,
    x: 260,
    cost: 3,
    payout: 3,
    cycleSeconds: 3.5,
  },
  {
    id: 'copper-still',
    name: 'Alambic de cuivre',
    short: 'ALAM',
    description: 'Distille des extraits de caractère',
    floor: 0,
    x: 450,
    cost: 18,
    payout: 14,
    cycleSeconds: 4,
  },
  {
    id: 'bottling-line',
    name: 'Ligne d’embouteillage',
    short: 'FILL',
    description: 'Remplit et ferme les flacons à la chaîne',
    floor: 1,
    x: 320,
    cost: 140,
    payout: 70,
    cycleSeconds: 5,
  },
  {
    id: 'perfumer-studio',
    name: 'Atelier de parfumeur',
    short: 'LAB',
    description: 'Crée des compositions premium',
    floor: 1,
    x: 560,
    cost: 700,
    payout: 360,
    cycleSeconds: 6,
  },
  {
    id: 'astral-extractor',
    name: 'Extracteur astral',
    short: 'ASTR',
    description: 'Synthétise des essences interdimensionnelles',
    floor: 2,
    x: 440,
    cost: 6_000,
    payout: 2200,
    cycleSeconds: 7,
  },
  {
    id: 'botanical-garden',
    name: 'Serre botanique',
    short: 'BOT',
    description: 'Cultive les matières premières fraîches',
    floor: 1,
    x: 680,
    cost: 40_000,
    payout: 5_200,
    cycleSeconds: 7.5,
  },
  {
    id: 'enfleurage-press',
    name: 'Presse à enfleurage',
    short: 'ENF',
    description: 'Capture les notes florales les plus délicates',
    floor: 1,
    x: 800,
    cost: 350_000,
    payout: 42_000,
    cycleSeconds: 8,
  },
  {
    id: 'luxury-atelier',
    name: 'Atelier haute parfumerie',
    short: 'LUX',
    description: 'Compose des collections de prestige',
    floor: 1,
    x: 900,
    cost: 3_500_000,
    payout: 390_000,
    cycleSeconds: 9,
  },
  {
    id: 'crystal-distiller',
    name: 'Distillateur de cristal',
    short: 'CRYS',
    description: 'Concentre les essences à très haut rendement',
    floor: 2,
    x: 1000,
    cost: 40_000_000,
    payout: 4_500_000,
    cycleSeconds: 10,
  },
  {
    id: 'orbital-manufactory',
    name: 'Manufacture orbitale',
    short: 'ORBIT',
    description: 'Produit des fragrances hors normes à grande échelle',
    floor: 2,
    x: 1100,
    cost: 350_000_000,
    payout: 48_000_000,
    cycleSeconds: 12,
  },
];

const WORLD_IDS = WORLDS.map((world) => world.id);
const MACHINE_IDS = MACHINES.map((machine) => machine.id);

function emptyWorldMachines(): WorldMachines {
  return Object.fromEntries(MACHINES.map((machine) => [machine.id, 0])) as WorldMachines;
}

export function createEmptyMachineSave(): MachineSave {
  return {
    'glass-garden': emptyWorldMachines(),
    'amber-house': emptyWorldMachines(),
    'astral-palace': emptyWorldMachines(),
  };
}

export function createInitialState(now = Date.now()): GameState {
  return {
    perfumeRevenue: 0,
    lifetimePerfumeRevenue: 0,
    runPerfumeRevenue: 0,
    gatherClicks: 0,
    harvestProgress: 0,
    ingredients: emptyMaterialStock(),
    materialDiscoveries: emptyMaterialStock(),
    lastHarvestedMaterial: null,
    machines: createEmptyMachineSave(),
    rebirths: 0,
    currentWorld: 'glass-garden',
    currentFloor: 0,
    unlockedFloors: [0],
    unlockedWorlds: ['glass-garden'],
    upgrades: { production: 0, clickPower: 0, discount: 0, rareBonus: 0, orders: 0 },
    claimedMissions: [],
    rareFlaconsClaimed: 0,
    ordersCompleted: 0,
    totalRebirths: 0,
    essences: 0,
    rampBuilt: false,
    wallsBuilt: false,
    outsideExpansions: 0,
    lastSavedAt: now,
  };
}

/**
 * Purchase the starting outdoor plot. The serialized rampBuilt field is retained
 * for save compatibility; it now means the starter plot/workshop entrance exists.
 */
export function buyStartingLand(state: GameState): GameState {
  if (state.rampBuilt || state.perfumeRevenue < STARTING_LAND_COST) return state;
  return { ...state, perfumeRevenue: state.perfumeRevenue - STARTING_LAND_COST, rampBuilt: true };
}

export function getWorld(worldId: WorldId): WorldDefinition {
  return WORLDS.find((world) => world.id === worldId) ?? WORLDS[0]!;
}

export function getMachine(machineId: MachineId): MachineDefinition {
  return MACHINES.find((machine) => machine.id === machineId) ?? MACHINES[0]!;
}

export function rebirthMultiplier(state: Pick<GameState, 'rebirths'>): number {
  return REBIRTH_MULTIPLIER ** state.rebirths;
}

export function totalRebirthRequiredLevel(state: Pick<GameState, 'totalRebirths'>): number {
  return TOTAL_REBIRTH_BASE_LEVEL + state.totalRebirths * TOTAL_REBIRTH_LEVEL_STEP;
}

export function essenceMultiplier(state: Pick<GameState, 'essences'>): number {
  return 1 + state.essences * ESSENCE_PRODUCTION_BONUS;
}

export function canTotalRebirth(state: GameState): boolean {
  return state.rebirths >= totalRebirthRequiredLevel(state) &&
    state.runPerfumeRevenue >= rebirthCost(state.rebirths);
}

export function performTotalRebirth(state: GameState, now = Date.now()): GameState {
  if (!canTotalRebirth(state)) return state;
  const nextTotalRebirths = state.totalRebirths + 1;
  const essenceReward = 1 + state.totalRebirths;
  return {
    ...createInitialState(now),
    totalRebirths: nextTotalRebirths,
    essences: state.essences + essenceReward,
    lastSavedAt: now,
  };
}

export function machineCost(state: GameState, machineId: MachineId): number {
  const machine = getMachine(machineId);
  const owned = state.machines[state.currentWorld][machineId];
  const world = getWorld(state.currentWorld);
  const discount = Math.min(0.5, state.upgrades.discount * 0.05);
  return Math.max(1, Math.ceil(machine.cost * world.costMultiplier * MACHINE_COST_GROWTH ** owned * (1 - discount)));
}

export function upgradeCost(state: GameState, upgradeId: UpgradeId): number {
  const definition = UPGRADES[upgradeId];
  const level = state.upgrades[upgradeId];
  return Math.ceil(definition.baseCost * definition.growth ** level);
}

function chooseMaterial(roll: number): MaterialId {
  const normalized = Math.max(0, Math.min(0.999999999, Number.isFinite(roll) ? roll : 0));
  let threshold = 0;
  for (const material of MATERIALS) {
    threshold += material.weight;
    if (normalized < threshold) return material.id;
  }
  return 'lavender';
}

function gatherOneMaterial(state: GameState, material: MaterialId): { state: GameState; crafted: number } {
  const ingredients: MaterialStock = { ...state.ingredients, [material]: state.ingredients[material] + 1 };
  const materialDiscoveries: MaterialStock = { ...state.materialDiscoveries, [material]: state.materialDiscoveries[material] + 1 };
  let progress = state.harvestProgress + 1;
  let next: GameState = {
    ...state,
    ingredients,
    materialDiscoveries,
    lastHarvestedMaterial: material,
  };
  let crafted = 0;
  if (progress >= INGREDIENTS_PER_PERFUME) {
    let toConsume = INGREDIENTS_PER_PERFUME;
    for (const definition of MATERIALS) {
      const used = Math.min(toConsume, next.ingredients[definition.id]);
      if (used > 0) {
        next = { ...next, ingredients: { ...next.ingredients, [definition.id]: next.ingredients[definition.id] - used } };
        toConsume -= used;
      }
      if (toConsume === 0) break;
    }
    progress -= INGREDIENTS_PER_PERFUME;
    crafted = 1;
    next = addPerfumeRevenue(next, crafted);
  }
  next = { ...next, harvestProgress: progress };
  return { state: next, crafted };
}

/**
 * Harvest a surprise botanical drop. A batch of ten ingredients is consumed
 * to formulate one perfume; click-power research gives a small chance of a bonus drop.
 */
export function harvestIngredient(state: GameState, random: () => number = Math.random): HarvestResult {
  const primary = chooseMaterial(random());
  const nextClick: GameState = { ...state, gatherClicks: state.gatherClicks + 1 };
  const first = gatherOneMaterial(nextClick, primary);
  const bonusChance = Math.min(0.8, Math.max(0, state.upgrades.clickPower) * 0.08);
  const materials: MaterialId[] = [primary];
  let next = first.state;
  let perfumesCreated = first.crafted;
  if (random() < bonusChance) {
    const bonus = chooseMaterial(random());
    const second = gatherOneMaterial(next, bonus);
    next = second.state;
    materials.push(bonus);
    perfumesCreated += second.crafted;
  }
  next = { ...next, lastHarvestedMaterial: materials[materials.length - 1] ?? primary };
  return { state: next, materials, perfumesCreated };
}

export function buyUpgrade(state: GameState, upgradeId: UpgradeId): GameState {
  const level = state.upgrades[upgradeId];
  if (level >= MAX_UPGRADE_LEVEL) return state;
  const cost = upgradeCost(state, upgradeId);
  if (state.perfumeRevenue < cost) return state;
  return {
    ...state,
    perfumeRevenue: state.perfumeRevenue - cost,
    upgrades: { ...state.upgrades, [upgradeId]: level + 1 },
  };
}

function totalMachinesOwned(state: GameState): number {
  return Object.values(state.machines).reduce(
    (worldTotal, worldMachines) => worldTotal + Object.values(worldMachines).reduce((sum, count) => sum + count, 0),
    0,
  );
}

export function missionProgress(state: GameState, mission: MissionDefinition): number {
  const progress = mission.kind === 'machines'
    ? totalMachinesOwned(state)
    : mission.kind === 'lifetime'
      ? state.lifetimePerfumeRevenue
      : mission.kind === 'orders'
        ? state.ordersCompleted
        : state.unlockedWorlds.length;
  return Math.min(mission.target, progress);
}

export function canClaimMission(state: GameState, missionId: MissionId): boolean {
  const mission = MISSION_DEFINITIONS.find((item) => item.id === missionId);
  return Boolean(mission && !state.claimedMissions.includes(missionId) && missionProgress(state, mission) >= mission.target);
}

export function claimMission(state: GameState, missionId: MissionId): GameState {
  if (!canClaimMission(state, missionId)) return state;
  const mission = MISSION_DEFINITIONS.find((item) => item.id === missionId);
  if (!mission) return state;
  const rewarded = addPerfumeRevenue(state, mission.reward);
  return { ...rewarded, claimedMissions: [...rewarded.claimedMissions, missionId] };
}

export function productionPerSecond(
  state: Pick<GameState, 'machines' | 'currentWorld' | 'rebirths' | 'upgrades' | 'essences'>,
  worldId: WorldId = state.currentWorld,
): number {
  const world = getWorld(worldId);
  const worldMachines = state.machines[worldId];
  const base = MACHINES.reduce((total, machine) => {
    return total + worldMachines[machine.id] * (machine.payout / machine.cycleSeconds);
  }, 0);
  const productionUpgrade = 1 + state.upgrades.production * 0.2;
  return base * world.incomeMultiplier * REBIRTH_MULTIPLIER ** state.rebirths * productionUpgrade * essenceMultiplier(state);
}

export function customerOrderCost(state: Pick<GameState, 'ordersCompleted'>): number {
  return Math.ceil(CUSTOMER_ORDER_BASE_COST * CUSTOMER_ORDER_COST_GROWTH ** state.ordersCompleted);
}

export function customerOrderReward(state: Pick<GameState, 'ordersCompleted' | 'upgrades'>): number {
  const rewardMultiplier = CUSTOMER_ORDER_REWARD_MULTIPLIER * (1 + state.upgrades.orders * 0.1);
  return Math.ceil(customerOrderCost(state) * rewardMultiplier);
}

export function canCompleteCustomerOrder(state: GameState): boolean {
  return state.perfumeRevenue >= customerOrderCost(state);
}

export function completeCustomerOrder(state: GameState): GameState {
  if (!canCompleteCustomerOrder(state)) return state;
  const cost = customerOrderCost(state);
  const reward = customerOrderReward(state);
  const withMaterialsPaid = { ...state, perfumeRevenue: state.perfumeRevenue - cost };
  return {
    ...addPerfumeRevenue(withMaterialsPaid, reward),
    ordersCompleted: state.ordersCompleted + 1,
  };
}

export function addPerfumeRevenue(state: GameState, amount: number): GameState {
  if (!Number.isFinite(amount) || amount < 0) return state;
  return {
    ...state,
    perfumeRevenue: state.perfumeRevenue + amount,
    lifetimePerfumeRevenue: state.lifetimePerfumeRevenue + amount,
    runPerfumeRevenue: state.runPerfumeRevenue + amount,
  };
}

export function buyMachine(state: GameState, machineId: MachineId): GameState {
  const cost = machineCost(state, machineId);
  if (state.perfumeRevenue < cost) return state;
  return {
    ...state,
    perfumeRevenue: state.perfumeRevenue - cost,
    machines: {
      ...state.machines,
      [state.currentWorld]: {
        ...state.machines[state.currentWorld],
        [machineId]: state.machines[state.currentWorld][machineId] + 1,
      },
    },
  };
}

export function rebirthCost(rebirths: number): number {
  return Math.ceil(REBIRTH_BASE_COST * REBIRTH_COST_GROWTH ** rebirths);
}

export function canRebirth(state: GameState): boolean {
  return state.runPerfumeRevenue >= rebirthCost(state.rebirths);
}

export function performRebirth(state: GameState): GameState {
  if (!canRebirth(state)) return state;
  const nextRebirths = state.rebirths + 1;
  const unlockedWorlds: WorldId[] = ['glass-garden'];
  for (const world of WORLDS) {
    if (world.unlockRebirths <= nextRebirths && !unlockedWorlds.includes(world.id)) {
      unlockedWorlds.push(world.id);
    }
  }
  return {
    ...state,
    perfumeRevenue: 0,
    runPerfumeRevenue: 0,
    machines: createEmptyMachineSave(),
    ingredients: emptyMaterialStock(),
    harvestProgress: 0,
    lastHarvestedMaterial: null,
    rebirths: nextRebirths,
    rampBuilt: true,
    wallsBuilt: false,
    outsideExpansions: 0,
    unlockedFloors: [0],
    currentWorld: 'glass-garden',
    currentFloor: 0,
    unlockedWorlds,
  };
}

export function enterWorld(state: GameState, worldId: WorldId): GameState {
  if (!state.unlockedWorlds.includes(worldId)) return state;
  return { ...state, currentWorld: worldId, currentFloor: 0 };
}

export function floorUnlockCost(floor: number): number {
  return floor === 1 ? 260 : floor === 2 ? 2_400 : Number.POSITIVE_INFINITY;
}

export function canUnlockFloor(state: GameState, floor: number): boolean {
  if (!Number.isInteger(floor) || floor < 1 || floor > 2) return false;
  if (state.unlockedFloors.includes(floor) || !state.rampBuilt || state.currentFloor !== floor - 1) return false;
  const previousFloorMachineCount = MACHINES
    .filter((machine) => machine.floor === floor - 1)
    .reduce((sum, machine) => sum + state.machines[state.currentWorld][machine.id], 0);
  const requiredMachines = floor === 1 ? 2 : 1;
  return previousFloorMachineCount >= requiredMachines && state.perfumeRevenue >= floorUnlockCost(floor);
}

export function unlockFloor(state: GameState, floor: number): GameState {
  if (!canUnlockFloor(state, floor)) return state;
  return {
    ...state,
    perfumeRevenue: state.perfumeRevenue - floorUnlockCost(floor),
    unlockedFloors: [...state.unlockedFloors, floor].sort((a, b) => a - b),
  };
}

export function enterFloor(state: GameState, floor: number): GameState {
  if (!Number.isInteger(floor) || floor < 0 || floor > 2 || !state.unlockedFloors.includes(floor)) return state;
  return { ...state, currentFloor: floor };
}

export function collectParfums(state: GameState, amount: number): GameState {
  return addPerfumeRevenue(state, amount);
}

export function applyOfflineProgress(state: GameState, now: number): GameState {
  const elapsedSeconds = Math.min(
    MAX_OFFLINE_SECONDS,
    Math.max(0, (now - state.lastSavedAt) / 1000),
  );
  return addPerfumeRevenue(state, productionPerSecond(state) * elapsedSeconds);
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function parseUpgradeLevel(value: unknown, key: UpgradeId): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0;
  const level = (value as Record<string, unknown>)[key];
  return Number.isSafeInteger(level) && (level as number) >= 0
    ? Math.min(MAX_UPGRADE_LEVEL, level as number)
    : 0;
}

export function parseSavedState(raw: string | null, now = Date.now()): GameState {
  if (!raw) return createInitialState(now);
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return createInitialState(now);
    const rawValue = data as Record<string, unknown>;
    const legacyWorldIds: Record<string, string> = {
      'cookie-valley': 'glass-garden',
      'choco-moon': 'amber-house',
      'galaxy-oven': 'astral-palace',
    };
    const legacyMachineIds: Record<string, string> = {
      'hand-mixer': 'formulation-table',
      'brick-oven': 'copper-still',
      'conveyor-oven': 'bottling-line',
      'frosting-lab': 'perfumer-studio',
      'quantum-bakery': 'astral-extractor',
    };
    const rawMachines = rawValue.machines && typeof rawValue.machines === 'object'
      ? rawValue.machines as Record<string, unknown>
      : undefined;
    const normalizedMachines: Record<string, unknown> = {};
    if (rawMachines) {
      for (const [rawWorldId, rawCounts] of Object.entries(rawMachines)) {
        if (!rawCounts || typeof rawCounts !== 'object') continue;
        const worldId = legacyWorldIds[rawWorldId] ?? rawWorldId;
        const counts: Record<string, unknown> = {};
        for (const [rawMachineId, count] of Object.entries(rawCounts as Record<string, unknown>)) {
          counts[legacyMachineIds[rawMachineId] ?? rawMachineId] = count;
        }
        normalizedMachines[worldId] = counts;
      }
    }
    const value: Record<string, unknown> = {
      ...rawValue,
      perfumeRevenue: rawValue.perfumeRevenue ?? rawValue.crumbs,
      lifetimePerfumeRevenue: rawValue.lifetimePerfumeRevenue ?? rawValue.lifetimeCrumbs,
      runPerfumeRevenue: rawValue.runPerfumeRevenue ?? rawValue.runCrumbsEarned ?? rawValue.lifetimeCrumbs,
      rareFlaconsClaimed: rawValue.rareFlaconsClaimed ?? rawValue.goldenCookiesClaimed,
      alambics: rawValue.alambics ?? rawValue.ovens,
      currentWorld: typeof rawValue.currentWorld === 'string'
        ? legacyWorldIds[rawValue.currentWorld] ?? rawValue.currentWorld
        : rawValue.currentWorld,
      unlockedWorlds: Array.isArray(rawValue.unlockedWorlds)
        ? rawValue.unlockedWorlds.map((id) => typeof id === 'string' ? legacyWorldIds[id] ?? id : id)
        : rawValue.unlockedWorlds,
      machines: rawMachines ? normalizedMachines : rawValue.machines,
    };

    // Migrate the earlier prototype save format, where only alambics were stored.
    if (!value.machines && isFiniteNonNegative(value.perfumeRevenue) &&
        isFiniteNonNegative(value.lifetimePerfumeRevenue) && Number.isSafeInteger(value.alambics) &&
        (value.alambics as number) >= 0 && isFiniteNonNegative(value.lastSavedAt)) {
      const migrated = createInitialState(now);
      migrated.perfumeRevenue = value.perfumeRevenue;
      migrated.lifetimePerfumeRevenue = value.lifetimePerfumeRevenue;
      migrated.runPerfumeRevenue = value.lifetimePerfumeRevenue;
      migrated.machines['glass-garden']['copper-still'] = value.alambics as number;
      migrated.rampBuilt = (value.alambics as number) > 0 || value.perfumeRevenue > 0 || value.lifetimePerfumeRevenue > 0;
      migrated.lastSavedAt = value.lastSavedAt;
      return applyOfflineProgress(migrated, now);
    }

    if (
      !isFiniteNonNegative(value.perfumeRevenue) ||
      !isFiniteNonNegative(value.lifetimePerfumeRevenue) ||
      !isFiniteNonNegative(value.runPerfumeRevenue) ||
      !Number.isSafeInteger(value.rebirths) || (value.rebirths as number) < 0 ||
      !isFiniteNonNegative(value.lastSavedAt) ||
      !value.machines || typeof value.machines !== 'object' ||
      !Array.isArray(value.unlockedWorlds)
    ) return createInitialState(now);

    const sourceMachines = value.machines as Record<string, unknown>;
    const machines = createEmptyMachineSave();
    for (const worldId of WORLD_IDS) {
      const counts = sourceMachines[worldId];
      if (!counts || typeof counts !== 'object') continue;
      for (const machineId of MACHINE_IDS) {
        const count = (counts as Record<string, unknown>)[machineId];
        if (Number.isSafeInteger(count) && (count as number) >= 0) {
          machines[worldId][machineId] = count as number;
        }
      }
    }

    const currentWorld = WORLD_IDS.includes(value.currentWorld as WorldId)
      ? value.currentWorld as WorldId
      : 'glass-garden';
    const unlockedWorlds = (value.unlockedWorlds as unknown[])
      .filter((item): item is WorldId => typeof item === 'string' && WORLD_IDS.includes(item as WorldId));
    if (!unlockedWorlds.includes('glass-garden')) unlockedWorlds.unshift('glass-garden');
    const ingredients = parseMaterialStock(value.ingredients);
    const materialDiscoveries = parseMaterialStock(value.materialDiscoveries);
    const parsedProgress = Number.isSafeInteger(value.harvestProgress) && (value.harvestProgress as number) >= 0
      ? Math.min(INGREDIENTS_PER_PERFUME - 1, value.harvestProgress as number)
      : Object.values(ingredients).reduce((sum, count) => sum + count, 0);
    const parsedGatherClicks = Number.isSafeInteger(value.gatherClicks) && (value.gatherClicks as number) >= 0
      ? value.gatherClicks as number
      : 0;
    const state: GameState = {
      perfumeRevenue: value.perfumeRevenue,
      lifetimePerfumeRevenue: value.lifetimePerfumeRevenue,
      runPerfumeRevenue: value.runPerfumeRevenue,
      gatherClicks: parsedGatherClicks,
      harvestProgress: parsedProgress,
      ingredients,
      materialDiscoveries,
      lastHarvestedMaterial: isMaterialId(value.lastHarvestedMaterial) ? value.lastHarvestedMaterial : null,
      machines,
      rebirths: value.rebirths as number,
      currentWorld: unlockedWorlds.includes(currentWorld) ? currentWorld : 'glass-garden',
      currentFloor: Number.isSafeInteger(value.currentFloor) && (value.currentFloor as number) >= 0 && (value.currentFloor as number) <= 2
        ? value.currentFloor as number
        : 0,
      unlockedFloors: Array.isArray(value.unlockedFloors)
        ? [...new Set([0, ...(value.unlockedFloors as unknown[]).filter((floor): floor is number => typeof floor === 'number' && Number.isInteger(floor) && floor >= 0 && floor <= 2)])].sort((a, b) => a - b)
        : [0, ...MACHINES.filter((machine) => machines[WORLD_IDS.includes(currentWorld) ? currentWorld : 'glass-garden'][machine.id] > 0).map((machine) => machine.floor), Number.isInteger(value.currentFloor) && (value.currentFloor as number) >= 0 && (value.currentFloor as number) <= 2 ? value.currentFloor as number : 0].filter((floor) => floor >= 0 && floor <= 2).filter((floor, index, all) => all.indexOf(floor) === index).sort((a, b) => a - b),
      unlockedWorlds,
      upgrades: {
        production: parseUpgradeLevel(value.upgrades, 'production'),
        clickPower: parseUpgradeLevel(value.upgrades, 'clickPower'),
        discount: parseUpgradeLevel(value.upgrades, 'discount'),
        rareBonus: parseUpgradeLevel(value.upgrades, 'rareBonus'),
        orders: parseUpgradeLevel(value.upgrades, 'orders'),
      },
      claimedMissions: Array.isArray(value.claimedMissions)
        ? value.claimedMissions.filter((id): id is MissionId => typeof id === 'string' && MISSION_IDS.includes(id as MissionId))
        : [],
      rareFlaconsClaimed: Number.isSafeInteger(value.rareFlaconsClaimed) && (value.rareFlaconsClaimed as number) >= 0
        ? value.rareFlaconsClaimed as number
        : 0,
      ordersCompleted: Number.isSafeInteger(value.ordersCompleted) && (value.ordersCompleted as number) >= 0
        ? value.ordersCompleted as number
        : 0,
      totalRebirths: Number.isSafeInteger(value.totalRebirths) && (value.totalRebirths as number) >= 0
        ? value.totalRebirths as number
        : 0,
      essences: Number.isSafeInteger(value.essences) && (value.essences as number) >= 0
        ? value.essences as number
        : 0,
      rampBuilt: value.rampBuilt === undefined ? true : value.rampBuilt === true,
      wallsBuilt: value.wallsBuilt === true,
      outsideExpansions: Number.isSafeInteger(value.outsideExpansions) && (value.outsideExpansions as number) >= 0
        ? Math.min(3, value.outsideExpansions as number)
        : 0,
      lastSavedAt: value.lastSavedAt,
    };
    const ownedMachineCount = Object.values(state.machines)
      .reduce((sum, machinesInWorld) => sum + Object.values(machinesInWorld).reduce((worldSum, count) => worldSum + count, 0), 0);
    const hasMeaningfulProgress =
      state.perfumeRevenue > 0 ||
      state.lifetimePerfumeRevenue > 0 ||
      state.runPerfumeRevenue > 0 ||
      state.rebirths > 0 ||
      state.totalRebirths > 0 ||
      state.essences > 0 ||
      state.ordersCompleted > 0 ||
      state.rareFlaconsClaimed > 0 ||
      state.claimedMissions.length > 0 ||
      state.upgrades.production > 0 ||
      state.upgrades.clickPower > 0 ||
      state.upgrades.discount > 0 ||
      state.gatherClicks > 0 ||
      Object.values(state.materialDiscoveries).some((count) => count > 0) ||
      ownedMachineCount > 0;
    // Old prototype saves sometimes recorded an empty starting room as already built.
    // If nothing was ever earned or bought, migrate that false positive back to the real first-run state.
    if (!hasMeaningfulProgress && value.rampBuilt === undefined) {
      state.rampBuilt = false;
      state.wallsBuilt = false;
      state.outsideExpansions = 0;
      state.currentFloor = 0;
      state.unlockedFloors = [0];
      state.currentWorld = 'glass-garden';
      state.unlockedWorlds = ['glass-garden'];
    }
    state.unlockedFloors = state.unlockedFloors.filter((floor) => floor >= 0 && floor <= 2);
    if (!state.unlockedFloors.includes(0)) state.unlockedFloors.unshift(0);
    if (!state.unlockedFloors.includes(state.currentFloor)) state.currentFloor = 0;
    state.unlockedWorlds = WORLDS.filter((world) =>
      state.unlockedWorlds.includes(world.id) || world.unlockRebirths <= state.rebirths,
    ).map((world) => world.id);
    return applyOfflineProgress(state, now);
  } catch {
    return createInitialState(now);
  }
}


export interface SaveFileV1 {
  format: 'alambicfall-save';
  version: 1;
  exportedAt: string;
  state: GameState;
}

/** Serialize a transferable, human-readable save file. */
export function exportSaveFile(state: GameState, now = Date.now()): string {
  return JSON.stringify({
    format: 'alambicfall-save',
    version: 1,
    exportedAt: new Date(now).toISOString(),
    state: { ...state, lastSavedAt: now },
  } satisfies SaveFileV1, null, 2);
}

/**
 * Import a save exported by Alambicfall, a raw current-format state, or the
 * previous alambic-only local-save format. Returns null rather than resetting
 * progress when the supplied import is malformed.
 */
export function parseImportedSave(raw: string, now = Date.now()): GameState | null {
  try {
    const root: unknown = JSON.parse(raw);
    if (!root || typeof root !== 'object' || Array.isArray(root)) return null;
    const rootRecord = root as Record<string, unknown>;
    let candidate: unknown = root;

    if ('format' in rootRecord || 'version' in rootRecord || 'state' in rootRecord) {
      if (rootRecord.format !== 'alambicfall-save' || rootRecord.version !== 1 ||
          !rootRecord.state || typeof rootRecord.state !== 'object' ||
          Array.isArray(rootRecord.state)) return null;
      candidate = rootRecord.state;
    }

    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
    const value = candidate as Record<string, unknown>;

    // Accept old local saves from the original prototype, so users can migrate
    // a save made before the multi-world tycoon was introduced.
    if (!('machines' in value)) {
      if (
        !isFiniteNonNegative(value.perfumeRevenue) ||
        !isFiniteNonNegative(value.lifetimePerfumeRevenue) ||
        !Number.isSafeInteger(value.alambics) || (value.alambics as number) < 0 ||
        !isFiniteNonNegative(value.lastSavedAt)
      ) return null;
      const migrated = parseSavedState(JSON.stringify(value), now);
      return { ...migrated, lastSavedAt: now };
    }

    if (
      !isFiniteNonNegative(value.perfumeRevenue) ||
      !isFiniteNonNegative(value.lifetimePerfumeRevenue) ||
      !isFiniteNonNegative(value.runPerfumeRevenue) ||
      !Number.isSafeInteger(value.rebirths) || (value.rebirths as number) < 0 ||
      !isFiniteNonNegative(value.lastSavedAt) ||
      !WORLD_IDS.includes(value.currentWorld as WorldId) ||
      !Number.isSafeInteger(value.currentFloor) || (value.currentFloor as number) < 0 || (value.currentFloor as number) > 2 ||
      !Array.isArray(value.unlockedWorlds) ||
      !value.unlockedWorlds.every((id) => typeof id === 'string' && WORLD_IDS.includes(id as WorldId)) ||
      !value.unlockedWorlds.includes(value.currentWorld) ||
      !value.machines || typeof value.machines !== 'object' || Array.isArray(value.machines)
    ) return null;

    const sourceMachines = value.machines as Record<string, unknown>;
    for (const worldId of WORLD_IDS) {
      const counts = sourceMachines[worldId];
      if (!counts || typeof counts !== 'object' || Array.isArray(counts)) return null;
      const worldCounts = counts as Record<string, unknown>;
      for (const machineId of MACHINE_IDS) {
        const count = worldCounts[machineId];
        if (!Number.isSafeInteger(count) || (count as number) < 0) return null;
      }
    }

    const parsed = parseSavedState(JSON.stringify(value), now);
    return { ...parsed, lastSavedAt: now };
  } catch {
    return null;
  }
}
