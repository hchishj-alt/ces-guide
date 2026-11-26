// CES 가이드 (웹앱). 화면: 오늘 · 지도 · 위시 · 기록, 어디서나 번역 버튼.
export const VERSION = '0.2.6';
import { HALLS, TAGS, TRIPS, SAMPLE, layout, amenities, AMEN, hallById, boothById, boothByNo, boothByName, boothByInfo, infoByOld, allNamed, tripById, koName, enName, newsUrl, DIR, loadDirectory } from './data.js';
// 회사 이름: 한국어 먼저, 영어는 뒤에 작게
const nm = b => `${esc(koName(b) || b?.no || '부스')}${enName(b) ? ` <span class="en">${esc(enName(b))}</span>` : ''}`;
import { createMap, route, frontOf, walkMin, dist } from './map.js';
import * as pos from './pos.js';
import * as store from './store.js';
import { esc, icon, $, $$, toast, sheet, closeSheet, laNow, toMin, dur, dayLabel } from './ui.js';
import { openTalk, askKey, translate } from './talk.js';

const S = { trip: null, interests: [], wish: new Set(), seen: new Set(), rate: {}, tab: 'today', hall: 'central', day: null, map: null, routeTo: null, notesF: { kind: '', q: '', hall: '', day: '' } };
const view = () => $('#view');
const named = b => b && !b.filler;
const meXY = () => [pos.me.x, pos.me.y];

// ---------- 시작 ----------
async function boot() {
  await loadDirectory(); // CES 공식 참가 기업 목록(없거나 못 받으면 예시 배치)
  const [trip, ints, wish, seen, rate, hall] = await Promise.all([store.get('trip', null), store.get('interests', null), store.get('wish', []), store.get('seen', []), store.get('rate', {}), store.get('viewHall', '')]);
  S.trip = trip ? tripById(trip) : null; S.interests = ints || []; S.wish = new Set(wish); S.seen = new Set(seen); S.rate = rate;
  await relink(); if (hall && hallById(hall)) S.hall = hall; S.wishBy = (await store.get('wishBy', 'place')) === 'tag' ? 'tag' : 'place';
  await pos.load(); if (pos.me.hall) S.hall = pos.me.hall;
  if (await store.get('sensors', false)) pos.startSensors().catch(() => { });
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) go(b.dataset.tab); });
  $('#fabTalk').onclick = () => openTalk({ booth: lastBooth(), onSave: saveTalk });
  $('#btnSet').onclick = openSettings;
  window.addEventListener('hashchange', () => go(location.hash.slice(1) || 'today', true));
  pos.onMove(onMove);
  store.onChange(w => { if (w === 'notes' && S.tab === 'notes') renderNotes(); });
  setInterval(tickAlarms, 30000); tickAlarms();
  if (ints == null) setup(); 
  go(location.hash.slice(1) || 'today', true);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
}
// 공식 목록이 바뀌어 부스 번호가 달라져도 위시·본 부스·별점이 따라가게: 이름을 같이 적어 두고, 못 찾으면 이름으로 다시 찾아요.
async function relink() {
  const names = await store.get('idNames', {}); let changed = false;
  const fix = id => {
    if (boothById(id)) return id;
    const b = (names[id] && boothByName(names[id])) || boothByInfo(infoByOld(String(id).split(':')[1]));
    if (b && b.id !== id) { changed = true; return b.id; }
    return id; // 아직 목록에 없는 회사면 그대로 두었다가 나중에 다시 찾아요
  };
  const wish = [...S.wish].map(fix), seen = [...S.seen].map(fix), rate = {};
  for (const [k, v] of Object.entries(S.rate)) rate[fix(k)] = v;
  for (const id of [...wish, ...seen, ...Object.keys(rate)]) { const b = boothById(id); if (b?.en && names[id] !== b.en) { names[id] = b.en; changed = true; } }
  if (!changed) return;
  S.wish = new Set(wish); S.seen = new Set(seen); S.rate = rate;
  await Promise.all([store.set('wish', wish), store.set('seen', seen), store.set('rate', rate), store.set('idNames', names)]);
}
function go(tab, fromHash) {
  if (!['today', 'map', 'wish', 'notes'].includes(tab)) tab = 'today';
  S.tab = tab; if (!fromHash && location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab);
  $$('#tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  $('#title').textContent = { today: '오늘', map: '지도', wish: '위시', notes: '기록' }[tab];
  document.body.dataset.tab = tab;
  ({ today: renderToday, map: renderMap, wish: renderWish, notes: renderNotes })[tab]();
}

// ---------- 처음 설정 ----------
function setup() {
  const pick = new Set(S.interests.length ? S.interests : ['ai', 'robot', 'mobility', 'smarthome', 'iot', 'smartcity', 'enterprise']);
  const sh = sheet(`<h2 class="sh-t">CES 가이드 시작</h2>
   <h3 class="sh-h">연수 일정</h3><div class="chips" id="suTrip">${TRIPS.map(t => `<button data-v="${t.id}" class="on">${esc(t.name)}</button>`).join('')}<button data-v="">일정 없이 쓰기</button></div>
   <h3 class="sh-h">관심 분야 <small>추천에 써요</small></h3><div class="chips" id="suInt">${Object.entries(TAGS).map(([k, v]) => `<button data-v="${k}" class="${pick.has(k) ? 'on' : ''}">${esc(v)}</button>`).join('')}</div>
   <label class="chk"><input type="checkbox" id="suWish" checked> 연수 참관 코스의 부스를 위시에 넣기</label>
   <button class="btn wide" id="suOk">시작하기</button>
   <p class="mute small">기록·사진·음성·위시는 이 폰에만 저장돼요. 서버로 보내지 않아요.</p>`, { tall: true });
  let trip = TRIPS[0]?.id || '';
  sh.querySelector('#suTrip').onclick = e => { const b = e.target.closest('button'); if (!b) return; trip = b.dataset.v; $$('#suTrip button', sh).forEach(x => x.classList.toggle('on', x === b)); };
  sh.querySelector('#suInt').onclick = e => { const b = e.target.closest('button'); if (!b) return; pick.has(b.dataset.v) ? pick.delete(b.dataset.v) : pick.add(b.dataset.v); b.classList.toggle('on'); };
  sh.querySelector('#suOk').onclick = async () => {
    S.interests = [...pick]; await store.set('interests', S.interests);
    S.trip = trip ? tripById(trip) : null; await store.set('trip', trip || null);
    if (S.trip && sh.querySelector('#suWish').checked) { S.trip.wishes.forEach(no => { const b = boothByInfo(infoByOld(no)); if (b) S.wish.add(b.id); }); await store.set('wish', [...S.wish]); }
    closeSheet(); go(S.tab);
  };
}

// ---------- 오늘 ----------
function tripDays() { return S.trip?.days || []; }
function currentDay() {
  const days = tripDays(); if (!days.length) return null; const t = laNow().date;
  if (S.day && days.find(d => d.date === S.day)) return days.find(d => d.date === S.day);
  return days.find(d => d.date === t) || (t < days[0].date ? days[0] : days[days.length - 1]);
}
function wishIn(hallId) { const all = [...S.wish].filter(id => id.startsWith(hallId + ':')); return { all, left: all.filter(id => !S.seen.has(id)) }; }
function renderToday() {
  const d = currentDay(), now = laNow(), isToday = d && d.date === now.date;
  const dd = d ? Math.ceil((Date.parse(d.date) - Date.parse(now.date)) / 864e5) : 0;
  const zones = d ? d.zones : []; const zoneH = [...new Set(zones.map(z => z[0]))];
  const nextFix = isToday ? d.fixed.find(f => toMin(f[0]) > now.min) : null;
  const notesToday = S._notesCache?.filter(n => n.at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length || 0;
  view().innerHTML = `
   ${d ? `<div class="days">${tripDays().map(x => `<button data-d="${x.date}" class="${x.date === d.date ? 'on' : ''}">${esc(dayLabel(x.date).replace(/^(\d+)월 /, '$1/').replace('일 ', ' '))}</button>`).join('')}</div>` : ''}
   <section class="card hero">
     <p class="k">${d ? esc(dayLabel(d.date)) + (isToday ? ' · 오늘' : dd > 0 ? ` · D-${dd}` : '') : '일정 없음'}</p>
     <h2>${zones.length ? esc(zoneH.map(h => hallById(h).short).join(' · ')) + ' 둘러보기' : d ? '못 본 곳 자유롭게' : '가고 싶은 홀을 골라 보세요'}</h2>
     <div class="zones">${(zones.length ? zones : HALLS.filter(h => wishIn(h.id).left.length).slice(0, 4).map(h => [h.id, ''])).filter((z, i, a) => a.findIndex(y => y[0] === z[0]) === i).map(([h, when]) => { const w = wishIn(h); return `<button class="zone" data-h="${h}"><span class="when">${esc(when || '추천')}</span><b>${esc(hallById(h).short)}</b><span class="num">${icon('heart')}${w.left.length}<small>/${w.all.length}</small></span></button>`; }).join('')}</div>
     <button class="btn wide" id="whatNext">${icon('spark')}뭐 볼까?</button>
   </section>
   ${d ? `<section class="card"><h3 class="ch">정해진 시간</h3><ul class="fix">${d.fixed.map(f => { const past = isToday && toMin(f[0]) <= now.min, nx = nextFix === f; return `<li class="${past ? 'past' : ''}${nx ? ' nx' : ''}"><time>${esc(f[0])}</time><span>${esc(f[1])}</span>${nx ? `<em>${dur(toMin(f[0]) - now.min)} 남음</em>` : ''}</li>`; }).join('')}</ul>
     <div class="row"><button class="btn ghost" id="icsBtn">${icon('bell')}폰 캘린더에 알람 넣기</button></div></section>` : ''}
   <section class="card stats"><div>${icon('pin')}<b>${S.seen.size}</b><small>본 부스</small></div><div>${icon('heart')}<b>${[...S.wish].filter(id => !S.seen.has(id)).length}</b><small>남은 위시</small></div><div>${icon('walk')}<b>${pos.me.steps.toLocaleString()}</b><small>오늘 걸음</small></div></section>
   ${!pos.sensorsOn ? `<section class="card tip"><div><b>걸음·방향 켜기</b><p class="mute">지도에서 내 점과 바라보는 방향을 보려면 센서를 한 번 허용해 주세요.</p></div><button class="btn" id="sensBtn">켜기</button></section>` : ''}
   ${'Notification' in window && Notification.permission === 'default' ? `<section class="card tip"><div><b>알림 받기</b><p class="mute">위시 근처·집결 시간에 폰 알림(진동)으로 알려요. 아이폰은 홈 화면에 추가한 뒤에 돼요.</p></div><button class="btn" id="notiBtn">허용</button></section>` : ''}`;
  view().querySelector('.days')?.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) { S.day = b.dataset.d; renderToday(); } });
  $$('.zone', view()).forEach(b => b.onclick = () => { S.hall = b.dataset.h; go('map'); });
  $('#whatNext').onclick = () => recommend(pos.me.hall || zoneH[0] || S.hall);
  $('#icsBtn')?.addEventListener('click', exportIcs);
  $('#sensBtn')?.addEventListener('click', async () => { toast(await pos.startSensors() ? '켰어요' : '허용이 안 됐어요. 설정에서 동작·방향 접근을 켜 주세요'); renderToday(); });
  $('#notiBtn')?.addEventListener('click', async () => { try { await Notification.requestPermission(); } catch { } renderToday(); });
}

