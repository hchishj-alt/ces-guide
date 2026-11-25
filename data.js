// CES 가이드 공용 데이터. 개인 기록은 여기 없고 폰 안(store.js)에만 있어요.
// 1) 전시장: 홀 크기(미터)와 부스. 지금 배치는 "예시"예요. 12월에 CES 공식 전개도가 나오면
//    named(이름 있는 부스)의 x·y·w·h를 실제 값으로 채우면 layout()이 그 값을 그대로 써요.
// 2) 연수 묶음(TRIPS): 같은 연수생이 같이 쓰는 날짜별 구역·고정 시간·시작 위시. 호텔·항공·연락처는 넣지 않아요.

export const SAMPLE = true; // 실제 도면으로 바꾸면 false

export const TAGS = {
  ai: 'AI', robot: '로봇', mobility: '모빌리티', smarthome: '스마트홈', iot: 'IoT', smartcity: '스마트시티',
  enterprise: '기업용', energy: '에너지', health: '헬스', wearable: '웨어러블', display: '디스플레이', xr: 'XR',
  food: '푸드', audio: '오디오', startup: '스타트업', fintech: '핀테크', showcase: '전시·무대'
};

export const VENUES = [
  { id: 'lvcc', name: 'LVCC', lat: 36.1318, lng: -115.1513 },
  { id: 'venetian', name: 'Venetian Expo', lat: 36.1219, lng: -115.1680 }
];

// size: xl 큰 부스, l, m, s. 번호는 O.T 자료의 참관 코스 표 기준(바뀔 수 있음)
const N = (no, name, tags, size = 'm') => ({ no: String(no), name, tags, size });
export const HALLS = [
  { id: 'central', name: 'LVCC Central Hall', short: 'Central', venue: 'lvcc', w: 300, h: 150, from: 14000, to: 21999, north: 0,
    named: [N(14704, 'CJ Global', ['food']), N(15004, 'LG Electronics', ['smarthome', 'ai', 'display'], 'xl'), N(15445, 'Hypervsn', ['display', 'xr'], 's'),
      N(15823, 'Shokz', ['wearable', 'audio']), N(15841, 'Showcase Hologram', ['display', 'xr'], 's'), N(16203, 'Bosch', ['iot', 'mobility', 'smarthome'], 'l'),
      N(16605, 'Panasonic', ['smarthome', 'energy'], 'l'), N(16623, 'Hisense', ['display', 'smarthome'], 'l'), N(16838, 'Tuya Global', ['iot', 'smarthome']),
      N(17704, 'TCL', ['display'], 'l'), N(17726, 'SK', ['ai', 'energy'], 'l'), N(18604, 'Samsung Electronics', ['ai', 'smarthome', 'display'], 'xl'),
      N(18734, 'OpenWorkspace', ['enterprise'], 's'), N(20800, 'Sony Honda Mobility', ['mobility', 'ai'], 'l')] },
  { id: 'north', name: 'LVCC North Hall', short: 'North', venue: 'lvcc', w: 240, h: 140, from: 8000, to: 10999, north: 0,
    named: [N(8353, 'Deepmind Platform', ['ai']), N(8529, 'Hitachi', ['ai', 'enterprise'], 'l'), N(8545, 'Enchanted Tools', ['robot', 'ai']),
      N(8563, 'Woongjin', ['enterprise']), N(8725, 'Siemens', ['ai', 'enterprise', 'smartcity'], 'xl'), N(8871, 'K-Humanoid Alliance', ['robot', 'ai'], 'l'),
      N(9013, 'Incheon Free Economic Zone (IFEZ)', ['smartcity']), N(9251, 'Sharpa', ['robot'], 's'), N(9615, 'Segway-Ninebot', ['mobility', 'robot'], 'l'),
      N(9843, 'KEPCO', ['energy', 'smartcity'], 'l'), N(10321, 'AC Future', ['mobility', 'smarthome'])] },
  { id: 'south', name: 'LVCC South Hall 1·2', short: 'South', venue: 'lvcc', w: 260, h: 140, from: 30000, to: 36999, north: 0, named: [] },
  { id: 'venA', name: 'Venetian Expo 2층 Hall A–D', short: 'Hall A–D', venue: 'venetian', w: 280, h: 150, from: 50000, to: 58999, north: 0,
    named: [N(50043, 'Innovation Awards Showcase', ['showcase'], 'l'), N(51239, 'Swisstech Pavilion', ['startup']), N(51455, 'WYBOTIC', ['robot'], 's'),
      N(51762, 'SmartWings Home', ['smarthome'], 's'), N(51923, 'TP-Link Systems', ['iot', 'smarthome']), N(52632, 'Roborock', ['robot', 'smarthome']),
      N(52655, 'SwitchBot', ['smarthome', 'iot']), N(54123, 'AgeTech Collaborative from AARP', ['health']), N(54199, 'ORPHE', ['wearable', 'health'], 's'),
      N(56142, 'Chamelo', ['wearable'], 's'), N('Hall D', 'SK hynix', ['ai'], 'l')] },
  { id: 'eureka', name: 'Venetian Expo 1층 Hall G (Eureka Park)', short: 'Eureka Park', venue: 'venetian', w: 210, h: 140, from: 60000, to: 63999, north: 0,
    named: [N(60301, 'LG NOVA', ['startup', 'ai']), N(60509, "Canon Business Innovation Group", ['startup']), N(60859, 'Startup Stage', ['showcase', 'startup'], 'l'),
      N(61053, 'Remarkable', ['startup'], 's'), N(61311, 'Hyundai Motor and Kia ZER01NE·CRADLE', ['mobility', 'startup'], 'l'), N(61453, 'POSTECH', ['startup'], 's'),
      N(61511, 'Samsung C-Lab', ['startup', 'ai'], 'l'), N(62817, 'KISED (창업진흥원)', ['startup']), N(62919, 'XbotPark', ['robot', 'startup']),
      N(62949, 'IBK 기업은행', ['fintech', 'startup'], 's'), N(63200, 'HongKong Tech', ['startup'])] }
];

