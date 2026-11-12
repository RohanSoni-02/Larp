import { Redirect } from 'expo-router';

/**
 * The central Start tab never renders: its tab button and tabPress listener
 * both route to the /session/new full-screen modal instead. This file exists
 * because Expo Router requires a route for every tab screen.
 */
export default function StartScreen() {
  return <Redirect href="/session/new" />;
}
