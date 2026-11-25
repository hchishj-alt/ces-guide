// 내 위치와 방향. 체크인 버튼 없이:
//  - 부스를 눌러 기록하면 그 부스 앞으로 맞춤(anchor), 지도 꾹 누르기로 "나 여기"
//  - 그 사이는 걸음(가속도 센서) × 보폭을 나침반 방향으로 더하고, 부스 안으로 들어가면 통로로 밀어냄
//  - 확신(acc, 미터)은 걸을수록 커지고 맞출 때 작아짐. GPS는 어느 건물인지만 봄
import { nearestFree } from './map.js';
import { hallById, VENUES } from './data.js';
import * as store from './store.js';

const STRIDE = 0.68;
export const me = { hall: null, x: 0, y: 0, acc: 30, heading: null, steps: 0, at: 0 };
const subs = new Set();
export const onMove = fn => (subs.add(fn), () => subs.delete(fn));
const ping = () => subs.forEach(f => { try { f(me); } catch { } });
let saveT; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => store.set('me', { hall: me.hall, x: me.x, y: me.y, acc: me.acc, at: me.at, steps: me.steps, day: new Date().toDateString() }), 800); };

export async function load() { const s = await store.get('me'); if (s) { Object.assign(me, s); if (s.day !== new Date().toDateString()) me.steps = 0; me.acc = Math.min(60, me.acc + (Date.now() - (s.at || 0)) / 60000 * 4); } ping(); }
export function anchor(hall, x, y, acc = 4) { const [fx, fy] = nearestFree(hallById(hall), x, y); Object.assign(me, { hall, x: fx, y: fy, acc, at: Date.now() }); ping(); save(); }
export const known = () => !!me.hall;

// 나침반: iOS는 webkitCompassHeading, 안드로이드는 deviceorientationabsolute(alpha)
let headOff = 0; store.get('headOff', 0).then(v => headOff = v);
function onOrient(e) {
  let h = null;
  if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
  else if (e.absolute && typeof e.alpha === 'number') h = 360 - e.alpha;
  if (h == null) return;
  h = (h + headOff + 360) % 360;
  me.heading = me.heading == null ? h : me.heading + (((h - me.heading + 540) % 360) - 180) * 0.25; // 흔들림 줄이기
  me.heading = (me.heading + 360) % 360; throttle();
}
// "지금 화면 위쪽(지도 위)을 보고 있어요" → 그 순간 나침반 값을 지도 위쪽 방향으로 맞춤
export async function calibrate() { if (me.heading == null) return false; const hall = hallById(me.hall); const want = hall?.north || 0; headOff = (headOff + want - me.heading + 360) % 360; me.heading = want; await store.set('headOff', headOff); ping(); return true; }

// 걸음: 가속도 크기의 봉우리를 셈(0.3초 안에 두 번 안 셈)
let lastStep = 0, g = 9.8, hiArm = false;
function onMotion(e) {
  const a = e.accelerationIncludingGravity; if (!a || a.x == null) return;
  const m = Math.hypot(a.x, a.y, a.z); g = g * 0.98 + m * 0.02; const d = m - g; const t = performance.now();
  if (d > 1.6) hiArm = true;
  if (hiArm && d < 0.2 && t - lastStep > 300) { hiArm = false; lastStep = t; step(); }
}
function step() {
  me.steps++;
  if (!me.hall) { throttle(); return; }
  const hall = hallById(me.hall); const hd = me.heading == null ? null : (me.heading - (hall.north || 0)) * Math.PI / 180;
  if (hd != null) { const nx = Math.min(hall.w - 1, Math.max(1, me.x + Math.sin(hd) * STRIDE)), ny = Math.min(hall.h - 1, Math.max(1, me.y - Math.cos(hd) * STRIDE)); [me.x, me.y] = nearestFree(hall, nx, ny); }
  me.acc = Math.min(60, me.acc + (hd == null ? .5 : .07)); me.at = Date.now(); throttle(); save();
}
let raf = 0; const throttle = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; ping(); }); };

export let sensorsOn = false;
export async function startSensors() {
  try {
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') { if (await DeviceOrientationEvent.requestPermission() !== 'granted') return false; }
    if (typeof DeviceMotionEvent?.requestPermission === 'function') { if (await DeviceMotionEvent.requestPermission() !== 'granted') return false; }
  } catch { return false; }
  window.addEventListener('deviceorientationabsolute', onOrient); window.addEventListener('deviceorientation', onOrient); window.addEventListener('devicemotion', onMotion);
  sensorsOn = true; await store.set('sensors', true); ping(); return true;
}
export const hasSensors = () => 'DeviceOrientationEvent' in window || 'DeviceMotionEvent' in window;

// GPS로 건물만: 가까운 전시장(600m 안)을 돌려줌
export function whichVenue() {
  return new Promise(res => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(p => {
      const d = v => { const R = 6371e3, r = Math.PI / 180, dl = (v.lat - p.coords.latitude) * r, dn = (v.lng - p.coords.longitude) * r; return 2 * R * Math.asin(Math.sqrt(Math.sin(dl / 2) ** 2 + Math.cos(p.coords.latitude * r) * Math.cos(v.lat * r) * Math.sin(dn / 2) ** 2)); };
      const best = VENUES.map(v => ({ v, m: d(v) })).sort((a, b) => a.m - b.m)[0]; res(best && best.m < 600 ? best.v.id : null);
    }, () => res(null), { timeout: 8000, maximumAge: 60000 });
  });
}
