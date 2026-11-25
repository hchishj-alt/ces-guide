// 작은 화면 도구: 아이콘(선 아이콘 하나로 통일), 글자 넣기(항상 이스케이프), 시트, 알림 토스트
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const P = {
  water: '<path d="M12 3c3 4 6 7.2 6 10.5A6 6 0 0 1 6 13.5C6 10.2 9 7 12 3z"/>',
  wc: '<circle cx="7.5" cy="4.5" r="1.6"/><circle cx="16.5" cy="4.5" r="1.6"/><path d="M7.5 8v12M5 9h5v6H5zM16.5 8l-3 8h6zM16.5 16v4M12 3v18"/>',
  food: '<path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11M17 21V3c-2 1-3 4-3 8h3"/>',
  bat: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M11 9l-2 3h4l-2 3"/>',
  exit: '<path d="M14 4H6v16h8M11 12h10M18 9l3 3-3 3"/>',
  rest: '<path d="M4 18v-5h16v5M6 13V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5M4 18v2M20 18v2"/>',
  walk: '<circle cx="13" cy="4" r="1.8"/><path d="M9 21l3-6 3 3v3M12 15l1-6-4 2-1 3M13 9l3 3h3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3"/>',
  today: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  talk: '<path d="M4 5h10v7H8l-4 3z"/><path d="M14 9h6v7l-3-2h-5v-2"/>',
  gear: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  locate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  spark: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>', check: '<path d="M5 12l5 5 9-10"/>', play: '<path d="M8 5v14l11-7z"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>', moon: '<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
  trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>', share: '<path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/>', layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'
};
export const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let toastT;
export function toast(msg) { let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.append(t); } t.textContent = msg; t.className = 'on'; clearTimeout(toastT); toastT = setTimeout(() => t.className = '', 2600); }

// 아래에서 올라오는 시트. 바깥을 누르거나 아래로 밀면 닫힘
export function sheet(html, { onClose, tall = false } = {}) {
  closeSheet();
  const bg = document.createElement('div'); bg.className = 'shbg';
  const sh = document.createElement('section'); sh.className = 'sh' + (tall ? ' tall' : ''); sh.innerHTML = '<div class="grab"></div>' + html;
  bg.append(sh); document.body.append(bg);
  requestAnimationFrame(() => bg.classList.add('on'));
  bg.addEventListener('click', e => { if (e.target === bg) closeSheet(); });
  let y0 = null; sh.querySelector('.grab').addEventListener('pointerdown', e => { y0 = e.clientY; sh.setPointerCapture(e.pointerId); });
  sh.addEventListener('pointermove', e => { if (y0 != null) sh.style.transform = `translateY(${Math.max(0, e.clientY - y0)}px)`; });
  sh.addEventListener('pointerup', e => { if (y0 == null) return; const d = e.clientY - y0; y0 = null; sh.style.transform = ''; if (d > 90) closeSheet(); });
  bg._close = onClose; return sh;
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
export function closeSheet() { const bg = $('.shbg'); if (!bg) return; bg.classList.remove('on'); bg._close?.(); setTimeout(() => bg.remove(), 260); }

// 라스베이거스 시각
export const TZ = 'America/Los_Angeles';
export function laNow() { const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value])); return { date: `${p.year}-${p.month}-${p.day}`, min: +p.hour * 60 + +p.minute, hm: `${p.hour}:${p.minute}` }; }
export const toMin = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
export const dur = m => m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ' ' + (m % 60) + '분' : ''}` : `${m}분`;
export const dayLabel = d => { const dt = new Date(d + 'T12:00:00Z'); return `${dt.getUTCMonth() + 1}월 ${dt.getUTCDate()}일 ${'일월화수목금토'[dt.getUTCDay()]}`; };
