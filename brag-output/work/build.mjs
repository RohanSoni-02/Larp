import fs from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
let html = fs.readFileSync(dir + 'src.html', 'utf8');

const icon = (n) => fs.readFileSync(`${dir}icons/${n}.svg`, 'utf8').replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ');

// Logo: mask on sticker-tilted tile + gold verified tick (src/components/Wordmark.tsx)
const MASK = 'M2.2 9.2C2.2 6.9 4.6 5.8 7.6 5.8c2.2 0 3.3 1.1 4.4 1.1s2.2-1.1 4.4-1.1c3 0 5.4 1.1 5.4 3.4 0 4.6-2.5 8-5.6 8-2.3 0-3-2.6-4.2-2.6s-1.9 2.6-4.2 2.6c-3.1 0-5.6-3.4-5.6-8zM5 10.3c.5-1.3 1.9-1.9 3.3-1.7 1.3.2 2.1 1 2.3 2.1-.9 1-2.2 1.4-3.5 1.1-1-.2-1.8-.8-2.1-1.5zm14 0c-.5-1.3-1.9-1.9-3.3-1.7-1.3.2-2.1 1-2.3 2.1.9 1 2.2 1.4 3.5 1.1 1-.2 1.8-.8 2.1-1.5z';
const maskSvg = (fill, size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="${MASK}" fill="${fill}" fill-rule="evenodd"/></svg>`;
const logo = (size) => {
  const k = size / 30;
  return `<div style="position:relative;width:${size}px;height:${size}px;flex:none">
  <div style="position:absolute;inset:0;border-radius:${9 * k}px;background:#5B3DF5;transform:rotate(-7deg);display:flex;align-items:center;justify-content:center">${maskSvg('#fff', 24 * k)}</div>
  <div style="position:absolute;right:${-5 * k}px;bottom:${-4 * k}px;line-height:0"><svg width="${15 * k}" height="${15 * k}" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#fff"/><circle cx="10" cy="10" r="7.6" fill="#FFC53D"/><path d="M6.4 10.3 L8.9 12.7 L13.7 7.6" stroke="#1B1505" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></div></div>`;
};

// Procedural cover art (port of src/components/Art.tsx)
function hash(seed) { let h = 2166136261; for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = hash(seed); return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt))); const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f); return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'); }
let uidN = 0;
function art(seed, color, quality = 0.8, cls = 'art') {
  const uid = 'a' + uidN++; const r = rng(seed);
  const blobs = Array.from({ length: 2 + Math.round(quality * 2) }, (_, i) => ({ i, cx: Math.round(40 + r() * 320), cy: Math.round(40 + r() * 320), rad: Math.round(150 + r() * 120), tint: shade(color, i % 2 === 0 ? 70 : -40) }));
  const rc = { x: Math.round(80 + r() * 240), y: Math.round(80 + r() * 240) };
  const rings = 4 + Math.round(quality * 6); const tilt = 0.7 + r() * 0.5;
  return `<svg class="${cls}" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%"><defs>
<linearGradient id="${uid}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(color, 18)}"/><stop offset="1" stop-color="${shade(color, -55)}"/></linearGradient>
${blobs.map((b) => `<radialGradient id="${uid}b${b.i}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${b.tint}" stop-opacity=".75"/><stop offset="1" stop-color="${b.tint}" stop-opacity="0"/></radialGradient>`).join('')}
</defs><rect width="400" height="400" fill="url(#${uid}bg)"/>
${blobs.map((b) => `<circle cx="${b.cx}" cy="${b.cy}" r="${b.rad}" fill="url(#${uid}b${b.i})"/>`).join('')}
${Array.from({ length: rings }, (_, i) => `<ellipse cx="${rc.x}" cy="${rc.y}" rx="${30 + i * 34}" ry="${(30 + i * 34) * tilt}" stroke="#fff" stroke-opacity="${0.13 - i * 0.008}" stroke-width="1.6" fill="none"/>`).join('')}
</svg>`;
}

// Tier medals (src/components/Stamp.tsx), Larping → Legit
const TIERS = ['Larping', 'Apprentice', 'Adept', 'Legit'];
const METAL = ['#9BA0B1', '#C77B3A', '#8E9AAD', '#D99A00'];
const alpha = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const S = 250, CY = 470;
let medals = '';
TIERS.forEach((tier, i) => {
  const cx = 960 + (i - 1.5) * 380;
  const m = METAL[i];
  const glow = i === 3 ? `<div id="legitGlow" style="position:absolute;inset:-90px;border-radius:50%;background:radial-gradient(circle,rgba(255,197,61,.55),rgba(255,197,61,0) 65%);opacity:0;z-index:-1"></div>` : '';
  medals += `<div class="medal" id="m${i}" style="left:${cx - S / 2}px;top:${CY - S / 2}px;width:${S}px;height:${S}px;border:3px solid ${alpha(m, 0.55)};background:${i === 3 ? '#FFF8E6' : alpha(m, 0.1)};opacity:0">${glow}
  <div class="medalIn" style="border:2px solid ${alpha(m, 0.22)}${i === 3 ? ';background:#FFF8E6' : ''}"><span class="ico" style="width:60px;height:60px;color:${m}">${icon(i === 3 ? 'shield-checkmark' : 'ribbon')}</span>
  <div class="tier" style="font-size:37px;margin-top:4px">${tier}</div><div class="tierSkill" style="font-size:24px">Piano</div></div></div>`;
  if (i < 3) medals += `<div id="ar${i}" class="abs" style="left:${cx + 190 - 18}px;top:${CY - 18}px;width:36px;height:36px;color:#9A9DAE;opacity:0"><span class="ico" style="width:36px;height:36px;transform:rotate(-90deg)">${icon('chevron-down')}</span></div>`;
});

html = html
  .replace('{{MEDALS}}', medals)
  .replace(/\{\{MASK\}\}/g, maskSvg('#5B3DF5', 200))
  .replace(/\{\{LOGOMASK:(\d+)\}\}/g, (_, s) => maskSvg('#fff', +s))
  .replace(/\{\{LOGO:(\d+)\}\}/g, (_, s) => logo(+s))
  .replace(/\{\{ART:([^:]+):(#[0-9A-Fa-f]{6})\}\}/g, (_, s, c) => art(s, c))
  .replace(/\{\{ARTRAW:([^:]+):(#[0-9A-Fa-f]{6})\}\}/g, (_, s, c) => art(s, c, 0.6))
  .replace(/\{\{([a-z-]+)\}\}/g, (_, n) => icon(n));
fs.writeFileSync(dir + 'index.html', html);
console.log('built', html.length);
