function parse(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Lighten (amt > 0) or darken (amt < 0) a hex colour by a flat RGB offset. */
export function shade(hex: string, amt: number): string {
  const rgb = parse(hex);
  if (!rgb) return hex;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)));
  const [r, g, b] = rgb.map(f);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Hex colour at the given opacity, as rgba(). */
export function withAlpha(hex: string, alpha: number): string {
  const rgb = parse(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

/** True when dark text reads better than white on this colour. */
export function isLightColor(hex: string): boolean {
  const rgb = parse(hex);
  if (!rgb) return false;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45;
}
