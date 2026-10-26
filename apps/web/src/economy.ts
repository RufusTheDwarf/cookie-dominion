export interface GameState {
  crumbs: number;
  lifetimeCrumbs: number;
  ovens: number;
  lastSavedAt: number;
}

export const OVEN_BASE_COST = 25;
export const OVEN_COST_GROWTH = 1.18;
export const OVEN_PRODUCTION_PER_SECOND = 0.5;
export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;

export function ovenCost(owned: number): number {
  return Math.ceil(OVEN_BASE_COST * OVEN_COST_GROWTH ** owned);
}

export function productionPerSecond(state: Pick<GameState, "ovens">): number {
  return state.ovens * OVEN_PRODUCTION_PER_SECOND;
}

export function addCrumbs(state: GameState, amount: number): GameState {
  if (!Number.isFinite(amount) || amount < 0) return state;
  return {
    ...state,
    crumbs: state.crumbs + amount,
    lifetimeCrumbs: state.lifetimeCrumbs + amount,
  };
}

export function buyOven(state: GameState): GameState {
  const cost = ovenCost(state.ovens);
  if (state.crumbs < cost) return state;
  return {
    ...state,
    crumbs: state.crumbs - cost,
    ovens: state.ovens + 1,
  };
}

export function applyOfflineProgress(state: GameState, now: number): GameState {
  const elapsedSeconds = Math.min(
    MAX_OFFLINE_SECONDS,
    Math.max(0, (now - state.lastSavedAt) / 1000),
  );
  return addCrumbs(state, productionPerSecond(state) * elapsedSeconds);
}

export function createInitialState(now = Date.now()): GameState {
  return { crumbs: 0, lifetimeCrumbs: 0, ovens: 0, lastSavedAt: now };
}

export function parseSavedState(raw: string | null, now = Date.now()): GameState {
  if (!raw) return createInitialState(now);
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return createInitialState(now);
    const value = data as Partial<GameState>;
    if (
      !Number.isFinite(value.crumbs) || (value.crumbs ?? -1) < 0 ||
      !Number.isFinite(value.lifetimeCrumbs) || (value.lifetimeCrumbs ?? -1) < 0 ||
      !Number.isSafeInteger(value.ovens) || (value.ovens ?? -1) < 0 ||
      !Number.isFinite(value.lastSavedAt)
    ) return createInitialState(now);
    const loaded: GameState = {
      crumbs: value.crumbs!,
      lifetimeCrumbs: value.lifetimeCrumbs!,
      ovens: value.ovens!,
      lastSavedAt: value.lastSavedAt!,
    };
    return applyOfflineProgress(loaded, now);
  } catch {
    return createInitialState(now);
  }
}
