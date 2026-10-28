import { describe, expect, it } from 'vitest';
import { getFloorTransitionLanding, isWorkshopPositionBlocked } from '../apps/web/src/workshop-scene';


describe('workshop collision boundaries', () => {
  it('blocks visible garden beds, the laboratory, and the counter', () => {
    expect(isWorkshopPositionBlocked(112, 172, 0)).toBe(true);
    expect(isWorkshopPositionBlocked(820, 355, 0)).toBe(true);
    expect(isWorkshopPositionBlocked(1225, 355, 0)).toBe(true);
  });

  it('keeps the intended interaction positions reachable outside object bounds', () => {
    expect(isWorkshopPositionBlocked(166, 192, 0)).toBe(false);
    expect(isWorkshopPositionBlocked(758, 375, 0)).toBe(false);
    expect(isWorkshopPositionBlocked(1160, 360, 0)).toBe(false);
  });

  it('blocks only purchased machines placed on the active floor', () => {
    const machine = { id: 'formulation-table', short: 'FORM', name: 'Table', floor: 0, count: 1 };
    expect(isWorkshopPositionBlocked(730, 230, 0, [machine])).toBe(true);
    expect(isWorkshopPositionBlocked(730, 230, 0, [{ ...machine, count: 0 }])).toBe(false);
    expect(isWorkshopPositionBlocked(730, 230, 1, [machine])).toBe(false);
  });

  it('does not block locked expansion plots until they are purchased', () => {
    expect(isWorkshopPositionBlocked(112, 545, 0, [], 0)).toBe(false);
    expect(isWorkshopPositionBlocked(112, 545, 0, [], 1)).toBe(true);
  });

  it('rejects positions outside the playable map', () => {
    expect(isWorkshopPositionBlocked(10, 400, 0)).toBe(true);
    expect(isWorkshopPositionBlocked(700, 730, 0)).toBe(true);
  });
});

describe('workshop floor landings', () => {
  it('arrives beside the descending stairs when moving to a higher floor', () => {
    expect(getFloorTransitionLanding(0, 1)).toEqual({ x: 720, y: 520 });
    expect(getFloorTransitionLanding(1, 2)).toEqual({ x: 720, y: 520 });
  });

  it('arrives beside the ascending stairs when returning to a lower floor', () => {
    expect(getFloorTransitionLanding(2, 1)).toEqual({ x: 925, y: 520 });
    expect(getFloorTransitionLanding(1, 0)).toEqual({ x: 925, y: 520 });
    expect(getFloorTransitionLanding(2, 0)).toEqual({ x: 925, y: 520 });
  });

  it('does not create a landing for a same-floor move or invalid floors', () => {
    expect(getFloorTransitionLanding(1, 1)).toBeNull();
    expect(getFloorTransitionLanding(-1, 0)).toBeNull();
    expect(getFloorTransitionLanding(0, 3)).toBeNull();
    expect(getFloorTransitionLanding(0.5, 1)).toBeNull();
  });
});
