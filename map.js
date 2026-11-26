// 3D 전시장 지도 + 길찾기. 부스는 CSS 3D 상자(위·네 옆면), 단위는 미터 → 화면 px(PXM배)
import { layout, amenities, AMEN } from './data.js';
import { icon } from './ui.js';

export const PXM = 3; // 1m = 3px (바닥 좌표)
const HEIGHT = { xl: 26, l: 18, m: 10, s: 7 };

// ---------- 길찾기 (2m 격자, A*) ----------
const CELL = 2; const grids = new Map();
function grid(hall) {
  if (grids.has(hall.id)) return grids.get(hall.id);
  const cols = Math.ceil(hall.w / CELL), rows = Math.ceil(hall.h / CELL), blk = new Uint8Array(cols * rows);
  for (const b of layout(hall)) {
    const x0 = Math.max(0, Math.floor((b.x - .4) / CELL)), x1 = Math.min(cols - 1, Math.floor((b.x + b.w + .4) / CELL));
    const y0 = Math.max(0, Math.floor((b.y - .4) / CELL)), y1 = Math.min(rows - 1, Math.floor((b.y + b.h + .4) / CELL));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) blk[y * cols + x] = 1;
  }
  const g = { cols, rows, blk }; grids.set(hall.id, g); return g;
}
const cellOf = (g, x, y) => [Math.min(g.cols - 1, Math.max(0, Math.floor(x / CELL))), Math.min(g.rows - 1, Math.max(0, Math.floor(y / CELL)))];
export function nearestFree(hall, x, y) {
  const g = grid(hall); const [cx, cy] = cellOf(g, x, y);
  if (!g.blk[cy * g.cols + cx]) return [x, y];
  const seen = new Uint8Array(g.cols * g.rows), q = [[cx, cy]]; seen[cy * g.cols + cx] = 1;
  while (q.length) { const [a, b] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = a + dx, ny = b + dy; if (nx < 0 || ny < 0 || nx >= g.cols || ny >= g.rows || seen[ny * g.cols + nx]) continue; if (!g.blk[ny * g.cols + nx]) return [(nx + .5) * CELL, (ny + .5) * CELL]; seen[ny * g.cols + nx] = 1; q.push([nx, ny]); } }
  return [x, y];
}
export const frontOf = (hall, b) => nearestFree(hall, b.x + b.w / 2, b.y + b.h + 1.5);
export function route(hall, from, to) {
  const g = grid(hall); const [sx, sy] = cellOf(g, ...nearestFree(hall, ...from)), [tx, ty] = cellOf(g, ...nearestFree(hall, ...to));
  const N = g.cols * g.rows, gs = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const h = (x, y) => { const dx = Math.abs(x - tx), dy = Math.abs(y - ty); return Math.max(dx, dy) + .414 * Math.min(dx, dy); };
  const open = [[h(sx, sy), sy * g.cols + sx]]; gs[sy * g.cols + sx] = 0; const goal = ty * g.cols + tx;
  const push = (f, i) => { let lo = 0, hi = open.length; while (lo < hi) { const m = (lo + hi) >> 1; open[m][0] < f ? lo = m + 1 : hi = m; } open.splice(lo, 0, [f, i]); };
  while (open.length) {
    const [, i] = open.shift(); if (closed[i]) continue; closed[i] = 1; if (i === goal) break;
    const x = i % g.cols, y = (i / g.cols) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= g.cols || ny >= g.rows) continue;
      const j = ny * g.cols + nx; if (g.blk[j] || closed[j]) continue;
      if (dx && dy && (g.blk[y * g.cols + nx] || g.blk[ny * g.cols + x])) continue;
      const c = gs[i] + (dx && dy ? 1.414 : 1); if (c < gs[j]) { gs[j] = c; came[j] = i; push(c + h(nx, ny), j); }
    }
  }
  if (!isFinite(gs[goal])) return null;
  const cells = []; for (let i = goal; i !== -1; i = came[i]) cells.push([(i % g.cols + .5) * CELL, (((i / g.cols) | 0) + .5) * CELL]);
  cells.reverse(); const pts = [from, ...cells.slice(1, -1), to];
  const out = [pts[0]]; for (let i = 1; i < pts.length - 1; i++) { const [a, b, c] = [out[out.length - 1], pts[i], pts[i + 1]]; if (Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) > .01) out.push(b); } out.push(pts[pts.length - 1]);
  return { pts: out, m: Math.round(gs[goal] * CELL) };
}
export const walkMin = m => Math.max(1, Math.round(m / 55)); // 사람 많은 전시장 걸음, 분당 약 55m
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ---------- 지도 그리기 ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// 번호 글씨는 칸 너비에 맞춰 줄여요(다섯 자리가 잘리지 않게)
const fit1 = (a, b, n) => Math.min(10, (a - 2) / (n * .6), b * .7);
const fs = (w, h, no) => { const n = String(no).length, f = fit1(w, h, n), v = fit1(h, w, n); // 좁고 길면 세로로
  return v > f * 1.15 ? `font-size:${Math.max(3, v).toFixed(1)}px" class="v` : `font-size:${Math.max(3, f).toFixed(1)}px`; };
