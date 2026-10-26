import { describe, expect, it } from 'vitest';
import {
  addCrumbs,
  applyOfflineProgress,
  buyOven,
  createInitialState,
  MAX_OFFLINE_SECONDS,
  ovenCost,
  parseSavedState,
  productionPerSecond,
} from '../apps/web/src/economy';

describe('economy', () => {
  it('increases crumbs and lifetime total when baking', () => {
    const state = addCrumbs(createInitialState(100), 1);
    expect(state.crumbs).toBe(1);
    expect(state.lifetimeCrumbs).toBe(1);
  });

  it('rejects invalid earning amounts', () => {
    const initial = createInitialState(100);
    expect(addCrumbs(initial, Number.NaN)).toBe(initial);
    expect(addCrumbs(initial, -1)).toBe(initial);
  });

  it('charges the configured oven cost and increases production', () => {
    const state = { ...createInitialState(100), crumbs: 100 };
    const next = buyOven(state);
    expect(next.crumbs).toBe(75);
    expect(next.ovens).toBe(1);
    expect(productionPerSecond(next)).toBe(0.5);
    expect(ovenCost(1)).toBe(30);
  });

  it('does not buy an unaffordable oven', () => {
    const state = { ...createInitialState(100), crumbs: 24 };
    expect(buyOven(state)).toBe(state);
  });

  it('caps offline production at eight hours', () => {
    const state = { ...createInitialState(0), ovens: 2, lastSavedAt: 0 };
    const next = applyOfflineProgress(state, (MAX_OFFLINE_SECONDS + 100) * 1000);
    expect(next.crumbs).toBe(2 * 0.5 * MAX_OFFLINE_SECONDS);
  });

  it('resets corrupted saves safely', () => {
    expect(parseSavedState('{broken', 123)).toEqual(createInitialState(123));
    expect(parseSavedState(JSON.stringify({ crumbs: -1, lifetimeCrumbs: 0, ovens: 0, lastSavedAt: 1 }), 123))
      .toEqual(createInitialState(123));
  });
});