// 근처 3곳: 위시 1, 관심 분야 1, 평소 안 볼 분야 1
function recommend(hallId) {
  const hall = hallById(hallId); const from = pos.me.hall === hallId ? meXY() : [hall.w / 2, hall.h - 6];
  const pool = layout(hall).filter(b => named(b) && !S.seen.has(b.id)).map(b => ({ b, m: dist(from, frontOf(hall, b)) })).sort((a, b) => a.m - b.m);
  const picks = []; const take = (f, why) => { const x = pool.find(p => f(p.b) && !picks.some(q => q.b === p.b)); if (x) picks.push({ ...x, why }); };
  take(b => S.wish.has(b.id), '위시'); take(b => b.tags.some(t => S.interests.includes(t)), '관심 분야'); take(b => !b.tags.some(t => S.interests.includes(t)), '의외의 것'); take(() => true, '가까운 곳'); take(() => true, '가까운 곳');
  const list = picks.slice(0, 3).map(p => ({ ...p, r: route(hall, from, frontOf(hall, p.b)) }));
  if (!list.length) return toast('이 홀은 다 봤어요. 다른 홀을 골라 보세요');
  const sh = sheet(`<h2 class="sh-t">${icon('spark')} 지금 근처에서 <small>${esc(hall.short)}${pos.me.hall === hallId ? '' : ' · 입구 기준'}</small></h2>
    <div class="list">${list.map((p, i) => `<button class="li" data-i="${i}"><span class="why">${esc(p.why)}</span><b>${nm(p.b)}</b><small>${esc(p.b.no)} · ${esc(p.b.tags.map(t => TAGS[t]).join(', '))}</small><span class="mt">${p.r ? `${p.r.m}m · ${walkMin(p.r.m)}분` : ''}</span></button>`).join('')}</div>`);
  $$('.li', sh).forEach(el => el.onclick = () => { const p = list[+el.dataset.i]; closeSheet(); S.hall = hallId; S.routeTo = { booth: p.b.id }; go('map'); });
}

