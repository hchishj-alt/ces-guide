// 번역 위젯 + 질문 추천
// - 받아 적기: 브라우저 음성 인식(사파리·크롬). 번역: Google Gemini 무료 키(하진이 넣은 키, 이 폰에만 저장)
// - 질문 카드(아래 QS)는 앱 안에 들어 있어서 인터넷 없이도 뜨고, 영어로 읽어 줌
import * as store from './store.js';
import { esc, icon, sheet, toast } from './ui.js';

export const KEY = 'secret:gemini';
const QS = {
  _: [['Could you give me a quick demo?', '짧게 시연해 주실 수 있나요?'], ['Is this available in Korea?', '한국에서도 살 수 있나요?'], ['When will it launch?', '언제 나와요?'], ['Who are your main customers?', '주요 고객이 누구예요?'], ['Can I take a photo?', '사진 찍어도 될까요?'], ['Do you have a brochure or a QR link?', '안내서나 QR 링크 있나요?']],
  ai: [['Does it run on the device or in the cloud?', '기기 안에서 돌아요, 클라우드에서 돌아요?'], ['How do you protect user data?', '사용자 데이터는 어떻게 지켜요?'], ['What makes your AI different?', '다른 AI와 뭐가 달라요?']],
  robot: [['How long does the battery last?', '배터리는 얼마나 가요?'], ['Is it already working somewhere?', '이미 쓰이는 곳이 있나요?'], ['How much does it cost?', '가격이 얼마예요?']],
  mobility: [['What level of self-driving is this?', '자율주행 몇 단계예요?'], ['Which cities are you testing in?', '어느 도시에서 시험 중이에요?'], ['When can people ride it?', '사람들은 언제 탈 수 있어요?']],
  smarthome: [['Does it work with Matter?', 'Matter랑 연결돼요?'], ['Which app controls it?', '어떤 앱으로 조작해요?'], ['Does it work without internet?', '인터넷 없이도 돼요?']],
  iot: [['Does it work with Matter?', 'Matter랑 연결돼요?'], ['How long does the battery last?', '배터리는 얼마나 가요?']],
  health: [['Is it approved by the FDA?', 'FDA 승인 받았나요?'], ['What exactly does it measure?', '정확히 뭘 재요?'], ['How accurate is it?', '얼마나 정확해요?']],
  wearable: [['How long can I wear it in a day?', '하루에 얼마나 차고 있을 수 있어요?'], ['What does it measure?', '뭘 재요?']],
  energy: [['How much energy does it save?', '에너지를 얼마나 아껴요?'], ['Where is it installed now?', '지금 어디에 설치돼 있어요?']],
  smartcity: [['Which cities use this now?', '지금 어느 도시가 써요?'], ['Who pays for it, the city or citizens?', '돈은 도시가 내요, 시민이 내요?']],
  display: [['What is the resolution and brightness?', '해상도랑 밝기가 어떻게 돼요?'], ['Where will people see this?', '사람들은 어디서 보게 돼요?']],
  xr: [['How heavy is the headset?', '기기가 얼마나 무거워요?'], ['What apps can I use?', '어떤 앱을 쓸 수 있어요?']],
  startup: [['What stage is your company at?', '회사가 어느 단계예요?'], ['Are you looking for partners in Korea?', '한국 파트너를 찾고 있나요?'], ['Can I connect with you on LinkedIn?', '링크드인으로 연결해도 될까요?']],
  me: [["Hi, I'm a university student from Korea visiting CES with my school program.", '안녕하세요, 학교 프로그램으로 CES에 온 한국 대학생이에요.'], ['Sorry, could you say that more slowly?', '죄송한데 조금 천천히 말해 주실래요?'], ['Thank you, this was really interesting!', '고마워요, 정말 흥미로웠어요!']]
};
export function questionsFor(tags = []) { const out = []; for (const t of tags) for (const q of QS[t] || []) if (!out.some(o => o[0] === q[0])) out.push(q); for (const q of QS._) if (out.length < 6 && !out.some(o => o[0] === q[0])) out.push(q); return out.slice(0, 6); }

export function speak(text, lang = 'en-US') { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = lang === 'en-US' ? .92 : 1; speechSynthesis.speak(u); } catch { } }