export function createMap(root, { onBooth = () => { }, onLong = () => { } } = {}) {
  root.innerHTML = '<div class="mp d3"><div class="fl"></div></div>';
  const mp = root.firstChild, fl = mp.firstChild;
  let hall = null, z = 1, pan = [0, 0], mode = 'd3', meEl = null, rtEl = null;
  let raf = 0; const applyNow = (smooth) => { fl.style.transition = smooth ? 'transform .8s cubic-bezier(.34,1.25,.64,1)' : 'none'; fl.style.transform = `translate(${pan[0]}px,${pan[1]}px) scale(${z}) ` + (mode === 'd3' ? 'rotateX(52deg) rotateZ(-28deg)' : ''); };
  const apply = smooth => { if (smooth) { cancelAnimationFrame(raf); raf = 0; applyNow(true); return; } if (!raf) raf = requestAnimationFrame(() => { raf = 0; applyNow(false); }); };
  const fit = () => { if (!hall) return 1; const W = mp.clientWidth || 360, H = mp.clientHeight || 400; return Math.min(W / (hall.w * PXM), H / (hall.h * PXM)) * (mode === 'd3' ? 1.25 : .94); };
  function setHall(h) {
    hall = h; const W = h.w * PXM, H = h.h * PXM;
    Object.assign(fl.style, { width: W + 'px', height: H + 'px', marginLeft: -W / 2 + 'px', marginTop: -H / 2 + 'px' });
    const bx = layout(h).map(b => {
      const z = b.filler ? 4 : HEIGHT[b.size] || 8, w = b.w * PXM, hh = b.h * PXM, big = !b.filler && b.w >= 14;
      // 가볍게: 부스 하나 = 요소 하나(옆면은 그림자로). 예전엔 면 5개씩 3D로 그려서 수백 개면 버벅였어요.
      return `<div class="bx${b.filler ? ' fi' : ''}" data-id="${esc(b.id)}" style="left:${b.x * PXM}px;top:${b.y * PXM}px;width:${w}px;height:${hh}px;--z:${z}px"><b style="${fs(w, hh, b.no)}">${esc(b.no)}</b>${big ? `<span>${esc(b.ko || b.name)}</span>` : ''}</div>`;
    }).join('');
    const am = amenities(h).map(a => `<div class="pin p-${a.type}" style="left:${a.x * PXM}px;top:${a.y * PXM}px" title="${esc(a.name)}">${icon(a.type)}</div>`).join('');
    fl.innerHTML = `<svg class="rt" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"></svg>${bx}${am}<div class="me" hidden><div class="acc"></div><svg class="cone" viewBox="0 0 60 60"><path d="M30 30 L18 3 A30 30 0 0 1 42 3 Z"/></svg><div class="dot"></div></div>`;
    meEl = fl.querySelector('.me'); rtEl = fl.querySelector('.rt');
    z = fit(); pan = [0, 0]; apply(false); center(h.w / 2, h.h * .5, fit() * 1.8);
  }
  function mark({ wish = new Set(), seen = new Set(), rec = new Set(), focus = '', sel = '' } = {}) {
    fl.querySelectorAll('.bx').forEach(el => { const id = el.dataset.id; el.classList.toggle('wi', wish.has(id)); el.classList.toggle('sn', seen.has(id)); el.classList.toggle('rc', rec.has(id) && !seen.has(id)); el.classList.toggle('fo', focus === id || sel === id); });
  }
  function setMe(me) {
    if (!meEl) return; meEl.hidden = !me || me.hall !== hall?.id; if (meEl.hidden) return;
    meEl.style.left = me.x * PXM + 'px'; meEl.style.top = me.y * PXM + 'px';
    const a = meEl.firstChild; a.style.width = a.style.height = Math.max(10, me.acc * 2 * PXM) + 'px';
    const cone = meEl.querySelector('.cone'); cone.style.display = me.heading == null ? 'none' : ''; cone.style.transform = `rotate(${(me.heading || 0) - (hall.north || 0)}deg)`;
  }
  function showRoute(pts) { if (!rtEl) return; rtEl.innerHTML = pts ? `<polyline points="${pts.map(p => (p[0] * PXM).toFixed(1) + ',' + (p[1] * PXM).toFixed(1)).join(' ')}"/>` : ''; }
  // 화면 가운데로: 보이지 않는 점을 잠깐 놓고 실제 화면 위치를 재서 맞춤(원근 때문에 계산보다 정확)
  function center(x, y, zoom, cover = 0) { // cover: 아래를 가린 패널 높이(px) → 남은 칸 가운데로
    if (!hall) return; const old = fl.style.transform; z = zoom || Math.max(z, fit() * 2.4); pan = [0, 0]; cancelAnimationFrame(raf); raf = 0; applyNow(false);
    const pr = document.createElement('i'); pr.style.cssText = `position:absolute;left:${x * PXM}px;top:${y * PXM}px;width:1px;height:1px`; fl.append(pr);
    const a = pr.getBoundingClientRect(), m = mp.getBoundingClientRect(); pr.remove();
    pan = [m.x + m.width / 2 - a.x, m.y + Math.max(40, (m.height - cover) / 2) - a.y];
    fl.style.transform = old; void fl.offsetWidth; apply(true);
  }
  function setMode(m) { mode = m; mp.className = 'mp ' + m; z = fit(); pan = [0, 0]; apply(true); }
  // 손가락: 끌기=이동, 두 손가락=확대, 꾹 누르기=나 여기, 톡=부스
  const pts = new Map(); let start = null, moved = false, longT = 0, pinch0 = 0, z0 = 1;
  const local = e => { const t = e.target.closest('.bx'); if (t && e.target === t) { const b = layout(hall).find(x => x.id === t.dataset.id); return [b.x + e.offsetX / PXM, b.y + e.offsetY / PXM]; } if (e.target === fl) return [e.offsetX / PXM, e.offsetY / PXM]; return null; };
  mp.addEventListener('pointerdown', e => {
    pts.set(e.pointerId, [e.clientX, e.clientY]); moved = false;
    if (pts.size === 1) { start = { x: e.clientX, y: e.clientY, pan: [...pan] }; const p = local(e); clearTimeout(longT); if (p) longT = setTimeout(() => { if (!moved) { moved = true; onLong(p); } }, 600); }
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = z; clearTimeout(longT); }
  });
  mp.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; z = Math.min(8, Math.max(fit() * .7, z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0)); moved = true; apply(false); return; }
    if (!start) return; const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!moved && Math.hypot(dx, dy) < 7) return; moved = true; clearTimeout(longT); pan = [start.pan[0] + dx, start.pan[1] + dy]; apply(false);
  });
  const up = e => { clearTimeout(longT); const was = pts.size; pts.delete(e.pointerId); if (was === 1 && !moved && e.type === 'pointerup') { const t = e.target.closest('.bx'); if (t) onBooth(t.dataset.id); } if (!pts.size) start = null; };
  mp.addEventListener('pointerup', up); mp.addEventListener('pointercancel', up);
  mp.addEventListener('wheel', e => { e.preventDefault(); z = Math.min(8, Math.max(fit() * .7, z * (e.deltaY < 0 ? 1.12 : .89))); apply(false); }, { passive: false });
  mp.addEventListener('contextmenu', e => e.preventDefault());
  const ro = new ResizeObserver(() => { if (hall && !moved) { z = fit(); apply(false); } }); ro.observe(mp);
  return { setHall, mark, setMe, showRoute, center, setMode, get mode() { return mode; }, destroy: () => ro.disconnect() };
}
export const amenName = t => AMEN[t] || t;