// ---------- 지도 ----------
function renderMap() {
  const hall = hallById(S.hall); store.set('viewHall', S.hall);
  view().innerHTML = `
   <div class="halls">${HALLS.map(h => `<button data-h="${h.id}" class="${h.id === S.hall ? 'on' : ''}">${esc(h.short)}${wishIn(h.id).left.length ? `<i>${wishIn(h.id).left.length}</i>` : ''}</button>`).join('')}</div>
   <div class="mapbox"><div id="map"></div>
     <div class="mtools"><button id="m3d" class="seg"><span class="${'d3'}">3D</span><span>위에서</span></button></div>
     <div class="mtools r"><button class="rb" id="mMe" aria-label="내 위치">${icon('locate')}</button><button class="rb" id="mPocket" aria-label="주머니 모드">${icon('moon')}</button><button class="rb dark" id="mTalk" aria-label="번역">${icon('talk')}</button></div>
     <div class="routebar" id="routeBar" hidden></div>
     <section class="secp" id="secp" hidden></section>
     <p class="sample">${DIR.count ? `CES 공식 목록 ${esc(DIR.updated)} 기준 · 번호 순 배치` : '예시 배치'} · 꾹 누르면 "나 여기"</p>
   </div>
   <div class="quick">${['water', 'wc', 'food', 'bat', 'exit'].map(t => `<button data-a="${t}">${icon(t)}<b>${AMEN[t]}</b><small data-d="${t}">–</small></button>`).join('')}</div>`;
  $('.halls', view()).onclick = e => { const b = e.target.closest('[data-h]'); if (!b) return; S.hall = b.dataset.h; S.routeTo = null; renderMap(); };
  const m = S.map = createMap($('#map'), { onBooth: id => openSection(id), onLong: p => { pos.anchor(hall.id, p[0], p[1], 6); toast('여기로 내 위치를 맞췄어요'); } });
  m.setHall(hall); markMap(); m.setMe(pos.me);
  $('#m3d').onclick = () => { m.setMode(m.mode === 'd3' ? 'd2' : 'd3'); $('#m3d').classList.toggle('flat', m.mode === 'd2'); };
  $('#mMe').onclick = () => { if (pos.me.hall === hall.id) m.center(pos.me.x, pos.me.y); else if (pos.me.hall) { S.hall = pos.me.hall; renderMap(); } else toast('부스를 눌러 기록하거나 지도를 꾹 누르면 내 위치가 잡혀요'); };
  $('#mPocket').onclick = pocket; $('#mTalk').onclick = () => openTalk({ booth: lastBooth(), onSave: saveTalk });
  $('.quick', view()).onclick = e => { const b = e.target.closest('[data-a]'); if (b) navAmen(b.dataset.a); };
  if (pos.me.hall === hall.id) m.center(pos.me.x, pos.me.y, 0); if (S.routeTo) drawRoute(); updateQuick();
  if (S.focus) { const b = boothById(S.focus); S.focus = null; if (b && b.hall === hall.id) setTimeout(() => { m.center(b.x + b.w / 2, b.y + b.h / 2); markMap(b.id); }, 120); }
}
function markMap(focus = '') { if (!S.map) return; const hall = hallById(S.hall); const rec = new Set(layout(hall).filter(b => named(b) && b.tags.some(t => S.interests.includes(t))).map(b => b.id)); S.map.mark({ wish: S.wish, seen: S.seen, rec, focus }); }
function nearestAmen(hall, type, from) { return amenities(hall).filter(a => a.type === type).map(a => ({ a, m: dist(from, [a.x, a.y]) })).sort((x, y) => x.m - y.m)[0]?.a; }
function updateQuick() {
  if (S.tab !== 'map') return; const hall = hallById(S.hall); const here = pos.me.hall === hall.id;
  $$('[data-d]', view()).forEach(el => { if (!here) { el.textContent = '–'; return; } const a = nearestAmen(hall, el.dataset.d, meXY()); el.textContent = a ? Math.round(dist(meXY(), [a.x, a.y]) * 1.25) + 'm' : '–'; });
}
function navAmen(type) {
  const hall = hallById(S.hall); const from = pos.me.hall === hall.id ? meXY() : null;
  if (!from) { toast('이 홀에서 내 위치를 먼저 잡아 주세요 (지도 꾹 누르기)'); return; }
  const a = nearestAmen(hall, type, from); if (!a) return; S.routeTo = { amen: a }; drawRoute();
}
function landmark(hall, pts) { const mid = pts[Math.floor(pts.length / 2)]; const b = layout(hall).filter(named).map(b => ({ b, m: dist(mid, [b.x + b.w / 2, b.y + b.h / 2]) })).sort((a, c) => a.m - c.m)[0]?.b; if (!b) return ''; const n = koName(b); return `${n.length > 16 ? n.slice(0, 15) + '…' : n} 쪽으로`; }
function drawRoute() {
  const hall = hallById(S.hall); const t = S.routeTo; const bar = $('#routeBar'); if (!t || !S.map) return;
  const panel = $('#secp'); const quiet = panel && !panel.hidden; // 통로 목록이 열려 있으면 거리는 목록 안에서 보여 줘요
  const target = t.booth ? boothById(t.booth) : t.amen; if (!target) return;
  const to = t.booth ? frontOf(hall, target) : [target.x, target.y];
  const from = pos.me.hall === hall.id ? meXY() : [hall.w / 2, hall.h - 5];
  const r = route(hall, from, to); if (!r) { toast('길을 못 찾았어요'); return; }
  S.map.showRoute(r.pts); if (t.booth) markMap(target.id);
  const name = t.booth ? target.name || target.no : target.name; const near = r.m < 12;
  if (quiet) { bar.hidden = true; return r; }
  bar.hidden = false; bar.innerHTML = `<div><b>${esc(name)}</b><small>${near ? '도착했어요' : `${esc(landmark(hall, r.pts))} · ${r.m}m · ${walkMin(r.m)}분`}${pos.me.hall === hall.id ? '' : ' · 입구 기준'}</small></div><button class="rb" aria-label="길안내 끄기">${icon('x')}</button>`;
  bar.querySelector('button').onclick = () => { S.routeTo = null; S.map.showRoute(null); bar.hidden = true; markMap(); };
  return r;
}