const GAPI = 'https://generativelanguage.googleapis.com/v1beta/models/';
const MODELS = ['gemini-flash-lite-latest', 'gemini-flash-latest'];
export async function translate(text, to) {
  const key = await store.get(KEY, ''); if (!key) throw Object.assign(new Error('nokey'), { fix: true });
  if (!navigator.onLine) throw new Error('offline');
  const prompt = to === 'ko' ? `Translate this English (spoken at a tech trade show booth) into natural, short Korean. Reply with the Korean only.\n\n${text}` : `Translate this Korean into simple, polite spoken English for talking to staff at a tech trade show booth. Reply with the English only.\n\n${text}`;
  let last;
  for (const m of MODELS) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 12000);
    try {
      const r = await fetch(GAPI + m + ':generateContent', { method: 'POST', signal: c.signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: .2 } }) });
      if (r.status === 400 || r.status === 401 || r.status === 403) throw Object.assign(new Error('badkey'), { fix: true });
      if (!r.ok) { last = new Error('busy'); continue; }
      const j = await r.json(); return (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    } catch (e) { if (e.fix) throw e; last = e; } finally { clearTimeout(t); }
  }
  throw last || new Error('busy');
}

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = !!SR;
const NOSR = 'ces:nosr'; // 받아 적기가 막혔던 기기(아이폰 홈 화면 앱 등)는 기억해 두고 바로 녹음으로
const srBlocked = () => { try { return +localStorage.getItem(NOSR) > Date.now(); } catch { return false; } };
const blockSr = () => { try { localStorage.setItem(NOSR, String(Date.now() + 7 * 864e5)); } catch { } };

// 결과 이어 붙이기. 안드로이드 크롬은 중간 결과가 앞 글자를 다시 담아 와서 그대로 붙이면 "이거 이거 한국" 처럼 겹침
export function joinResults(list) {
  const out = [];
  for (const raw of list) {
    const t = (raw || '').trim(); if (!t) continue;
    const last = out[out.length - 1];
    if (last != null && (t.startsWith(last) || last.startsWith(t))) out[out.length - 1] = t.length >= last.length ? t : last;
    else out.push(t);
  }
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

// 받아 적기 한 번(말이 끝나면 끝남). onPart(중간 글자), 끝나면 최종 글자 돌려줌
export function listen(lang, onPart) {
  return new Promise((res, rej) => {
    if (!SR) return rej(new Error('nosr'));
    const r = new SR(); r.lang = lang; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1; let fin = '', done = false, err = null;
    r.onresult = e => { const t = joinResults(Array.from(e.results, x => x[0]?.transcript)); fin = t; onPart?.(t); };
    r.onerror = e => { err = new Error(e.error || 'sr'); };
    r.onend = () => { if (done) return; done = true; listen.stop = null; if (err && !fin) rej(err); else res(fin.trim()); };
    try { r.start(); } catch (e) { done = true; return rej(e); }
    listen.stop = () => { try { r.stop(); } catch { } };
  });
}

// 녹음 → Gemini가 받아 적고 번역(받아 적기가 안 되는 폰용). 키가 있어야 함
const recMime = () => ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/aac'].find(m => window.MediaRecorder?.isTypeSupported?.(m)) || '';
export const canRecord = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
export function record(maxMs = 30000) {
  let stopFn; const p = (async () => {
    const st = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = recMime(); const mr = new MediaRecorder(st, mime ? { mimeType: mime } : undefined); const parts = [];
    mr.ondataavailable = e => e.data.size && parts.push(e.data);
    const end = new Promise(r => mr.onstop = r); mr.start();
    const t = setTimeout(() => stopFn(), maxMs);
    stopFn = () => { clearTimeout(t); if (mr.state !== 'inactive') mr.stop(); };
    await end; st.getTracks().forEach(x => x.stop());
    return new Blob(parts, { type: (mr.mimeType || mime || 'audio/webm').split(';')[0] });
  })();
  return { done: p, stop: () => stopFn?.() };
}
const b64 = blob => new Promise((r, j) => { const f = new FileReader(); f.onload = () => r(String(f.result).split(',')[1]); f.onerror = j; f.readAsDataURL(blob); });
export async function hear(blob, from) {
  const key = await store.get(KEY, ''); if (!key) throw Object.assign(new Error('nokey'), { fix: true });
  if (!navigator.onLine) throw new Error('offline');
  if (blob.size < 1500) throw new Error('empty');
  if (blob.size > 15e6) throw new Error('big');
  const ask = from === 'en' ? 'The audio is English spoken at a tech trade show booth. Write exactly what was said, then translate it into natural short Korean.' : 'The audio is Korean. Write exactly what was said, then translate it into simple, polite spoken English for talking to booth staff.';
  const body = { contents: [{ parts: [{ text: ask + ' Reply as JSON {"src":"...","dst":"..."} only. If nothing was said, reply {"src":"","dst":""}.' }, { inline_data: { mime_type: blob.type || 'audio/webm', data: await b64(blob) } }] }], generationConfig: { temperature: .1, responseMimeType: 'application/json' } };
  let last;
  for (const m of MODELS) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 25000);
    try {
      const r = await fetch(GAPI + m + ':generateContent', { method: 'POST', signal: c.signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) });
      if (r.status === 401 || r.status === 403) throw Object.assign(new Error('badkey'), { fix: true });
      if (!r.ok) { last = new Error('busy'); continue; }
      const j = await r.json(); const txt = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
      const o = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
      return { src: String(o.src || '').trim().slice(0, 2000), dst: String(o.dst || '').trim().slice(0, 2000) };
    } catch (e) { if (e.fix) throw e; last = e; } finally { clearTimeout(t); }
  }
  throw last || new Error('busy');
}

