// 폰 안 저장소(IndexedDB). 개인 기록(위시·메모·사진·음성·설정)은 전부 여기에만 있고 어디로도 보내지 않아요.
const DB = 'ces-guide', VER = 1; let dbp;
function open() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB, VER);
    r.onupgradeneeded = () => { const d = r.result; for (const s of ['kv', 'notes', 'blobs']) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, s === 'notes' ? { keyPath: 'id' } : undefined); };
    r.onsuccess = () => { const d = r.result; d.onversionchange = () => { d.close(); dbp = null; }; res(d); };
    r.onerror = () => { dbp = null; rej(r.error); };
  });
  return dbp;
}
const req = q => new Promise((res, rej) => { q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
async function tx(store, mode, fn) { const d = await open(); const t = d.transaction(store, mode); const out = await fn(t.objectStore(store)); await new Promise((res, rej) => { t.oncomplete = res; t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); return out; }
const subs = new Set();
export const onChange = fn => (subs.add(fn), () => subs.delete(fn));
const ping = what => subs.forEach(f => { try { f(what); } catch { } });

export async function get(k, d = null) { const v = await tx('kv', 'readonly', s => req(s.get(k))); return v === undefined ? d : v; }
export async function set(k, v) { await tx('kv', 'readwrite', s => req(s.put(v, k))); ping('kv:' + k); }

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export async function notes() { return (await tx('notes', 'readonly', s => req(s.getAll()))).sort((a, b) => b.at.localeCompare(a.at)); }
export async function putNote(n) { n.id ||= uid(); n.at ||= new Date().toISOString(); await tx('notes', 'readwrite', s => req(s.put(n))); ping('notes'); return n; }
export async function removeNote(n) { await tx('notes', 'readwrite', s => req(s.delete(n.id))); if (n.blob) await tx('blobs', 'readwrite', s => req(s.delete(n.blob))); ping('notes'); }
export async function putBlob(b) { const id = uid(); await tx('blobs', 'readwrite', s => req(s.put(b, id))); return id; }
export const getBlob = id => tx('blobs', 'readonly', s => req(s.get(id)));
export async function wipe() { for (const s of ['kv', 'notes', 'blobs']) await tx(s, 'readwrite', st => req(st.clear())); ping('all'); }

// 위시·본 곳은 kv에 부스 id 목록으로
export async function toggleList(key, id, on) { const a = new Set(await get(key, [])); (on ?? !a.has(id)) ? a.add(id) : a.delete(id); await set(key, [...a]); return a.has(id); }
export async function estimate() { try { const e = await navigator.storage?.estimate?.(); return e ? { used: e.usage, quota: e.quota } : null; } catch { return null; } }