// 지도에서 부스를 누르면: 그 통로(번호 백 단위)의 부스 목록이 아래에 떠요. 지도는 그대로 보이고 움직일 수 있어요.
// 줄을 누르면 바로 길 안내 + 짧은 정보. X나 손잡이를 아래로 밀면 닫혀요. ‹ › 로 옆 통로.
function openSection(id, pick = true) {
  const b = boothById(id); if (!b) return; const hall = hallById(b.hall); const p = $('#secp'); if (!p) return openBooth(id);
  const aisleOf = x => Math.floor(parseInt(x.no) / 100);
  const all = layout(hall).filter(x => named(x) && !x.guess);
  const aisles = [...new Set(all.map(aisleOf))].sort((a, c) => a - c);
  const aisle = aisleOf(b), ai = aisles.indexOf(aisle);
  const list = all.filter(x => aisleOf(x) === aisle).sort((a, c) => parseInt(a.no) - parseInt(c.no));
  const tag = x => { const c = (x.cat || '').split('·')[0].trim() || TAGS[x.tags?.[0]] || ''; return c ? `<span class="stag">${esc(c)}</span>` : ''; };
  const row = x => `<div class="srow ${S.seen.has(x.id) ? 'seen' : ''}" data-id="${esc(x.id)}"><button class="sgo" data-go="${esc(x.id)}"><span class="sno">${esc(x.no)}</span><span class="snm"><b>${esc(koName(x))}</b>${enName(x) ? `<small>${esc(enName(x))}</small>` : ''}</span>${tag(x)}</button><button class="sht ${S.wish.has(x.id) ? 'on' : ''}" data-w="${esc(x.id)}" aria-label="위시">${icon('heart')}</button></div>`;
  p.innerHTML = `<div class="grab"></div><div class="sec-h"><button class="rb" data-nav="-1" ${ai <= 0 ? 'disabled' : ''} aria-label="앞 통로">${icon('down')}</button><div><b>${esc(hall.short)} · ${aisle}00번대 통로</b><small>${list.length}곳 · 누르면 바로 길 안내</small></div><button class="rb" data-nav="1" ${ai >= aisles.length - 1 ? 'disabled' : ''} aria-label="다음 통로">${icon('down')}</button><button class="rb" data-x aria-label="닫기">${icon('x')}</button></div>
    <div class="sec-d" id="secD" hidden></div><div class="sec-l">${list.map(row).join('')}</div>`;
  if (p.hidden) { p.hidden = false; p.classList.add('in'); setTimeout(() => p.classList.toggle('in', false), 500); }
  $('#routeBar').hidden = true;
  const syncHeart = (wid, on) => $$(`[data-w="${CSS.escape(wid)}"]`, p).forEach(h => h.classList.toggle('on', on));
  p.onclick = async e => {
    const w = e.target.closest('[data-w]');
    if (w) { const on = await store.toggleList('wish', w.dataset.w); on ? S.wish.add(w.dataset.w) : S.wish.delete(w.dataset.w); syncHeart(w.dataset.w, on); w.classList.toggle('pop', false); void w.offsetWidth; w.classList.add('pop'); markMap(S.routeTo?.booth || ''); return; }
    if (e.target.closest('[data-x]')) { closeSection(); return; }
    const n = e.target.closest('[data-nav]');
    if (n) { const f = all.find(x => aisleOf(x) === aisles[ai + +n.dataset.nav]); if (f) { openSection(f.id, false); S.map.center(f.x + f.w / 2, f.y + f.h / 2, 0, p.offsetHeight); markMap(f.id); } return; }
    if (e.target.closest('[data-more]')) { openBooth(S.routeTo?.booth || id); return; }
    const g = e.target.closest('[data-go]'); if (g) pickInSection(g.dataset.go);
  };
  let y0 = null; const grab = p.querySelector('.grab');
  grab.onpointerdown = e => { y0 = e.clientY; grab.setPointerCapture(e.pointerId); };
  grab.onpointermove = e => { if (y0 != null) p.style.transform = `translateY(${Math.max(0, e.clientY - y0)}px)`; };
  grab.onpointerup = grab.onpointercancel = e => { if (y0 == null) return; const d = e.clientY - y0; y0 = null; p.style.transform = ''; if (d > 60) closeSection(); };
  if (pick) pickInSection(id); else markMap(S.routeTo?.booth || '');
}
function pickInSection(id) {
  const b = boothById(id); const p = $('#secp'); if (!b || !p) return; const hall = hallById(b.hall);
  S.lastBooth = b.id; S.routeTo = { booth: id }; const r = drawRoute();
  $$('.srow', p).forEach(x => x.classList.toggle('on', x.dataset.id === id));
  p.querySelector(`.srow[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  const here = pos.me.hall === hall.id; const d = $('#secD'); d.hidden = false;
  d.innerHTML = `<div class="sd-top"><div><b>${nm(b)}</b><small>${esc(b.no)}${b.cat ? ' · ' + esc(b.cat) : ''}</small></div><button class="heart sm ${S.wish.has(id) ? 'on' : ''}" data-w="${esc(id)}" aria-label="위시">${icon('heart')}</button></div>
    <div class="sd-go">${icon('walk')}<b>${r ? r.m + 'm' : '–'}</b>${icon('clock')}<b>${r ? walkMin(r.m) + '분' : '–'}</b><small>${here ? '' : '입구 기준'}</small><button class="btn sm" data-more>자세히 · 기록</button></div>`;
  requestAnimationFrame(() => S.map.center(b.x + b.w / 2, b.y + b.h / 2, 0, p.offsetHeight));
}
function closeSection() {
  const p = $('#secp'); if (!p || p.hidden) return; p.classList.add('out');
  setTimeout(() => { p.hidden = true; p.classList.toggle('out', false); if (S.routeTo) drawRoute(); else markMap(); }, 220);
}

// 부스 카드: 위시, 본 곳, 별점, 기록(사진·말하기·글), 번역·질문
async function openBooth(id) {
  const b = boothById(id); if (!b) return; const hall = hallById(b.hall); S.lastBooth = b.id;
  const notes = (await store.notes()).filter(n => n.booth === id);
  const here = pos.me.hall === hall.id; const r = here ? route(hall, meXY(), frontOf(hall, b)) : null; const rate = S.rate[id] || 0;
  const sh = sheet(`<div class="bh"><div><p class="k">${esc(hall.short)} · ${esc(b.no)}${b.guess ? ' (예시 번호)' : ''}</p><h2>${b.name ? nm(b) : '이름 없는 부스'}</h2>
      ${b.cat ? `<p class="cat">${esc(b.cat)}</p>` : ''}${b.with?.length ? `<p class="cat">같은 부스 · ${esc(b.with.slice(0, 6).join(', '))}${b.with.length > 6 ? ` 외 ${b.with.length - 6}곳` : ''}</p>` : ''}<div class="tags">${(b.tags || []).map(t => `<span>${esc(TAGS[t])}</span>`).join('')}</div></div>
      <button class="heart ${S.wish.has(id) ? 'on' : ''}" id="bWish" aria-label="위시">${icon('heart')}</button></div>
    ${b.pre || b.desc ? `<button class="pv" id="bPv" aria-expanded="false"><span>${icon('star')}CES 미리 보기</span>${icon('down')}</button><div class="pvb" id="bPvb" hidden>${b.pre ? `<p>${esc(b.pre)}</p><p class="mute small">지난 CES 전시를 바탕으로 한 예상이에요.</p>` : ''}${b.desc ? `<p class="en-desc" lang="en">${esc(b.desc)}${b.desc.length >= 80 ? '…' : ''}</p><p class="mute small">CES 2027 공식 참가 기업 목록의 회사 소개예요. <button class="link" id="bTr">한국어로 보기</button></p><p id="bTrOut" hidden></p>` : ''}<a class="link" href="${esc(newsUrl(b))}" target="_blank" rel="noopener noreferrer">최신 소식 찾아보기 ↗</a></div>` : ''}
    ${r ? `<div class="mt">${icon('walk')}<b>${r.m}m</b>${icon('clock')}<b>${walkMin(r.m)}분</b><button class="btn ghost sm" id="bGo">길 보기</button></div>` : `<div class="mt"><button class="btn ghost sm" id="bGo">지도에서 보기</button></div>`}
    <div class="rec3"><label class="btn rec">${icon('cam')}사진<input type="file" accept="image/*" capture="environment" id="bPhoto" hidden></label><button class="btn rec" id="bVoice">${icon('mic')}<span>누르고 말하기</span></button><button class="btn rec alt" id="bText">${icon('pen')}글</button></div>
    <div class="txt" id="bTxt" hidden><textarea id="bTa" rows="3" maxlength="2000" placeholder="본 것, 느낀 것, 물어볼 것"></textarea><button class="btn" id="bTaOk">저장</button></div>
    <div class="row between"><div class="stars" id="bStars">${[1, 2, 3, 4, 5].map(i => `<button data-s="${i}" class="${i <= rate ? 'on' : ''}" aria-label="${i}점">${icon('star')}</button>`).join('')}</div>
      <button class="chipbtn ${S.seen.has(id) ? 'on' : ''}" id="bSeen">${icon('check')}봤어요</button></div>
    <button class="btn wide alt" id="bTalk">${icon('talk')}번역 · 질문 추천</button>
    <div id="bNotes">${noteList(notes)}</div>`);
  sh.querySelector('#bPv')?.addEventListener('click', e => { const o = sh.querySelector('#bPvb'); o.hidden = !o.hidden; e.currentTarget.setAttribute('aria-expanded', String(!o.hidden)); e.currentTarget.classList.toggle('on', !o.hidden); });
  sh.querySelector('#bTr')?.addEventListener('click', async e => { const o = sh.querySelector('#bTrOut'); o.hidden = false; o.innerHTML = '<span class="wait"><i></i><i></i><i></i></span>'; e.currentTarget.disabled = true;
    try { o.textContent = await translate(b.desc, 'ko'); } catch (er) { o.textContent = er.fix ? '번역하려면 설정에서 AI 키를 넣어 주세요' : er.message === 'offline' ? '인터넷이 없어서 번역을 못 했어요' : '지금은 번역이 늦어요'; e.currentTarget.disabled = false; } });
  sh.querySelector('#bWish').onclick = async e => { const on = await store.toggleList('wish', id); on ? S.wish.add(id) : S.wish.delete(id); e.currentTarget.classList.toggle('on', on); e.currentTarget.classList.add('pop'); markMap(); };
  sh.querySelector('#bSeen').onclick = async e => { const on = await store.toggleList('seen', id); on ? S.seen.add(id) : S.seen.delete(id); e.currentTarget.classList.toggle('on', on); markMap(); };
  sh.querySelector('#bStars').onclick = async e => { const s = e.target.closest('[data-s]'); if (!s) return; S.rate[id] = +s.dataset.s; await store.set('rate', S.rate); $$('[data-s]', sh).forEach(x => x.classList.toggle('on', +x.dataset.s <= S.rate[id])); };
  sh.querySelector('#bGo').onclick = () => { closeSheet(); S.hall = hall.id; S.routeTo = here ? { booth: id } : null; S.focus = id; go('map'); };
  sh.querySelector('#bTalk').onclick = () => { closeSheet(); setTimeout(() => openTalk({ booth: b, onSave: c => saveTalk(c, b) }), 280); };
  sh.querySelector('#bText').onclick = () => { const t = sh.querySelector('#bTxt'); t.hidden = !t.hidden; if (!t.hidden) sh.querySelector('#bTa').focus(); };
  sh.querySelector('#bTaOk').onclick = async () => { const v = sh.querySelector('#bTa').value.trim(); if (!v) return; await addNote(b, { kind: 'text', text: v }); sh.querySelector('#bTa').value = ''; sh.querySelector('#bTxt').hidden = true; refresh(); };
  sh.querySelector('#bPhoto').onchange = async e => { const f = e.target.files?.[0]; if (!f) return; try { const blob = await shrink(f); await addNote(b, { kind: 'photo', blob: await store.putBlob(blob) }); toast('사진 저장'); refresh(); } catch { toast('사진을 못 읽었어요'); } e.target.value = ''; };
  holdToRecord(sh.querySelector('#bVoice'), async (blob, text) => { await addNote(b, { kind: 'voice', blob: blob ? await store.putBlob(blob) : null, text }); refresh(); });
  async function refresh() { const ns = (await store.notes()).filter(n => n.booth === id); sh.querySelector('#bNotes').innerHTML = noteList(ns); bindNoteMedia(sh); sh.querySelector('#bSeen').classList.toggle('on', S.seen.has(id)); }
  bindNoteMedia(sh);
}
const lastBooth = () => S.lastBooth ? boothById(S.lastBooth) : null;
async function addNote(b, n) {
  await store.putNote({ ...n, booth: b.id, hall: b.hall, day: laNow().date });
  if (!S.seen.has(b.id)) { S.seen.add(b.id); await store.set('seen', [...S.seen]); }
  const [x, y] = frontOf(hallById(b.hall), b); pos.anchor(b.hall, x, y, 4); // 기록한 곳 = 지금 있는 곳
  markMap(); S.lastBooth = b.id;
}
async function saveTalk(convo, b = lastBooth()) { if (!b || !convo?.length) return; await addNote(b, { kind: 'talk', convo: convo.slice(0, 40) }); toast('대화를 부스 기록에 넣었어요'); }
async function shrink(file, max = 1600) {
  const img = await createImageBitmap(file).catch(async () => { const u = URL.createObjectURL(file); const i = new Image(); i.src = u; await i.decode(); return i; });
  const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return await new Promise(r => c.toBlob(r, 'image/jpeg', .82));
}
// 누르는 동안 녹음(최대 2분) + 가능하면 받아 적기
function holdToRecord(btn, done) {
  let rec = null, chunks = [], sr = null, text = '', t0 = 0, timer = 0, stream = null;
  const label = btn.querySelector('span');
  async function start(e) {
    e.preventDefault(); if (rec) return; chunks = []; text = '';
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { toast('마이크를 허용해 주세요'); return; }
    try { rec = new MediaRecorder(stream); rec.ondataavailable = ev => ev.data.size && chunks.push(ev.data); rec.start(); } catch { rec = null; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) { try { sr = new SR(); sr.lang = 'ko-KR'; sr.continuous = true; sr.interimResults = true; sr.onresult = ev => { text = [...ev.results].map(x => x[0].transcript).join(' '); }; sr.start(); } catch { sr = null; } }
    t0 = Date.now(); btn.classList.add('live'); timer = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); label.textContent = `녹음 중 ${s}초 · 떼면 저장`; if (s >= 120) stop(); }, 250);
  }
  async function stop() {
    if (!stream) return; clearInterval(timer); btn.classList.remove('live'); label.textContent = '누르고 말하기';
    const long = Date.now() - t0 > 900;
    try { sr?.stop(); } catch { }
    const blob = await new Promise(res => { if (!rec || rec.state === 'inactive') return res(null); rec.onstop = () => res(new Blob(chunks, { type: rec.mimeType || 'audio/mp4' })); rec.stop(); });
    stream.getTracks().forEach(t => t.stop()); stream = null; rec = null;
    if (!long) { toast('꾹 누른 채로 말해 주세요'); return; }
    setTimeout(() => done(blob && blob.size < 8e6 ? blob : null, text.trim()), 300); toast('음성 메모 저장');
  }
  btn.addEventListener('pointerdown', start); btn.addEventListener('pointerup', stop); btn.addEventListener('pointerleave', () => rec && stop()); btn.addEventListener('contextmenu', e => e.preventDefault());
}
function noteList(ns) {
  if (!ns.length) return '';
  return `<div class="notes">${ns.map(n => `<div class="note n-${n.kind}" data-id="${esc(n.id)}"><time>${new Date(n.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>${noteBody(n)}</div>`).join('')}</div>`;
}
function noteBody(n) {
  if (n.kind === 'photo') return `<img data-blob="${esc(n.blob)}" alt="부스 사진">`;
  if (n.kind === 'voice') return `${n.blob ? `<button class="play" data-audio="${esc(n.blob)}">${icon('play')}듣기</button>` : ''}<p>${esc(n.text || '(받아 적은 글 없음)')}</p>`;
  if (n.kind === 'talk') return `<div class="convo">${n.convo.map(c => `<p class="c-${c.who === 'me' ? 'me' : 'them'}"><b>${esc(c.en || '')}</b><span>${esc(c.ko || '')}</span></p>`).join('')}</div>`;
  return `<p>${esc(n.text)}</p>`;
}
function bindNoteMedia(root) {
  $$('img[data-blob]', root).forEach(async img => { const b = await store.getBlob(img.dataset.blob); if (b) { img.src = URL.createObjectURL(b); img.onclick = () => sheet(`<img class="full" src="${img.src}" alt="">`); } });
  $$('[data-audio]', root).forEach(btn => btn.onclick = async () => { const b = await store.getBlob(btn.dataset.audio); if (b) new Audio(URL.createObjectURL(b)).play().catch(() => toast('재생 못 했어요')); });
}

// ---------- 위시 ----------
function renderWish(q = '') {
  const qq = q.trim().toLowerCase();
  const found = qq ? allNamed().filter(b => (b.name + ' ' + b.no + ' ' + (b.also || []).join(' ') + ' ' + (b.cat || '') + ' ' + (b.with || []).join(' ') + ' ' + b.tags.map(t => TAGS[t]).join(' ')).toLowerCase().includes(qq)).slice(0, 30) : [];
  const by = S.wishBy || 'place';
  const wished = [...S.wish].map(boothById).filter(Boolean);
  // 위치별 = 홀 순서, 분야별 = 관심 분야 먼저(한 부스가 여러 분야면 각 분야에 다 보여요)
  const groups = by === 'place'
    ? HALLS.map(h => ({ title: h.name, items: wished.filter(b => b.hall === h.id) })).filter(g => g.items.length)
    : Object.keys(TAGS).sort((a, c) => (S.interests.includes(c) ? 1 : 0) - (S.interests.includes(a) ? 1 : 0)).map(t => ({ title: TAGS[t], items: wished.filter(b => b.tags?.includes(t)).sort((a, c) => a.hall.localeCompare(c.hall)) })).filter(g => g.items.length);
  const row = b => { const here = pos.me.hall === b.hall; const m = here ? Math.round(dist(meXY(), frontOf(hallById(b.hall), b)) * 1.25) : null; return `<div class="wrow ${S.seen.has(b.id) ? 'seen' : ''}"><button class="wmain" data-open="${esc(b.id)}"><b>${nm(b)}</b><small>${esc(b.no)} · ${esc(hallById(b.hall).short)}${m != null ? ` · ${m}m` : ''}${S.seen.has(b.id) ? ' · 봤어요' : ''}</small></button><button class="heart ${S.wish.has(b.id) ? 'on' : ''}" data-w="${esc(b.id)}" aria-label="위시">${icon('heart')}</button></div>`; };
  view().innerHTML = `<div class="search">${icon('search')}<input id="wq" placeholder="회사·부스 번호·분야 찾기" value="${esc(q)}" autocomplete="off"></div>
    ${qq ? `<section class="card"><h3 class="ch">찾은 부스 ${found.length}</h3>${found.map(row).join('') || '<p class="mute">없어요</p>'}</section>` : ''}
    <section class="card wsum"><div><b>${wished.length}</b><small>위시</small></div><div><b>${wished.filter(b => S.seen.has(b.id)).length}</b><small>봤어요</small></div><p class="mute">근처 60m에 오면 알려 드려요. 누르면 지도에서 3D로 미리 봐요.</p></section>
    ${S.wish.size ? `<div class="seg" id="wBy"><button data-by="place" class="${by === 'place' ? 'on' : ''}">위치별</button><button data-by="tag" class="${by === 'tag' ? 'on' : ''}">분야별</button></div>` : ''}
    ${groups.map(g => `<section class="card"><h3 class="ch">${esc(g.title)} <small>${g.items.filter(b => !S.seen.has(b.id)).length}곳 남음</small></h3>${g.items.map(row).join('')}</section>`).join('') || '<p class="empty">하트를 눌러 가고 싶은 부스를 모아 보세요</p>'}`;
  const inp = $('#wq'); inp.oninput = () => { const v = inp.value, p = inp.selectionStart; renderWish(v); const n = $('#wq'); n.focus(); n.setSelectionRange(p, p); };
  view().onclick = async e => {
    const sb = e.target.closest('[data-by]'); if (sb) { S.wishBy = sb.dataset.by; store.set('wishBy', S.wishBy); renderWish($('#wq')?.value || ''); return; }
    const w = e.target.closest('[data-w]'); if (w) { const on = await store.toggleList('wish', w.dataset.w); on ? S.wish.add(w.dataset.w) : S.wish.delete(w.dataset.w); renderWish($('#wq')?.value || ''); return; }
    const o = e.target.closest('[data-open]'); if (o) { const b = boothById(o.dataset.open); S.hall = b.hall; S.focus = b.id; view().onclick = null; go('map'); setTimeout(() => openBooth(b.id), 700); }
  };
}

// ---------- 기록 모아보기 ----------
async function renderNotes() {
  const all = await store.notes(); S._notesCache = all; const f = S.notesF;
  const days = [...new Set(all.map(n => n.day))].sort();
  const list = all.filter(n => (!f.kind || n.kind === f.kind) && (!f.day || n.day === f.day) && (!f.hall || n.hall === f.hall) && (!f.q || JSON.stringify([n.text, n.convo, boothById(n.booth)?.name, boothById(n.booth)?.no]).toLowerCase().includes(f.q.toLowerCase())));
  const by = new Map(); list.forEach(n => { if (!by.has(n.booth)) by.set(n.booth, []); by.get(n.booth).push(n); });
  const cnt = k => all.filter(n => n.kind === k).length;
  view().innerHTML = `<div class="search">${icon('search')}<input id="nq" placeholder="메모·말한 내용·회사 찾기" value="${esc(f.q)}" autocomplete="off"></div>
   <div class="chips sc" id="nKind">${[['', '전체', all.length], ['photo', '사진', cnt('photo')], ['voice', '음성', cnt('voice')], ['text', '글', cnt('text')], ['talk', '대화', cnt('talk')]].map(([k, l, c]) => `<button data-k="${k}" class="${f.kind === k ? 'on' : ''}">${l} <small>${c}</small></button>`).join('')}</div>
   <div class="chips sc" id="nDay"><button data-d="" class="${!f.day ? 'on' : ''}">모든 날</button>${days.map(d => `<button data-d="${esc(d)}" class="${f.day === d ? 'on' : ''}">${esc(dayLabel(d))}</button>`).join('')}<select id="nHall"><option value="">모든 홀</option>${HALLS.map(h => `<option value="${h.id}" ${f.hall === h.id ? 'selected' : ''}>${esc(h.short)}</option>`).join('')}</select></div>
   ${[...by].map(([id, ns]) => { const b = boothById(id); return `<section class="card nb"><button class="nbh" data-b="${esc(id)}"><b>${nm(b)}</b><small>${esc(hallById(b?.hall)?.short || '')} · ${esc(b?.no || '')}${S.rate[id] ? ' · ' + '★'.repeat(S.rate[id]) : ''}</small></button>${noteList(ns)}</section>`; }).join('') || `<p class="empty">${all.length ? '맞는 기록이 없어요' : '부스를 눌러 사진·음성·글을 남기면 여기 모여요'}</p>`}
   ${all.length ? `<div class="row"><button class="btn ghost" id="nExp">${icon('share')}전부 파일로 내보내기</button></div>` : ''}`;
  bindNoteMedia(view());
  const inp = $('#nq'); inp.oninput = () => { f.q = inp.value; clearTimeout(S._nqT); S._nqT = setTimeout(async () => { const p = inp.selectionStart; await renderNotes(); const n = $('#nq'); n.focus(); n.setSelectionRange(p, p); }, 250); };
  $('#nKind').onclick = e => { const b = e.target.closest('[data-k]'); if (b) { f.kind = b.dataset.k; renderNotes(); } };
  $('#nDay').onclick = e => { const b = e.target.closest('[data-d]'); if (b) { f.day = b.dataset.d; renderNotes(); } };
  $('#nHall').onchange = e => { f.hall = e.target.value; renderNotes(); };
  $$('.nbh', view()).forEach(b => b.onclick = () => openBooth(b.dataset.b));
  $('#nExp')?.addEventListener('click', exportAll);
}
async function exportAll() {
  toast('파일 만드는 중…'); const ns = await store.notes(); const toUrl = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
  const out = []; for (const n of ns) { const b = boothById(n.booth); const o = { ...n, company: b?.name, boothNo: b?.no, hallName: hallById(n.hall)?.name }; if (n.blob) { const bl = await store.getBlob(n.blob); if (bl) o.file = await toUrl(bl); } delete o.blob; out.push(o); }
  const blob = new Blob([JSON.stringify({ app: 'ces-guide', version: VERSION, at: new Date().toISOString(), wish: [...S.wish], seen: [...S.seen], rate: S.rate, notes: out }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ces-기록-${laNow().date}.json`; document.body.append(a); a.click(); a.remove();
}

// ---------- 위치가 바뀔 때: 지도 점, 위시 근처 알림 ----------
async function onMove(me) {
  if (S.map && S.tab === 'map') { S.map.setMe(me); updateQuick(); if (S.routeTo && me.hall === S.hall) { clearTimeout(S._rt); S._rt = setTimeout(drawRoute, 600); } }
  if (!me.hall) return; const hall = hallById(me.hall);
  const key = 'alerted:' + laNow().date; const done = new Set(await store.get(key, []));
  for (const id of S.wish) {
    if (!id.startsWith(me.hall + ':') || S.seen.has(id) || done.has(id)) continue;
    const b = boothById(id); if (!b) continue; const m = dist([me.x, me.y], frontOf(hall, b));
    if (m < 60 && me.acc < 30) { done.add(id); await store.set(key, [...done]); notify(`위시 ${b.name}이(가) 가까워요`, `${b.no} · 약 ${Math.round(m * 1.25)}m`, 'wish-' + id, () => { S.hall = b.hall; S.routeTo = { booth: id }; go('map'); }); break; }
  }
}
async function notify(title, body, tag, onTap) {
  toast(title + ' · ' + body); try { navigator.vibrate?.([200, 100, 200]); } catch { }
  if (S._lastNoti) S._lastNoti = null; S._lastNoti = onTap;
  if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
    try { const reg = await navigator.serviceWorker?.ready; await reg.showNotification(title, { body, tag, icon: 'icon-192.png', badge: 'icon-192.png', vibrate: [200, 100, 200], renotify: true }); } catch { }
  }
  $('#toast')?.addEventListener('click', () => { S._lastNoti?.(); }, { once: true });
}
// 정해진 시간 알람(앱이 열려 있을 때): 출구까지 걸리는 시간 + 10분 전에
async function tickAlarms() {
  const d = currentDay(); const now = laNow(); if (!d || d.date !== now.date || S.day) return;
  let lead = 15; if (pos.me.hall) { const hall = hallById(pos.me.hall); const ex = nearestAmen(hall, 'exit', meXY()); if (ex) { const r = route(hall, meXY(), [ex.x, ex.y]); if (r) lead = walkMin(r.m) + 10; } }
  const key = 'fixAlert:' + now.date; const done = new Set(await store.get(key, []));
  for (const [hm, what] of d.fixed) { const t = toMin(hm); if (done.has(hm) || now.min < t - lead || now.min > t) continue; done.add(hm); await store.set(key, [...done]); notify(`${hm} ${what}`, `${t - now.min}분 남았어요${pos.me.hall ? ' · 지금 출구로 가면 딱 맞아요' : ''}`, 'fix-' + hm); }
}
// 화면이 꺼져 있어도 울리게: 정해진 시간을 폰 캘린더 알람으로
function exportIcs() {
  const days = tripDays(); if (!days.length) return;
  const utc = (date, hm) => { const [h, m] = hm.split(':').map(Number); const d = new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), h + 8, m)); return d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); };
  const ev = days.flatMap(d => d.fixed.map(([hm, what]) => ['BEGIN:VEVENT', `UID:ces-${d.date}-${hm.replace(':', '')}@ces-guide`, `DTSTAMP:${utc(d.date, '00:00')}`, `DTSTART:${utc(d.date, hm)}`, `DTEND:${utc(d.date, hm)}`, `SUMMARY:CES ${what}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${what}`, 'TRIGGER:-PT20M', 'END:VALARM', 'END:VEVENT'].join('\r\n')));
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ces-guide//KO', ...ev, 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics); a.download = 'ces-일정.ics'; document.body.append(a); a.click(); a.remove();
  toast('캘린더 파일을 열고 "추가"를 눌러 주세요 · 20분 전에 울려요');
}

