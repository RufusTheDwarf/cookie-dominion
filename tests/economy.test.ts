import { describe, expect, it } from 'vitest';
import {
  addPerfumeRevenue,
  applyOfflineProgress,
  buyStartingLand,
  buyMachine,
  botanicalExpansionCost,
  canUnlockBotanicalExpansion,
  unlockBotanicalExpansion,
  MAX_BOTANICAL_EXPANSIONS,
  buyUpgrade,
  canClaimMission,
  canCraftPerfume,
  canFulfillCustomerOrder,
  fulfillCustomerOrder,
  getActiveCustomerOrder,
  getHouseReputation,
  canUnlockFloor,
  canRebirth,
  canTotalRebirth,
  claimMission,
  createInitialState,
  craftPerfume,
  harvestMaterial,
  enterFloor,
  floorUnlockCost,
  enterWorld,
  exportSaveFile,
  MACHINES,
  WORLDS,
  machineCost,
  missionProgress,
  MAX_OFFLINE_SECONDS,
  parseImportedSave,
  parseSavedState,
  performRebirth,
  performTotalRebirth,
  productionPerSecond,
  operatingCostsPerSecond,
  netProductionPerSecond,
  PERFUME_RECIPES,
  perfumeSalePrice,
  sellPerfume,
  STARTING_LAND_COST,
  rebirthCost,
  rebirthMultiplier,
  totalRebirthRequiredLevel,
  essenceMultiplier,
  upgradeCost,
  unlockFloor,
  type WorldId,
} from '../apps/web/src/economy';

