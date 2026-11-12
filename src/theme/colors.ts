/**
 * Flat white canvas, soft grey panels instead of outlined cards, navy ink for
 * selection, and Larping purple only for the primary action and progress.
 * `night` is the one dark surface: event moments (Larp Check, live rooms).
 * Gold is reserved for XP and tiers, green for landed nodes, flame for streaks.
 */
export const light = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surface2: '#F3F3F7',
  surface3: '#E6E6EE',
  ink: '#0E0F1C',
  muted: '#5C5F72',
  subtle: '#9A9DAE',
  line: '#ECECF2',
  /** Translucent control fill: reads on both the white canvas and grey panels. */
  fill: 'rgba(14,15,28,0.06)',
  primary: '#5B3DF5',
  primaryInk: '#FFFFFF',
  primarySoft: '#EEEAFF',
  accent: '#5B3DF5',
  accentInk: '#FFFFFF',
  accentSoft: '#EEEAFF',
  /** Purple dark enough for text and thin strokes on light or tinted surfaces. */
  accentStrong: '#4A2DDB',
  /** Brand panels (streak, player card, weekly stats). */
  hero: '#F3F3F7',
  heroSurface: '#FFFFFF',
  heroInk: '#0E0F1C',
  heroMuted: '#5C5F72',
  heroLine: '#E6E6EE',
  night: '#12132A',
  nightInk: '#FFFFFF',
  nightMuted: '#A9ABC8',
  nightLine: '#2A2C4A',
  flame: '#FF7A1A',
  gold: '#B98100',
  goldSoft: '#FCF1D4',
  good: '#16A34A',
  bad: '#E5484D',
  overlay: 'rgba(17,20,39,0.45)',
  heat0: '#E1E2EA',
  heat1: '#DCD4FF',
  heat2: '#B3A2FF',
  heat3: '#8269FA',
  heat4: '#5B3DF5',
} as const;

export const dark = {
  bg: '#0B0C12',
  surface: '#14161F',
  surface2: '#1C1F2A',
  surface3: '#282B38',
  ink: '#F2F3F8',
  muted: '#A2A7BA',
  subtle: '#6C7186',
  line: '#252837',
  fill: 'rgba(255,255,255,0.08)',
  primary: '#7A61FF',
  primaryInk: '#FFFFFF',
  primarySoft: '#221C46',
  accent: '#7A61FF',
  accentInk: '#FFFFFF',
  accentSoft: '#221C46',
  accentStrong: '#A897FF',
  hero: '#14161F',
  heroSurface: '#221C46',
  heroInk: '#F2F3F8',
  heroMuted: '#A2A7BA',
  heroLine: '#2A2D3D',
  night: '#1A1640',
  nightInk: '#FFFFFF',
  nightMuted: '#B4AEDC',
  nightLine: '#2F2A5C',
  flame: '#FF8A3D',
  gold: '#FFC53D',
  goldSoft: '#2B2210',
  good: '#4ADE80',
  bad: '#FF6369',
  overlay: 'rgba(0,0,0,0.6)',
  heat0: '#1A1C27',
  heat1: '#2A2356',
  heat2: '#4636A8',
  heat3: '#6A52F0',
  heat4: '#A897FF',
} as const;

export type ThemeColors = {
  [K in keyof typeof light]: string;
};

/** Story-ring gradient stops (unseen). */
export const storyRing = ['#A897FF', '#7A61FF', '#5B3DF5'] as const;

/** Tier medal metals, Larping → Legit. */
export const tierMetal = ['#9BA0B1', '#C77B3A', '#8E9AAD', '#D99A00'] as const;
