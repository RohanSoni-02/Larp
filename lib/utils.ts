export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassValue[]
  | Record<string, boolean | undefined | null>;

/**
 * Combines class names conditionally (shadcn-compatible `cn` helper).
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  const push = (val: ClassValue): void => {
    if (!val) return;
    if (typeof val === 'string' || typeof val === 'number') {
      classes.push(String(val));
      return;
    }
    if (Array.isArray(val)) {
      for (const item of val) push(item);
      return;
    }
    if (typeof val === 'object') {
      for (const [key, active] of Object.entries(val)) {
        if (active) classes.push(key);
      }
    }
  };

  for (const input of inputs) {
    push(input);
  }

  return classes.join(' ');
}
