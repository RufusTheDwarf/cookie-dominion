export type WorldId = 'cookie-valley' | 'choco-moon' | 'galaxy-oven';
export type MachineId = 'hand-mixer' | 'brick-oven' | 'conveyor-oven' | 'frosting-lab' | 'quantum-bakery';

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
  unlockedWorlds: WorldId[];
  lastSavedAt: number;
}

export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;
export const COOKIE_CLICK_VALUE = 10;
export const REBIRTH_BASE_COST = 1500;
export const REBIRTH_COST_GROWTH = 1.55;
export const REBIRTH_MULTIPLIER = 1.75;
export const MACHINE_COST_GROWTH = 1.22;

export const WORLDS: WorldDefinition[] = [
  {
    id: 'cookie-valley',
    name: 'Cookie Valley',
    tagline: 'La première fabrique',
    unlockRebirths: 0,
    costMultiplier: 1,
    incomeMultiplier: 1,
    background: 0x19140f,
    floorColor: 0x35291f,
    accent: 0xd69b5b,
    belt: 0x6c4b30,
  },
  {
    id: 'choco-moon',
    name: 'Choco Moon',
    tagline: 'Le chocolat ne dort jamais',
    unlockRebirths: 1,
    costMultiplier: 5,
    incomeMultiplier: 8,
    background: 0x171426,
    floorColor: 0x322646,
    accent: 0xb68aff,
    belt: 0x6852a1,
  },
  {
    id: 'galaxy-oven',
    name: 'Galaxy Oven',
    tagline: 'La chaîne de production cosmique',
    unlockRebirths: 3,
    costMultiplier: 35,
    incomeMultiplier: 65,
    background: 0x0d1a2a,
    floorColor: 0x1b3446,
    accent: 0x65d8e8,
    belt: 0x326f85,
  },
];

export const MACHINES: MachineDefinition[] = [
  {
    id: 'hand-mixer',
    name: 'Mélangeur manuel',
    short: 'MIX',
    description: 'Petits cookies rapides',
    floor: 0,
    x: 260,
    cost: 15,
    payout: 6,
    cycleSeconds: 2,
  },
  {
    id: 'brick-oven',
    name: 'Four en briques',
    short: 'OVN',
    description: 'Une fournée plus rentable',
    floor: 0,
    x: 450,
    cost: 110,
    payout: 36,
    cycleSeconds: 3,
  },
  {
    id: 'conveyor-oven',
    name: 'Four à convoyeur',
    short: 'BELT',
    description: 'Production industrielle',
    floor: 1,
    x: 320,
    cost: 650,
    payout: 300,
    cycleSeconds: 4,
  },
  {
    id: 'frosting-lab',
    name: 'Laboratoire glaçage',
    short: 'LAB',
    description: 'Cookies premium automatisés',
    floor: 1,
    x: 560,
    cost: 3200,
    payout: 1800,
    cycleSeconds: 5,
  },
  {
    id: 'quantum-bakery',
    name: 'Four quantique',
    short: 'QNT',
    description: 'Production interdimensionnelle',
    floor: 2,
    x: 440,
    cost: 18000,
    payout: 12500,
    cycleSeconds: 5,
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
    unlockedWorlds: ['cookie-valley'],
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

export function machineCost(state: GameState, machineId: MachineId): number {
  const machine = getMachine(machineId);
  const owned = state.machines[state.currentWorld][machineId];
  const world = getWorld(state.currentWorld);
  return Math.ceil(machine.cost * world.costMultiplier * MACHINE_COST_GROWTH ** owned);
}

export function productionPerSecond(
  state: Pick<GameState, 'machines' | 'currentWorld' | 'rebirths'>,
  worldId: WorldId = state.currentWorld,
): number {
  const world = getWorld(worldId);
  const worldMachines = state.machines[worldId];
  const base = MACHINES.reduce((total, machine) => {
    return total + worldMachines[machine.id] * (machine.payout / machine.cycleSeconds);
  }, 0);
  return base * world.incomeMultiplier * REBIRTH_MULTIPLIER ** state.rebirths;
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
    currentWorld: 'cookie-valley',
    currentFloor: 0,
    unlockedWorlds,
  };
}

export function enterWorld(state: GameState, worldId: WorldId): GameState {
  if (!state.unlockedWorlds.includes(worldId)) return state;
  return { ...state, currentWorld: worldId, currentFloor: 0 };
}

export function enterFloor(state: GameState, floor: number): GameState {
  if (!Number.isInteger(floor) || floor < 0 || floor > 2) return state;
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
      unlockedWorlds,
      lastSavedAt: value.lastSavedAt,
    };
    state.unlockedWorlds = WORLDS.filter((world) =>
      state.unlockedWorlds.includes(world.id) || world.unlockRebirths <= state.rebirths,
    ).map((world) => world.id);
    return applyOfflineProgress(state, now);
  } catch {
    return createInitialState(now);
  }
}
