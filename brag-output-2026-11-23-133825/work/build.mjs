import fs from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
let html = fs.readFileSync(dir + 'src.html', 'utf8');
const icon = (n) => fs.readFileSync(`${dir}icons/${n}.svg`, 'utf8');
const MASK = 'M2.2 9.2C2.2 6.9 4.6 5.8 7.6 5.8c2.2 0 3.3 1.1 4.4 1.1s2.2-1.1 4.4-1.1c3 0 5.4 1.1 5.4 3.4 0 4.6-2.5 8-5.6 8-2.3 0-3-2.6-4.2-2.6s-1.9 2.6-4.2 2.6c-3.1 0-5.6-3.4-5.6-8zM5 10.3c.5-1.3 1.9-1.9 3.3-1.7 1.3.2 2.1 1 2.3 2.1-.9 1-2.2 1.4-3.5 1.1-1-.2-1.8-.8-2.1-1.5zm14 0c-.5-1.3-1.9-1.9-3.3-1.7-1.3.2-2.1 1-2.3 2.1.9 1 2.2 1.4 3.5 1.1 1-.2 1.8-.8 2.1-1.5z';
const maskSvg = (fill, size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="${MASK}" fill="${fill}" fill-rule="evenodd"/></svg>`;
const logo = (size) => { const k = size / 30; return `<div style="position:relative;width:${size}px;height:${size}px;flex:none">
  <div style="position:absolute;inset:0;border-radius:${9*k}px;background:#5B3DF5;transform:rotate(-7deg);display:flex;align-items:center;justify-content:center">${maskSvg('#fff',24*k)}</div>
  <div style="position:absolute;right:${-5*k}px;bottom:${-4*k}px;line-height:0"><svg width="${15*k}" height="${15*k}" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#fff"/><circle cx="10" cy="10" r="7.6" fill="#FFC53D"/><path d="M6.4 10.3 L8.9 12.7 L13.7 7.6" stroke="#1B1505" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></div></div>`; };
function hash(seed) { let h = 2166136261; for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = hash(seed); return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt))); const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f); return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'); }
let uidN = 0;
function art(seed, color, quality = 0.8) {
  const uid = 'a' + uidN++; const r = rng(seed);
  const blobs = Array.from({ length: 2 + Math.round(quality * 2) }, (_, i) => ({ i, cx: Math.round(40 + r() * 320), cy: Math.round(40 + r() * 320), rad: Math.round(150 + r() * 120), tint: shade(color, i % 2 === 0 ? 70 : -40) }));
  const rc = { x: Math.round(80 + r() * 240), y: Math.round(80 + r() * 240) }; const rings = 4 + Math.round(quality * 6); const tilt = 0.7 + r() * 0.5;
  return `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%"><defs><linearGradient id="${uid}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(color, 18)}"/><stop offset="1" stop-color="${shade(color, -55)}"/></linearGradient>
${blobs.map((b) => `<radialGradient id="${uid}b${b.i}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${b.tint}" stop-opacity=".75"/><stop offset="1" stop-color="${b.tint}" stop-opacity="0"/></radialGradient>`).join('')}</defs><rect width="400" height="400" fill="url(#${uid}bg)"/>
${blobs.map((b) => `<circle cx="${b.cx}" cy="${b.cy}" r="${b.rad}" fill="url(#${uid}b${b.i})"/>`).join('')}
${Array.from({ length: rings }, (_, i) => `<ellipse cx="${rc.x}" cy="${rc.y}" rx="${30 + i * 34}" ry="${(30 + i * 34) * tilt}" stroke="#fff" stroke-opacity="${0.13 - i * 0.008}" stroke-width="1.6" fill="none"/>`).join('')}</svg>`;
}
// keyboard illustration, seen from above at an angle
let keys = '<svg viewBox="0 0 350 300" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%"><g transform="translate(175 175) rotate(-12) translate(-210 -70)"><rect x="-6" y="-14" width="432" height="168" rx="10" fill="#15161F"/>';
for (let i = 0; i < 14; i++) keys += `<rect x="${i * 30}" y="0" width="28" height="140" rx="3" fill="#F7F7FA"/>`;
[0,1,3,4,5,7,8,10,11,12].forEach((i) => { keys += `<rect x="${i * 30 + 19}" y="0" width="20" height="86" rx="2" fill="#111218"/>`; });
keys += '</g></svg>';
const AV = ['#E0548A','#C2703D','#5B3DF5','#1F9D74','#0F7173','#F97316'];
const stories = ['You','Rina','Theo','Ada','Jun','Mo'].map((n,i) => `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;width:52px"><div style="width:52px;height:52px;border-radius:50%;padding:2.5px;background:${i===0?'#E6E6EE':'linear-gradient(135deg,#A897FF,#7A61FF,#5B3DF5)'}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid #fff;background:${AV[i]};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:16px">${i===0?'+':n[0]}</div></div><span style="font-size:11px;font-weight:500;color:#5C5F72">${n}</span></div>`).join('');
const arenaHead = (on) => `<div class="pad" style="top:64px;display:flex;align-items:center;justify-content:space-between"><span class="title">Arena</span><span class="tag" style="background:var(--fill);height:30px;font-size:13px"><i style="width:7px;height:7px;border-radius:4px;background:#2F8FDE"></i>Piano</span></div>
<div class="abs tabs" style="left:0;right:0;top:118px">${['For you','Quests','Rankings','Standards','Rooms','Guilds'].map((t)=>`<span class="${t===on?'on':''}">${t}</span>`).join('')}</div>`;
const qdots = Array.from({length:5},(_,i)=>`<div class="qd" style="flex:1;height:10px;border-radius:5px;background:${i<3?'#2F8FDE':'#E6E6EE'}"></div>`).join('');
const podium = (() => { const P=[['Theo M.','2,610 min',2,'#C77B3A',84,'#8E9AAD'],['Rina K.','2,940 min',1,'#5B3DF5',118,'#D99A00'],['Ada W.','2,385 min',3,'#1F9D74',64,'#C77B3A']];
  return `<div style="display:flex;align-items:flex-end;gap:10px;height:100%">${P.map(([n,m,r,c,h,metal])=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center">
  ${r===1?`<svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5z" fill="${metal}"/></svg>`:'<div style="height:22px"></div>'}
  <div style="width:${r===1?62:52}px;height:${r===1?62:52}px;border-radius:50%;border:3px solid ${metal};background:${c};color:#fff;font-weight:600;font-size:${r===1?22:19}px;display:flex;align-items:center;justify-content:center">${n[0]}</div>
  <div style="font-weight:600;font-size:13.5px;margin-top:5px">${n}</div><div style="font-size:12px;color:var(--muted)">${m}</div>
  <div style="margin-top:6px;width:100%;height:${h}px;border-radius:14px 14px 4px 4px;background:${r===1?'var(--primary)':'var(--s2)'};display:flex;justify-content:center;padding-top:8px;font-family:Barlow;font-weight:800;font-size:26px;color:${r===1?'#fff':'#9A9DAE'}">${r}</div></div>`).join('')}</div>`; })();