// 부스 정보: [한국어 이름, 볼 수 있는 것(상세 분야), 미리 보기]
// 미리 보기는 지난 CES(2025·2026) 전시를 바탕으로 한 "예상"이에요. CES 2027 공식 발표가 나오면 pre를 바꾸고 src에 출처 주소(https)를 적어요.
const INFO = {
  14704: ['CJ', '푸드테크 · K-푸드 · 바이오', '식품·바이오 기술과 K-푸드를 체험하는 부스로 예상돼요.'],
  15004: ['LG전자', '가전 · TV · AI 홈 · 차량 경험', '대형 OLED 조형물, AI로 연결된 집과 가전, 차 안 경험을 보여 주던 부스예요.'],
  15445: ['하이퍼비전', '홀로그램 디스플레이', '공중에 떠 보이는 3D 홀로그램 광고 화면을 만드는 회사예요.'],
  15823: ['샥즈', '골전도 · 오픈형 이어폰', '귀를 막지 않는 운동용 이어폰 신제품을 들어 볼 수 있어요.'],
  15841: ['쇼케이스 홀로그램', '홀로그램 · 전시 장치', '홀로그램 전시 장치를 보여 주는 작은 부스예요.'],
  16203: ['보쉬', '센서 · 스마트홈 · 모빌리티', '센서와 AI로 집·차를 똑똑하게 만드는 기술을 보여 주던 부스예요.'],
  16605: ['파나소닉', '가전 · 에너지 · 배터리', '에너지 절약·지속가능 기술과 가전을 함께 보여 주던 부스예요.'],
  16623: ['하이센스', 'TV · 레이저 TV · 스마트 가전', '초대형 TV와 레이저 TV, 스마트 가전이 중심이에요.'],
  16838: ['투야', 'IoT 플랫폼 · 스마트홈', '여러 브랜드 기기를 한 앱으로 잇는 IoT 플랫폼 회사예요.'],
  17704: ['TCL', 'TV · 디스플레이 · 모바일', '미니 LED TV와 새 디스플레이 기술이 중심이에요.'],
  17726: ['SK', 'AI · 반도체 · 에너지', 'SK 계열사가 함께 AI·에너지 기술을 보여 주는 그룹관이에요.'],
  18604: ['삼성전자', 'AI 가전 · TV · 스마트싱스', '가전·TV를 하나로 잇는 AI 홈 경험과 신제품이 중심이에요.'],
  18734: ['오픈워크스페이스', '기업용 · 업무 공간', '기업용 업무 공간 솔루션 부스예요.'],
  20800: ['소니 혼다 모빌리티', '전기차 · 차 안 엔터테인먼트', '전기차 AFEELA와 차 안 엔터테인먼트를 보여 주던 부스예요.'],
  8353: ['딥마인드 플랫폼', 'AI 플랫폼', 'AI 플랫폼 기업 부스예요.'],
  8529: ['히타치', '산업 AI · 인프라', '공장·철도 같은 사회 인프라에 쓰는 AI와 디지털 기술이에요.'],
  8545: ['인챈티드 툴스', '서비스 로봇 · 휴머노이드', '병원·매장에서 일하는 귀여운 서비스 로봇을 만드는 프랑스 회사예요.'],
  8563: ['웅진', '기업용 IT', 'IT 서비스·솔루션 부스예요.'],
  8725: ['지멘스', '산업 AI · 디지털 트윈 · 스마트시티', '공장과 도시를 가상으로 돌려 보는 디지털 트윈과 산업 AI가 중심이에요.'],
  8871: ['K-휴머노이드 연합', '휴머노이드 로봇', '한국 휴머노이드 로봇 기업·기관이 모인 공동관이에요.'],
  9013: ['인천경제자유구역', '스마트시티 · 투자', '송도 같은 스마트시티와 입주 기업을 소개해요.'],
  9251: ['샤르파', '로봇 손', '사람 손처럼 섬세하게 움직이는 로봇 손을 만드는 회사예요.'],
  9615: ['세그웨이-나인봇', '퍼스널 모빌리티 · 로봇', '전동 킥보드·바이크와 잔디 깎기 로봇 같은 제품이에요.'],
  9843: ['한국전력', '에너지 · 전력망 · 스마트시티', '전력망·에너지 신기술과 함께 나온 스타트업을 볼 수 있어요.'],
  10321: ['AC 퓨처', '이동형 주택 · 모빌리티', '집처럼 쓰는 스마트 트레일러를 만드는 회사예요.'],
  50043: ['혁신상 쇼케이스', '혁신상 받은 제품 모음', '그해 CES 혁신상 받은 제품을 한곳에서 볼 수 있어요. 짧게 훑기 좋아요.'],
  51239: ['스위스테크관', '스위스 스타트업', '스위스 스타트업 공동관이에요.'],
  51455: ['와이보틱', '수영장 청소 로봇', '수영장을 혼자 청소하는 로봇이에요.'],
  51762: ['스마트윙스 홈', '스마트 블라인드', '전동·스마트 블라인드 회사예요.'],
  51923: ['TP-링크', '와이파이 · 스마트홈 · 홈캠', '공유기·메시 와이파이와 홈캠 같은 제품이에요.'],
  52632: ['로보락', '로봇청소기 · 가전', '로봇청소기 신제품이 중심이에요.'],
  52655: ['스위치봇', '스마트홈 자동화 · 홈 로봇', '스위치를 눌러 주는 작은 로봇부터 홈 로봇까지 있어요.'],
  54123: ['AARP 에이지테크', '시니어 헬스 · 돌봄 기술', '나이 든 사람을 돕는 헬스·돌봄 스타트업 공동관이에요.'],
  54199: ['오르페', '스마트 신발 · 걸음 분석', '신발에 넣어 걸음을 재는 센서를 만드는 일본 회사예요.'],
  56142: ['카멜로', '스마트 안경', '버튼으로 렌즈 색이 바뀌는 스마트 선글라스예요.'],
  'Hall D': ['SK하이닉스', 'AI 반도체 · 메모리', 'AI에 쓰는 고성능 메모리(HBM)가 중심이에요.'],
  60301: ['LG 노바', 'LG 스타트업 투자 · AI', 'LG가 투자·육성하는 스타트업을 모은 부스예요.'],
  60509: ['캐논 비즈니스 이노베이션 그룹', '사내 신사업', '캐논의 새 사업 아이디어를 보여 주는 부스예요.'],
  60859: ['스타트업 스테이지', '스타트업 발표 무대', '스타트업이 짧게 발표하는 무대예요. 시간표를 보고 가면 좋아요.'],
  61053: ['리마커블', '스타트업', '유레카 파크 스타트업 부스예요.'],
  61311: ['현대차·기아 제로원·크래들', '모빌리티 스타트업', '현대차그룹이 키우는 스타트업을 볼 수 있어요.'],
  61453: ['포스텍', '대학 스타트업', '포항공대 학생·연구실 창업팀이에요.'],
  61511: ['삼성 C랩', '스타트업 · AI', '삼성이 키운 스타트업이 모인 부스예요.'],
  62817: ['창업진흥원', '한국 스타트업 공동관', '한국 스타트업이 모인 공동관이에요.'],
  62919: ['엑스봇파크', '로봇 스타트업 육성', '로봇 창업을 키우는 기관 출신 팀들이에요.'],
  62949: ['IBK기업은행', '핀테크 · 스타트업 육성', 'IBK가 키우는 스타트업(IBK창공)이 나와요.'],
  63200: ['홍콩 테크', '홍콩 스타트업', '홍콩 스타트업 공동관이에요.']
};
for (const h of HALLS) for (const b of h.named) {
  const i = INFO[b.no]; b.en = b.name;
  if (i) { const ko = i[0].trim(); b.ko = ko; b.name = ko === b.en ? b.en : `${ko} ${b.en}`; b.cat = i[1]; b.pre = i[2]; }
}
// 한국어 이름 / 영어 이름 (화면용)
export const koName = b => b?.ko || b?.name || '';
export const enName = b => (b?.ko && b.en && b.en !== b.ko ? b.en : '');
// 최신 소식 찾기(구글 검색 링크, https만)
export const newsUrl = b => 'https://www.google.com/search?q=' + encodeURIComponent(`${b.en || b.name} CES 2027`);

