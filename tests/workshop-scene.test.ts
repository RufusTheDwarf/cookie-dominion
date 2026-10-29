import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { findWorkshopPath, getFloorTransitionLanding, isClosedWallCrossingBlocked, isWorkshopPositionBlocked, WORKSHOP_EFFECT_PROFILES } from '../apps/web/src/workshop-scene';


describe('workshop wall crossings', () => {
  it('blocks solid wall sections and leaves the doorway opening passable', () => {
    expect(isClosedWallCrossingBlocked(630, 670, 250)).toBe(true);
    expect(isClosedWallCrossingBlocked(630, 670, 290)).toBe(true);
    expect(isClosedWallCrossingBlocked(630, 670, 350)).toBe(false);
    expect(isClosedWallCrossingBlocked(630, 635, 250)).toBe(false);
  });
});

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
    expect(getFloorTransitionLanding(0, 1)).toEqual({ x: 770, y: 460 });
    expect(getFloorTransitionLanding(1, 2)).toEqual({ x: 770, y: 460 });
  });

  it('arrives beside the ascending stairs when returning to a lower floor', () => {
    expect(getFloorTransitionLanding(2, 1)).toEqual({ x: 870, y: 460 });
    expect(getFloorTransitionLanding(1, 0)).toEqual({ x: 870, y: 460 });
    expect(getFloorTransitionLanding(2, 0)).toEqual({ x: 870, y: 460 });
  });

  it('keeps the visible staircase objects fixed while landings stay clear', () => {
    expect(isWorkshopPositionBlocked(925, 520, 0)).toBe(true);
    expect(isWorkshopPositionBlocked(720, 520, 1)).toBe(true);
    expect(isWorkshopPositionBlocked(770, 460, 1)).toBe(false);
    expect(isWorkshopPositionBlocked(870, 460, 0)).toBe(false);
  });

  it('places the player on a free tile after changing floors', () => {
    for (const [from, to] of [[0, 1], [1, 2], [2, 1], [1, 0], [2, 0]]) {
      const landing = getFloorTransitionLanding(from, to);
      expect(landing).not.toBeNull();
      expect(isWorkshopPositionBlocked(landing!.x, landing!.y, to), `blocked landing from floor ${from} to ${to} at (${landing!.x}, ${landing!.y})`).toBe(false);
    }
  });

  it('does not create a landing for a same-floor move or invalid floors', () => {
    expect(getFloorTransitionLanding(1, 1)).toBeNull();
    expect(getFloorTransitionLanding(-1, 0)).toBeNull();
    expect(getFloorTransitionLanding(0, 3)).toBeNull();
    expect(getFloorTransitionLanding(0.5, 1)).toBeNull();
  });
});

describe('workshop click pathfinding', () => {
  it('routes around garden beds and reaches a walkable point near the requested target', () => {
    const path = findWorkshopPath(735, 520, 112, 172, 0);
    expect(path.length).toBeGreaterThan(0);
    expect(Math.hypot(path.at(-1)!.x - 112, path.at(-1)!.y - 172)).toBeLessThan(75);
    for (const point of path) expect(isWorkshopPositionBlocked(point.x, point.y, 0)).toBe(false);
  });

  it('finds a route across the workshop through the doorway', () => {
    const path = findWorkshopPath(500, 350, 1200, 350, 0);
    expect(path.length).toBeGreaterThan(0);
    expect(path.at(-1)!.x).toBeGreaterThan(1100);
    expect(path.length).toBeLessThan(20);
    let previous = { x: 500, y: 350 };
    let segmentIndex = 0;
    for (const point of path) {
      expect(isWorkshopPositionBlocked(point.x, point.y, 0)).toBe(false);
      // The first waypoint is reached from the player's exact off-grid position;
      // subsequent smoothed segments must stay clear of every collision box.
      if (segmentIndex > 0) {
        const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
        const samples = Math.max(1, Math.ceil(distance / 8));
        for (let sample = 1; sample <= samples; sample++) {
          const ratio = sample / samples;
          const x = previous.x + (point.x - previous.x) * ratio;
          const y = previous.y + (point.y - previous.y) * ratio;
          expect(isWorkshopPositionBlocked(x, y, 0)).toBe(false);
          const previousRatio = (sample - 1) / samples;
          expect(isClosedWallCrossingBlocked(
            previous.x + (point.x - previous.x) * previousRatio, x,
            previous.y + (point.y - previous.y) * previousRatio,
          )).toBe(false);
        }
      }
      segmentIndex++;
      for (const wall of [650, 1000]) {
        const crossesWall = (previous.x < wall && point.x > wall) ||
          (previous.x > wall && point.x < wall);
        if (crossesWall) {
          const crossingRatio = (wall - previous.x) / (point.x - previous.x);
          const crossingY = previous.y + (point.y - previous.y) * crossingRatio;
          expect(crossingY).toBeGreaterThanOrEqual(295);
          expect(crossingY).toBeLessThanOrEqual(415);
        }
      }
      previous = point;
    }
  });

  it('rejects invalid input and invalid floors', () => {
    expect(findWorkshopPath(0, 0, 100, 100, 9)).toEqual([]);
    expect(findWorkshopPath(Number.NaN, 0, 100, 100, 0)).toEqual([]);
  });
});