const HANGUL = /[가-힣]/;
// 위젯: booth가 있으면 그 부스 분야에 맞는 질문 추천 + 대화를 그 부스 기록으로 저장
export function openTalk({ booth = null, onSave } = {}) {
  const qs = questionsFor([...(booth?.tags || []), 'me']);
  const sh = sheet(`<h2 class="sh-t">${icon('talk')} 번역${booth ? ` <small>${esc(booth.name || booth.no)}</small>` : ''}</h2>
    <div class="tk-log" id="tkLog"><p class="mute">버튼을 누르고 말하거나, 아래 칸에 글로 쳐도 번역돼요.</p></div>
    <p class="tk-why" id="tkWhy" hidden></p>
    <div class="tk-btns"><button class="btn big" id="tkThem">${icon('mic')}<span class="lb">상대 말 듣기</span><small>영어 → 한국어</small></button><button class="btn big alt" id="tkMe">${icon('mic')}<span class="lb">내가 말하기</span><small>한국어 → 영어</small></button></div>
    <form class="tk-type" id="tkType" autocomplete="off"><input id="tkIn" maxlength="400" placeholder="글로 쳐서 번역 (한글↔영어 자동)" enterkeyhint="send"><button class="btn" id="tkGo" type="submit">번역</button></form>
    <h3 class="sh-h">질문 추천${booth?.tags?.length ? '' : ' · 기본'}</h3>
    <div class="qq">${qs.map(([en, ko], i) => `<button data-q="${i}"><b>${esc(en)}</b><span>${esc(ko)}</span></button>`).join('')}</div>`, { tall: true, onClose: () => { stopAll(); hideBig(); try { speechSynthesis.cancel(); } catch { } } });
  const log = sh.querySelector('#tkLog'), why = sh.querySelector('#tkWhy'); const convo = [];
  // 큰 영어 화면은 시트 밖(body)에 붙여야 스크롤·끌기에 안 밀리고 겹치지 않음
  const big = document.createElement('div'); big.className = 'big-en'; big.hidden = true; document.body.append(big);
  const hideBig = () => { big.hidden = true; big.remove(); };
  const showBig = en => {
    if (!big.isConnected) document.body.append(big);
    big.hidden = false; big.innerHTML = `<button class="big-x" aria-label="닫기">${icon('x')}</button><p>${esc(en)}</p><div class="big-act"><button class="btn" data-a="say">${icon('play')} 다시 읽기</button><button class="btn ghost" data-a="x">닫기</button></div>`;
    big.querySelector('.big-x').onclick = big.querySelector('[data-a=x]').onclick = () => { big.hidden = true; try { speechSynthesis.cancel(); } catch { } };
    big.querySelector('[data-a=say]').onclick = () => speak(en); speak(en);
  };
  sh.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const [en, ko] = qs[+b.dataset.q]; showBig(en); convo.push({ who: 'me', ko, en }); });

  let busy = null; // 지금 듣는 쪽('them'|'me')과 멈추는 함수
  const btn = { them: sh.querySelector('#tkThem'), me: sh.querySelector('#tkMe') };
  const setBtn = (who, txt) => { for (const k in btn) { btn[k].classList.toggle('on', k === who && !!txt); btn[k].querySelector('.lb').textContent = k === who && txt ? txt : (k === 'them' ? '상대 말 듣기' : '내가 말하기'); } };
  function stopAll() { busy?.stop?.(); }
  const say = (t, warn) => { why.hidden = !t; why.textContent = t || ''; why.classList.toggle('warn', !!warn); };
  const newRow = who => { const row = document.createElement('div'); row.className = 'tk-row tk-' + who; row.innerHTML = '<p class="src"></p><p class="dst"></p>'; log.querySelector('.mute')?.remove(); log.append(row); log.scrollTop = log.scrollHeight; return { row, src: row.children[0], dst: row.children[1] }; };
  const keyFix = dst => { dst.innerHTML = `번역하려면 AI 키가 필요해요. <button class="link">키 넣기</button>`; dst.querySelector('button').onclick = () => askKey(); };

  async function translateInto(who, text, dst) {
    dst.innerHTML = '<span class="wait"><i></i><i></i><i></i></span>';
    for (let tryN = 0; tryN < 3; tryN++) {
      try { const out = await translate(text, who === 'them' ? 'ko' : 'en'); dst.textContent = out; convo.push(who === 'them' ? { who, en: text, ko: out } : { who, ko: text, en: out }); if (who === 'me') showBig(out); log.scrollTop = log.scrollHeight; return; }
      catch (e) {
        if (e.fix) return keyFix(dst);
        if (e.message === 'offline') { dst.textContent = '인터넷이 없어서 원문만 적어 뒀어요. 질문 카드는 그대로 쓸 수 있어요'; convo.push({ who, [who === 'them' ? 'en' : 'ko']: text }); return; }
        await new Promise(r => setTimeout(r, 1200 * (tryN + 1)));
      }
    }
    dst.textContent = '지금은 번역이 늦어요. 원문은 저장돼요'; convo.push({ who, [who === 'them' ? 'en' : 'ko']: text });
  }

  // 받아 적기가 안 되는 폰: 녹음했다가 AI가 받아 적고 번역
  async function byRecording(who) {
    if (!canRecord()) { say('이 브라우저는 마이크를 못 써요. 아래 칸에 글로 쳐 주세요', true); sh.querySelector('#tkIn').focus(); return; }
    if (!(await store.get(KEY, ''))) { say('이 폰은 바로 받아 적기가 안 돼서, 녹음해서 AI로 받아 적어야 해요. AI 키를 넣거나 아래 칸에 글로 쳐 주세요', true); askKey(); return; }
    const { src, dst } = newRow(who); src.textContent = '녹음 중… 말 끝나면 버튼을 한 번 더 눌러요'; src.classList.add('live');
    let rec; try { rec = record(30000); } catch { src.textContent = '마이크를 켜지 못했어요'; return; }
    busy = { who, stop: () => rec.stop() }; setBtn(who, '끝났으면 누르기');
    let blob; try { blob = await rec.done; } catch (e) { busy = null; setBtn(); src.classList.remove('live'); src.textContent = /NotAllowed|Permission/.test(e.name || e.message) ? '마이크를 허용해 주세요 (설정 › 사파리 › 마이크)' : '마이크를 켜지 못했어요'; return; }
    busy = null; setBtn(); src.classList.remove('live'); src.textContent = '받아 적는 중…'; dst.innerHTML = '<span class="wait"><i></i><i></i><i></i></span>';
    try {
      const o = await hear(blob, who === 'them' ? 'en' : 'ko');
      if (!o.src) { src.textContent = '말소리가 안 들렸어요. 다시 눌러 주세요'; dst.textContent = ''; return; }
      src.textContent = o.src; dst.textContent = o.dst; convo.push(who === 'them' ? { who, en: o.src, ko: o.dst } : { who, ko: o.src, en: o.dst }); if (who === 'me' && o.dst) showBig(o.dst); log.scrollTop = log.scrollHeight;
    } catch (e) {
      if (e.fix) { src.textContent = '녹음은 됐는데 AI 키가 맞지 않아요'; return keyFix(dst); }
      src.textContent = e.message === 'offline' ? '인터넷이 없어서 받아 적지 못했어요' : e.message === 'empty' ? '너무 짧았어요. 다시 눌러 주세요' : '받아 적기가 늦어요. 다시 누르거나 글로 쳐 주세요'; dst.textContent = '';
    }
  }

  async function turn(who) {
    if (busy) { const was = busy.who; stopAll(); if (was === who) return; await new Promise(r => setTimeout(r, 250)); }
    say('');
    if (!canListen || srBlocked()) return byRecording(who);
    const { row, src, dst } = newRow(who); src.textContent = '듣는 중…'; src.classList.add('live');
    busy = { who, stop: () => listen.stop?.() }; setBtn(who, '듣는 중 · 누르면 멈춤');
    let text = '';
    try { text = await listen(who === 'them' ? 'en-US' : 'ko-KR', t => { src.textContent = t || '듣는 중…'; }); }
    catch (e) {
      busy = null; setBtn(); const m = e.message;
      if (m === 'service-not-allowed' || m === 'language-not-supported' || m === 'network' || m === 'nosr') { row.remove(); blockSr(); say('이 폰에선 바로 받아 적기가 막혀 있어서 녹음 방식으로 바꿀게요'); return byRecording(who); }
      src.classList.remove('live');
      src.textContent = m === 'not-allowed' ? '마이크를 허용해 주세요 (아이폰: 설정 › 사파리 › 마이크, 설정 › 개인정보 › 음성 인식)' : m === 'no-speech' ? '말소리가 안 들렸어요. 다시 눌러 주세요' : m === 'aborted' ? '멈췄어요' : '잘 못 들었어요. 다시 누르거나 글로 쳐 주세요';
      return;
    }
    busy = null; setBtn(); src.classList.remove('live');
    if (!text) { src.textContent = '말소리가 안 들렸어요. 다시 눌러 주세요'; return; }
    src.textContent = text; await translateInto(who, text, dst);
  }
  btn.them.onclick = () => turn('them');
  btn.me.onclick = () => turn('me');
  sh.querySelector('#tkType').onsubmit = async e => {
    e.preventDefault(); const inp = sh.querySelector('#tkIn'); const text = inp.value.trim().slice(0, 400); if (!text) return;
    inp.value = ''; inp.blur(); const who = HANGUL.test(text) ? 'me' : 'them'; const { src, dst } = newRow(who); src.textContent = text; await translateInto(who, text, dst);
  };
  const bg = sh.parentElement; const old = bg._close; bg._close = () => { old?.(); if (booth && convo.length && onSave) onSave(convo); };
}

export async function askKey() {
  const has = !!(await store.get(KEY, ''));
  const sh = sheet(`<h2 class="sh-t">번역 AI 키</h2><p class="mute">Google AI Studio에서 받은 무료 Gemini 키를 넣어 주세요. 이 폰에만 저장되고, 번역할 문장만 Google로 보내요.${has ? ' 지금 키가 들어 있어요.' : ''}</p>
    <input id="kIn" type="password" autocomplete="off" placeholder="키 붙여넣기" style="width:100%"><div class="row"><button class="btn" id="kOk">저장</button>${has ? '<button class="btn ghost" id="kDel">키 지우기</button>' : ''}</div>
    <p class="mute small"><a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> 에서 무료로 만들 수 있어요.</p>`);
  sh.querySelector('#kOk').onclick = async () => { const v = sh.querySelector('#kIn').value.trim(); if (v.length < 20 || v.length > 200) return toast('키 모양이 아니에요'); await store.set(KEY, v); toast('저장했어요'); sh.parentElement.click(); import('./ui.js').then(u => u.closeSheet()); };
  sh.querySelector('#kDel')?.addEventListener('click', async () => { await store.set(KEY, ''); toast('지웠어요'); import('./ui.js').then(u => u.closeSheet()); });
}
