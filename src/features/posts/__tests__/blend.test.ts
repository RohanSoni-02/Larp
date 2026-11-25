import type { FeedPost } from '@/src/types/app';

import { blendForYou, GUIDE_FADE_THRESHOLD, MAX_GUIDE_POSTS } from '../blend';

let counter = 0;
function post(overrides: Partial<FeedPost> = {}): FeedPost {
  counter += 1;
  return {
    kind: 'session',
    id: `post-${counter}`,
    userId: `user-${counter}`,
    authorName: 'Someone',
    authorHandle: 'someone',
    authorColor: '#5B3DF5',
    authorAvatarPath: null,
    authorOfficial: false,
    authorTier: 0,
    skillId: 'piano',
    skillName: 'Piano',
    skillLower: 'piano',
    skillColor: '#2F8FDE',
    skillSlug: 'piano',
    skillCategory: 'music',
    kudoLabel: 'Great timing',
    nodeName: null,
    landed: false,
    at: new Date(Date.UTC(2026, 10, 1, 0, counter)).toISOString(),
    minutes: 10,
    note: null,
    label: '',
    isLate: false,
    kudoCounts: {},
    myKudos: [],
    commentCount: 0,
    savedByMe: false,
    media: [],
    selfie: null,
    ...overrides,
  };
}

const guide = (skillId: string) => post({ authorOfficial: true, skillId });
const real = () => post();

describe('blendForYou', () => {
  it('shows only guide posts in an empty community', () => {
    const guides = [guide('piano'), guide('candle')];
    expect(blendForYou(guides)).toHaveLength(2);
  });

  it('puts real posts first and slots a guide post after every second real post', () => {
    const r = [real(), real(), real(), real()];
    const g = [guide('piano'), guide('candle'), guide('guitar')];
    const out = blendForYou([...r, ...g]);
    expect(out.map((p) => p.authorOfficial)).toEqual([false, false, true, false, false, true, true]);
    expect(out.filter((p) => !p.authorOfficial)).toEqual(r);
  });

  it('hides guide posts once the community fills the feed on its own', () => {
    const r = Array.from({ length: GUIDE_FADE_THRESHOLD }, real);
    const out = blendForYou([...r, guide('piano')]);
    expect(out.some((p) => p.authorOfficial)).toBe(false);
    expect(out).toHaveLength(GUIDE_FADE_THRESHOLD);
  });

  it('still shows guides one post below the threshold', () => {
    const r = Array.from({ length: GUIDE_FADE_THRESHOLD - 1 }, real);
    expect(blendForYou([...r, guide('piano')]).some((p) => p.authorOfficial)).toBe(true);
  });

  it('caps the number of guide posts', () => {
    const guides = Array.from({ length: MAX_GUIDE_POSTS + 5 }, (_, i) => guide(`skill-${i}`));
    expect(blendForYou(guides)).toHaveLength(MAX_GUIDE_POSTS);
  });

  it('surfaces guides for the viewer’s own skills first', () => {
    const guides = [guide('candle'), guide('piano'), guide('guitar')];
    const out = blendForYou(guides, new Set(['guitar']));
    expect(out[0]!.skillId).toBe('guitar');
  });

  it('spreads guide posts across skills instead of repeating one guide', () => {
    const guides = [guide('piano'), guide('piano'), guide('candle'), guide('candle')];
    const out = blendForYou(guides);
    expect(out.map((p) => p.skillId)).toEqual(['piano', 'candle', 'piano', 'candle']);
  });

  it('returns an empty feed when there is nothing at all', () => {
    expect(blendForYou([])).toEqual([]);
  });
});