describe('workshop action animation profiles', () => {
  it('defines a visual profile for every gameplay feedback state', () => {
    const effects = [
      'harvest', 'craft', 'sell', 'order', 'purchase', 'unlock', 'mission',
      'world', 'rebirth', 'ascension', 'floor', 'save', 'level-up', 'selection', 'failure',
    ];
    expect(Object.keys(WORKSHOP_EFFECT_PROFILES).sort()).toEqual([...effects].sort());
    for (const effect of effects) {
      const profile = WORKSHOP_EFFECT_PROFILES[effect as keyof typeof WORKSHOP_EFFECT_PROFILES];
      expect(profile.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(profile.particleCount).toBeGreaterThan(0);
      expect(profile.ringCount).toBeGreaterThan(0);
      expect(profile.duration).toBeGreaterThan(0);
    }
  });

  it('gives major milestones more pronounced feedback than selection and failure', () => {
    expect(WORKSHOP_EFFECT_PROFILES.ascension.particleCount).toBeGreaterThan(WORKSHOP_EFFECT_PROFILES.selection.particleCount);
    expect(WORKSHOP_EFFECT_PROFILES.rebirth.ringCount).toBeGreaterThan(WORKSHOP_EFFECT_PROFILES.selection.ringCount);
    expect(WORKSHOP_EFFECT_PROFILES['level-up'].duration).toBeGreaterThan(WORKSHOP_EFFECT_PROFILES.failure.duration);
  });
});


describe('workshop starting position', () => {
  it('starts beside the first botanical plot and outside the collision box', () => {
    expect(isWorkshopPositionBlocked(160, 210, 0)).toBe(false);
    expect(findWorkshopPath(160, 210, 166, 192, 0).length).toBeGreaterThan(0);
  });
});


describe('application HTML structure', () => {
  it('keeps the workshop, manufacture, and office inside one valid grid', () => {
    const source = readFileSync(new URL('../apps/web/src/main.ts', import.meta.url), 'utf8');
    const match = source.match(/app\\.innerHTML\\s*=\\s*`([\\s\\S]*?)`;\\s*\\nfunction byId/);
    expect(match, 'the application HTML template must exist').not.toBeNull();
    const html = match![1]!;

    type ElementNode = { tag: string; className: string; children: ElementNode[] };
    const root: ElementNode = { tag: '#root', className: '', children: [] };
    const stack: ElementNode[] = [root];
    const voidTags = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr',
    ]);

    for (const tokenMatch of html.matchAll(/<!--[\\s\\S]*?-->|<\\/?[a-zA-Z][^>]*>/g)) {
      const token = tokenMatch[0];
      if (token.startsWith('<!--')) continue;
      const closing = /^<\\//.test(token);
      const name = token.match(/^<\\/?\\s*([a-zA-Z][\\w:-]*)/)?.[1]?.toLowerCase();
      if (!name) continue;

      if (closing) {
        expect(stack.length, 'unexpected closing tag ' + token).toBeGreaterThan(1);
        expect(stack[stack.length - 1]!.tag, 'mismatched closing tag ' + token).toBe(name);
        stack.pop();
        continue;
      }

      const className = token.match(/\\bclass=["']([^"']*)["']/)?.[1] ?? '';
      const element: ElementNode = { tag: name, className, children: [] };
      stack[stack.length - 1]!.children.push(element);
      if (!voidTags.has(name) && !/\\/\\s*>$/.test(token)) stack.push(element);
    }

    expect(stack.map((element) => element.tag), 'all HTML tags must be properly closed').toEqual(['#root']);
    const findByClass = (node: ElementNode, className: string): ElementNode | undefined => {
      if (node.className.split(/\\s+/).includes(className)) return node;
      for (const child of node.children) {
        const found = findByClass(child, className);
        if (found) return found;
      }
      return undefined;
    };

    const layout = findByClass(root, 'game-layout');
    expect(layout, 'the main layout grid must exist').toBeDefined();
    expect(layout!.children.map((child) => child.className.split(/\\s+/).find((name) =>
      ['workshop-column', 'production-column', 'store-column'].includes(name),
    ))).toEqual(['workshop-column', 'production-column', 'store-column']);

    const workshop = findByClass(layout!, 'workshop-column');
    expect(workshop!.children.some((child) => child.className.split(/\\s+/).includes('mini-metrics'))).toBe(true);
  });
});
