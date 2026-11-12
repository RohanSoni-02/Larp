import { tierFromProgress, tierNeedNodes } from '../tiers';

describe('tierNeedNodes', () => {
  it('caps node requirements at the tree size', () => {
    // Calisthenics tree has 11 nodes, so Legit needs 11, not 12.
    expect(tierNeedNodes(3, 11)).toBe(11);
    expect(tierNeedNodes(3, 15)).toBe(12);
    expect(tierNeedNodes(1, 11)).toBe(2);
  });
});

describe('tierFromProgress', () => {
  it('everyone starts out Larping', () => {
    const t = tierFromProgress(0, 0, 11);
    expect(t.name).toBe('Larping');
    expect(t.index).toBe(0);
  });

  it('Apprentice needs 5 h AND 2 nodes', () => {
    expect(tierFromProgress(5 * 60, 2, 11).name).toBe('Apprentice');
    // Hours but not enough nodes -> still Larping.
    expect(tierFromProgress(10 * 60, 1, 11).name).toBe('Larping');
    // Nodes but not enough hours -> still Larping.
    expect(tierFromProgress(4 * 60, 2, 11).name).toBe('Larping');
  });

  it('Adept needs 25 h AND 6 nodes', () => {
    expect(tierFromProgress(25 * 60, 6, 11).name).toBe('Adept');
    expect(tierFromProgress(24 * 60, 6, 11).name).toBe('Apprentice');
  });

  it('Legit needs 100 h AND 12 nodes (capped by tree size)', () => {
    expect(tierFromProgress(100 * 60, 11, 11).name).toBe('Legit');
    expect(tierFromProgress(100 * 60, 12, 15).name).toBe('Legit');
    expect(tierFromProgress(99 * 60, 12, 15).name).toBe('Adept');
  });

  it('exposes progress toward the next tier', () => {
    const t = tierFromProgress(10 * 60, 3, 11);
    expect(t.next).toMatchObject({ name: 'Adept', hoursNeeded: 25, hoursDone: 10, nodesNeeded: 6, nodesDone: 3 });
  });

  it('has no next tier once Legit', () => {
    expect(tierFromProgress(200 * 60, 12, 12).next).toBeNull();
  });
});