// ---------- 주머니 모드: 화면은 켜 둔 채 까맣게(걸음·알림 계속) ----------
let lock = null;
async function pocket() {
  const ov = document.createElement('div'); ov.id = 'pocket';
  const paint = () => { const hall = pos.me.hall && hallById(pos.me.hall); let near = ''; if (hall) { const w = [...S.wish].filter(id => id.startsWith(hall.id + ':') && !S.seen.has(id)).map(boothById).map(b => ({ b, m: dist(meXY(), frontOf(hall, b)) })).sort((a, c) => a.m - c.m)[0]; if (w) near = `${esc(w.b.name)} ${Math.round(w.m * 1.25)}m`; } ov.innerHTML = `<p>주머니 모드</p><b>${pos.me.steps.toLocaleString()}</b><small>걸음</small>${near ? `<p class="nw">가까운 위시 · ${near}</p>` : ''}<p class="out">두 번 톡 치면 나가요</p>`; };
  paint(); document.body.append(ov); const off = pos.onMove(paint);
  try { lock = await navigator.wakeLock?.request('screen'); } catch { }
  // 폰은 dblclick이 잘 안 와서 직접 두 번 톡을 셈(0.5초 안, 너무 멀리 떨어진 톡은 무시)
  let lastT = 0, lastX = 0, lastY = 0, gone = false;
  const exit = async () => { if (gone) return; gone = true; off(); ov.remove(); document.removeEventListener('keydown', esc1); try { await lock?.release(); } catch { } lock = null; };
  const esc1 = e => { if (e.key === 'Escape') exit(); }; document.addEventListener('keydown', esc1);
  ov.addEventListener('pointerup', e => { const t = performance.now(); if (t - lastT < 500 && Math.hypot(e.clientX - lastX, e.clientY - lastY) < 80) { exit(); return; } lastT = t; lastX = e.clientX; lastY = e.clientY; ov.classList.remove('tap1'); void ov.offsetWidth; ov.classList.add('tap1'); });
  ov.addEventListener('dblclick', exit);
}

