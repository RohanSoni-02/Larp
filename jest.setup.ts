/**
 * Jest setup. Unit tests in src/gamification are pure functions and need no
 * mocks; native-module wrappers (crashlytics, posthog) degrade gracefully.
 * Add global mocks here as later phases need them.
 */
export {};