const others = [['Jun P.','2,280',4,'#E0548A'],['Mo A.','2,190',5,'#F97316'],['Lea S.','2,050',6,'#0EA5E9'],['Ravi D.','1,960',7,'#64748B'],['Noor H.','1,880',8,'#8B5CF6']];
let lb = others.map(([n,m,r,c])=>`<div class="lbr lrow" data-r="${r}" style="position:absolute;left:0;right:0;top:0;height:48px"><span class="rk num" style="width:22px;font-size:20px;font-weight:700;color:#9A9DAE">${r}</span><div class="av" style="width:34px;height:34px;font-size:13px;background:${c}">${n[0]}</div><span style="flex:1;font-weight:600;font-size:14.5px">${n}</span><span class="mins" style="font-family:Barlow;font-weight:700;font-size:17px;color:var(--muted)">${m} min</span></div>`).join('');
lb += `<div class="lbr lrow" data-me="1" data-r="9" style="position:absolute;left:0;right:0;top:0;height:48px;background:var(--soft);z-index:2"><span class="rk num" style="width:22px;font-size:20px;font-weight:700;color:var(--strong)">9</span><div class="av" style="width:34px;height:34px;font-size:13px;background:#0F7173">S</div><span style="flex:1;font-weight:600;font-size:14.5px">You</span><span class="mins" style="font-family:Barlow;font-weight:700;font-size:17px;color:var(--strong)">1,820 min</span></div>`;
const goers = AV.slice(0,4).map((c,i)=>`<div style="width:28px;height:28px;border-radius:50%;border:2px solid #fff;background:${c};margin-left:${i?-8:0}px"></div>`).join('');
const rail = Array.from({length:9},()=>'<i></i>').join('');
html = html.replace('{{RAIL}}', rail).replace('{{STORIES}}', stories).replace('{{QDOTS}}', qdots).replace('{{PODIUM}}', podium).replace('{{LBROWS}}', lb).replace('{{GOERS}}', goers)
  .replace(/\{\{KEYS\}\}/g, keys)
  .replace(/\{\{ARENA_HEAD:(\w+)\}\}/g, (_, t) => arenaHead(t))
  .replace(/\{\{MASK:(#[0-9A-Fa-f]{6}):(\d+)\}\}/g, (_, c, s) => maskSvg(c, +s))
  .replace(/\{\{LOGO:(\d+)\}\}/g, (_, s) => logo(+s))
  .replace(/\{\{ART:([^:]+):(#[0-9A-Fa-f]{6})\}\}/g, (_, s, c) => art(s, c))
  .replace(/\{\{([a-z-]+)\}\}/g, (_, n) => icon(n));
fs.writeFileSync(dir + 'index.html', html); console.log('built', html.length, (html.match(/\{\{/g)||[]).length, 'unreplaced');
