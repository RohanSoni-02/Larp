import { blockAt, isValidPlan, planMinutes, PRESET_PLANS, upcomingBoundaries, type SessionPlan } from '../blocks';

const wdp: SessionPlan = PRESET_PLANS[2]!;

describe('session plan blocks', () => {
  it('sums plan minutes', () => {
    expect(planMinutes(wdp)).toBe(40);
  });

  it('finds the current block and time left', () => {
    const at = blockAt(wdp, 12 * 60);
    expect(at.block.label).toBe('Drill');
    expect(at.next?.label).toBe('Play');
    expect(at.remainingSec).toBe(18 * 60);
    expect(at.done).toBe(false);
  });

  it('treats a block boundary as the start of the next block', () => {
    expect(blockAt(wdp, 600).block.label).toBe('Drill');
  });

  it('marks the plan done after the last block', () => {
    const at = blockAt(wdp, 41 * 60);
    expect(at.done).toBe(true);
    expect(at.remainingSec).toBe(0);
  });

  it('lists only future boundaries', () => {
    expect(upcomingBoundaries(wdp, 15 * 60)).toEqual([
      { atSec: 15 * 60, startsBlock: { label: 'Play', minutes: 10 } },
      { atSec: 25 * 60, startsBlock: null },
    ]);
  });

  it('validates plans', () => {
    expect(isValidPlan(wdp)).toBe(true);
    expect(isValidPlan({ name: '', blocks: [{ label: 'x', minutes: 5 }] })).toBe(false);
    expect(isValidPlan({ name: 'ok', blocks: [{ label: 'x', minutes: 0 }] })).toBe(false);
  });
});