describe('tycoon economy', () => {
  it('starts with an empty workshop and preserves built legacy saves only when they have progress', () => {
    const initial = createInitialState(100);
    expect(initial.rampBuilt).toBe(false);
    expect(initial.startingPlotPurchased).toBe(false);
    expect(initial.wallsBuilt).toBe(false);
    expect(initial.outsideExpansions).toBe(0);

    const olderProgress = parseSavedState(JSON.stringify({
      ...initial,
      perfumeRevenue: 20,
      lifetimePerfumeRevenue: 20,
      runPerfumeRevenue: 20,
      rampBuilt: undefined,
      wallsBuilt: undefined,
      outsideExpansions: undefined,
    }), 100);
    expect(olderProgress.rampBuilt).toBe(true);
    expect(olderProgress.startingPlotPurchased).toBe(true);
    expect(olderProgress.wallsBuilt).toBe(false);

    const staleEmptySave = parseSavedState(JSON.stringify({
      ...initial,
      rampBuilt: undefined,
      unlockedFloors: [0, 1],
      currentFloor: 1,
    }), 100);
    expect(staleEmptySave.rampBuilt).toBe(false);
    expect(staleEmptySave.currentFloor).toBe(0);
    expect(staleEmptySave.unlockedFloors).toEqual([0]);

    const expandedLegacySave = parseSavedState(JSON.stringify({
      ...initial,
      rampBuilt: undefined,
      outsideExpansions: 1,
    }), 100);
    expect(expandedLegacySave.outsideExpansions).toBe(1);
    expect(expandedLegacySave.rampBuilt).toBe(true);

    const staleExplicitRampSave = parseSavedState(JSON.stringify({ ...initial, rampBuilt: true }), 100);
    expect(staleExplicitRampSave.rampBuilt).toBe(false);
    expect(staleExplicitRampSave.startingPlotPurchased).toBe(false);
  });

  it('migrates an empty first-generation save to the unbuilt starting room', () => {
    const legacy = parseSavedState(JSON.stringify({
      perfumeRevenue: 0,
      lifetimePerfumeRevenue: 0,
      alambics: 0,
      lastSavedAt: 100,
    }), 100);
    expect(legacy.rampBuilt).toBe(false);
    expect(legacy.machines['glass-garden']['copper-still']).toBe(0);
    expect(legacy.unlockedFloors).toEqual([0]);
  });

  it('unlocks extra garden plots with rising deterministic costs', () => {
    const initial = createInitialState(100);
    expect(initial.outsideExpansions).toBe(0);
    expect(botanicalExpansionCost(initial)).toBe(2_500);
    expect(canUnlockBotanicalExpansion(initial)).toBe(false);
    expect(unlockBotanicalExpansion(initial)).toBe(initial);

    const first = unlockBotanicalExpansion({ ...initial, perfumeRevenue: 2_500 });
    expect(first.outsideExpansions).toBe(1);
    expect(first.perfumeRevenue).toBe(0);
    expect(botanicalExpansionCost(first)).toBe(25_000);

    const second = unlockBotanicalExpansion({ ...first, perfumeRevenue: 25_000 });
    expect(second.outsideExpansions).toBe(2);
    expect(second.perfumeRevenue).toBe(0);
    expect(botanicalExpansionCost(second)).toBe(250_000);

    const third = unlockBotanicalExpansion({ ...second, perfumeRevenue: 250_000 });
    expect(third.outsideExpansions).toBe(MAX_BOTANICAL_EXPANSIONS);
    expect(third.perfumeRevenue).toBe(0);
    expect(canUnlockBotanicalExpansion({ ...third, perfumeRevenue: 1_000_000 })).toBe(false);
    expect(unlockBotanicalExpansion(third)).toBe(third);
  });

  it('requires 1,000 perfumes to purchase the starting outdoor plot', () => {
    const broke = createInitialState(100);
    expect(buyStartingLand(broke)).toBe(broke);

    const funded = { ...broke, perfumeRevenue: STARTING_LAND_COST };
    const purchased = buyStartingLand(funded);
    expect(purchased.rampBuilt).toBe(true);
    expect(purchased.startingPlotPurchased).toBe(true);
    expect(purchased.perfumeRevenue).toBe(0);
    expect(buyStartingLand(purchased)).toBe(purchased);
  });

  it('gives parfums for manual formulation and tracks this run separately', () => {
    const state = addPerfumeRevenue(createInitialState(100), 10);
    expect(state.perfumeRevenue).toBe(10);
    expect(state.lifetimePerfumeRevenue).toBe(10);
    expect(state.runPerfumeRevenue).toBe(10);
  });

  it('harvests only the selected material and crafts/sells recipes without random rolls', () => {
    let state = createInitialState(100);
    for (let action = 1; action <= 10; action += 1) {
      state = harvestMaterial(state, 'lavender').state;
      expect(state.perfumeRevenue).toBe(0);
      expect(state.harvestProgress).toBe(action);
    }
    expect(state.gatherClicks).toBe(10);
    expect(state.ingredients.lavender).toBe(10);
    expect(state.perfumeStock['green-whisper']).toBe(0);
    expect(state.materialDiscoveries.lavender).toBe(10);

    let recipeState = harvestMaterial(createInitialState(100), 'lavender').state;
    recipeState = harvestMaterial(recipeState, 'mint').state;
    expect(canCraftPerfume(recipeState, 'green-whisper')).toBe(true);
    expect(canCraftPerfume(recipeState, 'soft-rose')).toBe(false);
    const crafted = craftPerfume(recipeState, 'green-whisper');
    expect(crafted.ingredients.lavender).toBe(0);
    expect(crafted.ingredients.mint).toBe(0);
    expect(crafted.perfumeStock['green-whisper']).toBe(1);
    expect(crafted.perfumeRevenue).toBe(0);
    expect(perfumeSalePrice(crafted, 'green-whisper')).toBe(2);
    const sold = sellPerfume(crafted, 'green-whisper');
    expect(sold.perfumeRevenue).toBe(2);
    expect(sold.lifetimePerfumeRevenue).toBe(2);
    expect(sold.perfumesSold).toBe(1);
    expect(sold.perfumeStock['green-whisper']).toBe(0);
    expect(sellPerfume(sold, 'green-whisper')).toBe(sold);
  });

  it('supports several distinct herb combinations with increasing sale prices', () => {
    const gather = (ids: Array<'lavender' | 'mint' | 'rose' | 'bergamot' | 'sandalwood' | 'jasmine' | 'resin'>) =>
      ids.reduce((current, id) => harvestMaterial(current, id).state, createInitialState(100));
    const floral = craftPerfume(gather(['lavender', 'rose']), 'soft-rose');
    const citrus = craftPerfume(gather(['mint', 'bergamot']), 'citrus-dawn');
    const royal = craftPerfume(gather(['lavender', 'rose', 'jasmine']), 'royal-bouquet');
    const amber = craftPerfume(gather(['sandalwood', 'resin', 'jasmine']), 'amber-velvet');
    expect(floral.perfumeStock['soft-rose']).toBe(1);
    expect(citrus.perfumeStock['citrus-dawn']).toBe(1);
    expect(royal.perfumeStock['royal-bouquet']).toBe(1);
    expect(amber.perfumeStock['amber-velvet']).toBe(1);
    expect(PERFUME_RECIPES.map((recipe) => recipe.salePrice)).toEqual([2, 3, 4, 6, 10]);
  });

  it('applies deterministic harvest upgrades to the chosen garden bed', () => {
    const initial = createInitialState(100);
    const trained = { ...initial, upgrades: { ...initial.upgrades, clickPower: 2, rareBonus: 3 } };
    const common = harvestMaterial(trained, 'lavender');
    expect(common.materials).toEqual(['lavender', 'lavender']);
    expect(common.state.ingredients.lavender).toBe(2);
    const rare = harvestMaterial(trained, 'resin');
    expect(rare.materials).toEqual(['resin', 'resin', 'resin']);
    expect(rare.state.ingredients.resin).toBe(3);
    expect(rare.state.gatherClicks).toBe(1);
  });

  it('persists partial botanical harvests and the discovery journal', () => {
    let state = createInitialState(100);
    for (let click = 0; click < 4; click += 1) {
      state = harvestMaterial(state, 'lavender').state;
    }

    state = { ...state, perfumeStock: { ...state.perfumeStock, 'green-whisper': 2 }, perfumesSold: 1 };
    const encoded = exportSaveFile(state, 1000);
    const restored = parseImportedSave(encoded, 1000);
    expect(restored).not.toBeNull();
    expect(restored?.gatherClicks).toBe(4);
    expect(restored?.harvestProgress).toBe(4);
    expect(restored?.ingredients.lavender).toBe(4);
    expect(restored?.materialDiscoveries.lavender).toBe(4);
    expect(restored?.lastHarvestedMaterial).toBe('lavender');
    expect(restored?.perfumeStock['green-whisper']).toBe(2);
    expect(restored?.perfumesSold).toBe(1);
  });

  it('delivers deterministic customer orders and pays the 50% premium exactly once', () => {
    const initial = createInitialState(100);
    const first = getActiveCustomerOrder(initial);
    expect(first.orderNumber).toBe(1);
    expect(first.recipeId).toBe('green-whisper');
    expect(first.quantity).toBe(1);
    expect(first.normalValue).toBe(2);
    expect(first.reward).toBe(3);
    expect(canFulfillCustomerOrder(initial)).toBe(false);
    expect(fulfillCustomerOrder(initial)).toBe(initial);

    const stocked = {
      ...initial,
      perfumeStock: { ...initial.perfumeStock, 'green-whisper': 1 },
    };
    expect(canFulfillCustomerOrder(stocked)).toBe(true);
    const delivered = fulfillCustomerOrder(stocked);
    expect(delivered.perfumeStock['green-whisper']).toBe(0);
    expect(delivered.perfumesSold).toBe(1);
    expect(delivered.customerOrdersCompleted).toBe(1);
    expect(delivered.perfumeRevenue).toBe(3);
    expect(delivered.lifetimePerfumeRevenue).toBe(3);
    expect(getActiveCustomerOrder(delivered).recipeId).toBe('soft-rose');
    expect(fulfillCustomerOrder(delivered)).toBe(delivered);
  });

  it('requires the full order quantity and preserves the order queue in saves', () => {
    const initial = createInitialState(100);
    const partial = {
      ...initial,
      customerOrdersCompleted: 5,
      perfumeStock: { ...initial.perfumeStock, 'green-whisper': 1 },
    };
    const order = getActiveCustomerOrder(partial);
    expect(order.recipeId).toBe('green-whisper');
    expect(order.quantity).toBe(2);
    expect(canFulfillCustomerOrder(partial)).toBe(false);
    expect(fulfillCustomerOrder(partial)).toBe(partial);

    const restored = parseImportedSave(exportSaveFile(partial, 1000), 1000);
    expect(restored?.customerOrdersCompleted).toBe(5);
    expect(getActiveCustomerOrder(restored!).orderNumber).toBe(6);
    expect(getActiveCustomerOrder(restored!).quantity).toBe(2);
  });

  it('increases house reputation and customer premiums at deterministic rank thresholds', () => {
    const initial = createInitialState(100);
    expect(getHouseReputation(initial)).toEqual({
      points: 0,
      rank: 1,
      maxRank: 10,
      pointsIntoRank: 0,
      progressPercent: 0,
      premiumPercent: 50,
    });

    const threeOrders = getHouseReputation({ customerOrdersCompleted: 3 });
    expect(threeOrders.points).toBe(75);
    expect(threeOrders.rank).toBe(1);
    expect(threeOrders.progressPercent).toBe(75);

    const fourOrders = getHouseReputation({ customerOrdersCompleted: 4 });
    expect(fourOrders.points).toBe(100);
    expect(fourOrders.rank).toBe(2);
    expect(fourOrders.premiumPercent).toBe(55);

    const nextOrder = getActiveCustomerOrder({ ...initial, customerOrdersCompleted: 4 });
    expect(nextOrder.premiumPercent).toBe(55);
    expect(nextOrder.normalValue).toBe(10);
    expect(nextOrder.reward).toBe(16);

    const maxed = getHouseReputation({ customerOrdersCompleted: 36 });
    expect(maxed.rank).toBe(10);
    expect(maxed.premiumPercent).toBe(95);
    expect(maxed.progressPercent).toBe(100);
  });

  it('rejects invalid earning amounts', () => {
    const initial = createInitialState(100);
    expect(addPerfumeRevenue(initial, Number.NaN)).toBe(initial);
    expect(addPerfumeRevenue(initial, -1)).toBe(initial);
  });

  it('lets the player buy a machine and raises passive output', () => {
    const state = { ...createInitialState(100), perfumeRevenue: 100 };
    const next = buyMachine(state, 'formulation-table');
    expect(next.perfumeRevenue).toBe(97);
    expect(next.machines['glass-garden']['formulation-table']).toBe(1);
    expect(productionPerSecond(next)).toBeCloseTo(3 / 3.5);
    expect(machineCost(next, 'formulation-table')).toBe(5);
  });

  it('buys permanent research upgrades and applies their effects', () => {
    const initial = createInitialState(100);
    const withMixer = {
      ...initial,
      perfumeRevenue: 800,
      machines: {
        ...initial.machines,
        'glass-garden': { ...initial.machines['glass-garden'], 'formulation-table': 1 },
      },
    };
    expect(productionPerSecond(withMixer)).toBeCloseTo(3 / 3.5);

    const researched = buyUpgrade(withMixer, 'production');
    expect(researched.perfumeRevenue).toBe(500);
    expect(researched.upgrades.production).toBe(1);
    expect(productionPerSecond(researched)).toBeCloseTo((3 / 3.5) * 1.2);
    expect(upgradeCost(researched, 'production')).toBe(555);

    const clickResearch = buyUpgrade({ ...withMixer, perfumeRevenue: 200 }, 'clickPower');
    expect(clickResearch.upgrades.clickPower).toBe(1);

    const discounted = buyUpgrade({ ...withMixer, perfumeRevenue: 600 }, 'discount');
    expect(machineCost(discounted, 'copper-still')).toBe(18);

    const rareResearch = buyUpgrade({ ...withMixer, perfumeRevenue: 2000 }, 'rareBonus');
    expect(rareResearch.upgrades.rareBonus).toBe(1);
    const luxuryFinish = buyUpgrade({ ...withMixer, perfumeRevenue: 2000 }, 'orders');
    expect(luxuryFinish.upgrades.orders).toBe(1);
    expect(perfumeSalePrice(luxuryFinish, 'green-whisper')).toBe(3);

    expect(buyUpgrade({ ...researched, upgrades: { ...researched.upgrades, production: 10 } }, 'production').upgrades.production).toBe(10);
  });

  it('tracks and rewards completed factory missions exactly once', () => {
    const initial = createInitialState(100);
    expect(canClaimMission(initial, 'first-machine')).toBe(false);
    const built = {
      ...initial,
      machines: {
        ...initial.machines,
        'glass-garden': { ...initial.machines['glass-garden'], 'formulation-table': 1 },
      },
    };
    expect(missionProgress(built, {
      id: 'first-machine', name: 'First', description: 'Build', target: 1, reward: 75, kind: 'machines',
    })).toBe(1);
    expect(canClaimMission(built, 'first-machine')).toBe(true);
    const rewarded = claimMission(built, 'first-machine');
    expect(rewarded.perfumeRevenue).toBe(2);
    expect(rewarded.claimedMissions).toContain('first-machine');
    expect(claimMission(rewarded, 'first-machine')).toBe(rewarded);
  });

  it('locks floors until the player builds enough machines and pays for stairs', () => {
    const initial = { ...createInitialState(100), perfumeRevenue: 260 };
    expect(initial.unlockedFloors).toEqual([0]);
    expect(enterFloor(initial, 1)).toBe(initial);
    expect(floorUnlockCost(1)).toBe(260);
    expect(canUnlockFloor(initial, 1)).toBe(false);

    const withTwoMachines = {
      ...initial,
      rampBuilt: true,
      machines: {
        ...initial.machines,
        'glass-garden': { ...initial.machines['glass-garden'], 'formulation-table': 1, 'copper-still': 1 },
      },
    };
    expect(canUnlockFloor(withTwoMachines, 1)).toBe(true);
    const opened = unlockFloor(withTwoMachines, 1);
    expect(opened.perfumeRevenue).toBe(0);
    expect(opened.unlockedFloors).toEqual([0, 1]);
    expect(enterFloor(opened, 1).currentFloor).toBe(1);
    expect(enterFloor(opened, 2)).toBe(opened);
  });

  it('only allows equipment that belongs to the currently active, unlocked floor', () => {
    const starter = { ...createInitialState(100), perfumeRevenue: 5000 };
    expect(buyMachine(starter, 'bottling-line')).toBe(starter);

    const firstUpperFloor = { ...starter, currentFloor: 1, unlockedFloors: [0, 1] };
    const firstHighTier = buyMachine(firstUpperFloor, 'bottling-line');
    expect(firstHighTier.perfumeRevenue).toBe(4860);
    expect(firstHighTier.machines['glass-garden']['bottling-line']).toBe(1);
    expect(buyMachine(firstUpperFloor, 'astral-extractor')).toBe(firstUpperFloor);

    const funded = { ...starter, perfumeRevenue: 100_000_000, currentFloor: 2, unlockedFloors: [0, 1, 2] };
    const advanced = buyMachine(funded, 'astral-extractor');
    expect(advanced.machines['glass-garden']['astral-extractor']).toBe(1);
    expect(advanced.perfumeRevenue).toBeLessThan(funded.perfumeRevenue);

    const orbital = buyMachine({ ...funded, perfumeRevenue: 2_000_000_000 }, 'orbital-manufactory');
    expect(orbital.machines['glass-garden']['orbital-manufactory']).toBe(1);
  });

  it('scales production by each world and permanent rebirths', () => {
    const base = {
      ...createInitialState(100),
      machines: {
        ...createInitialState(100).machines,
        'glass-garden': { ...createInitialState(100).machines['glass-garden'], 'formulation-table': 1 },
        'amber-house': { ...createInitialState(100).machines['amber-house'], 'formulation-table': 1 },
      },
      unlockedWorlds: ['glass-garden', 'amber-house'] as WorldId[],
    };
    expect(productionPerSecond(base)).toBeCloseTo(3 / 3.5);
    expect(productionPerSecond(base, 'amber-house')).toBeCloseTo((3 / 3.5) * 8);
    expect(productionPerSecond({ ...base, rebirths: 2 })).toBeCloseTo((3 / 3.5) * 1.6 ** 2);
  });

  it('does not enter locked worlds and allows unlocked portals', () => {
    const state = createInitialState(100);
    expect(enterWorld(state, 'amber-house')).toBe(state);
    const unlocked = { ...state, unlockedWorlds: ['glass-garden', 'amber-house'] as WorldId[] };
    expect(enterWorld(unlocked, 'amber-house').currentWorld).toBe('amber-house');
  });

  it('changes only to unlocked floors and allows returning down the staircase', () => {
    const state = createInitialState(100);
    expect(state.unlockedFloors).toEqual([0]);
    expect(enterFloor(state, 2)).toBe(state);
    const firstFloor = { ...state, unlockedFloors: [0, 1], currentFloor: 1 };
    expect(enterFloor(firstFloor, 1).currentFloor).toBe(1);
    expect(enterFloor(firstFloor, 2)).toBe(firstFloor);
    const upperFloor = { ...state, unlockedFloors: [0, 1, 2], currentFloor: 2 };
    expect(enterFloor(upperFloor, 1).currentFloor).toBe(1);
    expect(enterFloor(upperFloor, 0).currentFloor).toBe(0);
    expect(enterFloor(state, 4)).toBe(state);
  });

  it('requires the run threshold before rebirth', () => {
    const state = { ...createInitialState(100), perfumeRevenue: 500, runPerfumeRevenue: 500 };
    expect(canRebirth(state)).toBe(false);
    expect(performRebirth(state)).toBe(state);
    expect(rebirthCost(0)).toBe(10000);
  });

  it('resets the factory, keeps lifetime earnings and unlocks Choco Moon on rebirth', () => {
    const initial = createInitialState(100);
    const state = {
      ...initial,
      perfumeRevenue: 350,
      lifetimePerfumeRevenue: 3200,
      runPerfumeRevenue: rebirthCost(0),
      machines: {
        ...initial.machines,
        'glass-garden': { ...initial.machines['glass-garden'], 'formulation-table': 2 },
      },
    };
    const next = performRebirth(state);
    expect(next.rebirths).toBe(1);
    expect(next.perfumeRevenue).toBe(0);
    expect(next.runPerfumeRevenue).toBe(0);
    expect(next.lifetimePerfumeRevenue).toBe(3200);
    expect(next.machines['glass-garden']['formulation-table']).toBe(0);
    expect(next.unlockedWorlds).toContain('amber-house');
    expect(next.unlockedFloors).toEqual([0]);
    expect(rebirthMultiplier(next)).toBe(1.6);
  });

  it('unlocks Galaxy Alambic after the third rebirth', () => {
    const state = {
      ...createInitialState(100),
      rebirths: 2,
      runPerfumeRevenue: rebirthCost(2),
      unlockedWorlds: ['glass-garden', 'amber-house'] as const,
    };
    expect(performRebirth(state).unlockedWorlds).toContain('astral-palace');
  });

  it('unlocks total ascension at the prestige level and resets all normal progress', () => {
    const initial = createInitialState(100);
    const ready = {
      ...initial,
      perfumeRevenue: 999,
      lifetimePerfumeRevenue: 900000,
      runPerfumeRevenue: rebirthCost(10),
      rebirths: 10,
      totalRebirths: 0,
      essences: 2,
      currentWorld: 'astral-palace' as WorldId,
      currentFloor: 2,
      unlockedWorlds: ['glass-garden', 'amber-house', 'astral-palace'] as WorldId[],
      upgrades: { production: 4, clickPower: 3, discount: 2 },
      claimedMissions: ['first-machine'] as const,
      machines: {
        ...initial.machines,
        'astral-palace': { ...initial.machines['astral-palace'], 'astral-extractor': 4 },
      },
    };
    expect(totalRebirthRequiredLevel(ready)).toBe(10);
    expect(canTotalRebirth(ready)).toBe(true);
    const next = performTotalRebirth(ready, 200);
    expect(next.perfumeRevenue).toBe(0);
    expect(next.lifetimePerfumeRevenue).toBe(0);
    expect(next.runPerfumeRevenue).toBe(0);
    expect(next.rebirths).toBe(0);
    expect(next.currentWorld).toBe('glass-garden');
    expect(next.currentFloor).toBe(0);
    expect(next.unlockedWorlds).toEqual(['glass-garden']);
    expect(next.machines['astral-palace']['astral-extractor']).toBe(0);
    expect(next.upgrades).toEqual({ production: 0, clickPower: 0, discount: 0, rareBonus: 0, orders: 0 });
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
      runPerfumeRevenue: rebirthCost(9),
    };
    expect(canTotalRebirth(underLevel)).toBe(false);
    expect(performTotalRebirth(underLevel, 200)).toBe(underLevel);

    const noRun = {
      ...initial,
      rebirths: 10,
      runPerfumeRevenue: 0,
    };
    expect(canTotalRebirth(noRun)).toBe(false);
  });

  it('charges operating costs for installed machines and reports net cashflow', () => {
    const initial = createInitialState(100);
    expect(operatingCostsPerSecond(initial)).toBe(0);
    expect(netProductionPerSecond(initial)).toBe(0);

    const installed = {
      ...initial,
      machines: {
        ...initial.machines,
        'glass-garden': {
          ...initial.machines['glass-garden'],
          'formulation-table': 2,
          'copper-still': 1,
        },
      },
    };
    const expectedUpkeep = (2 * 3 + 18) / 600;
    expect(operatingCostsPerSecond(installed)).toBeCloseTo(expectedUpkeep);
    expect(netProductionPerSecond(installed)).toBeCloseTo(
      productionPerSecond(installed) - expectedUpkeep,
    );

    const otherWorld = {
      ...installed,
      currentWorld: 'amber-house' as WorldId,
      machines: {
        ...installed.machines,
        'amber-house': {
          ...installed.machines['amber-house'],
          'formulation-table': 1,
        },
      },
    };
    expect(operatingCostsPerSecond(otherWorld)).toBeCloseTo((3 * 5) / 600);
  });

  it('keeps every first machine purchase net-positive across all three worlds', () => {
    const initial = createInitialState(100);

    for (const world of WORLDS) {
      const emptyWorld = {
        ...initial,
        currentWorld: world.id,
        unlockedWorlds: WORLDS.map((entry) => entry.id),
      };

      for (const machine of MACHINES) {
        const installed = {
          ...emptyWorld,
          machines: {
            ...emptyWorld.machines,
            [world.id]: {
              ...emptyWorld.machines[world.id],
              [machine.id]: 1,
            },
          },
        };
        const netPerSecond = netProductionPerSecond(installed);
        const firstCost = machineCost(emptyWorld, machine.id);

        expect(netPerSecond).toBeGreaterThan(0);
        expect(operatingCostsPerSecond(installed)).toBeLessThan(productionPerSecond(installed));
        expect(firstCost / netPerSecond).toBeLessThan(120);
      }
    }
  });

  it('caps offline production at eight hours after operating costs', () => {
    const initial = createInitialState(0);
    const state = {
      ...initial,
      machines: {
        ...initial.machines,
        'glass-garden': { ...initial.machines['glass-garden'], 'formulation-table': 2 },
      },
      lastSavedAt: 0,
    };
    const next = applyOfflineProgress(state, (MAX_OFFLINE_SECONDS + 100) * 1000);
    const expectedNetProduction = netProductionPerSecond(state) * MAX_OFFLINE_SECONDS;
    expect(next.perfumeRevenue).toBeCloseTo(expectedNetProduction);
    expect(next.runPerfumeRevenue).toBeCloseTo(expectedNetProduction);
  });

  it('migrates the older alambic-only save', () => {
    const migrated = parseSavedState(JSON.stringify({
      perfumeRevenue: 75,
      lifetimePerfumeRevenue: 500,
      alambics: 2,
      lastSavedAt: 100,
    }), 100);
    expect(migrated.perfumeRevenue).toBe(75);
    expect(migrated.machines['glass-garden']['copper-still']).toBe(2);
    expect(migrated.currentWorld).toBe('glass-garden');
  });

  it('exports and imports a portable save without changing progress', () => {
    const state = {
      ...createInitialState(100),
      perfumeRevenue: 345.5,
      lifetimePerfumeRevenue: 900,
      runPerfumeRevenue: 500,
      rebirths: 1,
      currentWorld: 'amber-house' as WorldId,
      currentFloor: 1,
      unlockedFloors: [0, 1],
      outsideExpansions: 2,
      unlockedWorlds: ['glass-garden', 'amber-house'] as WorldId[],
      rareFlaconsClaimed: 3,
      ordersCompleted: 4,
    };
    state.machines['amber-house']['bottling-line'] = 2;
    const encoded = exportSaveFile(state, 1000);
    const loaded = parseImportedSave(encoded, 1000);
    expect(loaded).not.toBeNull();
    expect(loaded?.perfumeRevenue).toBe(345.5);
    expect(loaded?.rebirths).toBe(1);
    expect(loaded?.currentWorld).toBe('amber-house');
    expect(loaded?.currentFloor).toBe(1);
    expect(loaded?.outsideExpansions).toBe(2);
    expect(loaded?.machines['amber-house']['bottling-line']).toBe(2);
    expect(loaded?.upgrades).toEqual({ production: 0, clickPower: 0, discount: 0, rareBonus: 0, orders: 0 });
    expect(loaded?.claimedMissions).toEqual([]);
    expect(loaded?.rareFlaconsClaimed).toBe(3);
    expect(loaded?.ordersCompleted).toBe(4);
    expect(loaded?.totalRebirths).toBe(0);
    expect(loaded?.essences).toBe(0);
    expect(loaded?.unlockedFloors).toEqual([0, 1]);
  });

  it('refuses malformed import text instead of replacing progress with a new game', () => {
    expect(parseImportedSave('not a save file', 123)).toBeNull();
    expect(parseImportedSave(JSON.stringify({ format: 'alambicfall-save', version: 99, state: {} }), 123)).toBeNull();
    expect(parseImportedSave(JSON.stringify({
      perfumeRevenue: -1,
      lifetimePerfumeRevenue: 0,
      alambics: 0,
      lastSavedAt: 1,
    }), 123)).toBeNull();
  });

  it('resets corrupted saves safely', () => {
    expect(parseSavedState('{broken', 123)).toEqual(createInitialState(123));
    expect(parseSavedState(JSON.stringify({
      perfumeRevenue: -1,
      lifetimePerfumeRevenue: 0,
      runPerfumeRevenue: 0,
      rebirths: 0,
      machines: {},
      currentWorld: 'glass-garden',
      currentFloor: 0,
      unlockedWorlds: ['glass-garden'],
      lastSavedAt: 1,
    }), 123)).toEqual(createInitialState(123));
  });
});
