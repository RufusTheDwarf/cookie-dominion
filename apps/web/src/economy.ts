export type WorldId = 'cookie-valley' | 'choco-moon' | 'galaxy-oven';
export type MachineId = 'hand-mixer' | 'brick-oven' | 'conveyor-oven' | 'frosting-lab' | 'quantum-bakery';
export type UpgradeId = 'production' | 'clickPower' | 'discount';
export type MissionId = 'first-machine' | 'industrialist' | 'lifetime-baker' | 'world-explorer' | 'galactic-empire' | 'first-order';

export interface UpgradeLevels {
  production: number;
  clickPower: number;
  discount: number;
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
  crumbs: number;
  lifetimeCrumbs: number;
  runCrumbsEarned: number;
  machines: MachineSave;
  rebirths: number;
  currentWorld: WorldId;
  currentFloor: number;
  unlockedFloors: number[];
  unlockedWorlds: WorldId[];
  upgrades: UpgradeLevels;
  claimedMissions: MissionId[];
  goldenCookiesClaimed: number;
  ordersCompleted: number;
  totalRebirths: number;
  essences: number;
  rampBuilt: boolean;
  wallsBuilt: boolean;
  outsideExpansions: number;
  lastSavedAt: number;
}

export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;
export const COOKIE_CLICK_VALUE = 5;
export const TOTAL_REBIRTH_BASE_LEVEL = 10;
export const TOTAL_REBIRTH_LEVEL_STEP = 5;
export const ESSENCE_PRODUCTION_BONUS = 0.75;
export const ESSENCE_PRESTIGE_VALUE = 1_000_000;
export const CUSTOMER_ORDER_BASE_COST = 120;
export const CUSTOMER_ORDER_COST_GROWTH = 1.65;
export const CUSTOMER_ORDER_REWARD_MULTIPLIER = 1.8;
export const REBIRTH_BASE_COST = 10000;
export const REBIRTH_COST_GROWTH = 1.65;
export const REBIRTH_MULTIPLIER = 1.6;
export const MACHINE_COST_GROWTH = 1.35;
export const MAX_UPGRADE_LEVEL = 10;

export const UPGRADES: Record<UpgradeId, { name: string; description: string; baseCost: number; growth: number; effect: string }> = {
  production: {
    name: 'Concentré Absolu',
    description: 'Toutes tes machines produisent 20 % de parfums en plus par niveau.',
    baseCost: 300,
    growth: 1.85,
    effect: '+20 % parfums / niveau',
  },
  clickPower: {
    name: 'Gestuelle du maître',
    description: 'Chaque création manuelle rapporte 10 parfums supplémentaires par niveau.',
    baseCost: 120,
    growth: 1.8,
    effect: '+10 parfums / création',
  },
  discount: {
    name: 'Contrats verriers',
    description: 'Réduit le prix des équipements de 5 % par niveau.',
    baseCost: 500,
    growth: 2,
    effect: '−5 % prix des machines / niveau',
  },
};

export const MISSION_DEFINITIONS: MissionDefinition[] = [
  { id: 'first-machine', name: 'Premier atelier', description: 'Installe ton premier équipement.', target: 1, reward: 75, kind: 'machines' },
  { id: 'industrialist', name: 'Maison en expansion', description: 'Possède 5 équipements.', target: 5, reward: 400, kind: 'machines' },
  { id: 'lifetime-baker', name: 'Mille flacons vendus', description: 'Vends 1 000 parfums au total.', target: 1000, reward: 500, kind: 'lifetime' },
  { id: 'world-explorer', name: 'Nez voyageur', description: 'Déverrouille un deuxième monde.', target: 2, reward: 1500, kind: 'worlds' },
  { id: 'galactic-empire', name: 'Grand nez de l’Empire', description: 'Déverrouille les trois mondes.', target: 3, reward: 8000, kind: 'worlds' },
  { id: 'first-order', name: 'Premier client VIP', description: 'Livre ta première commande au client VIP.', target: 1, reward: 250, kind: 'orders' },
];

const MISSION_IDS: MissionId[] = MISSION_DEFINITIONS.map((mission) => mission.id);

