import { Platform } from 'react-native';

/**
 * Crash reporting via Firebase Crashlytics (free at any volume).
 * Requires a dev build (native module) and google-services config files;
 * safely no-ops on web and in Expo Go. Typed structurally so we don't depend
 * on the library's export style.
 */
type CrashlyticsInstance = {
  setCrashlyticsCollectionEnabled(enabled: boolean): Promise<void>;
  setUserId(userId: string): Promise<void>;
  log(message: string): void;
  recordError(error: Error): Promise<void>;
  readonly isCrashlyticsCollectionEnabled: boolean;
};
type CrashlyticsModule = () => CrashlyticsInstance;

let crashlytics: CrashlyticsModule | null = null;

function getCrashlytics(): CrashlyticsModule | null {
  if (Platform.OS === 'web') return null;
  if (crashlytics) return crashlytics;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-firebase/crashlytics');
    const fn: CrashlyticsModule = mod.default ?? mod;
    // Touching a method verifies the native module is linked (throws in Expo Go).
    void fn().isCrashlyticsCollectionEnabled;
    crashlytics = fn;
    return fn;
  } catch {
    return null;
  }
}

export function initCrashReporting(): void {
  getCrashlytics()?.().setCrashlyticsCollectionEnabled(!__DEV__);
}

export function setCrashUser(userId: string): void {
  getCrashlytics()?.().setUserId(userId);
}

export function logCrash(message: string): void {
  getCrashlytics()?.().log(message);
}

export function recordError(error: unknown): void {
  const cr = getCrashlytics();
  if (!cr) return;
  if (error instanceof Error) cr().recordError(error);
  else cr().recordError(new Error(String(error)));
}
