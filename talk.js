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
// 받아 적기 한 번(말이 끝나면 끝남). onPart(중간 글자), 끝나면 최종 글자 돌려줌
export function listen(lang, onPart) {
  return new Promise((res, rej) => {
    if (!SR) return rej(new Error('nosr'));
    const r = new SR(); r.lang = lang; r.interimResults = true; r.continuous = false; let fin = '';
    r.onresult = e => { let t = ''; for (const x of e.results) t += x[0].transcript; fin = t; onPart?.(t); };
    r.onerror = e => rej(new Error(e.error || 'sr')); r.onend = () => res(fin.trim());
    try { r.start(); } catch (e) { rej(e); }
    listen.stop = () => { try { r.stop(); } catch { } };
  });
}

// 위젯: booth가 있으면 그 부스 분야에 맞는 질문 추천 + 대화를 그 부스 기록으로 저장
export function openTalk({ booth = null, onSave } = {}) {
  const qs = questionsFor([...(booth?.tags || []), 'me']);
  const sh = sheet(`<h2 class="sh-t">${icon('talk')} 번역${booth ? ` <small>${esc(booth.name || booth.no)}</small>` : ''}</h2>
    <div class="tk-log" id="tkLog"><p class="mute">아래 버튼을 누르고 말하면 받아 적고 번역해요.</p></div>
    <div class="tk-btns"><button class="btn big" id="tkThem">${icon('mic')}상대 말 듣기<small>영어 → 한국어</small></button><button class="btn big alt" id="tkMe">${icon('mic')}내가 말하기<small>한국어 → 영어</small></button></div>
    <h3 class="sh-h">질문 추천${booth?.tags?.length ? '' : ' · 기본'}</h3>
    <div class="qq">${qs.map(([en, ko], i) => `<button data-q="${i}"><b>${esc(en)}</b><span>${esc(ko)}</span></button>`).join('')}</div>
    <div class="big-en" id="bigEn" hidden></div>`, { tall: true, onClose: () => { listen.stop?.(); speechSynthesis?.cancel?.(); } });
  const log = sh.querySelector('#tkLog'), big = sh.querySelector('#bigEn'); const convo = [];
  const showBig = en => { big.hidden = false; big.innerHTML = `<p>${esc(en)}</p><small>화면을 상대에게 보여 주세요 · 누르면 다시 읽어요</small>`; big.onclick = () => speak(en); speak(en); };
  sh.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const [en, ko] = qs[+b.dataset.q]; showBig(en); convo.push({ who: 'me', ko, en }); });
  async function turn(who) {
    if (!canListen) { toast('이 브라우저는 받아 적기를 못 해요. 사파리나 크롬에서 열어 주세요'); return; }
    const row = document.createElement('div'); row.className = 'tk-row ' + who; row.innerHTML = '<p class="src">듣는 중…</p><p class="dst"></p>'; log.querySelector('.mute')?.remove(); log.append(row); row.scrollIntoView({ block: 'end', behavior: 'smooth' });
    let text = '';
    try { text = await listen(who === 'them' ? 'en-US' : 'ko-KR', t => row.firstChild.textContent = t); } catch (e) { row.firstChild.textContent = e.message === 'not-allowed' ? '마이크를 허용해 주세요' : '잘 못 들었어요. 다시 눌러 주세요'; return; }
    if (!text) { row.remove(); return; }
    row.firstChild.textContent = text; const dst = row.lastChild; dst.innerHTML = '<span class="wait"><i></i><i></i><i></i></span>';
    for (let tryN = 0; tryN < 3; tryN++) {
      try { const out = await translate(text, who === 'them' ? 'ko' : 'en'); dst.textContent = out; convo.push(who === 'them' ? { who, en: text, ko: out } : { who, ko: text, en: out }); if (who === 'me') showBig(out); return; }
      catch (e) {
        if (e.fix) { dst.innerHTML = `번역하려면 AI 키가 필요해요. <button class="link" id="tkKey">키 넣기</button>`; dst.querySelector('#tkKey').onclick = () => askKey(); return; }
        if (e.message === 'offline') { dst.textContent = '인터넷이 없어서 원문만 적어 뒀어요. 질문 카드는 그대로 쓸 수 있어요'; return; }
        await new Promise(r => setTimeout(r, 1200 * (tryN + 1)));
      }
    }
    dst.textContent = '지금은 번역이 늦어요. 원문은 저장돼요';
  }
  sh.querySelector('#tkThem').onclick = () => turn('them');
  sh.querySelector('#tkMe').onclick = () => turn('me');
  sh.addEventListener('click', e => { if (e.target.closest('.shbg')) return; });
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
