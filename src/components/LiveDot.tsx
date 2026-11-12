import { useEffect, useState } from 'react';
import { Animated } from 'react-native';

/** Pulsing dot for anything live right now (co-op rooms, Larp Check). */
export function LiveDot({ color = '#FF3B30', size = 8 }: { color?: string; size?: number }) {
  const [anim] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return (
    <Animated.View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: anim }}
    />
  );
}
