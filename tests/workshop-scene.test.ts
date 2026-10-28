import { describe, expect, it } from 'vitest';
import { getFloorTransitionLanding } from '../apps/web/src/workshop-scene';

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
