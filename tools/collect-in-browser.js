// CES 공식 참가 기업 목록 받기 (사람이 보는 화면 그대로 읽어요)
// 1) 크롬에서 https://exhibitors.ces.tech/8_0/explore/exhibitor-gallery.cfm?featured=false 열기
// 2) 이 코드를 그 탭에서 실행 → 카드가 화면에 들어와야 부스 번호가 떠서 천천히 내리며 모아요(4,000곳 약 20분)
// 3) 끝나면 window._st.done === true. copy(JSON.stringify([...window._R])) 로 복사해 raw.json으로 저장
// 4) node tools/build-exhibitors.mjs raw.json → exhibitors.json 갱신 → 커밋하면 앱이 다음에 켤 때 바로 반영
window._R = window._R || new Map(); window._st = { i: 0, loads: 0, done: false, err: '' };
(async () => {
  try {
    const sl = ms => new Promise(r => setTimeout(r, ms)); let idle = 0;
    const grab = cs => { for (const c of cs) { const n = c.querySelector('span.normal')?.textContent.trim(); if (n && !window._R.has(n)) window._R.set(n, [...c.querySelectorAll('span.f6')].map(s => s.textContent.trim().replace(/,$/, '')).join(' | ')); } };
    for (let round = 0; round < 400; round++) {
      const cs = [...document.querySelectorAll('main ul:not(.exh-featured) li.js-Card')];
      for (; window._st.i < cs.length; window._st.i++) { const c = cs[window._st.i]; if (!c.querySelector('span.normal')) { c.scrollIntoView(); await sl(90); } }
      await sl(1500); grab(cs);
      for (const c of cs.filter(c => !c.querySelector('span.normal')).slice(0, 200)) { c.scrollIntoView(); await sl(60); }
      await sl(1200); grab(cs);
      const lm = [...document.querySelectorAll('a')].find(x => /Load More Results/.test(x.textContent) && x.offsetParent);
      if (!lm) break;
      const before = cs.length; lm.click(); window._st.loads++; let k = 0;
      while (document.querySelectorAll('main ul:not(.exh-featured) li.js-Card').length === before && k < 40) { await sl(500); k++; }
      if (k >= 40) { if (++idle > 3) { window._st.err = 'stalled'; break; } } else idle = 0;
    }
  } catch (e) { window._st.err = String(e); }
  window._st.done = true;
})();