export const WORLDS: WorldDefinition[] = [
  {
    id: 'cookie-valley',
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
    id: 'choco-moon',
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
    id: 'galaxy-oven',
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
    id: 'hand-mixer',
    name: 'Table de formulation',
    short: 'FORM',
    description: 'Mélange les premières notes parfumées',
    floor: 0,
    x: 260,
    cost: 35,
    payout: 3,
    cycleSeconds: 3.5,
  },
  {
    id: 'brick-oven',
    name: 'Alambic de cuivre',
    short: 'ALAM',
    description: 'Distille des extraits de caractère',
    floor: 0,
    x: 450,
    cost: 220,
    payout: 14,
    cycleSeconds: 4,
  },
  {
    id: 'conveyor-oven',
    name: 'Ligne d’embouteillage',
    short: 'FILL',
    description: 'Remplit et ferme les flacons à la chaîne',
    floor: 1,
    x: 320,
    cost: 1600,
    payout: 70,
    cycleSeconds: 5,
  },
  {
    id: 'frosting-lab',
    name: 'Atelier de parfumeur',
    short: 'LAB',
    description: 'Crée des compositions premium',
    floor: 1,
    x: 560,
    cost: 8800,
    payout: 360,
    cycleSeconds: 6,
  },
  {
    id: 'quantum-bakery',
    name: 'Extracteur astral',
    short: 'ASTR',
    description: 'Synthétise des essences interdimensionnelles',
    floor: 2,
    x: 440,
    cost: 52000,
    payout: 2200,
    cycleSeconds: 7,
  },
];

const WORLD_IDS = WORLDS.map((world) => world.id);
const MACHINE_IDS = MACHINES.map((machine) => machine.id);

function emptyWorldMachines(): WorldMachines {
  return {
    'hand-mixer': 0,
    'brick-oven': 0,
    'conveyor-oven': 0,
    'frosting-lab': 0,
    'quantum-bakery': 0,
  };
}

export function createEmptyMachineSave(): MachineSave {
  return {
    'cookie-valley': emptyWorldMachines(),
    'choco-moon': emptyWorldMachines(),
    'galaxy-oven': emptyWorldMachines(),
  };
}

