import fs from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
let html = fs.readFileSync(dir + 'src.html', 'utf8');
const icon = (n) => fs.readFileSync(`${dir}icons/${n}.svg`, 'utf8');
const MASK = 'M2.2 9.2C2.2 6.9 4.6 5.8 7.6 5.8c2.2 0 3.3 1.1 4.4 1.1s2.2-1.1 4.4-1.1c3 0 5.4 1.1 5.4 3.4 0 4.6-2.5 8-5.6 8-2.3 0-3-2.6-4.2-2.6s-1.9 2.6-4.2 2.6c-3.1 0-5.6-3.4-5.6-8zM5 10.3c.5-1.3 1.9-1.9 3.3-1.7 1.3.2 2.1 1 2.3 2.1-.9 1-2.2 1.4-3.5 1.1-1-.2-1.8-.8-2.1-1.5zm14 0c-.5-1.3-1.9-1.9-3.3-1.7-1.3.2-2.1 1-2.3 2.1.9 1 2.2 1.4 3.5 1.1 1-.2 1.8-.8 2.1-1.5z';
const maskSvg = (fill, size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="${MASK}" fill="${fill}" fill-rule="evenodd"/></svg>`;
const logo = (size) => { const k = size / 30; return `<div style="position:relative;width:${size}px;height:${size}px;flex:none">
  <div style="position:absolute;inset:0;border-radius:${9*k}px;background:#5B3DF5;transform:rotate(-7deg);display:flex;align-items:center;justify-content:center">${maskSvg('#fff',24*k)}</div>
  <div style="position:absolute;right:${-5*k}px;bottom:${-4*k}px;line-height:0"><svg width="${15*k}" height="${15*k}" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#fff"/><circle cx="10" cy="10" r="7.6" fill="#FFC53D"/><path d="M6.4 10.3 L8.9 12.7 L13.7 7.6" stroke="#1B1505" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></div></div>`; };
// deterministic chalk dust + fluorescent strips
let seed = 3; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
let dust = ''; for (let i = 0; i < 46; i++) { const x = r()*1080, y = r()*1920, s = 2 + r()*5, o = .05 + r()*.22; dust += `<div class="dust" data-y="${y.toFixed(0)}" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;opacity:${o.toFixed(2)};filter:blur(${(r()*1.5).toFixed(1)}px)"></div>`; }
const strips = `<div class="strip" style="left:-60px;top:70px;width:520px;opacity:.85"></div><div class="strip" style="left:640px;top:110px;width:480px;opacity:.65"></div>`;
// skill tree nodes (Strength branch), x=80
const vid = icon('videocam').replace(/<svg[^>]*>/, '').replace('</svg>', '');
const NODES = [['Bench 135 lb', 345, 19], ['Bench 185 lb', 240, 19], ['Bench 225 lb', 120, 25]].map(([label, y, rad], i) => `
<g id="n${i}" style="opacity:.35"><circle id="ring${i}" cx="80" cy="${y}" r="${rad+7}" fill="none" stroke="#E0548A" stroke-width="3" stroke-dasharray="5 6" stroke-opacity="0"/>
<circle cx="80" cy="${y}" r="${rad}" fill="#fff" stroke="#E6E6EE" stroke-width="3"/>
<g transform="translate(${80-10} ${y-10}) scale(${20/512})" fill="#E0548A">${vid}</g>
<text x="122" y="${y-4}" font-family="Brico" font-weight="700" font-size="18" fill="#0E0F1C" letter-spacing="-.3">${label}</text></g>
<g id="tag${i}" style="opacity:0"><rect x="122" y="${y+6}" width="122" height="24" rx="12" fill="rgba(224,84,138,.12)"/>
<g transform="translate(131 ${y+11}) scale(${14/512})" fill="#C23B70">${vid}</g><text x="150" y="${y+22.5}" font-family="Inter" font-weight="600" font-size="11.5" fill="#C23B70">Video required</text></g>`).join('');
html = html.replace('{{STRIPS}}', strips).replace('{{DUST}}', dust).replace('{{NODES}}', NODES)
  .replace(/\{\{MASK:(#[0-9A-Fa-f]{6}):(\d+)\}\}/g, (_, c, s) => maskSvg(c, +s))
  .replace(/\{\{LOGO:(\d+)\}\}/g, (_, s) => logo(+s))
  .replace(/\{\{([a-z-]+)\}\}/g, (_, n) => icon(n));
fs.writeFileSync(dir + 'index.html', html); console.log('built', html.length);
