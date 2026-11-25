import type { FeedPost } from '@/src/types/app';

/**
 * Cold-start blending for the "For You" feed.
 *
 * A brand-new community has no posts, so the feed is seeded with a few
 * clearly-labelled official guide posts (see migration 0015). They are scaffolding,
 * not content to rank: real members' posts always come first, and the guides
 * step back as soon as the community can fill the feed on its own.
 */

/** With at least this many real posts in the feed, guide posts are hidden from "For You". */
export const GUIDE_FADE_THRESHOLD = 12;

/** Upper bound on guide posts shown while the community is still small. */
export const MAX_GUIDE_POSTS = 8;

/** One guide post shows after every this-many real posts. */
const REAL_POSTS_PER_GUIDE = 2;

/**
 * Order guide posts so the viewer's own skills come first and the rest are
 * spread across skills (one per skill per round) instead of a run of the same
 * guide.
 */
function rankGuidePosts(guides: FeedPost[], mySkillIds: ReadonlySet<string>): FeedPost[] {
  const bySkill = new Map<string, FeedPost[]>();
  for (const post of guides) {
    const list = bySkill.get(post.skillId) ?? [];
    list.push(post);
    bySkill.set(post.skillId, list);
  }
  // Skill queues: the viewer's skills first, otherwise stable by first appearance.
  const queues = [...bySkill.entries()]
    .sort(([a], [b]) => Number(mySkillIds.has(b)) - Number(mySkillIds.has(a)))
    .map(([, posts]) => posts);

  const ranked: FeedPost[] = [];
  for (let round = 0; ranked.length < guides.length; round++) {
    for (const queue of queues) {
      const post = queue[round];
      if (post) ranked.push(post);
    }
  }
  return ranked;
}

/**
 * @param posts all feed posts, newest first
 * @param mySkillIds skills in the viewer's portfolio, to surface relevant guides first
 */
export function blendForYou(posts: FeedPost[], mySkillIds: ReadonlySet<string> = new Set()): FeedPost[] {
  const real = posts.filter((p) => !p.authorOfficial);
  if (real.length >= GUIDE_FADE_THRESHOLD) return real;

  const guides = rankGuidePosts(
    posts.filter((p) => p.authorOfficial),
    mySkillIds,
  ).slice(0, MAX_GUIDE_POSTS);
  if (guides.length === 0) return real;

  const out: FeedPost[] = [];
  let g = 0;
  real.forEach((post, i) => {
    out.push(post);
    if ((i + 1) % REAL_POSTS_PER_GUIDE === 0 && g < guides.length) out.push(guides[g++]!);
  });
  return out.concat(guides.slice(g));
}