export function createInitialState(now = Date.now()): GameState {
  return {
    crumbs: 0,
    lifetimeCrumbs: 0,
    runCrumbsEarned: 0,
    machines: createEmptyMachineSave(),
    rebirths: 0,
    currentWorld: 'cookie-valley',
    currentFloor: 0,
    unlockedFloors: [0],
    unlockedWorlds: ['cookie-valley'],
    upgrades: { production: 0, clickPower: 0, discount: 0 },
    claimedMissions: [],
    goldenCookiesClaimed: 0,
    ordersCompleted: 0,
    totalRebirths: 0,
    essences: 0,
    rampBuilt: false,
    wallsBuilt: false,
    outsideExpansions: 0,
    lastSavedAt: now,
  };
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
    state.runCrumbsEarned >= rebirthCost(state.rebirths);
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

export function manualCookieValue(state: Pick<GameState, 'upgrades'>): number {
  return COOKIE_CLICK_VALUE * (1 + state.upgrades.clickPower);
}

export function buyUpgrade(state: GameState, upgradeId: UpgradeId): GameState {
  const level = state.upgrades[upgradeId];
  if (level >= MAX_UPGRADE_LEVEL) return state;
  const cost = upgradeCost(state, upgradeId);
  if (state.crumbs < cost) return state;
  return {
    ...state,
    crumbs: state.crumbs - cost,
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
      ? state.lifetimeCrumbs
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
  const rewarded = addCrumbs(state, mission.reward);
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

export function customerOrderReward(state: Pick<GameState, 'ordersCompleted'>): number {
  return Math.ceil(customerOrderCost(state) * CUSTOMER_ORDER_REWARD_MULTIPLIER);
}

export function canCompleteCustomerOrder(state: GameState): boolean {
  return state.crumbs >= customerOrderCost(state);
}

export function completeCustomerOrder(state: GameState): GameState {
  if (!canCompleteCustomerOrder(state)) return state;
  const cost = customerOrderCost(state);
  const reward = customerOrderReward(state);
  const withMaterialsPaid = { ...state, crumbs: state.crumbs - cost };
  return {
    ...addCrumbs(withMaterialsPaid, reward),
    ordersCompleted: state.ordersCompleted + 1,
  };
}

export function addCrumbs(state: GameState, amount: number): GameState {
  if (!Number.isFinite(amount) || amount < 0) return state;
  return {
    ...state,
    crumbs: state.crumbs + amount,
    lifetimeCrumbs: state.lifetimeCrumbs + amount,
    runCrumbsEarned: state.runCrumbsEarned + amount,
  };
}

export function buyMachine(state: GameState, machineId: MachineId): GameState {
  const machine = getMachine(machineId);
  if (machine.floor !== state.currentFloor) return state;
  const cost = machineCost(state, machineId);
  if (state.crumbs < cost) return state;
  return {
    ...state,
    crumbs: state.crumbs - cost,
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
  return state.runCrumbsEarned >= rebirthCost(state.rebirths);
}

export function performRebirth(state: GameState): GameState {
  if (!canRebirth(state)) return state;
  const nextRebirths = state.rebirths + 1;
  const unlockedWorlds: WorldId[] = ['cookie-valley'];
  for (const world of WORLDS) {
    if (world.unlockRebirths <= nextRebirths && !unlockedWorlds.includes(world.id)) {
      unlockedWorlds.push(world.id);
    }
  }
  return {
    ...state,
    crumbs: 0,
    runCrumbsEarned: 0,
    machines: createEmptyMachineSave(),
    rebirths: nextRebirths,
    rampBuilt: true,
    wallsBuilt: false,
    outsideExpansions: 0,
    unlockedFloors: [0],
    currentWorld: 'cookie-valley',
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
  return previousFloorMachineCount >= requiredMachines && state.crumbs >= floorUnlockCost(floor);
}

export function unlockFloor(state: GameState, floor: number): GameState {
  if (!canUnlockFloor(state, floor)) return state;
  return {
    ...state,
    crumbs: state.crumbs - floorUnlockCost(floor),
    unlockedFloors: [...state.unlockedFloors, floor].sort((a, b) => a - b),
  };
}

export function enterFloor(state: GameState, floor: number): GameState {
  if (!Number.isInteger(floor) || floor < 0 || floor > 2 || !state.unlockedFloors.includes(floor)) return state;
  return { ...state, currentFloor: floor };
}

export function collectCookies(state: GameState, amount: number): GameState {
  return addCrumbs(state, amount);
}

export function applyOfflineProgress(state: GameState, now: number): GameState {
  const elapsedSeconds = Math.min(
    MAX_OFFLINE_SECONDS,
    Math.max(0, (now - state.lastSavedAt) / 1000),
  );
  return addCrumbs(state, productionPerSecond(state) * elapsedSeconds);
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
    const value = data as Record<string, unknown>;

    // Migrate the earlier prototype save format, where only ovens were stored.
    if (!value.machines && isFiniteNonNegative(value.crumbs) &&
        isFiniteNonNegative(value.lifetimeCrumbs) && Number.isSafeInteger(value.ovens) &&
        (value.ovens as number) >= 0 && isFiniteNonNegative(value.lastSavedAt)) {
      const migrated = createInitialState(now);
      migrated.crumbs = value.crumbs;
      migrated.lifetimeCrumbs = value.lifetimeCrumbs;
      migrated.runCrumbsEarned = value.lifetimeCrumbs;
      migrated.machines['cookie-valley']['brick-oven'] = value.ovens as number;
      migrated.rampBuilt = true;
      migrated.lastSavedAt = value.lastSavedAt;
      return applyOfflineProgress(migrated, now);
    }

    if (
      !isFiniteNonNegative(value.crumbs) ||
      !isFiniteNonNegative(value.lifetimeCrumbs) ||
      !isFiniteNonNegative(value.runCrumbsEarned) ||
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
      : 'cookie-valley';
    const unlockedWorlds = (value.unlockedWorlds as unknown[])
      .filter((item): item is WorldId => typeof item === 'string' && WORLD_IDS.includes(item as WorldId));
    if (!unlockedWorlds.includes('cookie-valley')) unlockedWorlds.unshift('cookie-valley');
    const state: GameState = {
      crumbs: value.crumbs,
      lifetimeCrumbs: value.lifetimeCrumbs,
      runCrumbsEarned: value.runCrumbsEarned,
      machines,
      rebirths: value.rebirths as number,
      currentWorld: unlockedWorlds.includes(currentWorld) ? currentWorld : 'cookie-valley',
      currentFloor: Number.isSafeInteger(value.currentFloor) && (value.currentFloor as number) >= 0 && (value.currentFloor as number) <= 2
        ? value.currentFloor as number
        : 0,
      unlockedFloors: Array.isArray(value.unlockedFloors)
        ? [...new Set((value.unlockedFloors as unknown[]).filter((floor): floor is number => Number.isInteger(floor) && floor >= 0 && floor <= 2))].concat(0).sort((a, b) => a - b)
        : [0, ...MACHINES.filter((machine) => machines[WORLD_IDS.includes(currentWorld) ? currentWorld : 'cookie-valley'][machine.id] > 0).map((machine) => machine.floor), Number.isInteger(value.currentFloor) && (value.currentFloor as number) >= 0 && (value.currentFloor as number) <= 2 ? value.currentFloor as number : 0].filter((floor) => floor >= 0 && floor <= 2).filter((floor, index, all) => all.indexOf(floor) === index).sort((a, b) => a - b),
      unlockedWorlds,
      upgrades: {
        production: parseUpgradeLevel(value.upgrades, 'production'),
        clickPower: parseUpgradeLevel(value.upgrades, 'clickPower'),
        discount: parseUpgradeLevel(value.upgrades, 'discount'),
      },
      claimedMissions: Array.isArray(value.claimedMissions)
        ? value.claimedMissions.filter((id): id is MissionId => typeof id === 'string' && MISSION_IDS.includes(id as MissionId))
        : [],
      goldenCookiesClaimed: Number.isSafeInteger(value.goldenCookiesClaimed) && (value.goldenCookiesClaimed as number) >= 0
        ? value.goldenCookiesClaimed as number
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
  format: 'ovenfall-save';
  version: 1;
  exportedAt: string;
  state: GameState;
}

/** Serialize a transferable, human-readable save file. */
export function exportSaveFile(state: GameState, now = Date.now()): string {
  return JSON.stringify({
    format: 'ovenfall-save',
    version: 1,
    exportedAt: new Date(now).toISOString(),
    state: { ...state, lastSavedAt: now },
  } satisfies SaveFileV1, null, 2);
}

/**
 * Import a save exported by Ovenfall, a raw current-format state, or the
 * previous oven-only local-save format. Returns null rather than resetting
 * progress when the supplied import is malformed.
 */
export function parseImportedSave(raw: string, now = Date.now()): GameState | null {
  try {
    const root: unknown = JSON.parse(raw);
    if (!root || typeof root !== 'object' || Array.isArray(root)) return null;
    const rootRecord = root as Record<string, unknown>;
    let candidate: unknown = root;

    if ('format' in rootRecord || 'version' in rootRecord || 'state' in rootRecord) {
      if (rootRecord.format !== 'ovenfall-save' || rootRecord.version !== 1 ||
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
        !isFiniteNonNegative(value.crumbs) ||
        !isFiniteNonNegative(value.lifetimeCrumbs) ||
        !Number.isSafeInteger(value.ovens) || (value.ovens as number) < 0 ||
        !isFiniteNonNegative(value.lastSavedAt)
      ) return null;
      const migrated = parseSavedState(JSON.stringify(value), now);
      return { ...migrated, lastSavedAt: now };
    }

    if (
      !isFiniteNonNegative(value.crumbs) ||
      !isFiniteNonNegative(value.lifetimeCrumbs) ||
      !isFiniteNonNegative(value.runCrumbsEarned) ||
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
