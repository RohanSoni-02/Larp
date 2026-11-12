export type TemplateBlock = { label: string; minutes: number };
export type SessionPlan = { name: string; blocks: TemplateBlock[] };

export const PRESET_PLANS: SessionPlan[] = [
  { name: 'Pomodoro', blocks: [{ label: 'Focus', minutes: 25 }, { label: 'Break', minutes: 5 }] },
  { name: 'Deep work', blocks: [{ label: 'Deep work', minutes: 50 }] },
  {
    name: 'Warm-up · Drill · Play',
    blocks: [
      { label: 'Warm-up', minutes: 10 },
      { label: 'Drill', minutes: 20 },
      { label: 'Play', minutes: 10 },
    ],
  },
];

export const planMinutes = (plan: SessionPlan): number => plan.blocks.reduce((sum, b) => sum + b.minutes, 0);

export type BlockPosition = {
  index: number;
  block: TemplateBlock;
  next: TemplateBlock | null;
  /** Seconds left in the current block. */
  remainingSec: number;
  /** 0–1 progress through the current block. */
  progress: number;
  done: boolean;
};

/** Where in the plan we are after `elapsedSec` of practice. */
export function blockAt(plan: SessionPlan, elapsedSec: number): BlockPosition {
  let start = 0;
  for (let i = 0; i < plan.blocks.length; i++) {
    const block = plan.blocks[i]!;
    const len = block.minutes * 60;
    if (elapsedSec < start + len) {
      const into = elapsedSec - start;
      return {
        index: i,
        block,
        next: plan.blocks[i + 1] ?? null,
        remainingSec: Math.ceil(len - into),
        progress: len > 0 ? into / len : 1,
        done: false,
      };
    }
    start += len;
  }
  const last = plan.blocks[plan.blocks.length - 1]!;
  return { index: plan.blocks.length - 1, block: last, next: null, remainingSec: 0, progress: 1, done: true };
}

/** Seconds-from-now at which each upcoming block boundary falls. */
export function upcomingBoundaries(plan: SessionPlan, elapsedSec: number): { atSec: number; startsBlock: TemplateBlock | null }[] {
  const out: { atSec: number; startsBlock: TemplateBlock | null }[] = [];
  let end = 0;
  plan.blocks.forEach((block, i) => {
    end += block.minutes * 60;
    if (end > elapsedSec) out.push({ atSec: end - elapsedSec, startsBlock: plan.blocks[i + 1] ?? null });
  });
  return out;
}

export function isValidPlan(plan: SessionPlan): boolean {
  return (
    plan.name.trim().length > 0 &&
    plan.name.trim().length <= 40 &&
    plan.blocks.length >= 1 &&
    plan.blocks.length <= 12 &&
    plan.blocks.every((b) => b.label.trim().length > 0 && b.minutes >= 1 && b.minutes <= 180)
  );
}
