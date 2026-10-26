import { describe, expect, it } from 'vitest';
import {
  addCrumbs,
  applyOfflineProgress,
  buyMachine,
  canRebirth,
  createInitialState,
  enterFloor,
  enterWorld,
  machineCost,
  MAX_OFFLINE_SECONDS,
  parseSavedState,
  performRebirth,
  productionPerSecond,
  rebirthCost,
  rebirthMultiplier,
  type WorldId,
} from '../apps/web/src/economy';

describe('tycoon economy', () => {
  it('gives cookies for manual baking and tracks this run separately', () => {
    const state = addCrumbs(createInitialState(100), 10);
    expect(state.crumbs).toBe(10);
    expect(state.lifetimeCrumbs).toBe(10);
    expect(state.runCrumbsEarned).toBe(10);
  });

  it('rejects invalid earning amounts', () => {
    const initial = createInitialState(100);
    expect(addCrumbs(initial, Number.NaN)).toBe(initial);
    expect(addCrumbs(initial, -1)).toBe(initial);
  });

  it('lets the player buy a machine and raises passive output', () => {
    const state = { ...createInitialState(100), crumbs: 100 };
    const next = buyMachine(state, 'hand-mixer');
    expect(next.crumbs).toBe(85);
    expect(next.machines['cookie-valley']['hand-mixer']).toBe(1);
    expect(productionPerSecond(next)).toBe(3);
    expect(machineCost(next, 'hand-mixer')).toBe(19);
  });

  it('requires the matching floor to build a machine', () => {
    const state = { ...createInitialState(100), crumbs: 5000 };
    expect(buyMachine(state, 'conveyor-oven')).toBe(state);
    const floorTwo = enterFloor(enterFloor(state, 1), 2);
    expect(buyMachine(floorTwo, 'quantum-bakery')).toBe(floorTwo);
    const floorOne = enterFloor(state, 1);
    expect(buyMachine(floorOne, 'conveyor-oven').machines['cookie-valley']['conveyor-oven']).toBe(1);
  });

  it('scales production by each world and permanent rebirths', () => {
    const base = {
      ...createInitialState(100),
      machines: {
        ...createInitialState(100).machines,
        'cookie-valley': { ...createInitialState(100).machines['cookie-valley'], 'hand-mixer': 1 },
        'choco-moon': { ...createInitialState(100).machines['choco-moon'], 'hand-mixer': 1 },
      },
      unlockedWorlds: ['cookie-valley', 'choco-moon'] as WorldId[],
    };
    expect(productionPerSecond(base)).toBe(3);
    expect(productionPerSecond(base, 'choco-moon')).toBe(24);
    expect(productionPerSecond({ ...base, rebirths: 2 })).toBeCloseTo(3 * 1.75 ** 2);
  });

  it('does not enter locked worlds and allows unlocked portals', () => {
    const state = createInitialState(100);
    expect(enterWorld(state, 'choco-moon')).toBe(state);
    const unlocked = { ...state, unlockedWorlds: ['cookie-valley', 'choco-moon'] as WorldId[] };
    expect(enterWorld(unlocked, 'choco-moon').currentWorld).toBe('choco-moon');
  });

  it('changes floors only to supported levels', () => {
    const state = createInitialState(100);
    expect(enterFloor(state, 2).currentFloor).toBe(2);
    expect(enterFloor(state, 4)).toBe(state);
  });

  it('requires the run threshold before rebirth', () => {
    const state = { ...createInitialState(100), crumbs: 500, runCrumbsEarned: 500 };
    expect(canRebirth(state)).toBe(false);
    expect(performRebirth(state)).toBe(state);
    expect(rebirthCost(0)).toBe(1500);
  });

  it('resets the factory, keeps lifetime earnings and unlocks Choco Moon on rebirth', () => {
    const initial = createInitialState(100);
    const state = {
      ...initial,
      crumbs: 350,
      lifetimeCrumbs: 3200,
      runCrumbsEarned: rebirthCost(0),
      machines: {
        ...initial.machines,
        'cookie-valley': { ...initial.machines['cookie-valley'], 'hand-mixer': 2 },
      },
    };
    const next = performRebirth(state);
    expect(next.rebirths).toBe(1);
    expect(next.crumbs).toBe(0);
    expect(next.runCrumbsEarned).toBe(0);
    expect(next.lifetimeCrumbs).toBe(3200);
    expect(next.machines['cookie-valley']['hand-mixer']).toBe(0);
    expect(next.unlockedWorlds).toContain('choco-moon');
    expect(rebirthMultiplier(next)).toBe(1.75);
  });

  it('unlocks Galaxy Oven after the third rebirth', () => {
    const state = {
      ...createInitialState(100),
      rebirths: 2,
      runCrumbsEarned: rebirthCost(2),
      unlockedWorlds: ['cookie-valley', 'choco-moon'] as const,
    };
    expect(performRebirth(state).unlockedWorlds).toContain('galaxy-oven');
  });

  it('caps offline production at eight hours', () => {
    const initial = createInitialState(0);
    const state = {
      ...initial,
      machines: {
        ...initial.machines,
        'cookie-valley': { ...initial.machines['cookie-valley'], 'hand-mixer': 2 },
      },
      lastSavedAt: 0,
    };
    const next = applyOfflineProgress(state, (MAX_OFFLINE_SECONDS + 100) * 1000);
    expect(next.crumbs).toBe(6 * MAX_OFFLINE_SECONDS);
    expect(next.runCrumbsEarned).toBe(6 * MAX_OFFLINE_SECONDS);
  });

  it('migrates the older oven-only save', () => {
    const migrated = parseSavedState(JSON.stringify({
      crumbs: 75,
      lifetimeCrumbs: 500,
      ovens: 2,
      lastSavedAt: 100,
    }), 100);
    expect(migrated.crumbs).toBe(75);
    expect(migrated.machines['cookie-valley']['brick-oven']).toBe(2);
    expect(migrated.currentWorld).toBe('cookie-valley');
  });

  it('resets corrupted saves safely', () => {
    expect(parseSavedState('{broken', 123)).toEqual(createInitialState(123));
    expect(parseSavedState(JSON.stringify({
      crumbs: -1,
      lifetimeCrumbs: 0,
      runCrumbsEarned: 0,
      rebirths: 0,
      machines: {},
      currentWorld: 'cookie-valley',
      currentFloor: 0,
      unlockedWorlds: ['cookie-valley'],
      lastSavedAt: 1,
    }), 123)).toEqual(createInitialState(123));
  });
});