const SIZE = { xl: [40, 26], l: [26, 26], m: [14, 12], s: [9, 12] };
const AISLE = 6, MARGIN = 10, CROSS = 64;

// 예시 배치 만들기: 번호 순서대로 줄을 채우고, 사이사이 작은 부스(번호만)를 끼워요. 같은 입력이면 늘 같은 배치.
// ---- CES 공식 참가 기업 목록(exhibitors.json) ----
// 앱이 켜질 때 받아서 홀마다 붙여요. 목록이 바뀌면 exhibitors.json만 바꿔 올리면 다음에 켤 때 바로 반영돼요.
export const DIR = { updated: '', count: 0, src: '' };
const KW = [['ai', /\b(ai|artificial intelligence|machine learning|llm|agent|genai)\b/i], ['robot', /robot|humanoid|drone/i], ['mobility', /vehicle|automotive|mobility|\bev\b|car |scooter|e-bike|autonomous/i],
  ['smarthome', /smart home|home appliance|appliance|vacuum|kitchen/i], ['iot', /\biot\b|sensor|connected device|matter\b/i], ['smartcity', /smart city|cities|infrastructure/i],
  ['enterprise', /enterprise|b2b|saas|business solution/i], ['energy', /energy|battery|solar|power bank|charging/i], ['health', /health|medical|wellness|care\b|clinic|sleep/i],
  ['wearable', /wearable|ring|watch|glasses/i], ['display', /display|oled|led|monitor|\btv\b|projector/i], ['xr', /\bxr\b|\bvr\b|\bar\b|virtual reality|augmented|metaverse/i],
  ['food', /food|beverage|cook/i], ['audio', /audio|speaker|headphone|earbud|sound/i], ['fintech', /fintech|payment|finance|bank/i]];