// ---------- 설정 ----------
async function openSettings() {
  const est = await store.estimate();
  const sh = sheet(`<h2 class="sh-t">${icon('gear')} 설정</h2>
   <div class="set"><button id="sSetup">연수 일정·관심 분야 다시 고르기</button>
   <button id="sSens">${pos.sensorsOn ? '걸음·방향 켜져 있어요' : '걸음·방향 켜기'}</button>
   <button id="sCal">방향 맞추기 <small>폰 위쪽을 지도 위쪽과 같은 쪽으로 들고 누르기</small></button>
   <button id="sKey">번역 AI 키</button>
   <button id="sNoti">알림 ${'Notification' in window ? ({ granted: '켜짐', denied: '막힘 (폰 설정에서 켜기)', default: '허용하기' }[Notification.permission]) : '이 브라우저는 안 돼요'}</button>
   <button id="sExp">기록 전부 파일로 내보내기</button>
   <button id="sWipe" class="danger">이 폰의 기록 전부 지우기</button></div>
   <p class="mute small">위시·기록·사진·음성은 이 폰 브라우저 안에만 있어요${est ? ` (지금 ${(est.used / 1e6).toFixed(1)}MB)` : ''}. 번역할 때만 그 문장이 Google Gemini로 가요. 앱을 지우거나 사파리 기록을 지우면 같이 지워지니, 연수 끝나면 내보내기로 챙겨 두세요.</p>
   <p class="mute small">${DIR.count ? `참가 기업 ${DIR.count.toLocaleString()}곳은 CES 공식 목록(${esc(DIR.updated)} 기준)이에요. 지도는 부스 번호 순서로 늘어놓은 것이라 실제 도면과 모양이 달라요. ` : '지도 부스 배치는 예시예요. '}버전 ${VERSION}</p>`, { tall: true });
  sh.querySelector('#sSetup').onclick = () => { closeSheet(); setTimeout(setup, 280); };
  sh.querySelector('#sSens').onclick = async () => { toast(await pos.startSensors() ? '켰어요' : '허용이 안 됐어요'); };
  sh.querySelector('#sCal').onclick = async () => toast(await pos.calibrate() ? '방향을 맞췄어요' : '먼저 걸음·방향을 켜 주세요');
  sh.querySelector('#sKey').onclick = () => { closeSheet(); setTimeout(askKey, 280); };
  sh.querySelector('#sNoti').onclick = async () => { try { await Notification.requestPermission(); } catch { } closeSheet(); };
  sh.querySelector('#sExp').onclick = exportAll;
  sh.querySelector('#sWipe').onclick = async e => { if (e.currentTarget.dataset.sure !== '1') { e.currentTarget.dataset.sure = '1'; e.currentTarget.textContent = '정말 지워요? 한 번 더 누르면 지워져요'; return; } await store.wipe(); location.reload(); };
}

boot();
