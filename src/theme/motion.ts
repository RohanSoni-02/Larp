import { Easing, type WithSpringConfig } from 'react-native-reanimated';

/**
 * Motion tokens. Interface motion is quick and never bounces; the one springy
 * curve is kept for rewards (XP, tier-ups), where a little overshoot reads as
 * delight instead of lag.
 */
export const springs = {
  /** Press feedback: settles in well under 200ms. */
  press: { damping: 30, stiffness: 520, mass: 0.6 },
  /** Thumbs, indicators and anything that slides between two resting places. */
  slide: { damping: 32, stiffness: 380, mass: 0.8 },
  /** Sheets and large surfaces. */
  sheet: { damping: 34, stiffness: 320, mass: 0.9 },
  /** Rewards only. */
  reward: { damping: 13, stiffness: 190, mass: 0.9 },
} as const satisfies Record<string, WithSpringConfig>;

export const easings = {
  /** Strong ease-out: things entering the screen or responding to a tap. */
  out: Easing.bezier(0.23, 1, 0.32, 1),
  /** Things already on screen that move from A to B. */
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
} as const;

export const durations = { fast: 140, base: 220, enter: 380, slow: 600 } as const;
