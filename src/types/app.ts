/** App-level types shared across features. */

export type Profile = {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_color: string;
  timezone: string;
  reminder_time: string | null;
  onboarded_at: string | null;
  xp_total: number;
  larper_level: number;
  class_title: string | null;
  show_on_leaderboards: boolean;
  created_at: string;
};

export type SkillCategory =
  | 'music'
  | 'visual_art'
  | 'crafts'
  | 'food'
  | 'fitness'
  | 'mind'
  | 'tech'
  | 'performance'
  | 'outdoors';

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  music: 'Music',
  visual_art: 'Visual art',
  crafts: 'Crafts and making',
  food: 'Food and drink',
  fitness: 'Fitness and movement',
  mind: 'Mind and language',
  tech: 'Tech and digital',
  performance: 'Performance and quirky',
  outdoors: 'Outdoors and home',
};

export type Skill = {
  id: string;
  slug: string;
  name: string;
  lower_name: string;
  category: SkillCategory;
  color: string;
  kudo_label: string;
  class_title: string;
  blurb: string | null;
  is_custom: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
};

export type UserSkill = {
  user_id: string;
  skill_id: string;
  tier: number;
  total_minutes: number;
  total_xp: number;
  nodes_landed: number;
  open_to_feedback?: boolean;
  skills?: Skill;
};

export const TIER_NAMES = ['Larping', 'Apprentice', 'Adept', 'Legit'] as const;
export const tierName = (t: number): string => TIER_NAMES[Math.max(0, Math.min(3, t))];

/** The three kudos on every post: fixed, skill-specific, fixed. */
export const kudoLabelsFor = (skill: Pick<Skill, 'kudo_label'>): string[] => [
  'Clean technique',
  skill.kudo_label,
  'I learned something',
];

export type PostMedia = { key: string; kind: 'image' | 'video' };

/** A feed post: a practice session or a Larp Check, normalised for the UI. */
export type FeedPost = {
  kind: 'session' | 'larp_check';
  id: string;
  userId: string;
  authorName: string;
  authorHandle: string;
  authorColor: string;
  authorTier: number;
  skillId: string;
  skillName: string;
  skillLower: string;
  skillColor: string;
  kudoLabel: string;
  nodeName: string | null;
  landed: boolean;
  at: string; // ISO timestamp (display time)
  minutes: number;
  note: string | null;
  label: string;
  isLate: boolean;
  kudoCounts: Record<string, number>;
  myKudos: string[];
  commentCount: number;
  savedByMe: boolean;
  media: PostMedia[];
  selfie: PostMedia | null;
};

export type TreeNodeState = 'landed' | 'in_progress' | 'available' | 'locked';

export type TreeNode = {
  id: string;
  name: string;
  branchIndex: number;
  position: number;
  isMilestone: boolean;
  requiresVideo: boolean;
  sessionsToLand: number;
  state: TreeNodeState;
  sessionsLogged: number;
};

export type TreeBranch = { id: string; name: string; nodes: TreeNode[] };

export type SkillTree = {
  skill: Skill;
  branches: TreeBranch[];
  landedCount: number;
  totalCount: number;
  xp: number;
};

export type CommentRow = {
  id: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  parentId: string | null;
  body: string;
  at: string;
};

export type Quest = {
  id: string;
  skillId: string | null;
  title: string;
  description: string;
  goalDays: number;
  endsOn: string;
  people: number;
  joined: boolean;
  progressDays: number;
};

export type Standard = {
  id: string;
  skillId: string;
  title: string;
  description: string;
  ladder: string[];
  attempts: {
    userId: string;
    name: string;
    color: string;
    tier: number;
    result: string;
  }[];
};

export type CoopRoom = {
  id: string;
  skillId: string;
  title: string;
  startedAt: string;
  members: { id: string; name: string; color: string }[];
};

export type GuildCard = {
  id: string;
  name: string;
  skillId: string | null;
  place: string | null;
  eventId: string | null;
  eventTitle: string | null;
  startsAt: string | null;
  goingCount: number;
  imGoing: boolean;
};

export type ActivityItem = {
  id: string;
  type: string;
  actorId: string | null;
  actorName: string | null;
  actorColor: string | null;
  data: Record<string, unknown>;
  at: string;
  unread: boolean;
};

export type LarpWindow = {
  id: string;
  region: string;
  firedAt: string;
  secondsLeft: number; // > 0 while the 2-minute window is live
};

export type StoryGroup = {
  userId: string;
  name: string;
  color: string;
  tier: number;
  items: FeedPost[];
};

export type StreakCard = {
  streak: number;
  shields: number;
  shieldDaysUsed: string[]; // local dates this week covered by a shield
  activeDays: string[]; // local dates with practice this week
  practisedToday: boolean;
};
