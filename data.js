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

const SIZE = { xl: [40, 26], l: [26, 26], m: [14, 12], s: [9, 12] };
const AISLE = 6, MARGIN = 10, CROSS = 64;

// 예시 배치 만들기: 번호 순서대로 줄을 채우고, 사이사이 작은 부스(번호만)를 끼워요. 같은 입력이면 늘 같은 배치.
export function layout(hall) {
  if (hall._booths) return hall._booths;
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