export const guessTags = t => KW.filter(([, r]) => r.test(t || '')).map(([k]) => k).slice(0, 3);
export function applyDirectory(j) {
  if (!j || !Array.isArray(j.list)) return false;
  for (const h of HALLS) { h.dir = []; h._booths = null; }
  for (const row of j.list) {
    const [name, booth, desc] = row; const no = parseInt(String(booth).replace(/\D/g, ''), 10); if (!name || !no) continue;
    const h = HALLS.find(x => no >= x.from && no <= x.to); if (!h) continue;
    const nm = String(name).slice(0, 120); const same = h.dir.find(d => d.no === String(no));
    if (same) { (same.with ||= []).push(nm); same.tags = [...new Set([...same.tags, ...guessTags(nm)])].slice(0, 3); continue; } // 같은 부스를 쓰는 공동관
    h.dir.push({ no: String(no), name: nm, en: nm, desc: String(desc || '').slice(0, 300), tags: guessTags(nm + ' ' + (desc || '')), size: 's', dir: true });
  }
  for (const h of HALLS) for (const d of h.dir) if (d.with?.length > 2) d.size = d.with.length > 8 ? 'l' : 'm'; // 공동관은 크게
  Object.assign(DIR, { updated: String(j.updated || ''), count: HALLS.reduce((a, h) => a + h.dir.length, 0), src: String(j.src || '') });
  return true;
}
export async function loadDirectory() {
  try { const r = await fetch('./exhibitors.json', { cache: 'no-cache' }); if (r.ok) return applyDirectory(await r.json()); } catch { }
  return false;
}

