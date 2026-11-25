// raw.json([[회사 이름, "부스 | 부스"], ...]) → exhibitors.json
// 쓰는 법: node tools/build-exhibitors.mjs raw.json [YYYY-MM-DD]
import { readFileSync, writeFileSync } from 'node:fs';
const [, , file, day] = process.argv;
if (!file) { console.error('raw.json 경로를 주세요'); process.exit(1); }
const raw = JSON.parse(readFileSync(file, 'utf8'));
const list = [];
for (const [name, booths] of raw) {
  const nm = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 120); if (!nm) continue;
  // 한 회사가 부스 여러 개면 숫자 부스마다 한 줄씩 (호텔 스위트·"+ 4 more" 같은 건 건너뜀)
  const nos = [...new Set(String(booths || '').match(/\b\d{4,5}[a-zA-Z]?\b/g) || [])];
  for (const no of nos) list.push([nm, no]);
}
list.sort((a, b) => parseInt(a[1]) - parseInt(b[1]) || a[0].localeCompare(b[0]));
const out = { updated: day || new Date().toISOString().slice(0, 10), src: 'CES 2027 Exhibitor Directory (exhibitors.ces.tech)', list };
writeFileSync(new URL('../exhibitors.json', import.meta.url), JSON.stringify(out));
const by = {}; for (const [, no] of list) { const k = String(Math.floor(parseInt(no) / 1000)); by[k] = (by[k] || 0) + 1; }
console.log('회사', raw.length, '부스 줄', list.length, '천 단위 분포', by);
