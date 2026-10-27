import { describe, expect, it } from 'vitest';
import {
  addCrumbs,
  applyOfflineProgress,
  buyMachine,
  buyUpgrade,
  canClaimMission,
  canCompleteCustomerOrder,
  canRebirth,
  canTotalRebirth,
  claimMission,
  completeCustomerOrder,
  createInitialState,
  customerOrderCost,
  customerOrderReward,
  enterFloor,
  enterWorld,
  exportSaveFile,
  machineCost,
  manualCookieValue,
  missionProgress,
  MAX_OFFLINE_SECONDS,
  parseImportedSave,
  parseSavedState,
  performRebirth,
  performTotalRebirth,
  productionPerSecond,
  rebirthCost,
  rebirthMultiplier,
  totalRebirthRequiredLevel,
  essenceMultiplier,
  upgradeCost,
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

  it('buys permanent research upgrades and applies their effects', () => {
    const initial = createInitialState(100);
    const withMixer = {
      ...initial,
      crumbs: 120,
      machines: {
        ...initial.machines,
        'cookie-valley': { ...initial.machines['cookie-valley'], 'hand-mixer': 1 },
      },
    };
    expect(manualCookieValue(withMixer)).toBe(10);
    expect(productionPerSecond(withMixer)).toBe(3);

    const researched = buyUpgrade(withMixer, 'production');
    expect(researched.crumbs).toBe(0);
    expect(researched.upgrades.production).toBe(1);
    expect(productionPerSecond(researched)).toBeCloseTo(3.6);
    expect(upgradeCost(researched, 'production')).toBe(222);

    const clickResearch = buyUpgrade({ ...withMixer, crumbs: 60 }, 'clickPower');
    expect(manualCookieValue(clickResearch)).toBe(20);

    const discounted = buyUpgrade({ ...withMixer, crumbs: 180 }, 'discount');
    expect(machineCost(discounted, 'brick-oven')).toBe(105);
    expect(buyUpgrade({ ...researched, upgrades: { ...researched.upgrades, production: 10 } }, 'production').upgrades.production).toBe(10);
  });

  it('tracks and rewards completed factory missions exactly once', () => {
    const initial = createInitialState(100);
    expect(canClaimMission(initial, 'first-machine')).toBe(false);
    const built = {
      ...initial,
      machines: {
        ...initial.machines,
        'cookie-valley': { ...initial.machines['cookie-valley'], 'hand-mixer': 1 },
      },
    };
    expect(missionProgress(built, {
      id: 'first-machine', name: 'First', description: 'Build', target: 1, reward: 75, kind: 'machines',
    })).toBe(1);
    expect(canClaimMission(built, 'first-machine')).toBe(true);
    const rewarded = claimMission(built, 'first-machine');
    expect(rewarded.crumbs).toBe(75);
    expect(rewarded.claimedMissions).toContain('first-machine');
    expect(claimMission(rewarded, 'first-machine')).toBe(rewarded);
  });

  it('delivers scalable VIP perfume orders and pays the player', () => {
    const initial = createInitialState(100);
    expect(initial.ordersCompleted).toBe(0);
    expect(customerOrderCost(initial)).toBe(50);
    expect(customerOrderReward(initial)).toBe(125);
    expect(canCompleteCustomerOrder(initial)).toBe(false);
    expect(completeCustomerOrder(initial)).toBe(initial);

    const underfunded = { ...initial, crumbs: 49 };
    expect(completeCustomerOrder(underfunded)).toBe(underfunded);

    const funded = { ...initial, crumbs: 50 };
    const delivered = completeCustomerOrder(funded);
    expect(delivered.crumbs).toBe(125);
    expect(delivered.ordersCompleted).toBe(1);
    expect(delivered.lifetimeCrumbs).toBe(125);
    expect(delivered.runCrumbsEarned).toBe(125);
    expect(customerOrderCost(delivered)).toBe(83);
    expect(customerOrderReward(delivered)).toBe(208);
    const secondDelivery = completeCustomerOrder(delivered);
    expect(secondDelivery.ordersCompleted).toBe(2);
    expect(secondDelivery.crumbs).toBe(250);
    expect(customerOrderCost(secondDelivery)).toBe(137);
    expect(customerOrderReward(secondDelivery)).toBe(343);
    expect(canClaimMission(delivered, 'first-order')).toBe(true);

    const claimed = claimMission(delivered, 'first-order');
    expect(claimed.claimedMissions).toContain('first-order');
    expect(claimed.crumbs).toBe(375);
    expect(claimMission(claimed, 'first-order')).toBe(claimed);
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

  it('unlocks total ascension at the prestige level and resets all normal progress', () => {
    const initial = createInitialState(100);
    const ready = {
      ...initial,
      crumbs: 999,
      lifetimeCrumbs: 900000,
      runCrumbsEarned: rebirthCost(10),
      rebirths: 10,
      totalRebirths: 0,
      essences: 2,
      currentWorld: 'galaxy-oven' as WorldId,
      currentFloor: 2,
      unlockedWorlds: ['cookie-valley', 'choco-moon', 'galaxy-oven'] as WorldId[],
      upgrades: { production: 4, clickPower: 3, discount: 2 },
      claimedMissions: ['first-machine'] as const,
      machines: {
        ...initial.machines,
        'galaxy-oven': { ...initial.machines['galaxy-oven'], 'quantum-bakery': 4 },
      },
    };
    expect(totalRebirthRequiredLevel(ready)).toBe(10);
    expect(canTotalRebirth(ready)).toBe(true);
    const next = performTotalRebirth(ready, 200);
    expect(next.crumbs).toBe(0);
    expect(next.lifetimeCrumbs).toBe(0);
    expect(next.runCrumbsEarned).toBe(0);
    expect(next.rebirths).toBe(0);
    expect(next.currentWorld).toBe('cookie-valley');
    expect(next.currentFloor).toBe(0);
    expect(next.unlockedWorlds).toEqual(['cookie-valley']);
    expect(next.machines['galaxy-oven']['quantum-bakery']).toBe(0);
    expect(next.upgrades).toEqual({ production: 0, clickPower: 0, discount: 0 });
    expect(next.claimedMissions).toEqual([]);
    expect(next.essences).toBe(3);
    expect(next.totalRebirths).toBe(1);
    expect(totalRebirthRequiredLevel(next)).toBe(15);
    expect(essenceMultiplier(next)).toBeCloseTo(3.25);
  });

  it('does not allow total ascension before the required normal rebirths or run earnings', () => {
    const initial = createInitialState(100);
    const underLevel = {
      ...initial,
      rebirths: 9,
      runCrumbsEarned: rebirthCost(9),
    };
    expect(canTotalRebirth(underLevel)).toBe(false);
    expect(performTotalRebirth(underLevel, 200)).toBe(underLevel);

    const noRun = {
      ...initial,
      rebirths: 10,
      runCrumbsEarned: 0,
    };
    expect(canTotalRebirth(noRun)).toBe(false);
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

  it('exports and imports a portable save without changing progress', () => {
    const state = {
      ...createInitialState(100),
      crumbs: 345.5,
      lifetimeCrumbs: 900,
      runCrumbsEarned: 500,
      rebirths: 1,
      currentWorld: 'choco-moon' as WorldId,
      currentFloor: 1,
      unlockedWorlds: ['cookie-valley', 'choco-moon'] as WorldId[],
      goldenCookiesClaimed: 3,
    };
    state.machines['choco-moon']['conveyor-oven'] = 2;
    const encoded = exportSaveFile(state, 1000);
    const loaded = parseImportedSave(encoded, 1000);
    expect(loaded).not.toBeNull();
    expect(loaded?.crumbs).toBe(345.5);
    expect(loaded?.rebirths).toBe(1);
    expect(loaded?.currentWorld).toBe('choco-moon');
    expect(loaded?.currentFloor).toBe(1);
    expect(loaded?.machines['choco-moon']['conveyor-oven']).toBe(2);
    expect(loaded?.upgrades).toEqual({ production: 0, clickPower: 0, discount: 0 });
    expect(loaded?.claimedMissions).toEqual([]);
    expect(loaded?.goldenCookiesClaimed).toBe(3);
    expect(loaded?.ordersCompleted).toBe(0);
    expect(loaded?.totalRebirths).toBe(0);
    expect(loaded?.essences).toBe(0);
  });

  it('refuses malformed import text instead of replacing progress with a new game', () => {
    expect(parseImportedSave('not a save file', 123)).toBeNull();
    expect(parseImportedSave(JSON.stringify({ format: 'ovenfall-save', version: 99, state: {} }), 123)).toBeNull();
    expect(parseImportedSave(JSON.stringify({
      crumbs: -1,
      lifetimeCrumbs: 0,
      ovens: 0,
      lastSavedAt: 1,
    }), 123)).toBeNull();
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