// 공식 목록이 있을 때: 부스 번호 앞자리(통로)를 세로줄로, 뒤 두 자리를 위아래 순서로 놓아요.
// 실제 도면 좌표가 아니라 "번호 순서대로 늘어놓은 지도"라서, 번호가 가까우면 실제로도 가까운 편이에요.
function layoutDir(hall) {
  const byNo = new Map();
  for (const d of hall.dir) byNo.set(d.no, { ...d });
  for (const n of hall.named) { const d = byNo.get(n.no); byNo.set(n.no, d ? { ...d, ...n, desc: d.desc, with: d.en && d.en !== n.en ? [d.en, ...(d.with || [])] : d.with, tags: n.tags?.length ? n.tags : d.tags, dir: true } : { ...n }); }
  const items = [...byNo.values()].sort((a, b) => (parseInt(a.no) || 9e9) - (parseInt(b.no) || 9e9));
  const aisles = [...new Set(items.map(b => Math.floor((parseInt(b.no) || hall.to) / 100)))];
  const W = hall.w - MARGIN * 2, H = hall.h - MARGIN * 2 - 6;
  const ncol = Math.max(1, Math.min(aisles.length, Math.floor(W / (12 + AISLE))));
  const pitch = W / ncol, cw = pitch - AISLE;
  const cols = Array.from({ length: ncol }, () => []);
  items.forEach(b => { const a = aisles.indexOf(Math.floor((parseInt(b.no) || hall.to) / 100)); cols[Math.min(ncol - 1, Math.floor(a * ncol / aisles.length))].push(b); });
  const BAND = 6, every = 46; const bands = []; for (let y = every; y < H - 10; y += every) bands.push(y); // 가로 통로
  const usable = H - bands.length * BAND;
  const WEIGHT = { xl: 4, l: 2.6, m: 1.4, s: 1 };
  const out = [];
  cols.forEach((col, ci) => {
    if (!col.length) return;
    const x0 = MARGIN + ci * pitch;
    const sub = Math.max(1, Math.ceil(col.length * 5 / usable)); // 너무 많으면 두세 줄로
    const per = Math.ceil(col.length / sub), sw = (cw - (sub - 1)) / sub;
    for (let s = 0; s < sub; s++) {
      const part = col.slice(s * per, (s + 1) * per); if (!part.length) continue;
      const tw = part.reduce((a, b) => a + (WEIGHT[b.size] || 1), 0);
      let yy = 0;
      for (const b of part) {
        const hh = Math.max(3, usable * (WEIGHT[b.size] || 1) / tw - 1);
        const shift = bands.filter((bd, k) => yy + hh / 2 >= bd - BAND * k).length * BAND; // 가로 통로만큼 아래로
        out.push({ ...b, x: x0 + s * (sw + 1), y: MARGIN + yy + shift, w: sw, h: hh });
        yy += hh + 1;
      }
    }
  });
  out.forEach(b => { b.id = hall.id + ':' + b.no; b.hall = hall.id; });
  hall._booths = out; return out;
}

export function layout(hall) {
  if (hall._booths) return hall._booths;
  if (hall.dir?.length) return layoutDir(hall);
  const named = [...hall.named].sort((a, b) => (parseInt(a.no) || 9e9) - (parseInt(b.no) || 9e9));
  const out = []; const rowH = 26; let y = MARGIN, ni = 0, fillNo = 0;
  const rows = Math.floor((hall.h - MARGIN * 2 - 14) / (rowH + AISLE));
  const perRowNamed = Math.ceil(named.length / Math.max(1, rows));
  for (let r = 0; r < rows; r++, y += rowH + AISLE) {
    let x = MARGIN, placed = 0, gap = 0; const seq = [];
    while (true) {
      const wantNamed = ni < named.length && placed < perRowNamed && gap >= 2;
      const item = wantNamed ? named[ni] : null;
      const [w] = item ? SIZE[item.size] : [9];
      const nextCross = Math.ceil((x + 1) / CROSS) * CROSS;
      if (x + w > nextCross - AISLE / 2 && x < nextCross) { x = nextCross + AISLE / 2; continue; }
      if (x + w > hall.w - MARGIN) break;
      if (item) {
        const [bw, bh] = SIZE[item.size];
        if (bh >= rowH) seq.push({ ...item, x, y, w: bw, h: rowH }); else seq.push({ ...item, x, y, w: bw, h: bh }, null);
        if (bh < rowH) seq.pop();
        if (bh < rowH) { seq.push({ no: '', name: '', tags: [], size: 's', x, y: y + bh + 2, w: bw, h: rowH - bh - 2, filler: true }); }
        ni++; placed++; gap = 0; x += bw + 2;
      } else {
        seq.push({ no: '', name: '', tags: [], size: 's', x, y, w: 9, h: 12, filler: true }, { no: '', name: '', tags: [], size: 's', x, y: y + 14, w: 9, h: 12, filler: true });
        gap++; x += 11;
      }
    }
    out.push(...seq);
  }
  // 남은 이름 부스(줄이 모자랄 때)는 마지막 줄 끝 필러 자리에 끼움
  while (ni < named.length) { const f = out.findLast(b => b.filler); if (!f) break; Object.assign(f, named[ni++], { filler: false, w: 9, h: 12 }); }
  // 번호 없는 칸에 앞뒤 번호 사이 값을 붙여요 (진짜 번호 아님 → 화면에선 흐리게)
  let prev = hall.from;
  out.forEach((b, i) => {
    if (!b.filler) { prev = parseInt(b.no) || prev; return; }
    const nextNamed = out.slice(i).find(x => !x.filler && parseInt(x.no));
    const next = nextNamed ? parseInt(nextNamed.no) : hall.to;
    prev = Math.min(next - 1, prev + Math.max(1, Math.round((next - prev) / 12)));
    b.no = String(prev); b.guess = true; fillNo++;
  });
  out.forEach((b, i) => { b.id = hall.id + ':' + (b.guess ? 'f' + i : b.no); b.hall = hall.id; });
  hall._booths = out;
  return out;
}

// 편의시설: 벽 쪽 통로 위 점(미터). 출구는 아래쪽 벽.
export function amenities(hall) {
  if (hall._amen) return hall._amen;
  const { w, h } = hall, by = h - 5, mx = 5;
  hall._amen = [
    { type: 'exit', x: w * 0.18, y: by, name: '입구·출구 1' }, { type: 'exit', x: w * 0.5, y: by, name: '입구·출구 2' }, { type: 'exit', x: w * 0.82, y: by, name: '입구·출구 3' },
    { type: 'wc', x: mx, y: h * 0.35, name: '화장실 서쪽' }, { type: 'wc', x: w - mx, y: h * 0.55, name: '화장실 동쪽' }, { type: 'wc', x: w * 0.34, y: by, name: '화장실 남쪽' },
    { type: 'water', x: mx, y: h * 0.42, name: '급수대 서쪽' }, { type: 'water', x: w - mx, y: h * 0.62, name: '급수대 동쪽' }, { type: 'water', x: w * 0.66, y: by, name: '급수대 남쪽' },
    { type: 'food', x: w * 0.08, y: by, name: '푸드 코트 서쪽' }, { type: 'food', x: w * 0.92, y: by, name: '푸드 코트 동쪽' },
    { type: 'bat', x: w * 0.42, y: MARGIN - 4, name: '충전 스테이션' }, { type: 'bat', x: w * 0.75, y: by, name: '충전 스테이션 남쪽' },
    { type: 'rest', x: w * 0.58, y: MARGIN - 4, name: '쉼터' }
  ];
  return hall._amen;
}
export const AMEN = { water: '물', wc: '화장실', food: '음식', bat: '충전', exit: '출구', rest: '쉼터' };

export const hallById = id => HALLS.find(h => h.id === id);
export function boothByNo(no) {
  for (const h of HALLS) { const b = layout(h).find(x => x.no === String(no) && !x.guess); if (b) return b; }
  return null;
}
export const boothById = id => { const h = hallById(String(id).split(':')[0]); return h ? layout(h).find(b => b.id === id) || null : null; };
export const allNamed = () => HALLS.flatMap(h => layout(h).filter(b => !b.filler));

// 연수 묶음. 시각은 라스베이거스 현지 시각.
export const TRIPS = [
  { id: 'ku-gsf3', name: '건국대 KU 글로벌 스타트업 프런티어 (CES 2027)',
    days: [
      { date: '2027-01-06', zones: [['central', '오전'], ['north', '오후']], fixed: [['09:00', '배지 받고 입장'], ['12:00', '점심 (각자)'], ['18:00', '석식 (단체)'], ['19:00', '호텔로 이동']] },
      { date: '2027-01-07', zones: [['venA', '오전'], ['eureka', '오후']], fixed: [['09:00', '참관 시작'], ['12:00', '점심 (각자)'], ['18:00', '석식 (단체)'], ['19:00', '야경 투어']] },
      { date: '2027-01-08', zones: [['eureka', '오전'], ['venA', '오전'], ['central', '오후'], ['south', '오후']], fixed: [['09:00', '참관 시작'], ['12:00', '점심 (각자)'], ['18:00', '전체 간담회']] },
      { date: '2027-01-09', zones: [], fixed: [['09:00', '못 본 곳 자유 참관'], ['12:00', '점심'], ['13:00', 'LA로 출발']] }
    ],
    // O.T 참관 코스 표의 부스: 처음 위시로 넣어 줄 후보
    wishes: [14704, 15004, 15445, 15841, 18734, 20800, 8545, 8529, 8725, 8353, 8563, 8871, 9251, 9843, 10321, 9615, 9013, 50043, 51239, 51923, 51455, 51762, 52655, 54199, 56142,
      60509, 61311, 61511, 62949, 62919, 63200, 62817, 61453, 61053, 60301, 60859, 52632, 54123, 'Hall D', 15823, 16203, 16838] }
];
export const tripById = id => TRIPS.find(t => t.id === id) || null;
