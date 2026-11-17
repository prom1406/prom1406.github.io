/* =====================================================================
   منظومة تحركات الحجاج 1447هـ — طبقة الواجهة والمزامنة
   ===================================================================== */
(function () {
'use strict';
const C = window.HajjCore;
const { esc, normAr, ST, ST_LABEL } = C;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const LS_VIEW = 'hajj1447.view', LS_CONN = 'hajj1447.conn', LS_PUB = 'hajj1447.pub', LS_THEME = 'hajj1447.theme', LS_BADGE = 'hajj1447.badges';
const LIBS = {
  xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  pdf: 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
};

/* ---------------- الإعدادات ---------------- */
const clone = o => JSON.parse(JSON.stringify(o));
function merge(a, b) { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) a[k] = merge(a[k] && typeof a[k] === 'object' ? a[k] : {}, b[k]); else a[k] = b[k]; } return a; }
const WEB_RE = /^https:\/\/script\.google\.com\/(a\/macros\/[A-Za-z0-9.-]+|macros)\/s\/[A-Za-z0-9_-]+\/exec$/;
// الاتصال المحفوظ في هذا المتصفح: رابط الخادم (عام) وجلسة المالك فقط. الإعدادات نفسها تأتي من الخادم.
const CONN = { webapp: '', session: '' };
try { Object.assign(CONN, JSON.parse(localStorage.getItem(LS_CONN) || '{}')); } catch (e) { }
const saveConn = () => { try { localStorage.setItem(LS_CONN, JSON.stringify({ webapp: CONN.webapp, session: CONN.session })); } catch (e) { } };
const REMOTE = { configured: false, owner: false, email: '', error: '', locked: false };
let S = clone(C.DEFAULTS);
function applyRemote(st) { S = merge(clone(C.DEFAULTS), st || {}); S.webapp = CONN.webapp; S.readVia = 'webapp'; }
function isMasked() { return !REMOTE.owner && !(S.perms && S.perms.showPassports); }
async function api(action, extra, payload) {
  if (!CONN.webapp) throw new Error('لم يُضبط رابط الخادم');
  const q = new URLSearchParams(); q.set('action', action);
  if (CONN.session) q.set('s', CONN.session);
  Object.keys(extra || {}).forEach(k => q.set(k, extra[k]));
  if (payload !== undefined) q.set('p', b64e(JSON.stringify(payload)));
  q.set('t', Date.now());
  let txt;
  try { txt = await (await fetch(CONN.webapp + (CONN.webapp.includes('?') ? '&' : '?') + q.toString(), { cache: 'no-store' })).text(); }
  catch (e) { throw new Error('تعذّر الاتصال بالخادم — تحقق من الإنترنت'); }
  try { return JSON.parse(txt); }
  catch (e) { throw new Error('ردّ غير متوقع من الخادم («' + txt.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50) + '») — تأكد من رابط Apps Script ومن نشر أحدث Code.gs'); }
}

/* ---------------- الأيقونات ---------------- */
const ic = (p, x) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + (x || '') + '>' + p + '</svg>';
const PLANE = '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>';
const ICON = {
  plane: ic(PLANE),
  dash: ic('<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/>'),
  land: ic(PLANE, ' style="transform:rotate(90deg)"'),
  take: ic(PLANE, ' style="transform:rotate(-45deg)"'),
  refresh: ic('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>'),
  gear: ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  theme: ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  xls: ic('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13l4 5M13 13l-4 5"/>'),
  pdf: ic('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8 14h2.5a1.5 1.5 0 0 1 0 3H8v-3zM14 17v-3h2M14 15.5h1.5"/>'),
  print: ic('<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>'),
  search: ic('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
  check: ic('<path d="M20 6 9 17l-5-5"/>'),
  table: ic('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>'),
  cards: ic('<rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="8" rx="1.5"/><rect x="3" y="13" width="7" height="8" rx="1.5"/><rect x="14" y="13" width="7" height="8" rx="1.5"/>'),
  bus: ic('<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16M8 17v3M16 17v3"/><circle cx="8" cy="14" r=".7"/><circle cx="16" cy="14" r=".7"/>'),
  car: ic('<path d="M5 17h14v-5l-2-5H7l-2 5z"/><path d="M3 12h18M7 17v2M17 17v2"/><circle cx="8" cy="14.5" r=".7"/><circle cx="16" cy="14.5" r=".7"/>'),
  train: ic('<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l2-4M15 21l-2-4"/><circle cx="9" cy="14" r=".7"/><circle cx="15" cy="14" r=".7"/>'),
  eye: ic('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>')
};

/* ---------------- الحالة والمزامنة ---------------- */
const state = { ready: {}, notes: { arrival: {}, departure: {} }, data: { arrival: null, departure: null }, sync: { arrival: 0, departure: 0 }, err: {}, pending: { arrival: {}, departure: {} }, fn: [] };
const pkey = r => (isMasked() ? 'r' + r.row : (r.key || ('r' + r.row)));
const emit = () => state.fn.forEach(f => { try { f(); } catch (e) { console.error(e); } });
const onData = f => state.fn.push(f);

const tabOf = (kind, cfg) => {
  const s = ((cfg || S).source) || {};
  return ((kind === 'arrival' ? s.arrivalTab : s.departureTab) || '').trim() || (kind === 'arrival' ? 'Arrival' : 'Departure');
};
const sourceReady = () => !!(CONN.webapp && REMOTE.configured);
async function fetchRows(kind) {
  const j = await api('read', { kind });
  if (!j.ok) { const e = new Error(j.error === 'not_configured' ? 'المنظومة لم تُهيّأ بعد — يحتاج المالك إلى ضبط الإعدادات' : (j.error || 'خطأ في تطبيق الويب')); if (j.error === 'not_configured') e.code = 'nc'; throw e; }
  return j.rows;
}
function processRows(kind, rows) {
  const res = C.toRecords(rows, kind, S), pend = state.pending[kind];
  res.records.forEach(r => {
    const p = pend[pkey(r)]; if (!p) return;
    if (r.done === p.value || Date.now() - p.ts > 600000) delete pend[pkey(r)];
    else { r.done = p.value; r.syncing = true; }
  });
  // حماية من اسم صفحة خاطئ: غياب عمود التأكيد المتوقع يعني غالباً أن الصفحة ليست المقصودة
  res.warn = (res.records.length && res.map.check == null) ? 'لم يُعثر على عمود «' + S[kind].checkHeader + '» في صفحة «' + tabOf(kind) + '» — تأكد من اسم الصفحة في الإعدادات' : '';
  state.data[kind] = res; if (kind === 'arrival') applyReady(); return res;
}
/* ---------------- الاستعداد المسبق للرحلات (الوصول) ---------------- */
const RDY_ST = { pending: 'لم تُدخل في نظام الوزارة', entered: 'أُدخلت في نظام الوزارة', approved: 'جاهزة', fix: 'تحتاج تعديلاً' };
const rKey = r => (r.flight || '—') + '|' + ((r.when0 || r.when) ? C.fmtDay(r.when0 || r.when) : '');
const parseEta = s => { const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/.exec(s || ''); if (!m) return null; const d = new Date(m[1] + 'T' + m[2] + ':00+03:00'); return isNaN(d) ? null : d; };
const readyOk = e => !!(e && e.status === 'approved');
// يبدّل وقت الوصول بالـETA المحدّث (مع حفظ الأصلي في when0 كي لا تتغير مفاتيح الرحلات والملاحظات)
function applyReady() {
  const d = state.data.arrival; if (!d) return;
  d.records.forEach(r => {
    if (r.when0 === undefined) { r.when0 = r.when; r.approx0 = r.approx; }
    const e = state.ready[rKey(r)], et = e && e.eta ? parseEta(e.eta) : null;
    r.when = et || r.when0; r.approx = et ? false : r.approx0; r.eta = !!et;
  });
}
async function loadReady() {
  try {
    const j = await api('ready_get'); if (!j.ok) return;
    const m = {}; (j.items || []).forEach(x => { m[x.key] = x; }); state.ready = m;
    try { localStorage.setItem('hajj1447.ready', JSON.stringify(m)); } catch (e) { }
  } catch (e) { }
}
function updateBadges() {
  const b = {}; try { Object.assign(b, JSON.parse(localStorage.getItem(LS_BADGE) || '{}')); } catch (e) { }
  ['arrival', 'departure'].forEach(k => { if (state.data[k]) { b[k] = C.summarize(state.data[k].records, Date.now(), S).dangerRows; } });
  try { localStorage.setItem(LS_BADGE, JSON.stringify(b)); } catch (e) { }
  ['arrival', 'departure'].forEach(k => { const el = $('#bd-' + k); if (!el) return; el.hidden = !b[k]; el.textContent = b[k] || ''; });
}
async function loadKind(kind) {
  try {
    const rows = await fetchRows(kind); processRows(kind, rows);
    state.sync[kind] = Date.now(); state.err[kind] = null;
    try { localStorage.setItem('hajj1447.cache.' + kind, JSON.stringify({ ts: Date.now(), rows })); } catch (e) { }
  } catch (e) {
    state.err[kind] = e.message || String(e);
    if (e.code === 'nc') { REMOTE.configured = false; state.data[kind] = null; try { localStorage.removeItem('hajj1447.cache.' + kind); } catch (x) { } }   // حذف المالك الإعدادات: لا تبقى بيانات معروضة
  }
}
let kindsInUse = [], lastTry = 0;
// ملاحظات المجموعات وحالة النقل (تُحفظ في تبويب Notes بالملف)
async function loadNotes(kind) {
  try {
    const j = await api('notes_get', { kind }); if (!j.ok) return;
    const m = {}; (j.items || []).forEach(x => { m[x.key] = x; }); state.notes[kind] = m;
    try { localStorage.setItem('hajj1447.notes.' + kind, JSON.stringify(m)); } catch (e) { }
  } catch (e) { }
}
// الزائر: التقط أي تغيير أجراه المالك في الإعدادات دون إعادة تحميل الصفحة
async function syncPublic() {
  if (REMOTE.owner || !CONN.webapp) return;
  try {
    const j = await api('public'); if (!j.ok) return;
    REMOTE.configured = !!j.configured;
    if (!j.configured) { clearCaches(); return; }
    if (j.settings && j.settings.updatedAt !== S.updatedAt) { applyRemote(j.settings); try { localStorage.setItem(LS_PUB, JSON.stringify({ configured: true, settings: j.settings })); } catch (e) { } }
  } catch (e) { }
}
async function refresh(kinds) {
  kinds = kinds || kindsInUse; lastTry = Date.now();
  const live = $('#live'), btn = $('#bRef');
  if (live) live.className = 'live load'; if (btn) btn.classList.add('spin');
  await syncPublic();
  await Promise.all(kinds.map(loadKind).concat(kinds.map(loadNotes), kinds.includes('arrival') ? [loadReady()] : []));
  applyReady();
  if (btn) btn.classList.remove('spin');
  updateBadges(); emit(); tick(true);
}
function hydrate(kinds) {
  try { state.ready = JSON.parse(localStorage.getItem('hajj1447.ready') || '{}') || {}; } catch (e) { }
  kinds.forEach(k => {
    try { state.notes[k] = JSON.parse(localStorage.getItem('hajj1447.notes.' + k) || '{}') || {}; } catch (e) { }
    try { const c = JSON.parse(localStorage.getItem('hajj1447.cache.' + k) || 'null'); if (c && c.rows) { processRows(k, c.rows); state.sync[k] = c.ts; state.cached = true; } } catch (e) { }
  });
}

/* ---------------- الهوية والصلاحيات ---------------- */
const LS_BY = 'hajj1447.by', SS_PIN = 'hajj1447.pin';
const lsGet = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
const lsSet = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { } };
const ssGet = k => { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } };
const ssSet = (k, v) => { try { v ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch (e) { } };
const confirmMode = () => (S.perms && S.perms.confirm) || 'all';
const canConfirm = () => REMOTE.owner || confirmMode() !== 'off';
function roleInfo() {
  if (REMOTE.owner) return { t: 'المالك', c: 'owner', d: 'تعدّل الإعدادات وتؤكد دون قيود.' };
  const m = confirmMode();
  if (m === 'off') return { t: 'زائر · عرض فقط', c: 'view', d: 'يمكنك مشاهدة البيانات وتصديرها دون تأكيد التسكين أو المغادرة.' };
  if (m === 'pin') return ssGet(SS_PIN) ? { t: 'مشرف · عرض + تأكيد', c: 'sup', d: 'أدخلت رمز المشرف، فيمكنك التأكيد في هذه الجلسة.' } : { t: 'زائر · التأكيد برمز', c: 'view', d: 'المشاهدة مفتوحة، والتأكيد يتطلب رمز المشرف (يُطلب عند أول تأكيد).' };
  return { t: 'زائر · عرض + تأكيد', c: 'view', d: 'يمكنك مشاهدة البيانات وتأكيد التسكين والمغادرة، ويُسجَّل اسمك مع كل تأكيد.' };
}
function updateRole() {
  const b = $('#bRole'); document.body.classList.toggle('ro', !canConfirm());
  if (!b) return; const r = roleInfo(); b.textContent = r.t; b.className = 'pill ' + r.c; b.title = r.d;
}
// الاسم (للزائر) ورمز المشرف عند الحاجة؛ تعيد null عند الإلغاء أو المنع
async function ensureAuth() {
  if (!canConfirm()) { toast('الموقع بوضع العرض فقط — لا يمكن التأكيد', 'warn'); return null; }
  let by = REMOTE.owner ? 'المالك' : lsGet(LS_BY);
  if (!by) { by = await askText('اسمك', 'يُسجَّل اسمك مع كل تأكيد في الجدول وفي سجل العمليات.', 'الاسم'); if (!by) return null; lsSet(LS_BY, by); }
  let pin = '';
  if (!REMOTE.owner && confirmMode() === 'pin') {
    pin = ssGet(SS_PIN);
    if (!pin) { pin = await askText('رمز المشرف', 'أدخل رمز المشرف لتأكيد التسكين أو المغادرة.', 'الرمز', true); if (!pin) return null; ssSet(SS_PIN, pin); updateRole(); }
  }
  return { by, pin };
}
function openQuality() {
  const kinds = ['arrival', 'departure'].filter(k => state.data[k]);
  if (!kinds.length) { toast('لا توجد بيانات محمّلة بعد', 'warn'); return; }
  const lab = { arrival: 'الوصول', departure: 'المغادرة' }; let body = '';
  kinds.forEach(k => {
    const d = state.data[k], R = d.records, bad = f => R.filter(f), rowsOf = a => a.slice(0, 8).map(r => r.row).join('، ') + (a.length > 8 ? ' …' : '');
    const cnt = new Map(); R.forEach(r => { if (r.passport) cnt.set(r.passport, (cnt.get(r.passport) || 0) + 1); });
    const dups = R.filter(r => r.passport && cnt.get(r.passport) > 1);
    const issues = [['بلا فندق', bad(r => !r.hotel)], ['مدينة الإقامة غير معروفة', bad(r => !r.stayCity)], ['بلا تاريخ/وقت صالح', bad(r => !r.when)], ['بلا رقم رحلة', bad(r => !r.flight)], ['جواز مكرر', dups], ['بلا رقم جواز', bad(r => !r.passport)]];
    const unm = Object.keys(C.FIELDS).filter(f => d.map[f] == null && ['name', 'passport', 'flight', 'date', 'time', 'hotel'].includes(f)).map(f => C.FIELDS[f].ar);
    const used = new Set(Object.values(d.map).filter(v => v != null)), loose = d.headers.map((h, i) => [h, i]).filter(([h, i]) => h && !used.has(i)).map(x => x[0]);
    body += '<h4>' + lab[k] + ' (' + R.length + ' سجل)</h4>' + issues.map(([t, a]) => '<div class="qrow ' + (a.length ? 'bad' : 'ok') + '"><span>' + (a.length ? '⚠' : '✓') + ' ' + t + '</span><b>' + a.length + '</b>' + (a.length ? '<small>صفوف: ' + rowsOf(a) + '</small>' : '') + '</div>').join('') +
      (unm.length ? '<div class="qrow bad"><span>⚠ أعمدة أساسية غير مربوطة</span><small>' + esc(unm.join('، ')) + '</small></div>' : '') +
      (loose.length ? '<div class="qrow"><span>أعمدة غير مستخدمة</span><small>' + esc(loose.join('، ')) + '</small></div>' : '');
  });
  const ov = modal('<h3>فحص جودة البيانات</h3><div class="qual">' + body + '</div><div class="act"><button class="btn" data-n>إغلاق</button></div>'); ov.querySelector('[data-n]').onclick = () => ov.close();
}
function openRole() {
  const r = roleInfo(), pinMode = !REMOTE.owner && confirmMode() === 'pin';
  const ov = modal('<h3>' + esc(r.t) + '</h3><p>' + esc(r.d) + '</p>' +
    (REMOTE.owner ? '' : '<div class="set"><label class="full">اسمك (يُسجَّل مع كل تأكيد)<input id="rNm" maxlength="40" value="' + esc(lsGet(LS_BY)) + '"></label>' +
      (pinMode ? '<label class="full">رمز المشرف<input id="rPin" type="password" autocomplete="off" dir="ltr" placeholder="' + (ssGet(SS_PIN) ? '•••• (مُدخل)' : 'غير مُدخل') + '"></label>' : '') + '</div>') +
    '<div class="act">' + (REMOTE.owner ? '' : '<button class="btn green" id="rOk">حفظ</button>') + (pinMode && ssGet(SS_PIN) ? '<button class="btn" id="rForget">نسيان الرمز</button>' : '') + '<button class="btn" id="rX">إغلاق</button></div>' +
    (REMOTE.owner ? '' : '<p class="hint" style="margin-top:10px">للإعدادات والتحكم الكامل: زر ⚙ ثم دخول المالك.</p>'));
  $('#rX', ov).onclick = () => ov.close();
  if ($('#rOk', ov)) $('#rOk', ov).onclick = () => { lsSet(LS_BY, $('#rNm', ov).value.trim()); if ($('#rPin', ov) && $('#rPin', ov).value.trim()) ssSet(SS_PIN, $('#rPin', ov).value.trim()); updateRole(); ov.close(); toast('تم الحفظ', 'ok'); };
  if ($('#rForget', ov)) $('#rForget', ov).onclick = () => { ssSet(SS_PIN, ''); updateRole(); ov.close(); toast('نُسي الرمز', 'ok'); };
}
// وصف مختصر لما سيُحدَّث: الرحلات والفنادق
const ctxOf = recs => {
  const u = f => [...new Set(recs.map(f).filter(Boolean))];
  const fl = u(r => r.flight), ho = u(r => r.hotel);
  const cut = (a, n) => a.slice(0, n).join('، ') + (a.length > n ? ' +' + (a.length - n) : '');
  return [fl.length ? 'رحلة ' + cut(fl, 3) : '', ho.length ? 'فندق ' + cut(ho, 2) : ''].filter(Boolean).join(' | ');
};
const fmtAge = ms => { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? s + ' ث' : s < 3600 ? Math.floor(s / 60) + ' د' : Math.floor(s / 3600) + ' س'; };

/* ---------------- الكتابة (Apps Script) ---------------- */
async function writeChecks(kind, recs, value, isUndo) {
  if (!CONN.webapp) { toast('لم يُضبط رابط الخادم', 'warn'); return false; }
  const d = state.data[kind];
  if (d.map.check == null) { toast('لم يُعثر على عمود ' + S[kind].checkHeader + ' في الجدول', 'err'); return false; }
  const auth = await ensureAuth(); if (!auth) return false;
  recs.forEach(r => { r.done = value; r.syncing = true; state.pending[kind][pkey(r)] = { value, ts: Date.now() }; });
  emit();
  const revert = rs => rs.forEach(r => { delete state.pending[kind][pkey(r)]; r.done = !value; r.syncing = false; });
  let doneN = 0;
  try {
    // الكتابة عبر GET على دفعات صغيرة (تعمل مع أي نشر لـ Apps Script وتتجنب مشاكل POST وإعادة التوجيه)
    const CH = 10, results = [];
    for (let i = 0; i < recs.length; i += CH) {
      const part = recs.slice(i, i + CH);
      const payload = { kind, sheet: tabOf(kind), headerRow: d.headerRow, ops: part.map(r => ({ row: r.row, key: r.key, keyHeader: r.keyHeader, value })), by: auth.by, pin: auth.pin, ctx: ctxOf(part) };
      const j = await api('write', {}, payload);
      if (!j.ok) {
        if (j.error === 'bad_pin') { ssSet(SS_PIN, ''); updateRole(); }
        throw new Error({ not_configured: 'المنظومة لم تُهيّأ بعد', bad_pin: 'رمز المشرف غير صحيح', locked: 'محاولات كثيرة — انتظر 15 دقيقة', readonly: 'الموقع بوضع العرض فقط' }[j.error] || j.error || 'فشل الحفظ');
      }
      if (!Array.isArray(j.results)) throw new Error('الكود المنشور قديم: ألصق أحدث Code.gs ثم نشر ← إدارة عمليات النشر ← ✏ ← إصدار جديد');
      results.push(...j.results); doneN = i + part.length;
    }
    const j = { results };
    const bad = [];
    (j.results || []).forEach((x, i) => { if (!x.ok) bad.push([recs[i], x.error]); });
    revert(bad.map(b => b[0]));
    if (bad.length) toast('تعذّر حفظ ' + bad.length + ' سجل: ' + bad[0][1], 'err');
    const okN = recs.length - bad.length;
    if (okN) {
      const okRecs = recs.filter(r => !bad.some(b => b[0] === r));
      toast((value ? 'تم حفظ ' : 'تم التراجع عن ') + okN + ' سجل', 'ok', isUndo ? null : { label: 'تراجع', fn: () => writeChecks(kind, okRecs, !value, true) });
    }
    emit();
    setTimeout(() => refresh([kind]), 2500); setTimeout(() => refresh([kind]), 9000);
    return true;
  } catch (e) {
    revert(recs.slice(doneN)); emit(); toast('فشل الحفظ: ' + (e.message || e), 'err'); return false;
  }
}

/* ---------------- مكوّنات الواجهة ---------------- */
function toast(msg, type, action) {
  let c = $('.toasts'); if (!c) { c = document.createElement('div'); c.className = 'toasts'; c.setAttribute('aria-live', 'polite'); document.body.appendChild(c); }
  const t = document.createElement('div'); t.className = 'toast ' + (type || ''); const m = document.createElement('span'); m.textContent = msg; t.appendChild(m);
  if (action) { const b = document.createElement('button'); b.type = 'button'; b.className = 'tact'; b.textContent = action.label; b.onclick = () => { t.remove(); action.fn(); }; t.appendChild(b); }
  c.appendChild(t); setTimeout(() => t.remove(), action ? 10000 : 4500);
}
// سؤال نصي قصير (الاسم / رمز المشرف)
function askText(title, msg, label, secret) {
  return new Promise(res => {
    let done = false; const fin = v => { if (!done) { done = true; res(v); } };
    const ov = modal('<h3>' + esc(title) + '</h3><p>' + esc(msg) + '</p><div class="set"><label class="full">' + esc(label) + '<input id="aTx" ' + (secret ? 'type="password" autocomplete="off" dir="ltr"' : 'type="text" maxlength="40"') + '></label></div><div class="act"><button class="btn green" data-y>متابعة</button><button class="btn" data-n>إلغاء</button></div>', () => fin(null));
    const go = () => { const v = $('#aTx', ov).value.trim(); if (!v) { $('#aTx', ov).focus(); return; } fin(v); ov.close(); };
    ov.querySelector('[data-y]').onclick = go; ov.querySelector('[data-n]').onclick = () => ov.close();
    ov.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    setTimeout(() => $('#aTx', ov).focus(), 50);
  });
}
function modal(html, onClose) {
  const ov = document.createElement('div'); ov.className = 'ov';
  ov.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
  document.body.appendChild(ov);
  const close = () => { ov.remove(); document.removeEventListener('keydown', kd); if (onClose) onClose(); };
  const kd = e => { if (e.key === 'Escape' && ov === [...document.querySelectorAll('.ov')].pop()) close(); };
  document.addEventListener('keydown', kd);
  ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
  ov.close = close; return ov;
}
function confirmBox(title, msg, okText) {
  return new Promise(res => {
    const ov = modal('<h3>' + esc(title) + '</h3><p>' + esc(msg) + '</p><div class="act"><button class="btn green" data-y>' + esc(okText || 'تأكيد') + '</button><button class="btn" data-n>إلغاء</button></div>');
    ov.querySelector('[data-y]').onclick = () => { ov.close(); res(true); };
    ov.querySelector('[data-n]').onclick = () => { ov.close(); res(false); };
  });
}
const libs = {};
function loadLib(url) {
  if (libs[url]) return libs[url];
  return libs[url] = new Promise((ok, no) => { const s = document.createElement('script'); s.src = url; s.onload = ok; s.onerror = () => { delete libs[url]; no(new Error('تعذّر تحميل مكتبة التصدير — تحقق من الاتصال بالإنترنت')); }; document.head.appendChild(s); });
}
const mask = p => !p ? '' : (p.length > 4 ? '••••' + p.slice(-4) : p);
const natHtml = r => {
  const c = r.country;
  if (!c) return '<span class="nat"><span class="flag ph">؟</span>' + esc(r.natRaw || '—') + '</span>';
  return '<span class="nat"><img class="flag" loading="lazy" alt="" src="' + C.flagUrl(c.iso2, 40) + '" srcset="' + C.flagUrl(c.iso2, 80) + ' 2x" onerror="this.style.visibility=\'hidden\'">' + esc(c.ar) + '</span>';
};
const whenTxt = r => r.when ? C.fmtDayAr(r.when) + ' · ' + (r.approx ? '≈' : '') + C.fmtTime(r.when) : esc(r.date || '—');
const cdHtml = (r) => r.when && !r.done ? '<span class="cd" data-w="' + r.when.getTime() + '"></span>' : '<span class="sub">—</span>';

/* ---------------- العدّ التنازلي الحي ---------------- */
function tick(force) {
  const now = Date.now();
  $$('.cd[data-w]').forEach(el => {
    const ms = +el.dataset.w - now, f = C.fmtCountdown(ms), h = ms / 36e5;
    el.innerHTML = (f.neg ? '<span dir="rtl">منذ</span> ' : '') + (f.d ? '<span dir="rtl">' + f.d + ' يوم</span> ' : '') + f.hms;
    el.classList.toggle('neg', f.neg);
    el.classList.toggle('crit', !f.neg && h <= S.criticalH);
    el.classList.toggle('warn', !f.neg && h > S.criticalH && h <= S.warnH);
  });
  const live = $('#live'), txt = $('#syncTxt'); if (!live) return;
  const last = Math.max(state.sync.arrival || 0, state.sync.departure || 0);
  const err = kindsInUse.some(k => state.err[k]);
  if (!$('#bRef').classList.contains('spin')) live.className = 'live' + (err ? ' err' : '');
  updateRole();
  const hasData = kindsInUse.some(k => state.data[k]);
  txt.textContent = err ? (hasData && last ? 'غير متصل · محفوظة قبل ' + fmtAge(now - last) : 'تعذّر التحديث') : (last ? 'محدّث قبل ' + fmtAge(now - last) : 'جارٍ التحميل…');
  txt.title = last ? 'آخر تحديث ' + new Intl.DateTimeFormat('en-GB', { timeZone: C.TZ_NAME, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(last) : '';
}

/* ---------------- شريط التنقل ---------------- */
function renderNav(page) {
  const tabs = [['index', 'لوحة المؤشرات', 'dash'], ['arrival', 'متابعة الوصول', 'land'], ['departure', 'متابعة المغادرة', 'take']];
  const nav = $('#nav'); nav.className = 'nav';
  nav.innerHTML = '<a class="brand" href="index.html"><span class="logo">' + ICON.plane + '</span><span><b>منظومة تحركات الحجاج</b><small>موسم 1447هـ</small></span></a>' +
    '<nav class="tabs" aria-label="التنقل الرئيسي">' + tabs.map(t => '<a class="tab' + (t[0] === page ? ' active' : '') + '" href="' + t[0] + '.html"' + (t[0] === page ? ' aria-current="page"' : '') + '>' + ICON[t[2]] + '<span class="tl">' + t[1] + '</span>' + (t[0] !== 'index' ? '<span class="badge" id="bd-' + t[0] + '" hidden></span>' : '') + '</a>').join('') + '</nav>' +
    '<div class="tools"><button class="pill view" id="bRole" type="button"></button><span class="live" id="live"><i></i><em id="syncTxt">—</em></span>' +
    '<button class="ibtn" id="bRef" title="تحديث الآن" aria-label="تحديث">' + ICON.refresh + '</button>' +
    '<button class="ibtn" id="bTheme" title="الوضع الفاتح/الداكن" aria-label="تبديل السمة">' + ICON.theme + '</button>' +
    '<button class="ibtn" id="bSet" title="الإعدادات" aria-label="الإعدادات">' + ICON.gear + '</button></div>';
  $('#bRef').onclick = () => refresh();
  $('#bSet').onclick = () => openSettings(false);
  $('#bRole').onclick = () => openRole();
  $('#bTheme').onclick = () => {
    const n = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = n; try { localStorage.setItem(LS_THEME, n); } catch (e) { }
    emit(window.__themeChanged = true);
  };
  updateBadges(); updateRole();
}

/* ---------------- الاتصال بالخادم، دخول المالك، روابط الزوار ---------------- */
const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64d = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
const clearCaches = () => { try { ['arrival', 'departure'].forEach(k => localStorage.removeItem('hajj1447.cache.' + k)); localStorage.removeItem(LS_BADGE); localStorage.removeItem(LS_PUB); } catch (e) { } };
const siteBase = () => new URL('index.html', location.href).href.split('#')[0];
const visitorLink = () => siteBase() + '#w=' + b64e(CONN.webapp);
const serverTail = () => { const m = /\/s\/([^/]+)\/exec/.exec(CONN.webapp || ''); return m ? '…' + m[1].slice(-8) : '—'; };

// رابط الزوار: #w=<رابط الخادم>. لا يحمل أي سر، لكنه يغيّر الخادم الذي يتصل به المتصفح، فيُطلب التأكيد إن كان مختلفاً عن المحفوظ.
async function handleHash() {
  const m = /^#w=([A-Za-z0-9_-]+)$/.exec(location.hash); if (!m) return;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
  let url; try { url = b64d(m[1]); } catch (e) { url = ''; }
  if (!WEB_RE.test(url)) { toast('رابط الدعوة غير صالح', 'err'); return; }
  if (url === CONN.webapp) return;
  if (CONN.webapp && !(await confirmBox('تغيير خادم المنظومة', 'هذا الرابط سيوجّه هذا المتصفح إلى خادم آخر (…' + url.split('/s/')[1].slice(-8) + ') بدل الحالي (' + serverTail() + '). تابع فقط إن كان من جهة تثق بها، ولا تُدخل كلمة مرور المالك إن لم تكن متأكداً.', 'تغيير الخادم'))) return;
  CONN.webapp = url; CONN.session = ''; clearCaches(); saveConn();
}
async function initConnection() {
  const fixed = window.HAJJ_CONFIG && window.HAJJ_CONFIG.webapp;           // مثبّت من ملف config.js على الموقع (الأقوى)
  if (typeof fixed === 'string' && WEB_RE.test(fixed)) {
    REMOTE.locked = true;
    if (CONN.webapp !== fixed) { CONN.webapp = fixed; CONN.session = ''; clearCaches(); saveConn(); }
  } else await handleHash();
  if (!CONN.webapp) return;
  try {
    const j = await api('public');
    if (!j.ok) throw new Error(j.error || 'خطأ في الخادم');
    REMOTE.configured = !!j.configured; applyRemote(j.settings);
    try { localStorage.setItem(LS_PUB, JSON.stringify({ configured: REMOTE.configured, settings: j.settings })); } catch (e) { }
    if (CONN.session) {
      const w = await api('whoami');
      if (w.ok && w.owner) {
        const g = await api('owner_get');
        if (g.ok) { REMOTE.owner = true; REMOTE.email = g.email || ''; if (g.settings) { S = merge(clone(C.DEFAULTS), g.settings); S.webapp = CONN.webapp; S.readVia = 'webapp'; } }
      } else { CONN.session = ''; saveConn(); }
    }
  } catch (e) {
    REMOTE.error = e.message || String(e);
    try { const c = JSON.parse(localStorage.getItem(LS_PUB) || 'null'); if (c && c.configured) { REMOTE.configured = true; applyRemote(c.settings); } } catch (x) { }   // دون اتصال: آخر إعدادات عامة محفوظة
  }
}

// أول دخول بلا رابط خادم: يلصقه المالك مرة واحدة (الزائر يصله رابط الدعوة جاهزاً)
function openConnect() {
  const ov = modal('<h3>ربط المنظومة بالخادم</h3><p class="hint">الصق رابط تطبيق الويب (…/exec) الذي حصلت عليه من Apps Script. إن كنت زائراً فاطلب من المالك «رابط الزوار» وافتحه مباشرة.</p>' +
    '<div class="set"><label class="full">رابط تطبيق الويب<input id="cUrl" dir="ltr" placeholder="https://script.google.com/macros/s/…/exec"></label></div>' +
    '<div class="act"><button class="btn gold" id="cOk">اتصال</button><button class="btn" id="cX">إغلاق</button></div><div id="cMsg" class="hint" style="margin-top:10px"></div>');
  $('#cX', ov).onclick = () => ov.close();
  $('#cOk', ov).onclick = () => {
    const u = $('#cUrl', ov).value.trim();
    if (!WEB_RE.test(u)) { $('#cMsg', ov).innerHTML = '<div style="color:var(--red)">✗ الرابط غير صالح: يجب أن يبدأ بـ https://script.google.com/ وينتهي بـ /exec</div>'; return; }
    CONN.webapp = u; CONN.session = ''; clearCaches(); saveConn(); location.reload();
  };
  setTimeout(() => { const i = $('#cUrl', ov); if (i) i.focus(); }, 50);
}

function openLogin() {
  const ov = modal('<h3>دخول المالك</h3><p class="hint">لتعديل الإعدادات فقط. الزوار لا يحتاجون إلى دخول.</p>' +
    '<div class="set"><label class="full">البريد الإلكتروني<input id="lEm" type="email" dir="ltr" autocomplete="username"></label>' +
    '<label class="full">كلمة المرور<input id="lPw" type="password" dir="ltr" autocomplete="current-password"></label></div>' +
    '<p class="hint">الخادم: <span dir="ltr">' + esc(serverTail()) + '</span> — تأكد أن آخر الرمز يطابق رابط النشر الذي تملكه قبل إدخال كلمة المرور.</p>' +
    '<div class="act"><button class="btn gold" id="lOk">دخول</button><button class="btn" id="lX">إغلاق</button></div><div id="lMsg" class="hint" style="margin-top:10px"></div>');
  const go = async () => {
    const m = $('#lMsg', ov), b = $('#lOk', ov); b.disabled = true; m.textContent = 'جارٍ التحقق…';
    try {
      const j = await api('login', {}, { email: $('#lEm', ov).value.trim(), password: $('#lPw', ov).value });
      if (!j.ok) throw new Error(j.error || 'تعذّر الدخول');
      CONN.session = j.session; saveConn(); clearCaches(); location.reload();
    } catch (e) { m.innerHTML = '<div style="color:var(--red)">✗ ' + esc(e.message || e) + '</div>'; b.disabled = false; }
  };
  $('#lOk', ov).onclick = go; $('#lX', ov).onclick = () => ov.close();
  ov.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  setTimeout(() => { const i = $('#lEm', ov); if (i) i.focus(); }, 50);
}

/* ---------------- لوحة المالك (الإعدادات) ---------------- */
function openSettings(first) {
  if (!REMOTE.owner) { openLogin(); return; }
  first = first === true;
  const lab = (t, inner, full) => '<label' + (full ? ' class="full"' : '') + '>' + t + inner + '</label>';
  const inp = (id, v, ph, type, dir) => '<input id="' + id + '" type="' + (type || 'text') + '" value="' + esc(v == null ? '' : v) + '" placeholder="' + esc(ph || '') + '" dir="' + (dir || 'ltr') + '">';
  let mapHtml = '';
  ['arrival', 'departure'].forEach(k => {
    const d = state.data[k]; if (!d || !d.headers.length) return;
    mapHtml += '<h4>ربط الأعمدة — ' + (k === 'arrival' ? 'الوصول' : 'المغادرة') + ' <span class="hint">(الأعمدة المكتشفة: ' + d.headers.filter(h => h).length + ')</span></h4>';
    Object.keys(C.FIELDS).concat('check').forEach(f => {
      const cur = (S.map[k] || {})[f] || '', det = d.map[f];
      const o = '<option value="">تلقائي' + (det != null ? ' ← ' + esc(d.headers[det]) : ' (غير مكتشف)') + '</option>' + d.headers.filter(h => h).map(h => '<option value="' + esc(h) + '"' + (cur === h ? ' selected' : '') + '>' + esc(h) + '</option>').join('');
      mapHtml += lab(f === 'check' ? 'عمود التأكيد (' + S[k].checkHeader + ')' : C.FIELDS[f].ar, '<select data-map="' + k + '|' + f + '">' + o + '</select>');
    });
  });
  const ov = modal('<h3>' + (first ? 'مرحباً — اربط ملف Google Sheets' : 'لوحة المالك والإعدادات') + '</h3>' +
    '<p class="hint">مسجَّل الدخول: <span dir="ltr">' + esc(REMOTE.email) + '</span> · ما تحفظه هنا يراه كل من يفتح الموقع (عدا رابط الملف). <button class="btn sm" id="sOut" type="button">تسجيل الخروج</button></p>' +
    '<div class="set"><h4>ملف Google Sheets</h4>' +
    lab('رابط الملف', inp('sLink', S.source.link, 'https://docs.google.com/spreadsheets/d/…/edit'), true) +
    lab('اسم صفحة الوصول', inp('sTabA', S.source.arrivalTab, 'Arrival', 'text', 'auto')) +
    lab('اسم صفحة المغادرة', inp('sTabD', S.source.departureTab, 'Departure', 'text', 'auto')) +
    '<p class="hint" style="grid-column:1/-1;margin:0">يجب أن يطابق الاسمان تبويبي الملف تماماً. تُقرأ البيانات عبر السكربت، فلا حاجة لمشاركة الملف علناً. إن تركت الرابط فارغاً استُخدم الملف المربوط بالسكربت.</p>' +
    '<h4>صلاحيات الزوار</h4>' +
    '<label class="sw" style="grid-column:1/-1"><input type="checkbox" id="sShowPP"' + (S.perms && S.perms.showPassports ? ' checked' : '') + '> السماح للزوار برؤية أرقام الجوازات كاملة (الأصل: مقنّعة ••••1234)</label>' +
    lab('من يستطيع تأكيد التسكين/المغادرة؟', '<select id="sConf"><option value="all"' + (confirmMode() === 'all' ? ' selected' : '') + '>كل الزوار (يُسجَّل اسم المؤكِّد)</option><option value="pin"' + (confirmMode() === 'pin' ? ' selected' : '') + '>من يملك رمز المشرف فقط</option><option value="off"' + (confirmMode() === 'off' ? ' selected' : '') + '>لا أحد — عرض فقط</option></select>') +
    lab('رمز المشرف (اتركه فارغاً للإبقاء على الحالي)', '<input id="sPin" type="password" autocomplete="new-password" dir="ltr" placeholder="' + (S.pinSet ? '•••• (محدد)' : 'غير محدد') + '">') +
    (S.pinSet ? '<label class="sw"><input type="checkbox" id="sPinClr"> إزالة رمز المشرف</label>' : '') +
    '<p class="hint" style="grid-column:1/-1;margin:0">الزائر يرى البيانات ويصدّر، ولا يرى الإعدادات ولا رابط الملف. الإخفاء يتم في الخادم قبل وصول البيانات للمتصفح. كل تأكيد يُسجَّل في عمود Check_By وفي صفحة Log بالملف.</p>' +
    '<div style="grid-column:1/-1"><button class="btn" type="button" id="sQual">فحص جودة البيانات</button></div>' +
    '<div style="grid-column:1/-1" class="bk"><b>النسخ الاحتياطي</b><div class="hint" id="sBkInfo">جارٍ التحقق…</div><div class="act" style="margin-top:6px"><button class="btn" type="button" id="sBkNow">نسخة الآن</button><button class="btn" type="button" id="sBkDaily">—</button></div><div class="hint">تُحفظ النسخ كتبويبات مخفية Backup_… في الملف نفسه (آخر 12). وتُؤخذ نسخة تلقائياً قبل أي تأكيد جماعي (10 فأكثر). للاستعادة: أظهر التبويب وانسخ محتواه.</div></div>' +
    '<h4>التوقيت والتنبيهات</h4>' +
    lab('فاصل التحديث (ثوانٍ)', inp('sRef', S.refreshSec, '', 'number')) +
    lab('ترتيب التاريخ في الجدول', '<select id="sOrd"><option value="DMY"' + (S.dateOrder === 'DMY' ? ' selected' : '') + '>يوم/شهر/سنة</option><option value="MDY"' + (S.dateOrder === 'MDY' ? ' selected' : '') + '>شهر/يوم/سنة</option></select>') +
    lab('«حرج» قبل الرحلة بـ (ساعات)', inp('sCrit', S.criticalH, '', 'number')) +
    lab('«قريب» قبل الرحلة بـ (ساعات)', inp('sWarn', S.warnH, '', 'number')) +
    lab('تأخر التسكين بعد الهبوط بـ (ساعات)', inp('sLate', S.lateH, '', 'number')) +
    '<h4>وقت التحرك من الفندق قبل الإقلاع (ساعات) — صفحة المغادرة</h4>' +
    lab('مكة ← مطار جدة', inp('sLdMJ', S.lead['makkah>jeddah'], '', 'number')) + lab('مكة ← مطار المدينة', inp('sLdMM', S.lead['makkah>madinah'], '', 'number')) +
    lab('المدينة ← مطار المدينة', inp('sLdDM', S.lead['madinah>madinah'], '', 'number')) + lab('المدينة ← مطار جدة', inp('sLdDJ', S.lead['madinah>jeddah'], '', 'number')) +
    '<p class="hint" style="grid-column:1/-1;margin:0">يُحسب وقت التحرك = وقت الإقلاع − هذه الساعات. اترك الخانة 0 لإلغاء الحساب لتلك الوجهة.</p>' +
    '<h4>وسيلة النقل (مدينة المطار ← مدينة الفندق)</h4>' +
    '<label class="sw"><input type="checkbox" id="sTpA"' + (S.transport.arrival ? ' checked' : '') + '> تفعيل في صفحة الوصول</label>' +
    '<label class="sw"><input type="checkbox" id="sTpD"' + (S.transport.departure ? ' checked' : '') + '> تفعيل في صفحة المغادرة</label>' +
    lab('أقل عدد أفراد لاستخدام الحافلة (الأقل = سيارة)', inp('sBus', S.transport.busMin, '', 'number')) +
    mapHtml +
    '<h4>رابط الزوار</h4><p class="hint" style="grid-column:1/-1;margin:0">أرسله لأي شخص: يفتح الموقع ويرى ما سمحت به. لا يحمل أي سر.</p>' +
    '<div class="full" style="grid-column:1/-1;display:flex;gap:8px"><input id="sShare" readonly dir="ltr" style="flex:1" value="' + esc(visitorLink()) + '"><button class="btn sky" type="button" id="sCopy">نسخ الرابط</button></div>' +
    '<p class="hint" style="grid-column:1/-1;margin:0">لتثبيته لكل الزوار دون رابط خاص: أنشئ ملفاً اسمه <b>config.js</b> بجانب صفحات الموقع في GitHub بهذا المحتوى:</p>' +
    '<input class="full" style="grid-column:1/-1" readonly dir="ltr" id="sCfg" value="' + esc('window.HAJJ_CONFIG = { webapp: "' + CONN.webapp + '" };') + '">' +
    '<h4>حذف</h4>' +
    '<div style="grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="sWipe" style="color:var(--red)">حذف كل الإعدادات من الخادم</button>' +
    (REMOTE.locked ? '' : '<button class="btn" type="button" id="sUnlink" style="color:var(--red)">فصل هذا المتصفح عن الخادم</button>') + '</div>' +
    '<p class="hint" style="grid-column:1/-1;margin:0">الحذف يمسح الإعدادات ورابط الملف فيرى الزوار «لم تُهيّأ بعد». ولقطع الخادم كلياً: أرشِف نشر السكربت من Apps Script ← إدارة عمليات النشر.</p>' +
    '</div><div class="act"><button class="btn gold" id="sOk">حفظ واعتماد</button><button class="btn" id="sClose">إغلاق</button></div><div id="sMsg" class="hint" style="margin-top:10px"></div>');
  const val = id => $('#' + id, ov).value.trim();
  const passIdx = (k, map) => { const d = state.data[k]; if (d) { const h = (map[k] || {}).passport; const i = h ? d.headers.indexOf(h) : d.map.passport; if (i != null && i >= 0) return i; } return (S.passCol || {})[k]; };
  const collect = () => {
    const map = clone(S.map || { arrival: {}, departure: {} }); map.arrival = map.arrival || {}; map.departure = map.departure || {};
    $$('[data-map]', ov).forEach(sel => { const [k, f] = sel.dataset.map.split('|'); if (sel.value) map[k][f] = sel.value; else delete map[k][f]; });
    const n = id => { const v = parseFloat(val(id)); return isNaN(v) ? 0 : Math.max(0, v); };
    return {
      source: { link: val('sLink'), arrivalTab: val('sTabA') || 'Arrival', departureTab: val('sTabD') || 'Departure' },
      refreshSec: Math.max(10, +val('sRef') || 30), dateOrder: val('sOrd'),
      criticalH: +val('sCrit') || 3, warnH: +val('sWarn') || 12, lateH: +val('sLate') || 2,
      lead: { 'makkah>jeddah': n('sLdMJ'), 'makkah>madinah': n('sLdMM'), 'madinah>madinah': n('sLdDM'), 'madinah>jeddah': n('sLdDJ') },
      transport: { arrival: $('#sTpA', ov).checked, departure: $('#sTpD', ov).checked, busMin: Math.max(1, +val('sBus') || 4) },
      map, perms: { showPassports: $('#sShowPP', ov).checked, confirm: val('sConf') },
      ...($('#sPinClr', ov) && $('#sPinClr', ov).checked ? { pin: '' } : (val('sPin') ? { pin: val('sPin') } : {})),
      passCol: { arrival: passIdx('arrival', map), departure: passIdx('departure', map) }
    };
  };
  const copyOf = (btn, inpEl) => async () => {
    try { await navigator.clipboard.writeText(inpEl.value); toast('تم النسخ', 'ok'); }
    catch (e) { inpEl.focus(); inpEl.select(); try { document.execCommand('copy') ? toast('تم النسخ', 'ok') : toast('حدّد النص وانسخه يدوياً', 'warn'); } catch (x) { toast('حدّد النص وانسخه يدوياً', 'warn'); } }
  };
  $('#sShare', ov).onfocus = e => e.target.select(); $('#sCfg', ov).onfocus = e => e.target.select();
  $('#sCopy', ov).onclick = copyOf($('#sCopy', ov), $('#sShare', ov));
  $('#sClose', ov).onclick = () => ov.close();
  $('#sQual', ov).onclick = () => openQuality();
  const bkDraw = j => { if (!j || !j.ok) { $('#sBkInfo', ov).textContent = 'تعذّر قراءة حالة النسخ'; return; } $('#sBkInfo', ov).textContent = (j.last ? 'آخر نسخة: ' + new Date(j.last.at).toLocaleString('ar-SA-u-nu-latn') + ' (' + j.last.why + ')' : 'لا توجد نسخ بعد') + ' · المحفوظ: ' + j.count + ' تبويب · اليومي: ' + (j.daily ? 'مفعّل' : 'متوقف'); $('#sBkDaily', ov).textContent = j.daily ? 'إيقاف النسخ اليومي' : 'تفعيل النسخ اليومي'; $('#sBkDaily', ov).dataset.on = j.daily ? '1' : ''; };
  api('owner_backup_info').then(bkDraw, () => bkDraw(null));
  $('#sBkNow', ov).onclick = async () => { $('#sBkNow', ov).disabled = true; try { const j = await api('owner_backup'); if (!j.ok) throw new Error(j.error); toast('تمت النسخة الاحتياطية', 'ok'); bkDraw(await api('owner_backup_info')); } catch (e) { toast('فشلت النسخة: ' + (e.message || e), 'err'); } $('#sBkNow', ov).disabled = false; };
  $('#sBkDaily', ov).onclick = async () => { try { bkDraw(await api('owner_backup_daily', {}, { on: !$('#sBkDaily', ov).dataset.on })); } catch (e) { toast('تعذّر: ' + (e.message || e), 'err'); } };
  $('#sOut', ov).onclick = async () => { try { await api('logout'); } catch (e) { } CONN.session = ''; saveConn(); clearCaches(); location.reload(); };
  $('#sWipe', ov).onclick = async () => {
    if (!(await confirmBox('حذف كل الإعدادات', 'سيُحذف من الخادم رابط الملف وكل الإعدادات، ولن يرى الزوار أي بيانات حتى تُهيّئ المنظومة من جديد. لا يمكن التراجع.', 'نعم، احذف'))) return;
    try { const j = await api('owner_reset'); if (!j.ok) throw new Error(j.error); clearCaches(); toast('تم حذف الإعدادات', 'ok'); setTimeout(() => location.reload(), 600); } catch (e) { toast('تعذّر الحذف: ' + (e.message || e), 'err'); }
  };
  if ($('#sUnlink', ov)) $('#sUnlink', ov).onclick = async () => {
    if (!(await confirmBox('فصل هذا المتصفح', 'سيُنسى رابط الخادم وجلستك في هذا المتصفح فقط. تبقى الإعدادات على الخادم.', 'فصل'))) return;
    try { await api('logout'); } catch (e) { } CONN.webapp = ''; CONN.session = ''; saveConn(); clearCaches(); location.reload();
  };
  $('#sOk', ov).onclick = async () => {
    const m = $('#sMsg', ov), b = $('#sOk', ov); b.disabled = true; m.textContent = 'جارٍ الحفظ والتحقق من الملف…';
    try {
      const prev = JSON.stringify(S.source), p = collect();
      const j = await api('owner_save', {}, p);
      if (!j.ok) throw new Error(j.error || 'تعذّر الحفظ');
      S = merge(clone(C.DEFAULTS), j.settings); S.webapp = CONN.webapp; S.readVia = 'webapp'; REMOTE.configured = true;
      if (JSON.stringify(S.source) !== prev) ['arrival', 'departure'].forEach(k => { try { localStorage.removeItem('hajj1447.cache.' + k); } catch (e) { } state.data[k] = null; kindsInUse.forEach(x => { state.err[x] = null; }); });
      ov.close(); startAuto(); await refresh(); toast('تم الحفظ — تظهر هذه الإعدادات الآن لكل الزوار', 'ok');
    } catch (e) { m.innerHTML = '<div style="color:var(--red)">✗ ' + esc(e.message || e) + '</div>'; b.disabled = false; }
  };
  if (first) setTimeout(() => { const l = $('#sLink', ov); if (l) l.focus(); }, 50);
}

/* ---------------- التصدير ---------------- */
async function saveXlsx(sheets, filename) {
  await loadLib(LIBS.xlsx);
  const wb = XLSX.utils.book_new();
  sheets.forEach(s => {
    const rows = s.rows.length ? s.rows : [{ '—': 'لا توجد بيانات' }];
    const ws = XLSX.utils.json_to_sheet(rows);
    const keys = Object.keys(rows[0]);
    ws['!cols'] = keys.map(k => ({ wch: Math.min(42, Math.max(k.length + 2, ...rows.slice(0, 300).map(r => String(r[k] == null ? '' : r[k]).length + 2))) }));
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  });
  wb.Workbook = { Views: [{ RTL: true }] };
  XLSX.writeFile(wb, filename);
}
function reportHtml(o) {
  const th = 'style="background:#07182D;color:#E3C98A;padding:6px 8px;text-align:right;font-size:11px;border:1px solid #1b3556"';
  const td = 'style="padding:5px 8px;border:1px solid #d9d3c3;font-size:10.5px;vertical-align:middle"';
  return '<div dir="rtl" style="font-family:Tajawal,Tahoma,sans-serif;color:#0B1B30;background:#fff;padding:6px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #C5A059;padding-bottom:8px;margin-bottom:10px">' +
    '<div><div style="font-size:20px;font-weight:800;color:#07182D">' + esc(o.title) + '</div><div style="color:#5A6B82;font-size:11px">' + esc(o.sub || '') + '</div></div>' +
    '<div style="text-align:left;font-size:11px;color:#5A6B82">منظومة تحركات الحجاج 1447هـ<br>' + esc(new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { dateStyle: 'medium', timeStyle: 'short', timeZone: C.TZ_NAME }).format(new Date())) + '</div></div>' +
    '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">' + (o.kpis || []).map(k => '<div style="flex:1;min-width:110px;border:1px solid #d9d3c3;border-top:3px solid ' + (k[2] || '#C5A059') + ';border-radius:6px;padding:6px 10px"><div style="font-size:10.5px;color:#5A6B82">' + esc(k[0]) + '</div><div style="font-size:19px;font-weight:800">' + esc(k[1]) + '</div></div>').join('') + '</div>' +
    '<table style="width:100%;border-collapse:collapse"><thead><tr>' + o.head.map(h => '<th ' + th + '>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
    o.rows.map((r, i) => '<tr style="page-break-inside:avoid;background:' + (i % 2 ? '#faf8f3' : '#fff') + '">' + r.map(c => '<td ' + td + '>' + (c && c.html != null ? c.html : esc(c)) + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>';
}
async function savePDF(html, filename, landscape) {
  await loadLib(LIBS.pdf);
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-99999px;top:0;width:' + (landscape ? 1100 : 760) + 'px;background:#fff';
  host.innerHTML = html; document.body.appendChild(host);
  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await html2pdf().set({ margin: [8, 8, 10, 8], filename, image: { type: 'jpeg', quality: .95 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' }, jsPDF: { unit: 'mm', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' }, pagebreak: { mode: ['css', 'legacy'], avoid: ['tr'] } }).from(host).save();
  } finally { host.remove(); }
}
const stamp = () => C.fmtDay(new Date());
const flagImg = c => c ? '<img src="' + C.flagUrl(c.iso2, 40) + '" crossorigin="anonymous" style="width:20px;height:14px;vertical-align:middle;margin-left:5px;border:1px solid #ccc" onerror="this.style.display=\'none\'">' + esc(c.ar) : '';
const exportRow = (kind, r, reveal, extra) => {
  const o = {
    'الاسم': r.name, 'الجنسية': r.country ? r.country.ar : r.natRaw, 'رقم الجواز': reveal ? r.passport : mask(r.passport),
    'الرحلة': r.flight, 'الناقل': r.airline, 'المطار': r.airport, [kind === 'arrival' ? 'مدينة الوصول' : 'مدينة المغادرة']: C.cityName(r.airCity, r.airCityRaw),
    'التاريخ': r.when ? C.fmtDay(r.when) : r.date, 'الوقت': r.when && !r.approx ? C.fmtTime(r.when) : r.time,
    'الفندق': r.hotel, 'مدينة الإقامة': C.cityName(r.stayCity, r.stayCityRaw), 'الغرفة': r.room, 'المجموعة': r.group,
    'الحالة': ST_LABEL[kind][r._st] || '', [kind === 'arrival' ? 'تم التسكين' : 'تمت المغادرة']: r.done ? 'نعم' : 'لا'
  };
  if (extra) Object.assign(o, extra);
  return o;
};

/* =====================================================================
   صفحة المتابعة (الوصول / المغادرة)
   ===================================================================== */
const KIND = {
  arrival: { title: 'متابعة الوصول', sub: 'رصد وصول الحجاج وتأكيد التسكين في الفنادق', doneL: 'تم التسكين', openL: 'بانتظار التسكين', act: 'تأكيد التسكين', total: 'إجمالي القادمين' },
  departure: { title: 'متابعة المغادرة', sub: 'متابعة مغادرة الفنادق وإنهاء إجراءات الجوازات قبل الرحلات', doneL: 'تمت المغادرة', openL: 'بانتظار التأكيد', act: 'تأكيد المغادرة (الفندق والجوازات)', total: 'إجمالي المغادرين' }
};
// أقسام الرحلات: الوصول بحسب موعد الوصول، والمغادرة بحسب موعد التحرك من الفندق (وإلا الإقلاع)
const SEC_DEFS = {
  arrival: [
    { id: 'cur', cls: 'now', t: 'رحلات حالية', s: 'من نصف ساعة قبل الوصول إلى نصف ساعة بعده' },
    { id: 'arr', cls: 'done', t: 'رحلات وصلت', s: 'مضى على وصولها أكثر من نصف ساعة — الأحدث أولاً' },
    { id: 'soon', cls: 'soon', t: 'قريبة الوصول', s: 'تصل بعد أكثر من نصف ساعة — الأقرب أولاً' }
  ],
  departure: [
    { id: 'cur', cls: 'now', t: 'تتحرك الآن', s: 'من نصف ساعة قبل التحرك إلى نصف ساعة بعده' },
    { id: 'arr', cls: 'done', t: 'تحرّكت', s: 'مضى على موعد تحركها أكثر من نصف ساعة — الأحدث أولاً' },
    { id: 'soon', cls: 'soon', t: 'قريبة التحرك', s: 'تتحرك بعد أكثر من نصف ساعة — الأقرب أولاً' }
  ]
};
const SEC_N = 5, SEC_MAX = 60, SEC_MS = 30 * 60000;
function initTracker(kind) {
  const K = KIND[kind], app = $('#app');
  let view = null; try { view = localStorage.getItem(LS_VIEW); } catch (e) { }
  if (view !== 'cards' && view !== 'table') view = window.matchMedia('(max-width:760px)').matches ? 'cards' : 'table';
  const ui = { q: '', status: 'all', nat: 'all', day: 'all', flight: 'all', rdy: 'all', sec: null, sortK: 'when', dir: 1, reveal: false, limit: 150, sel: new Set(), open: new Set(), view, modal: null };
  const qs = new URLSearchParams(location.search); ['status', 'q', 'day', 'nat', 'flight', 'rdy'].forEach(k => { if (qs.get(k)) ui[k] = qs.get(k); });
  let prevDanger = null, gmap = new Map(), ridx = new Map(), mo = null, shownGroups = [], lastFl = null;
  // موعد المرجع للرحلة: الوصول، أو في المغادرة أبكر موعد تحرك بين سجلاتها (وإلا الإقلاع)
  const refOf = g => {
    if (kind !== 'departure') return g.when;
    let m = null; g.rows.forEach(r => { const t = C.movementTime(r.when, r.stayCity, r.airCity, S.lead); if (t && (!m || t < m)) m = t; });
    return m || g.when;
  };
  const flCard = (g, now, ref) => {
    const t = ref ? ref.getTime() : null, h = t ? (t - now) / 36e5 : null;
    const lv = t ? (t < now ? 'warn' : (h <= S.criticalH ? 'danger' : (h <= S.warnH ? 'warn' : ''))) : '';
    const full = g.done >= g.pax, dep = kind === 'departure';
    const rdy = rdyHtml(g), flag = C.groupRecords(g.rows).filter(x => { const n = noteOf(x); return n && (n.status === 'delayed' || n.status === 'issue'); }).length;
    return '<div class="fl ' + (full ? 'full' : lv) + (ui.flight === g.key ? ' on' : '') + '" data-flight="' + esc(g.key) + '"><div class="t"><span class="no">' + esc(g.flight) + (flag ? ' <span class="flag" title="فيها مجموعات متأخرة أو بها مشكلة">⚠</span>' : '') + '</span><span class="sub">' + (ref ? C.fmtDayAr(ref) : '') + '</span></div>' +
      '<div class="m"><span>' + (dep ? 'التحرك' : esc(g.airline || '')) + '</span><span class="num">' + (ref ? C.fmtTime(ref) : '') + '</span></div>' +
      (dep && g.when ? '<div class="m"><span>الإقلاع</span><span class="num">' + C.fmtTime(g.when) + '</span></div>' : '') +
      '<div class="cd-wrap">' + (ref ? '<span class="cd" data-w="' + t + '" style="font-size:18px;font-weight:700"></span>' : '') + '</div>' +
      rdy + '<div class="bar" style="margin-top:8px"><i style="width:' + Math.round(g.done / g.pax * 100) + '%"></i></div>' +
      '<div class="row"><span class="num">' + g.done + ' / ' + g.pax + '</span>' + (full ? '<span class="okmark">✓ مكتمل</span>' : '<button class="btn sm" data-fok="' + esc(g.key) + '">' + ICON.check + (dep ? 'مغادرة الكل' : 'تأكيد الكل') + '</button>') + '<button class="btn sm" data-fshare="' + esc(g.key) + '" title="مشاركة ملخص الرحلة" aria-label="مشاركة ملخص الرحلة">📤</button>' + (kind === 'arrival' ? '<button class="btn sm" data-fready="' + esc(g.key) + '" title="الاستعداد المسبق" aria-label="الاستعداد المسبق">🛬</button>' : '') + '</div></div>';
  };
  // أقسام مختصرة بأعلى الصفحة؛ الضغط على قسم يعرض رحلاته (خمس كحد أقصى) أسفله، والجدول كما هو
  function drawRail(fl, now) {
    lastFl = fl;
    const defs = SEC_DEFS[kind], T = fl.map(g => ({ g, ref: refOf(g) })).filter(x => x.ref), w = x => x.ref.getTime();
    const lists = {
      cur: T.filter(x => Math.abs(w(x) - now) <= SEC_MS).sort((a, b) => w(a) - w(b)),
      arr: T.filter(x => now - w(x) > SEC_MS).sort((a, b) => w(b) - w(a)),
      soon: T.filter(x => w(x) - now > SEC_MS).sort((a, b) => w(a) - w(b))
    };
    $('#secTiles').innerHTML = defs.map(x => {
      const l = lists[x.id], f = l[0];
      return '<button type="button" class="stile ' + x.cls + (ui.sec === x.id ? ' on' : '') + '" data-sec="' + x.id + '" aria-expanded="' + (ui.sec === x.id) + '"><span class="st">' + x.t + '</span><span class="sn">' + l.length + '</span>' +
        '<span class="ss">' + (f ? '<b>' + esc(f.g.flight) + '</b> <span class="cd" data-w="' + w(f) + '"></span>' : '—') + '</span></button>';
    }).join('');
    const pn = $('#secPanel'), cur = defs.find(x => x.id === ui.sec);
    if (!cur) { pn.hidden = true; pn.innerHTML = ''; return; }
    const l = lists[cur.id];
    pn.hidden = false;
    pn.innerHTML = '<div class="sec ' + cur.cls + '"><div class="sec-h"><b>' + cur.t + '</b><span class="cnt">' + l.length + '</span><span class="hint">' + cur.s + ' · اضغط رحلة لتصفية الجدول' + (l.length > SEC_N ? ' · اسحب يميناً لعرض البقية ›' : '') + '</span></div>' +
      '<div class="rail">' + (l.length ? l.slice(0, SEC_MAX).map(x => flCard(x.g, now, x.ref)).join('') : '<div class="empty" style="width:100%;padding:12px">لا توجد رحلات في هذا القسم</div>') + '</div></div>';
  }
  setInterval(() => { if (lastFl) drawRail(lastFl, Date.now()); }, 20000);   // تنتقل الرحلات بين الأقسام مع الوقت

  app.innerHTML = '<section class="hero"><div><h1>' + K.title + '</h1><p>' + K.sub + '</p></div><div class="hero-actions">' +
    '<button class="btn green" id="xXls">' + ICON.xls + 'Excel</button><button class="btn sky" id="xPdf">' + ICON.pdf + 'PDF</button><button class="btn" id="xPrint">' + ICON.print + 'طباعة</button></div></section>' +
    '<div id="stale"></div><div class="kpis" id="kpis"></div><div id="alertbar"></div>' +
    '<section class="secs"><div class="sectiles" id="secTiles"></div><div class="secpanel panel" id="secPanel" hidden></div></section>' +
    '<section class="panel"><div id="tphint"></div><div class="toolbar">' +
    '<div class="qchips" id="qchips"></div>' +
    '<div class="field">' + ICON.search + '<input type="search" id="fQ" placeholder="بحث: اسم، جواز، رحلة، فندق…" value="' + esc(ui.q) + '"></div>' +
    '<select id="fStatus"><option value="all">كل الحالات</option><option value="open">' + K.openL + '</option><option value="done">' + K.doneL + '</option><option value="danger">حرجة / متأخرة</option><option value="warn">تستدعي الانتباه</option></select>' +
    '<select id="fNat"></select><select id="fDay"></select>' +
    '<label class="sw'+(isMasked()?'" hidden data-x="':'')+'"><input type="checkbox" id="fReveal"> إظهار أرقام الجوازات</label><span class="sp"></span><span class="hint" id="cnt"></span><button class="btn sm" id="bLegend" title="دلالات الألوان والحالات" aria-label="دلالات الألوان">؟</button><button class="btn sm" id="bBell" title="تنبيه صوتي عند ظهور حالات حرجة جديدة" aria-pressed="false">🔔</button>' +
    '<div class="seg" role="group" aria-label="طريقة العرض"><button data-view="table" title="عرض جدول">' + ICON.table + '<span>جدول</span></button><button data-view="cards" title="عرض بطاقات">' + ICON.cards + '<span>بطاقات</span></button></div></div>' +
    '<div class="bulk" id="bulk" hidden></div><div id="list"></div><div class="more" id="more"></div></section>';
  $('#fStatus').value = ui.status;

  const recs = () => (state.data[kind] ? state.data[kind].records : []);
  const flightKey = rKey;
  const natLabel = r => r.country ? r.country.ar : (r.natRaw || 'غير محدد');
  function passes(r) {
    if (ui.q) { const h = r._h || (r._h = normAr([r.name, r.passport, r.flight, r.hotel, r.room, r.group, r.phone, r.natRaw, r.country && r.country.ar].join(' '))); if (!h.includes(normAr(ui.q))) return false; }
    if (ui.nat !== 'all' && C.natKey(r) !== ui.nat) return false;
    if (ui.day !== 'all' && !(r.when && C.fmtDay(r.when) === ui.day)) return false;
    if (ui.flight !== 'all' && flightKey(r) !== ui.flight) return false;
    if (ui.rdy === 'no' && (kind !== 'arrival' || r.done || readyOk(state.ready[rKey(r)]))) return false;
    return true;
  }
  function groupPass(g) {
    if (!g.rows.some(passes)) return false;
    switch (ui.status) {
      case 'open': return g.open > 0; case 'done': return g.open === 0;
      case 'danger': return g.open > 0 && g.cls === 'danger'; case 'warn': return g.open > 0 && (g.cls === 'warn' || g.cls === 'danger');
    }
    return true;
  }
  const gsort = {
    flight: (a, b) => a.flight.localeCompare(b.flight), hotel: (a, b) => (a.hotel || '').localeCompare(b.hotel || '', 'ar'), pax: (a, b) => a.pax - b.pax,
    when: (a, b) => (a.when ? a.when.getTime() : 9e15) - (b.when ? b.when.getTime() : 9e15), status: (a, b) => ST[b.st].lv - ST[a.st].lv
  };
  const sortedGroups = all => all.filter(groupPass).sort((a, b) => ui.dir * (gsort[ui.sortK] || gsort.when)(a, b) || gsort.when(a, b));
  const gWhen = g => g.when ? C.fmtDayAr(g.when) + ' · ' + (g.approx ? '≈' : '') + C.fmtTime(g.when) : '—';
  const natText = g => g.natList.map(n => n.label + ' ' + n.n).join('، ');
  const gTitle = g => 'رحلة ' + g.flight + (g.hotel ? ' — ' + g.hotel : '');
  const fileTag = g => String(g.flight).replace(/[^\w؀-ۿ-]+/g, '_');

  const natChips = (g, max) => {
    const sh = g.natList.slice(0, max), rest = g.natList.length - sh.length;
    return '<div class="nchips">' + sh.map(n => '<button class="nchip" data-grp="' + esc(g.key) + '" data-nat="' + esc(n.k) + '" title="عرض جوازات ' + esc(n.label) + '">' +
      (n.c ? '<img class="flag" loading="lazy" alt="" src="' + C.flagUrl(n.c.iso2, 40) + '" onerror="this.style.visibility=\'hidden\'">' : '<span class="flag ph">؟</span>') + '<span>' + esc(n.label) + '</span><b class="num">' + n.n + '</b></button>').join('') +
      (rest > 0 ? '<button class="nchip more" data-grp="' + esc(g.key) + '" title="عرض الكل">+' + rest + '</button>' : '') + '</div>';
  };
  const stChip = g => '<span class="chip ' + (g.syncing ? 'sync' : g.cls) + '">' + (g.syncing ? 'جارٍ المزامنة…' : esc(ST_LABEL[kind][g.st] || g.st)) + '</span>' + (g.open > 0 && g.done > 0 ? '<div class="sub num">مكتمل ' + g.done + ' من ' + g.pax + '</div>' : '');
  /* ---- الاستعداد المسبق للرحلة ---- */
  const missingOf = g => { const m = { passport: 0, nat: 0, hotel: 0 }; let rows = 0; g.rows.forEach(r => { const a = !r.passport, b = !r.natRaw, c = !r.hotel; if (a) m.passport++; if (b) m.nat++; if (c) m.hotel++; if (a || b || c) rows++; }); return { m, rows }; };
  function rdyHtml(g) {
    if (kind !== 'arrival') return '';
    const e = state.ready[g.key], ms = missingOf(g), w0 = g.rows.reduce((a, r) => (r.when0 && (!a || r.when0 < a) ? r.when0 : a), null), out = [];
    out.push('<span class="rb ' + (e && e.status ? e.status : 'none') + '">' + esc(e && e.status ? RDY_ST[e.status] : 'الاستعداد: غير مسجّل') + '</span>');
    if (e && e.eta && w0 && g.when) { const dm = Math.round((g.when - w0) / 60000); out.push('<span class="rb eta">ETA ' + C.fmtTime(g.when) + (dm ? ' (' + (dm > 0 ? '+' : '−') + dur0(Math.abs(dm)) + ')' : '') + '</span>'); }
    if (e && (e.hall || e.gate)) out.push('<span class="rb loc">🚪 ' + esc([e.hall, e.gate].filter(Boolean).join(' · ')) + '</span>');
    if (ms.rows) out.push('<span class="rb miss" title="جواز: ' + ms.m.passport + ' · جنسية: ' + ms.m.nat + ' · فندق: ' + ms.m.hotel + '">⚠ بيانات ناقصة (' + ms.rows + ')</span>');
    return '<div class="rdy">' + out.join('') + '</div>';
  }
  const dur0 = m => m >= 60 ? Math.floor(m / 60) + ' س' + (m % 60 ? ' ' + (m % 60) + ' د' : '') : m + ' د';
  async function openReady(g) {
    const e = state.ready[g.key] || {}, ms = missingOf(g), w0 = g.rows.reduce((a, r) => (r.when0 && (!a || r.when0 < a) ? r.when0 : a), null);
    const fmtIn = d => d ? C.fmtDay(d) + 'T' + C.fmtTime(d) : '', cur = e.eta ? e.eta.replace(' ', 'T') : '';
    const ov = modal('<h3>الاستعداد المسبق — رحلة ' + esc(g.flight) + '</h3><p class="sub">الموعد الأصلي: ' + (w0 ? C.fmtDayAr(w0) + ' · ' + C.fmtTime(w0) : '—') + ' · ' + g.pax + ' فرد</p>' +
      '<div class="nsel">' + [['', 'غير مسجّل']].concat(Object.keys(RDY_ST).map(k => [k, RDY_ST[k]])).map(([k, l]) => '<label class="qc' + ((e.status || '') === k ? ' on' : '') + '"><input type="radio" name="rst" value="' + k + '"' + ((e.status || '') === k ? ' checked' : '') + ' hidden>' + esc(l) + '</label>').join('') + '</div>' +
      '<div class="set"><label>الوقت المحدّث للوصول (ETA)<input id="rEta" type="datetime-local" value="' + esc(cur) + '"></label><label>الصالة<input id="rHall" maxlength="30" value="' + esc(e.hall || '') + '"></label><label>البوابة / الجسر<input id="rGate" maxlength="30" value="' + esc(e.gate || '') + '"></label><label class="full">ملاحظة<textarea id="rNote" maxlength="300" rows="2">' + esc(e.note || '') + '</textarea></label></div>' +
      (ms.rows ? '<p class="hint" style="color:var(--amber,#f5a524)">⚠ ' + ms.rows + ' سجل ناقص قبل الإدخال في نظام الوزارة — بلا جواز: ' + ms.m.passport + ' · بلا جنسية: ' + ms.m.nat + ' · بلا فندق: ' + ms.m.hotel + '</p>' : '<p class="hint">✓ بيانات الرحلة مكتملة (جواز وجنسية وفندق لكل فرد).</p>') +
      '<div class="act"><button class="btn green" id="rOk">حفظ</button>' + (e.status || e.eta || e.hall || e.gate || e.note ? '<button class="btn" id="rClr">مسح</button>' : '') + '<button class="btn" id="rX">إلغاء</button></div>');
    ov.querySelectorAll('.nsel input').forEach(r => r.onchange = () => ov.querySelectorAll('.nsel .qc').forEach(l => l.classList.toggle('on', l.firstChild.checked)));
    const save = async v => {
      const auth = await ensureAuth(); if (!auth) return;
      try {
        const j = await api('ready_set', {}, Object.assign({ key: g.key, label: 'رحلة ' + g.flight, by: auth.by, pin: auth.pin }, v));
        if (!j.ok) { if (j.error === 'bad_pin') { ssSet(SS_PIN, ''); updateRole(); } throw new Error({ bad_pin: 'رمز المشرف غير صحيح', locked: 'محاولات كثيرة — انتظر 15 دقيقة', readonly: 'الموقع بوضع العرض فقط' }[j.error] || j.error || 'فشل الحفظ'); }
        if (j.cleared) delete state.ready[g.key]; else state.ready[g.key] = Object.assign({ key: g.key }, v, { by: auth.by });
        try { localStorage.setItem('hajj1447.ready', JSON.stringify(state.ready)); } catch (x) { }
        applyReady(); ov.close(); render(); toast(j.cleared ? 'تم مسح الاستعداد' : 'تم حفظ الاستعداد المسبق', 'ok');
      } catch (x) { toast('فشل الحفظ: ' + (x.message || x), 'err'); }
    };
    $('#rOk', ov).onclick = () => { const et = $('#rEta', ov).value; save({ status: (ov.querySelector('input[name=rst]:checked') || {}).value || '', eta: et ? et.replace('T', ' ').slice(0, 16) : '', hall: $('#rHall', ov).value.trim(), gate: $('#rGate', ov).value.trim(), note: $('#rNote', ov).value.trim() }); };
    if ($('#rClr', ov)) $('#rClr', ov).onclick = () => save({ status: '', eta: '', hall: '', gate: '', note: '' });
    $('#rX', ov).onclick = () => ov.close();
  }
  /* ---- حالة النقل والملاحظة ---- */
  const NST = () => ({ vehicle: kind === 'arrival' ? 'وصلت الحافلة/القطار' : 'وصلت الوسيلة للفندق', enroute: kind === 'arrival' ? 'في الطريق إلى الفندق' : 'في الطريق إلى المطار', delayed: 'تأخر النقل', issue: 'مشكلة تحتاج متابعة' });
  const nkey = g => String(g.key).slice(0, 200);
  const noteOf = g => state.notes[kind][nkey(g)] || null;
  const noteChip = g => { const n = noteOf(g); if (!n || (!n.status && !n.note)) return ''; return '<div class="ntag ' + esc(n.status) + '">' + (n.status ? '<b>' + esc(NST()[n.status] || '') + '</b>' : '') + (n.note ? '<span>📝 ' + esc(n.note) + '</span>' : '') + (n.by ? '<small>' + esc(n.by) + '</small>' : '') + '</div>'; };
  async function openNote(g) {
    const n = noteOf(g) || { status: '', note: '' }, L = NST();
    const ov = modal('<h3>حالة النقل والملاحظة</h3><p class="sub">' + esc(gTitle(g)) + '</p><div class="nsel">' +
      [['', 'بلا حالة']].concat(Object.keys(L).map(k => [k, L[k]])).map(([k, l]) => '<label class="qc' + (n.status === k ? ' on' : '') + '"><input type="radio" name="nst" value="' + k + '"' + (n.status === k ? ' checked' : '') + ' hidden>' + esc(l) + '</label>').join('') +
      '</div><div class="set"><label class="full">ملاحظة (حتى 300 حرف)<textarea id="nTx" maxlength="300" rows="3">' + esc(n.note || '') + '</textarea></label></div><div class="act"><button class="btn green" id="nOk">حفظ</button>' + ((n.status || n.note) ? '<button class="btn" id="nClr">مسح</button>' : '') + '<button class="btn" id="nX">إلغاء</button></div>');
    ov.querySelectorAll('.nsel input').forEach(r => r.onchange = () => ov.querySelectorAll('.nsel .qc').forEach(l => l.classList.toggle('on', l.firstChild.checked)));
    const save = async (st, note) => {
      const auth = await ensureAuth(); if (!auth) return;
      try {
        const j = await api('note_set', {}, { kind, key: nkey(g), label: gTitle(g), status: st, note, by: auth.by, pin: auth.pin });
        if (!j.ok) { if (j.error === 'bad_pin') { ssSet(SS_PIN, ''); updateRole(); } throw new Error({ bad_pin: 'رمز المشرف غير صحيح', locked: 'محاولات كثيرة — انتظر 15 دقيقة', readonly: 'الموقع بوضع العرض فقط' }[j.error] || j.error || 'فشل الحفظ'); }
        if (!st && !note) delete state.notes[kind][nkey(g)]; else state.notes[kind][nkey(g)] = { key: nkey(g), status: st, note, by: auth.by, at: '' };
        try { localStorage.setItem('hajj1447.notes.' + kind, JSON.stringify(state.notes[kind])); } catch (e) { }
        ov.close(); render(); toast(!st && !note ? 'تم مسح الملاحظة' : 'تم حفظ الحالة والملاحظة', 'ok');
      } catch (e) { toast('فشل الحفظ: ' + (e.message || e), 'err'); }
    };
    $('#nOk', ov).onclick = () => save((ov.querySelector('input[name=nst]:checked') || {}).value || '', $('#nTx', ov).value.trim());
    if ($('#nClr', ov)) $('#nClr', ov).onclick = () => save('', '');
    $('#nX', ov).onclick = () => ov.close();
  }
  const gAct = g => (g.open === 0
    ? '<button class="btn sm" data-gact="undo" data-key="' + esc(g.key) + '"' + (g.allSyncing ? ' disabled' : '') + '>تراجع</button>'
    : '<button class="btn sm green" data-gact="ok" data-key="' + esc(g.key) + '"' + (g.allSyncing ? ' disabled' : '') + '>' + ICON.check + (kind === 'arrival' ? 'تسكين' : 'مغادرة') + (g.done ? ' المتبقي' : ' الكل') + '</button>') + '<button class="btn sm" data-gnote="' + esc(g.key) + '" title="حالة النقل وملاحظة" aria-label="حالة النقل وملاحظة">📝</button>';
  const ppBtn = g => '<button class="btn sm sky" data-grp="' + esc(g.key) + '">' + ICON.eye + 'الجوازات (' + g.rows.length + ')</button>';
  const tpOn = () => !!(S.transport && S.transport[kind]);
  const gTransport = g => tpOn() ? C.transportFor(g.airCity, g.stayCity, g.pax, S.transport.busMin) : null;
  const tpLabel = g => { const x = gTransport(g); return x ? C.TRANSPORT[x].ar : ''; };
  const tpHtml = x => x ? '<span class="tp ' + x + '">' + ICON[x] + C.TRANSPORT[x].ar + '</span>' : '<span class="sub">—</span>';
  const gMove = g => kind === 'departure' ? C.movementTime(g.when, g.stayCity, g.airCity, S.lead) : null;
  const moveTxt = g => { const m = gMove(g); return m ? C.fmtDayAr(m) + ' · ' + (g.approx ? '≈' : '') + C.fmtTime(m) : ''; };
  const mvHtml = g => moveTxt(g) ? '<div class="mv">التحرك: ' + moveTxt(g) + '</div>' : '';
  const gExtra = g => { const o = { 'وسيلة النقل': tpLabel(g) }; if (kind === 'departure') { const m = gMove(g); o['تاريخ التحرك'] = m ? C.fmtDay(m) : ''; o['وقت التحرك'] = m && !g.approx ? C.fmtTime(m) : ''; } return o; };
  const airCityTxt = g => C.cityName(g.airCity, g.airCityRaw), stayCityTxt = g => C.cityName(g.stayCity, g.stayCityRaw);
  const twoLine = (main, sub) => (main || sub) ? (main ? '<b>' + esc(main) + '</b>' : '') + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') : '—';
  const gCd = g => g.when && g.open > 0 ? '<span class="cd" data-w="' + g.when.getTime() + '"></span>' : '<span class="sub">—</span>';

  /* ---- جدول المجموعات ---- */
  function tableHtml(groups, d, ci) {
    const hasHotel = d.map.hotel != null || ci.stay;
    const cols = [
      { id: 'sel', th: '<input type="checkbox" data-selall aria-label="تحديد الكل">' }, { id: 'n', th: '#' },
      { id: 'flight', th: 'الرحلة', sort: 'flight' }, { id: 'when', th: kind === 'arrival' ? 'موعد الوصول' : 'موعد الإقلاع / التحرك', sort: 'when' }, { id: 'cd', th: 'العدّ التنازلي' },
      ci.air && { id: 'air', th: 'المطار' }, hasHotel && { id: 'hotel', th: 'الفندق', sort: 'hotel' }, ci.tp && { id: 'tp', th: 'وسيلة النقل' }, { id: 'pax', th: 'العدد', sort: 'pax' }, { id: 'nat', th: 'الجنسيات' }, { id: 'pp', th: 'الجوازات' },
      { id: 'st', th: 'الحالة', sort: 'status' }, { id: 'act', th: '' }
    ].filter(Boolean);
    const cell = (c, g, i) => {
      switch (c.id) {
        case 'sel': return '<td><input type="checkbox" data-sel="' + esc(g.key) + '"' + (ui.sel.has(g.key) ? ' checked' : '') + ' aria-label="تحديد"></td>';
        case 'n': return '<td class="sub">' + (i + 1) + '</td>';
        case 'flight': return '<td><b>' + esc(g.flight) + '</b>' + (g.airline ? '<div class="sub">' + esc(g.airline) + '</div>' : '') + '</td>';
        case 'when': return '<td>' + gWhen(g) + mvHtml(g) + '</td>';
        case 'cd': return '<td>' + gCd(g) + '</td>';
        case 'air': return '<td>' + twoLine(g.airport, airCityTxt(g)) + '</td>';
        case 'hotel': return '<td>' + twoLine(g.hotel, stayCityTxt(g)) + '</td>';
        case 'tp': return '<td>' + tpHtml(gTransport(g)) + '</td>';
        case 'pax': return '<td><b class="num" style="font-size:17px">' + g.pax + '</b><div class="bar" style="width:70px;margin-top:4px"><i style="width:' + Math.round(g.done / g.pax * 100) + '%"></i></div></td>';
        case 'nat': return '<td>' + natChips(g, 3) + '</td>';
        case 'pp': return '<td>' + ppBtn(g) + '</td>';
        case 'st': return '<td>' + stChip(g) + noteChip(g) + '</td>';
        case 'act': return '<td>' + gAct(g) + '</td>';
      }
      return '<td></td>';
    };
    return '<div class="tablewrap"><table id="tbl"><thead><tr>' + cols.map(c => '<th' + (c.sort ? ' class="sort" data-sort="' + c.sort + '"' : '') + '>' + c.th + (c.sort && ui.sortK === c.sort ? '<span class="ar">' + (ui.dir > 0 ? '▲' : '▼') + '</span>' : '') + '</th>').join('') + '</tr></thead><tbody>' +
      (groups.length ? groups.map((g, i) => '<tr class="r ' + (g.open === 0 ? 'done ' : '') + (g.open && g.cls === 'danger' ? 'danger ' : g.open && g.cls === 'warn' ? 'warn ' : '') + (g.syncing ? 'syncing' : '') + '">' + cols.map(c => cell(c, g, i)).join('') + '</tr>').join('') :
        '<tr><td colspan="' + cols.length + '"><div class="empty">لا توجد نتائج مطابقة</div></td></tr>') + '</tbody></table></div>';
  }
  /* ---- بطاقات المجموعات ---- */
  function cardsHtml(groups, ci) {
    if (!groups.length) return '<div class="empty">لا توجد نتائج مطابقة</div>';
    return '<div class="cards">' + groups.map(g =>
      '<article class="gcard ' + (g.open === 0 ? 'done ' : '') + (g.open && g.cls === 'danger' ? 'danger ' : g.open && g.cls === 'warn' ? 'warn ' : '') + '">' +
      '<header><label class="chk"><input type="checkbox" data-sel="' + esc(g.key) + '"' + (ui.sel.has(g.key) ? ' checked' : '') + ' aria-label="تحديد"></label><div class="gt"><b class="no">' + esc(g.flight) + '</b>' + (g.airline ? '<div class="sub">' + esc(g.airline) + '</div>' : '') + '</div><div class="gs">' + stChip(g) + '</div></header>' +
      '<div class="gbig"><div><b class="num">' + g.pax + '</b><span>فرد</span></div><div class="gcd">' + gCd(g) + '</div></div>' +
      '<div class="bar"><i style="width:' + Math.round(g.done / g.pax * 100) + '%"></i></div>' + noteChip(g) +
      '<dl class="gkv"><div><dt>' + (kind === 'arrival' ? 'الموعد' : 'الإقلاع') + '</dt><dd>' + gWhen(g) + mvHtml(g) + '</dd></div>' + (ci.air ? '<div><dt>' + (kind === 'arrival' ? 'مطار الوصول' : 'مطار المغادرة') + '</dt><dd>' + twoLine(g.airport, airCityTxt(g)) + '</dd></div>' : '') + ((g.hotel || ci.stay) ? '<div><dt>الفندق</dt><dd>' + twoLine(g.hotel, stayCityTxt(g)) + '</dd></div>' : '') + (ci.tp ? '<div><dt>وسيلة النقل</dt><dd>' + tpHtml(gTransport(g)) + '</dd></div>' : '') + '</dl>' +
      natChips(g, 4) + '<footer>' + ppBtn(g) + gAct(g) + '</footer></article>').join('') + '</div>';
  }

  /* ---- مرشحات سريعة ورابط العرض ---- */
  const dayOf = off => C.fmtDay(new Date(Date.now() + off * 864e5));
  function drawChips() {
    const defs = [['all', 'الكل', ui.status === 'all' && ui.day === 'all' && ui.flight === 'all' && ui.rdy === 'all' && !ui.q && ui.nat === 'all'], ['danger', 'حرجة / متأخرة', ui.status === 'danger'], ['warn', 'تستدعي الانتباه', ui.status === 'warn'], ['open', K.openL, ui.status === 'open'], ...(kind === 'arrival' ? [['rdy', 'غير جاهزة', ui.rdy === 'no']] : []), ['today', 'اليوم', ui.day === dayOf(0)], ['tomorrow', 'غداً', ui.day === dayOf(1)]];
    $('#qchips').innerHTML = defs.map(d => '<button type="button" class="qc' + (d[2] ? ' on' : '') + '" data-qc="' + d[0] + '">' + d[1] + '</button>').join('') + '<button type="button" class="qc link" data-qc="link" title="نسخ رابط هذا العرض">🔗 نسخ رابط العرض</button>';
  }
  function viewLink() {
    const p = new URLSearchParams(); ['status', 'q', 'day', 'nat', 'flight', 'rdy'].forEach(k => { if (ui[k] && ui[k] !== 'all') p.set(k, ui[k]); });
    return location.origin + location.pathname + (p.toString() ? '?' + p : '') + location.hash;
  }
  function copyText(t, okMsg) {
    const fb = () => { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); toast(okMsg, 'ok'); } catch (e) { toast('تعذّر النسخ', 'err'); } a.remove(); };
    (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t).then(() => toast(okMsg, 'ok'), fb) : fb());
  }
  function qChip(v) {
    ui.limit = 150;
    if (v === 'link') { copyText(viewLink(), 'نُسخ رابط العرض'); return; }
    if (v === 'rdy') ui.rdy = ui.rdy === 'no' ? 'all' : 'no';
    else if (v === 'all') { ui.status = 'all'; ui.day = 'all'; ui.flight = 'all'; ui.rdy = 'all'; ui.nat = 'all'; ui.q = ''; $('#fQ').value = ''; }
    else if (v === 'today' || v === 'tomorrow') { const d = dayOf(v === 'today' ? 0 : 1); ui.day = ui.day === d ? 'all' : d; }
    else ui.status = ui.status === v ? 'all' : v;
    render();
  }
  /* ---- ملخص الرحلة: نص للمشاركة وورقة للطباعة ---- */
  const flightLink = fg => { const u = new URL(kind + '.html', location.href); u.search = '?flight=' + encodeURIComponent(fg.key); return u.href + (CONN.webapp ? '#w=' + b64e(CONN.webapp) : ''); };
  const hotelGroups = fg => C.groupRecords(fg.rows).sort((a, b) => (a.hotel || '').localeCompare(b.hotel || '', 'ar'));
  function flightText(fg) {
    const dep = kind === 'departure', ref = refOf(fg);
    const L = [(dep ? '✈️ مغادرة — رحلة ' : '✈️ وصول — رحلة ') + fg.flight + (fg.airline ? ' (' + fg.airline + ')' : ''),
      (dep ? 'الإقلاع: ' : 'الوصول: ') + (fg.when ? C.fmtDayAr(fg.when) + ' · ' + C.fmtTime(fg.when) : '—')];
    if (dep && ref && fg.when && ref.getTime() !== fg.when.getTime()) L.push('أبكر تحرك: ' + C.fmtDayAr(ref) + ' · ' + C.fmtTime(ref));
    L.push('العدد: ' + fg.pax + ' فرد · ' + (dep ? 'غادر ' : 'سُكّن ') + fg.done);
    const air = fg.rows.find(r => r.airport); if (air) L.push('المطار: ' + air.airport);
    { const e = kind === 'arrival' ? state.ready[fg.key] : null; if (e) { if (e.status) L.push('الاستعداد المسبق: ' + RDY_ST[e.status]); if (e.hall || e.gate) L.push('الصالة/البوابة: ' + [e.hall, e.gate].filter(Boolean).join(' · ')); if (e.note) L.push('ملاحظة: ' + e.note); } }
    L.push('');
    hotelGroups(fg).forEach(g => {
      const parts = [g.hotel || 'فندق غير محدد']; const cn = C.cityName(g.stayCity, g.stayCityRaw); if (cn) parts.push(cn);
      L.push('🏨 ' + parts.join(' — ') + ' (' + g.pax + ')');
      const nt = noteOf(g); if (nt && (nt.status || nt.note)) L.push('   ' + (nt.status ? '🚦 ' + NST()[nt.status] : '') + (nt.note ? ' 📝 ' + nt.note : ''));
      const tp = gTransport(g), mv = moveTxt(g); const x = [tp ? 'النقل: ' + C.TRANSPORT[tp].ar : '', mv ? 'التحرك: ' + mv : ''].filter(Boolean).join(' · '); if (x) L.push('   ' + x);
    });
    L.push('', 'الرابط: ' + flightLink(fg));
    return L.join('\n');
  }
  function openShare(fg) {
    const txt = flightText(fg);
    const ov = modal('<h3>ملخص الرحلة ' + esc(fg.flight) + '</h3><textarea id="shTx" rows="12" style="width:100%;font:inherit;direction:rtl" readonly></textarea><div class="act"><button class="btn green" id="shCp">نسخ</button><a class="btn sky" id="shWa" target="_blank" rel="noopener">واتساب</a><button class="btn" id="shPr">ورقة للطباعة</button><button class="btn" id="shX">إغلاق</button></div>');
    $('#shTx', ov).value = txt; $('#shWa', ov).href = 'https://wa.me/?text=' + encodeURIComponent(txt);
    $('#shCp', ov).onclick = () => copyText(txt, 'نُسخ الملخص'); $('#shX', ov).onclick = () => ov.close(); $('#shPr', ov).onclick = () => printSheet(fg);
  }
  let qrP = null;
  const loadQr = () => qrP || (qrP = new Promise(res => { if (window.qrcode) return res(true); const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; sc.onload = () => res(!!window.qrcode); sc.onerror = () => res(false); document.head.appendChild(sc); setTimeout(() => res(!!window.qrcode), 4000); }));
  async function printSheet(fg) {
    const link = flightLink(fg); let qr = '';
    if (await loadQr()) { try { const q = window.qrcode(0, 'L'); q.addData(link); q.make(); qr = q.createSvgTag(4, 0); } catch (e) { } }
    const dep = kind === 'departure', ref = refOf(fg), gs = hotelGroups(fg);
    const rows = gs.map((g, i) => { const tp = gTransport(g); return '<tr><td>' + (i + 1) + '</td><td>' + esc(g.hotel || '—') + '</td><td>' + esc(C.cityName(g.stayCity, g.stayCityRaw)) + '</td><td>' + g.pax + '</td><td>' + esc(g.natList.map(n => n.label + ' (' + n.n + ')').join('، ')) + '</td><td>' + esc(tp ? C.TRANSPORT[tp].ar : '') + '</td><td>' + esc(moveTxt(g)) + '</td><td>' + esc((() => { const n = noteOf(g); return n ? [n.status ? NST()[n.status] : '', n.note].filter(Boolean).join(' — ') : ''; })()) + '</td><td>' + (g.open ? '☐' : '☑') + '</td></tr>'; }).join('');
    const html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>رحلة ' + esc(fg.flight) + '</title><style>@page{size:A4;margin:12mm}body{font-family:Tahoma,Arial,sans-serif;color:#000;font-size:13px}h1{margin:0 0 4px;font-size:22px}.top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px}.meta div{margin:2px 0}table{width:100%;border-collapse:collapse}th,td{border:1px solid #444;padding:5px 7px;text-align:right}th{background:#eee}.qr svg{width:110px;height:110px}.ft{margin-top:10px;font-size:11px;color:#555}</style></head><body><div class="top"><div class="meta"><h1>' + (dep ? 'مغادرة' : 'وصول') + ' — رحلة ' + esc(fg.flight) + '</h1>' +
      '<div>' + (dep ? 'الإقلاع: ' : 'الوصول: ') + esc(fg.when ? C.fmtDayAr(fg.when) + ' · ' + C.fmtTime(fg.when) : '—') + (dep && ref && fg.when && ref.getTime() !== fg.when.getTime() ? ' | أبكر تحرك: ' + esc(C.fmtTime(ref)) : '') + '</div><div>الناقل: ' + esc(fg.airline || '—') + ' | العدد: ' + fg.pax + ' فرد</div>' + (() => { const e = kind === 'arrival' ? state.ready[fg.key] : null; return e ? '<div>الاستعداد: ' + esc((e.status ? RDY_ST[e.status] : '—') + (e.hall || e.gate ? ' | ' + [e.hall, e.gate].filter(Boolean).join(' · ') : '')) + '</div>' : ''; })() + '</div>' +
      '<div class="qr">' + (qr || '<small dir="ltr">' + esc(link) + '</small>') + '</div></div><table><thead><tr><th>#</th><th>الفندق</th><th>المدينة</th><th>العدد</th><th>الجنسيات</th><th>النقل</th><th>التحرك</th><th>ملاحظة</th><th>تم</th></tr></thead><tbody>' + rows + '</tbody></table><div class="ft">طُبع: ' + esc(C.fmtDayAr(new Date()) + ' ' + C.fmtTime(new Date())) + '</div></body></html>';
    const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0'; document.body.appendChild(fr);
    fr.contentDocument.open(); fr.contentDocument.write(html); fr.contentDocument.close();
    setTimeout(() => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast('تعذّرت الطباعة', 'err'); } setTimeout(() => fr.remove(), 4000); }, 250);
  }
  /* ---- دلالات الألوان ---- */
  function openLegend() {
    const rows = Object.keys(ST).filter(k => ST_LABEL[kind][k]).map(k => '<div class="lg"><span class="chip ' + ST[k].cls + '">' + esc(ST_LABEL[kind][k]) + '</span></div>').join('');
    modal('<h3>دلالات الحالات والألوان</h3><div class="lgs">' + rows + '</div><p class="hint" style="margin-top:12px">الأحمر: يحتاج إجراءً فورياً · الكهرماني: يستدعي الانتباه · الأزرق: قادم · الأخضر: مكتمل · الرمادي: بلا موعد. حدّا التنبيه (حرج/تحذير/تأخر) يضبطهما المالك من ⚙.</p><div class="act"><button class="btn" data-n>إغلاق</button></div>').querySelector('[data-n]').onclick = e => e.target.closest('.ov').close();
  }
  /* ---- تنبيه صوتي / إشعار المتصفح ---- */
  const bellOn = () => lsGet('hajj1447.bell') === '1';
  function drawBell() { const b = $('#bBell'); if (b) { b.classList.toggle('on', bellOn()); b.setAttribute('aria-pressed', bellOn()); } }
  function beep() { try { const A = window.AudioContext || window.webkitAudioContext, c = new A(), o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = 880; o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(.2, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .6); o.start(); o.stop(c.currentTime + .6); setTimeout(() => c.close(), 900); } catch (e) { } }
  function notifyNew(n) {
    if (!bellOn()) return; beep();
    try { if ('Notification' in window && Notification.permission === 'granted' && document.hidden) new Notification(K.title, { body: n + ' حالة حرجة جديدة' }); } catch (e) { }
  }
  function render() {
    const d = state.data[kind], now = Date.now();
    const stale = $('#stale');
    if (!d) {
      stale.innerHTML = state.err[kind] ? '<div class="stale">⚠ ' + esc(state.err[kind]) + ' <button class="btn sm" id="stSet">الإعدادات</button></div>' : '';
      if ($('#stSet')) $('#stSet').onclick = () => openSettings(false);
      ['#list', '#more', '#bulk', '#alertbar'].forEach(id => { const e = $(id); if (e) { e.innerHTML = ''; if (id === '#bulk') e.hidden = true; } }); if ($('#cnt')) $('#cnt').textContent = '';
      $('#kpis').innerHTML = '<div class="empty" style="grid-column:1/-1">' + (state.err[kind] ? 'تعذّر تحميل البيانات.' : 'جارٍ تحميل البيانات…') + '</div>'; return;
    }
    stale.innerHTML = state.err[kind] ? '<div class="stale">⚠ تعذّر التحديث الأخير (' + esc(state.err[kind]) + ') — تُعرض آخر بيانات محفوظة قبل ' + fmtAge(now - (state.sync[kind] || now)) + '.</div>' : (d.warn ? '<div class="stale">⚠ ' + esc(d.warn) + ' <button class="btn sm" id="stSet2">الإعدادات</button></div>' : '');
    if ($('#stSet2')) $('#stSet2').onclick = () => openSettings(false);
    const R = recs(); ridx = new Map(R.map(r => [r.row, r]));
    const sm = C.summarize(R, now, S);
    const allGroups = C.groupRecords(R); gmap = new Map(allGroups.map(g => [g.key, g]));
    [...ui.sel].forEach(k => { if (!gmap.has(k)) ui.sel.delete(k); });

    // مؤشرات
    const fl = C.groupFlights(R), nextG = fl.find(g => g.when && g.when.getTime() > now && g.done < g.pax);
    $('#kpis').innerHTML =
      '<div class="kpi gold"><div class="l">' + K.total + '</div><div class="v">' + sm.total + '</div><div class="s">' + allGroups.length + ' مجموعة · ' + fl.length + ' رحلة</div></div>' +
      '<div class="kpi ok"><div class="l">' + K.doneL + '</div><div class="v">' + sm.done + '</div><div class="s"><div class="bar"><i style="width:' + sm.pct + '%"></i></div>' + sm.pct + '%</div></div>' +
      '<div class="kpi amber"><div class="l">' + K.openL + '</div><div class="v">' + sm.pending + '</div><div class="s">تستدعي الانتباه: ' + sm.warn + '</div></div>' +
      '<div class="kpi red click' + (sm.dangerRows ? ' pulse' : '') + '" data-kpi="danger"><div class="l">حالات حرجة / متأخرة</div><div class="v">' + sm.danger + '</div><div class="s">' + sm.dangerRows + ' سجل — اضغط للتصفية</div></div>' +
      '<div class="kpi sky"><div class="l">أقرب رحلة</div><div class="v" style="font-size:25px;padding-top:5px">' + (nextG ? '<span class="cd" data-w="' + nextG.when.getTime() + '"></span>' : '—') + '</div><div class="s">' + (nextG ? esc(nextG.flight) + ' · ' + C.fmtTime(nextG.when) + ' · ' + nextG.pax + ' فرد' : 'لا توجد رحلات قادمة') + '</div></div>';
    $('#alertbar').innerHTML = sm.dangerRows ? '<div class="alertbar" data-kpi="danger"><span class="dot"></span><b>تنبيه:</b> ' + sm.dangerRows + ' سجل في حالة حرجة أو متأخرة ويحتاج إلى إجراء فوري <span class="sp"></span><span class="hint">عرض</span></div>' : '';
    const dk = new Set(R.filter(r => ST[r._st].cls === 'danger').map(r => pkey(r)));
    if (prevDanger) { let n = 0; dk.forEach(k => { if (!prevDanger.has(k)) n++; }); if (n) { toast('تنبيه: ' + n + ' حالة حرجة جديدة', 'err'); notifyNew(n); } }
    prevDanger = dk;

    // شريط الرحلات
    drawRail(fl, now);

    // خيارات التصفية
    const nats = new Map(); R.forEach(r => nats.set(C.natKey(r), natLabel(r)));
    const nv = ui.nat; $('#fNat').innerHTML = '<option value="all">كل الجنسيات</option>' + [...nats.entries()].sort((a, b) => a[1].localeCompare(b[1], 'ar')).map(([k, v]) => '<option value="' + esc(k) + '">' + esc(v) + '</option>').join(''); $('#fNat').value = nv;
    const days = [...new Set(R.filter(r => r.when).map(r => C.fmtDay(r.when)))].sort();
    const dv = ui.day; $('#fDay').innerHTML = '<option value="all">كل الأيام</option>' + days.map(k => '<option value="' + k + '">' + k.slice(5).replace('-', '/') + '</option>').join(''); $('#fDay').value = dv;
    $('#fStatus').value = ui.status; drawChips();
    $$('.seg [data-view]').forEach(b => { const on = b.dataset.view === ui.view; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });

    // القائمة
    const ci = { air: allGroups.some(g => g.airport || g.airCityRaw || g.airCity), stay: allGroups.some(g => g.stayCityRaw || g.stayCity), tp: tpOn() && allGroups.some(g => gTransport(g)) };
    $('#tphint').innerHTML = (tpOn() && !ci.tp) ? '<div class="note">ℹ وسيلة النقل مفعّلة لكن لم يُحدَّد لأي مجموعة (مدينة المطار ومدينة الإقامة مطلوبتان وتُستنتجان من الأعمدة أو من اسم المطار والفندق). راجع ربط الأعمدة من ⚙ أو عطّل الميزة.</div>' : '';
    shownGroups = sortedGroups(allGroups);
    const shown = shownGroups.slice(0, ui.limit);
    $('#list').innerHTML = ui.view === 'cards' ? cardsHtml(shown, ci) : tableHtml(shown, d, ci);
    const px = shownGroups.reduce((s, g) => s + g.pax, 0);
    $('#cnt').textContent = shownGroups.length + ' مجموعة · ' + px + ' فرد';
    $('#more').innerHTML = shownGroups.length > shown.length ? '<button class="btn" data-more>عرض المزيد (' + (shownGroups.length - shown.length) + ')</button>' : '';
    const bulk = $('#bulk'), n = ui.sel.size; bulk.hidden = !n;
    if (n) { const pp = [...ui.sel].reduce((s, k) => s + (gmap.get(k) ? gmap.get(k).pax : 0), 0); bulk.innerHTML = '<b>' + n + ' مجموعة · ' + pp + ' فرد</b><button class="btn green sm" data-bulk="ok">' + K.act + '</button><button class="btn sm" data-bulk="undo">تراجع عن المحدد</button><button class="btn sm" data-bulk="clear">إلغاء التحديد</button>'; }
    renderModal();
    tick();
  }

  /* ---- نافذة جوازات المجموعة ---- */
  function openGroup(key, nat) {
    ui.modal = { key, nat: nat || 'all' };
    if (mo && mo.isConnected) { renderModal(); return; }
    mo = modal('<div id="gmBody"></div>', () => { ui.modal = null; mo = null; });
    mo.firstChild.classList.add('wide');
    mo.addEventListener('click', onModalClick);
    mo.addEventListener('change', e => { if (e.target.id === 'mReveal') { ui.reveal = e.target.checked; $('#fReveal').checked = ui.reveal; render(); } });
    renderModal();
  }
  const modalList = g => g.rows.filter(r => ui.modal.nat === 'all' || C.natKey(r) === ui.modal.nat);
  function renderModal() {
    if (!ui.modal || !mo) return;
    const g = gmap.get(ui.modal.key); if (!g) { mo.close(); return; }
    if (ui.modal.nat !== 'all' && !g.nats.has(ui.modal.nat)) ui.modal.nat = 'all';
    const list = modalList(g), d = state.data[kind], hasRoom = d && d.map.room != null;
    const openN = list.filter(r => !r.done).length, paxN = list.reduce((s, r) => s + r.pax, 0);
    const chips = '<button class="nchip' + (ui.modal.nat === 'all' ? ' on' : '') + '" data-mn="all"><span>الكل</span><b class="num">' + g.pax + '</b></button>' +
      g.natList.map(n => '<button class="nchip' + (ui.modal.nat === n.k ? ' on' : '') + '" data-mn="' + esc(n.k) + '">' + (n.c ? '<img class="flag" alt="" src="' + C.flagUrl(n.c.iso2, 40) + '" onerror="this.style.visibility=\'hidden\'">' : '<span class="flag ph">؟</span>') + '<span>' + esc(n.label) + '</span><b class="num">' + n.n + '</b></button>').join('');
    const head = ['#', 'الاسم', 'الجنسية', 'رقم الجواز', hasRoom && 'الغرفة', 'الحالة', ''].filter(x => x !== false);
    const body = list.map((r, i) => {
      const lab = ST_LABEL[kind][r._st] || r._st, cls = ST[r._st].cls;
      let h = '<tr class="r ' + (r.done ? 'done' : '') + '"><td class="sub">' + (i + 1) + '</td><td><span class="nm" data-open="' + r.row + '">' + esc(r.name || '—') + '</span>' + (r.pax > 1 ? '<div class="sub">' + r.pax + ' أفراد</div>' : '') + '</td><td>' + natHtml(r) + '</td>' +
        '<td><span class="pp">' + esc(ui.reveal ? r.passport : mask(r.passport)) + '</span></td>' + (hasRoom ? '<td>' + esc(r.room || '—') + '</td>' : '') +
        '<td><span class="chip ' + (r.syncing ? 'sync' : cls) + '">' + (r.syncing ? 'جارٍ المزامنة…' : esc(lab)) + '</span></td>' +
        '<td>' + (r.done ? '<button class="btn sm" data-mact="undo" data-row="' + r.row + '"' + (r.syncing ? ' disabled' : '') + '>تراجع</button>' : '<button class="btn sm green" data-mact="ok" data-row="' + r.row + '"' + (r.syncing ? ' disabled' : '') + '>' + ICON.check + (kind === 'arrival' ? 'تسكين' : 'مغادرة') + '</button>') + '</td></tr>';
      if (ui.open.has(r.row)) h += '<tr class="detail"><td colspan="' + head.length + '"><div class="kv">' + r.raw.map(x => '<div><b>' + esc(x[0]) + '</b>' + esc(x[1]) + '</div>').join('') + '</div></td></tr>';
      return h;
    }).join('');
    const tpx = gTransport(g), pl = (a, b) => [a, b].filter(Boolean).join(' — ');
    $('#gmBody', mo).innerHTML = '<h3>' + esc(gTitle(g)) + '</h3>' +
      ((g.airport || airCityTxt(g) || g.hotel || stayCityTxt(g) || tpx || moveTxt(g)) ? '<div class="mroute">' + (pl(g.airport, airCityTxt(g)) ? '<span><em>' + (kind === 'arrival' ? 'المطار' : 'مطار المغادرة') + '</em>' + esc(pl(g.airport, airCityTxt(g))) + '</span>' : '') + (pl(g.hotel, stayCityTxt(g)) ? '<span><em>الفندق</em>' + esc(pl(g.hotel, stayCityTxt(g))) + '</span>' : '') + (moveTxt(g) ? '<span><em>موعد التحرك من الفندق</em><b class="mvb">' + moveTxt(g) + '</b></span>' : '') + (tpx ? '<span><em>وسيلة النقل</em>' + tpHtml(tpx) + '</span>' : '') + '</div>' : '') +
      '<div class="mhead"><span>' + gWhen(g) + '</span>' + (g.open > 0 && g.when ? '<span class="cd" data-w="' + g.when.getTime() + '"></span>' : '') + '<span><b class="num">' + g.pax + '</b> فرد · مكتمل <b class="num">' + g.done + '</b></span></div>' +
      '<div class="nfilter">' + chips + '</div>' +
      '<div class="toolbar"><label class="sw"' + (isMasked() ? ' hidden' : '') + '><input type="checkbox" id="mReveal"' + (ui.reveal ? ' checked' : '') + '> إظهار أرقام الجوازات</label><span class="sp"></span>' +
      '<button class="btn green sm" data-mx="xls">' + ICON.xls + 'Excel</button><button class="btn sky sm" data-mx="pdf">' + ICON.pdf + 'PDF</button>' +
      (openN ? '<button class="btn gold sm" data-mall>' + ICON.check + (kind === 'arrival' ? 'تسكين المتبقي' : 'مغادرة المتبقي') + ' (' + openN + ')</button>' : '') + '<button class="btn sm" data-mx="close">إغلاق</button></div>' +
      '<div class="tablewrap" style="max-height:52vh"><table style="min-width:640px"><thead><tr>' + head.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' + (body || '<tr><td colspan="' + head.length + '"><div class="empty">لا توجد سجلات</div></td></tr>') + '</tbody></table></div>' +
      '<p class="hint" style="margin:8px 0 0">' + list.length + ' جواز · ' + paxN + ' فرد' + (ui.modal.nat !== 'all' ? ' (مصفّى حسب الجنسية)' : '') + '</p>';
    tick();
  }
  async function onModalClick(e) {
    const t = e.target, g = ui.modal && gmap.get(ui.modal.key); if (!g) return; let el;
    if ((el = t.closest('[data-mn]'))) { ui.modal.nat = el.dataset.mn; renderModal(); return; }
    if ((el = t.closest('[data-open]'))) { const k = +el.dataset.open; ui.open.has(k) ? ui.open.delete(k) : ui.open.add(k); renderModal(); return; }
    if ((el = t.closest('[data-mact]'))) { const r = ridx.get(+el.dataset.row); if (r) doWrite([r], el.dataset.mact === 'ok', K.act); return; }
    if (t.closest('[data-mall]')) { doWrite(modalList(g), true, K.act + ' — ' + gTitle(g)); return; }
    if ((el = t.closest('[data-mx]'))) {
      const a = el.dataset.mx; if (a === 'close') { mo.close(); return; }
      const list = modalList(g), tag = fileTag(g) + '-' + stamp();
      if (a === 'xls') { try { await saveXlsx([{ name: 'الحجاج', rows: list.map(r => exportRow(kind, r, ui.reveal, gExtra(g))) }], 'hajj1447-' + kind + '-' + tag + '.xlsx'); toast('تم تصدير Excel', 'ok'); } catch (x) { toast(x.message, 'err'); } }
      if (a === 'pdf') {
        toast('جارٍ تجهيز PDF…'); const paxN = list.reduce((s, r) => s + r.pax, 0);
        const html = reportHtml({
          title: gTitle(g), sub: gWhen(g) + (ui.modal.nat !== 'all' ? ' · الجنسية: ' + (g.nats.get(ui.modal.nat) || {}).label : ''),
          kpis: [['العدد', paxN]].concat(moveTxt(g) ? [['موعد التحرك', moveTxt(g), '#E5484D']] : []).concat(tpLabel(g) ? [['وسيلة النقل', tpLabel(g), '#C5A059']] : []).concat([[K.doneL, list.filter(r => r.done).reduce((s, r) => s + r.pax, 0), '#006C35'], ['المتبقي', list.filter(r => !r.done).reduce((s, r) => s + r.pax, 0), '#F5A524'], ['عدد الجوازات', list.length, '#0EA5E9']]),
          head: ['#', 'الاسم', 'الجنسية', 'رقم الجواز', 'الغرفة', 'الحالة'],
          rows: list.map((r, i) => [i + 1, r.name, { html: flagImg(r.country) || esc(r.natRaw) }, { html: '<span dir="ltr">' + esc(ui.reveal ? r.passport : mask(r.passport)) + '</span>' }, r.room, r.done ? (kind === 'arrival' ? 'تم التسكين' : 'تمت المغادرة') : (ST_LABEL[kind][r._st] || '')])
        });
        try { await savePDF(html, 'hajj1447-' + kind + '-' + tag + '.pdf', false); toast('تم إنشاء PDF', 'ok'); } catch (x) { toast('تعذّر إنشاء PDF: ' + x.message, 'err'); }
      }
    }
  }

  /* ---- أحداث الصفحة ---- */
  async function doWrite(list, value, label) {
    list = list.filter(r => r.done !== value && !r.syncing); if (!list.length) return;
    if (list.length > 1 && !(await confirmBox(label, 'سيتم تحديث ' + list.length + ' سجل في Google Sheets' + (ctxOf(list) ? ' (' + ctxOf(list) + ')' : '') + '. متابعة؟', 'نعم، تنفيذ'))) return;
    await writeChecks(kind, list, value);
  }
  app.addEventListener('click', e => {
    const t = e.target; let el;
    if ((el = t.closest('[data-gnote]'))) { const g = gmap.get(el.dataset.gnote); if (g) openNote(g); return; }
    if ((el = t.closest('[data-gact]'))) { const g = gmap.get(el.dataset.key); if (g) doWrite(g.rows, el.dataset.gact === 'ok', K.act + ' — ' + gTitle(g)); return; }
    if ((el = t.closest('[data-grp]'))) { openGroup(el.dataset.grp, el.dataset.nat); return; }
    if ((el = t.closest('[data-view]'))) { ui.view = el.dataset.view; try { localStorage.setItem(LS_VIEW, ui.view); } catch (x) { } render(); return; }
    if ((el = t.closest('[data-fready]'))) { e.stopPropagation(); const g = C.groupFlights(recs()).find(x => x.key === el.dataset.fready); if (g) openReady(g); return; }
    if ((el = t.closest('[data-fshare]'))) { e.stopPropagation(); const g = C.groupFlights(recs()).find(x => x.key === el.dataset.fshare); if (g) openShare(g); return; }
    if ((el = t.closest('[data-fok]'))) { e.stopPropagation(); const g = C.groupFlights(recs()).find(x => x.key === el.dataset.fok); if (g) doWrite(g.rows, true, K.act + ' — رحلة ' + g.flight); return; }
    if ((el = t.closest('[data-sec]'))) { ui.sec = ui.sec === el.dataset.sec ? null : el.dataset.sec; if (lastFl) drawRail(lastFl, Date.now()); tick(); return; }
    if ((el = t.closest('[data-flight]'))) { ui.flight = ui.flight === el.dataset.flight ? 'all' : el.dataset.flight; ui.limit = 150; render(); return; }
    if ((el = t.closest('[data-sort]'))) { const k = el.dataset.sort; if (ui.sortK === k) ui.dir *= -1; else { ui.sortK = k; ui.dir = 1; } render(); return; }
    if ((el = t.closest('[data-kpi]'))) { ui.status = 'danger'; $('#fStatus').value = 'danger'; render(); return; }
    if (t.closest('[data-more]')) { ui.limit += 300; render(); return; }
    if ((el = t.closest('[data-bulk]'))) {
      const a = el.dataset.bulk;
      if (a === 'clear') { ui.sel.clear(); render(); return; }
      const list = [...ui.sel].flatMap(k => gmap.get(k) ? gmap.get(k).rows : []);
      doWrite(list, a === 'ok', K.act).then(() => { ui.sel.clear(); render(); }); return;
    }
    if (t.matches('[data-sel]')) { t.checked ? ui.sel.add(t.dataset.sel) : ui.sel.delete(t.dataset.sel); render(); return; }
    if (t.matches('[data-selall]')) { shownGroups.slice(0, ui.limit).forEach(g => t.checked ? ui.sel.add(g.key) : ui.sel.delete(g.key)); render(); }
  });
  $('#qchips').addEventListener('click', e => { const b = e.target.closest('[data-qc]'); if (b) qChip(b.dataset.qc); });
  $('#bLegend').onclick = openLegend; drawBell();
  $('#bBell').onclick = () => { const on = !bellOn(); lsSet('hajj1447.bell', on ? '1' : ''); drawBell(); if (on) { beep(); try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) { } toast('فُعّل التنبيه الصوتي للحالات الحرجة الجديدة', 'ok'); } else toast('أُوقف التنبيه الصوتي', 'ok'); };
  $('#fQ').oninput = e => { ui.q = e.target.value; ui.limit = 150; render(); };
  $('#fStatus').onchange = e => { ui.status = e.target.value; render(); };
  $('#fNat').onchange = e => { ui.nat = e.target.value; render(); };
  $('#fDay').onchange = e => { ui.day = e.target.value; render(); };
  $('#fReveal').onchange = e => { ui.reveal = e.target.checked; render(); };
  $('#xPrint').onclick = () => window.print();
  const groupExport = g => ({
    'الرحلة': g.flight, 'الناقل': g.airline, 'المطار': g.airport, [kind === 'arrival' ? 'مدينة الوصول' : 'مدينة المغادرة']: airCityTxt(g), 'التاريخ': g.when ? C.fmtDay(g.when) : '', 'الوقت': g.when && !g.approx ? C.fmtTime(g.when) : '', 'الفندق': g.hotel, 'مدينة الإقامة': stayCityTxt(g), ...gExtra(g),
    'العدد': g.pax, [K.doneL]: g.done, 'المتبقي': g.pax - g.done, 'عدد الجوازات': g.rows.length, 'الجنسيات': natText(g), 'الحالة': g.open ? (ST_LABEL[kind][g.st] || '') : ST_LABEL[kind].done
  });
  $('#xXls').onclick = async () => {
    try {
      const gs = shownGroups;
      await saveXlsx([{ name: 'المجموعات', rows: gs.map(groupExport) }, { name: 'الحجاج', rows: gs.flatMap(g => g.rows.map(r => exportRow(kind, r, ui.reveal, gExtra(g)))) }], 'hajj1447-' + kind + '-' + stamp() + '.xlsx');
      toast('تم تصدير Excel (ورقة المجموعات + ورقة الحجاج)', 'ok');
    } catch (e) { toast(e.message, 'err'); }
  };
  $('#xPdf').onclick = async () => {
    const gs = shownGroups, sm = C.summarize(recs(), Date.now(), S); toast('جارٍ تجهيز PDF…');
    const html = reportHtml({
      title: 'تقرير ' + K.title, sub: gs.length + ' مجموعة (حسب التصفية الحالية)',
      kpis: [[K.total, sm.total], [K.doneL, sm.done, '#006C35'], [K.openL, sm.pending, '#F5A524'], ['حرجة / متأخرة', sm.danger, '#E5484D'], ['نسبة الإنجاز', sm.pct + '%', '#0EA5E9']],
      head: ['#', 'الرحلة', kind === 'arrival' ? 'الموعد' : 'الإقلاع / التحرك', 'المطار', 'الفندق', 'النقل', 'العدد', 'الجنسيات', 'الحالة'],
      rows: gs.map((g, i) => [i + 1, g.flight, { html: esc(gWhen(g)) + (moveTxt(g) ? '<br><small>التحرك: ' + esc(moveTxt(g)) + '</small>' : '') }, { html: esc(g.airport) + (airCityTxt(g) ? '<br><small>' + esc(airCityTxt(g)) + '</small>' : '') }, { html: esc(g.hotel) + (stayCityTxt(g) ? '<br><small>' + esc(stayCityTxt(g)) + '</small>' : '') }, tpLabel(g), g.pax, { html: g.natList.map(n => (n.c ? flagImg(n.c) : esc(n.label)) + ' (' + n.n + ')').join('&nbsp;&nbsp;') }, g.open ? (ST_LABEL[kind][g.st] || '') : ST_LABEL[kind].done])
    });
    try { await savePDF(html, 'hajj1447-' + kind + '-' + stamp() + '.pdf', true); toast('تم إنشاء PDF', 'ok'); } catch (e) { toast('تعذّر إنشاء PDF: ' + e.message, 'err'); }
  };
  onData(render); render();
}

/* =====================================================================
   لوحة المؤشرات التنفيذية
   ===================================================================== */
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const charts = {};
function chart(id, type, data, extra) {
  const el = $('#' + id); if (!el) return;
  if (typeof Chart === 'undefined') { el.parentNode.innerHTML = '<div class="empty">تعذّر تحميل مكتبة الرسوم (Chart.js) — تحقق من الاتصال</div>'; return; }
  if (charts[id]) { charts[id].data = data; charts[id].update('none'); return; }
  Chart.defaults.font.family = 'Tajawal,Tahoma,sans-serif';
  const tc = css('--mut'), gc = 'rgba(147,166,191,.15)';
  charts[id] = new Chart(el, {
    type, data, options: Object.assign({
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: tc, usePointStyle: true, boxWidth: 8 } }, tooltip: { rtl: true, textDirection: 'rtl' } },
      scales: { x: { stacked: true, ticks: { color: tc }, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { color: tc, precision: 0 }, grid: { color: gc } } }
    }, extra || {})
  });
}
const byDay = R => { const m = new Map(); R.forEach(r => { if (!r.when) return; const k = C.fmtDay(r.when), o = m.get(k) || { done: 0, open: 0 }; if (r.done) o.done += r.pax; else o.open += r.pax; m.set(k, o); }); return [...m.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1); };
const ring = (pct, color, label, sub) => { const c = 2 * Math.PI * 54; return '<div class="ring"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="54" fill="none" stroke="' + css('--line2') + '" stroke-width="12"/><circle cx="70" cy="70" r="54" fill="none" stroke="' + color + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + (pct / 100 * c).toFixed(1) + ' ' + c.toFixed(1) + '"/></svg><div class="tx">' + pct + '%<small>' + sub + '</small></div><div class="lb">' + label + '</div></div>'; };

function initDashboard() {
  const app = $('#app');
  app.innerHTML = '<section class="hero"><div><h1>لوحة المؤشرات <span>التنفيذية</span></h1><p>نظرة لحظية على حركة وصول ومغادرة حجاج 1447هـ</p></div><div class="hero-actions"><button class="btn green" id="xXls">' + ICON.xls + 'Excel شامل</button><button class="btn sky" id="xPdf">' + ICON.pdf + 'تقرير PDF</button><button class="btn" id="xPrint">' + ICON.print + 'طباعة</button></div></section>' +
    '<div id="stale"></div><div id="ovr"></div><div class="kpis" id="kpis"></div>' +
    '<div class="grid2 even"><section class="panel"><div class="panel-h"><h2>الأكثر تأخراً</h2><span class="hint">وصول لم يُسكَّن · تحرك لم يغادر</span></div><div class="nxt" id="late"></div></section><section class="panel"><div class="panel-h"><h2>الجاهزية والنقل</h2><span class="hint">رحلات غير جاهزة · مشاكل النقل</span></div><div class="nxt" id="nIss"></div></section></div>' +
    '<div class="grid2"><section class="panel"><h2>أقرب الرحلات</h2><div class="cols2"><div><h3>الوصول</h3><div class="nxt" id="nxA"></div></div><div><h3>المغادرة</h3><div class="nxt" id="nxD"></div></div></div></section>' +
    '<section class="panel"><h2>نسب الإنجاز</h2><div class="rings" id="rings"></div></section></div>' +
    '<div class="grid2 even"><section class="panel"><h2>الوصول حسب اليوم</h2><div class="chartbox"><canvas id="chA"></canvas></div></section><section class="panel"><h2>المغادرة حسب اليوم</h2><div class="chartbox"><canvas id="chD"></canvas></div></section></div>' +
    '<div class="grid2"><section class="panel"><h2>حركة الرحلات خلال 24 ساعة القادمة</h2><div class="chartbox"><canvas id="chH"></canvas></div></section><section class="panel"><div class="panel-h"><h2>الجوازات حسب الجنسية</h2><span class="hint" id="natCnt"></span></div><div class="natl" id="nat"></div></section></div>' +
    '<section class="panel"><h2>الحجاج حسب المدينة</h2><div class="cities" id="cities"></div></section>' +
    '<section class="panel"><div class="panel-h"><h2>الطلب على النقل حسب الساعة</h2><div class="qchips" id="tpSw" style="flex:none"></div></div><div class="peaks" id="peaks"></div><div id="tpNote"></div><div class="chartbox"><canvas id="chT"></canvas></div></section>' +
    '<section class="panel"><h2>تنبيهات حرجة تحتاج إجراءً</h2><div class="nxt feed" id="feed"></div></section>';
  let snap = null; const tps = { kind: 'arrival', off: 0 };
  const dur = ms => { const m = Math.max(0, Math.round(ms / 60000)), h = Math.floor(m / 60); return h ? h + ' س' + (m % 60 ? ' ' + (m % 60) + ' د' : '') : m + ' د'; };
  const refT = (kind, g) => g.when ? (kind === 'departure' ? (C.movementTime(g.when, g.stayCity, g.airCity, S.lead) || g.when) : g.when) : null;
  const grps = kind => state.data[kind] ? C.groupRecords(state.data[kind].records) : [];
  const nOf = (kind, g) => (state.notes[kind] || {})[String(g.key).slice(0, 200)] || null;
  const NL = { vehicle: 'وصلت الوسيلة', enroute: 'في الطريق', delayed: 'تأخر النقل', issue: 'مشكلة' };
  // الأكثر تأخراً: مجموعات مضى موعدها (الوصول أو وقت التحرك) ولم تُنجَز
  function lateList(now) {
    const o = []; ['arrival', 'departure'].forEach(k => grps(k).forEach(g => { const t = refT(k, g); if (t && g.open > 0 && t.getTime() < now) o.push({ k, g, w: now - t.getTime() }); }));
    return o.sort((a, b) => b.w - a.w);
  }
  function issueList() {
    const o = []; ['arrival', 'departure'].forEach(k => grps(k).forEach(g => { const n = nOf(k, g); if (n && (n.status === 'delayed' || n.status === 'issue') && g.open > 0) o.push({ k, g, n }); }));
    return o.sort((a, b) => (a.n.status === 'issue' ? 0 : 1) - (b.n.status === 'issue' ? 0 : 1));
  }
  // رحلات وصول قريبة (خلال حد التحذير) لم تُعتمد جاهزيتها في نظام الوزارة
  function nrList(now) {
    return grps0().filter(g => g.when && g.done < g.pax && g.when.getTime() > now - 36e5 && (g.when.getTime() - now) / 36e5 <= S.warnH && !readyOk(state.ready[g.key])).map(g => ({ g, h: (g.when.getTime() - now) / 36e5, e: state.ready[g.key] || null }));
  }
  const grps0 = () => state.data.arrival ? C.groupFlights(state.data.arrival.records) : [];
  const gLink = (k, g) => k + '.html?flight=' + encodeURIComponent(C.groupFlights(g.rows)[0].key);
  function hourly(kind, off) {
    const day = C.fmtDay(new Date(Date.now() + off * 864e5)), a = Array(24).fill(0);
    grps(kind).forEach(g => { const t = refT(kind, g); if (t && C.fmtDay(t) === day) a[+C.fmtTime(t).slice(0, 2)] += g.pax; });
    return a;
  }
  const peakOf = a => { let m = 0, h = -1; a.forEach((v, i) => { if (v > m) { m = v; h = i; } }); return h < 0 ? null : { h, v: m }; };
  const peakTxt = p => p ? String(p.h).padStart(2, '0') + ':00 · ' + p.v + ' فرد' : 'لا حركة';
  // الوضع العام من الحالات الحرجة والتأخر ومشاكل النقل
  function overall(now) {
    const cnt = c => ['arrival', 'departure'].reduce((n, k) => n + grps(k).filter(g => g.open > 0 && g.cls === c).length, 0);
    const nl = nrList(now), nr = nl.length, nrc = nl.filter(x => x.h <= S.criticalH).length, dg = cnt('danger'), wg = cnt('warn'), is = issueList().length, lt = lateList(now).length;
    const lv = (dg || is || nrc) ? 'crit' : (wg || lt || nr) ? 'watch' : 'ok';
    return { lv, dg, wg, is, lt, nr, label: { crit: 'حرج', watch: 'تحت المراقبة', ok: 'طبيعي' }[lv] };
  }
  function ovrPanel(now) {
    if (!state.data.arrival && !state.data.departure) { $('#ovr').innerHTML = ''; return; }
    const o = overall(now), bits = [o.dg && o.dg + ' مجموعة حرجة', o.lt && o.lt + ' متأخرة', o.is && o.is + ' مشكلة نقل', o.nr && o.nr + ' رحلة غير جاهزة قبل الوصول', o.wg && o.wg + ' تستدعي الانتباه'].filter(Boolean);
    $('#ovr').innerHTML = '<div class="ovr ' + o.lv + '"><span class="dot"></span><b>الوضع العام: ' + o.label + '</b><span>' + (bits.length ? bits.join(' · ') : 'لا توجد حالات تحتاج تدخلاً') + '</span></div>';
  }
  function latePanel(now) {
    const L = lateList(now).slice(0, 8), cn = g => C.cityName(g.stayCity, g.stayCityRaw);
    $('#late').innerHTML = L.length ? L.map(x => '<a class="nx" href="' + gLink(x.k, x.g) + '"><span class="no">' + esc(x.g.flight) + '</span><span class="i">' + (x.k === 'arrival' ? 'وصول' : 'مغادرة') + ' · ' + esc(x.g.hotel || '—') + (cn(x.g) ? ' (' + esc(cn(x.g)) + ')' : '') + '<small>' + x.g.open + ' فرد متبقٍ من ' + x.g.pax + '</small></span><span class="c"><b class="lt">' + dur(x.w) + '</b></span></a>').join('') : '<div class="empty">لا توجد مجموعات متأخرة ✓</div>';
  }
  function issPanel(now) {
    const L = issueList(), NR = nrList(now).sort((a, b) => a.h - b.h);
    const nrRows = NR.map(x => '<a class="nx" href="arrival.html?flight=' + encodeURIComponent(x.g.key) + '"><span class="no">' + esc(x.g.flight) + '</span><span class="i">' + (x.e && x.e.status ? esc(RDY_ST[x.e.status]) : 'الاستعداد غير مسجّل') + '<small>' + (x.h > 0 ? 'الوصول بعد ' + dur(x.h * 36e5) : 'مضى موعد الوصول بـ ' + dur(-x.h * 36e5)) + ' · ' + x.g.pax + ' فرد' + (x.e && (x.e.hall || x.e.gate) ? ' · ' + esc([x.e.hall, x.e.gate].filter(Boolean).join(' / ')) : '') + '</small></span><span class="c"><span class="ntag ' + (x.h <= S.criticalH ? 'issue' : 'delayed') + '" style="margin:0"><b>غير جاهزة</b></span></span></a>').join('');
    $('#nIss').innerHTML = (L.length || NR.length) ? nrRows + L.map(x => '<a class="nx" href="' + gLink(x.k, x.g) + '"><span class="no">' + esc(x.g.flight) + '</span><span class="i">' + esc(x.g.hotel || '—') + '<small>' + esc(x.n.note || '') + (x.n.by ? ' — ' + esc(x.n.by) : '') + '</small></span><span class="c"><span class="ntag ' + esc(x.n.status) + '" style="margin:0"><b>' + NL[x.n.status] + '</b></span></span></a>').join('') : '<div class="empty">لا توجد حالات نقل أو جاهزية تحتاج متابعة ✓</div>';
  }
  function peaksPanel() {
    const it = [['arrival', 0, 'وصول اليوم'], ['arrival', 1, 'وصول غداً'], ['departure', 0, 'تحرك اليوم'], ['departure', 1, 'تحرك غداً']];
    $('#peaks').innerHTML = '<div class="pk-h">أزحم ساعة</div>' + it.map(([k, o, l]) => '<div class="pk"><span>' + l + '</span><b>' + peakTxt(peakOf(hourly(k, o))) + '</b></div>').join('');
  }
  // ملخص اليوم للمشاركة
  function dailyText() {
    const now = Date.now(), today = C.fmtDay(new Date(now)), o = overall(now), L = [];
    L.push('📊 ملخص حجاج 1447هـ', C.fmtDayAr(new Date(now)) + ' · ' + C.fmtTime(new Date(now)), '', 'الوضع العام: ' + o.label);
    [['arrival', 'الوصول', 'سُكّن'], ['departure', 'المغادرة', 'غادر']].forEach(([k, t, v]) => {
      const d = state.data[k]; if (!d) return; const s = C.summarize(d.records, now, S), gs = grps(k).filter(g => g.when && C.fmtDay(g.when) === today);
      L.push('', '✈️ ' + t + ': إجمالي ' + s.total + ' · ' + v + ' ' + s.done + ' (' + s.pct + '%) · متبقٍ ' + s.pending, '   اليوم: ' + gs.length + ' مجموعة · ' + gs.reduce((n, g) => n + g.pax, 0) + ' فرد · مكتمل ' + gs.filter(g => g.open === 0).length, '   أزحم ساعة اليوم: ' + peakTxt(peakOf(hourly(k, 0))));
    });
    const lt = lateList(now).slice(0, 5); if (lt.length) { L.push('', '⏰ الأكثر تأخراً:'); lt.forEach(x => L.push('• ' + x.g.flight + ' (' + (x.k === 'arrival' ? 'وصول' : 'مغادرة') + ') — ' + (x.g.hotel || '—') + ' — ' + x.g.open + ' فرد — منذ ' + dur(x.w))); }
    const nl = nrList(now).sort((a, b) => a.h - b.h).slice(0, 5); if (nl.length) { L.push('', '🛬 رحلات غير جاهزة قبل الوصول:'); nl.forEach(x => L.push('• ' + x.g.flight + ' — ' + (x.h > 0 ? 'بعد ' + dur(x.h * 36e5) : 'مضى موعده بـ ' + dur(-x.h * 36e5)) + ' — ' + (x.e && x.e.status ? RDY_ST[x.e.status] : 'غير مسجّل') + ' — ' + x.g.pax + ' فرد')); }
    const is = issueList().slice(0, 5); if (is.length) { L.push('', '🚦 مشاكل النقل:'); is.forEach(x => L.push('• ' + x.g.flight + ' — ' + (x.g.hotel || '—') + ' — ' + NL[x.n.status] + (x.n.note ? ': ' + x.n.note : ''))); }
    L.push('', location.origin + location.pathname.replace(/[^/]*$/, '') + 'index.html'); return L.join('\n');
  }
  function openDaily() {
    const txt = dailyText(), ov = modal('<h3>ملخص اليوم</h3><textarea id="dyTx" rows="14" style="width:100%;font:inherit;direction:rtl" readonly></textarea><div class="act"><button class="btn green" id="dyCp">نسخ</button><a class="btn sky" id="dyWa" target="_blank" rel="noopener">واتساب</a><button class="btn" id="dyX">إغلاق</button></div>');
    $('#dyTx', ov).value = txt; $('#dyWa', ov).href = 'https://wa.me/?text=' + encodeURIComponent(txt); $('#dyX', ov).onclick = () => ov.close();
    $('#dyCp', ov).onclick = () => { const ok = () => toast('نُسخ الملخص', 'ok'); (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(txt).then(ok, () => { $('#dyTx', ov).select(); document.execCommand('copy'); ok(); }) : ($('#dyTx', ov).select(), document.execCommand('copy'), ok())); };
  }
  function cityPanel(A, D) {
    const ids = ['makkah', 'madinah', 'jeddah', ''], m = {}; ids.forEach(i => m[i] = { a: 0, ad: 0, d: 0, dd: 0 });
    const add = (R, k, kd) => R && R.forEach(r => { const o = m[C.CITY_DEF[r.stayCity] ? r.stayCity : '']; o[k] += r.pax; if (r.done) o[kd] += r.pax; });
    add(A && A.records, 'a', 'ad'); add(D && D.records, 'd', 'dd');
    $('#cities').innerHTML = ids.filter(i => i || m[i].a || m[i].d).map(i => { const o = m[i]; return '<div class="city"><h3>' + esc(i ? C.CITY_DEF[i].ar : 'مدينة غير محددة') + '</h3><div class="cr"><span>قادمون</span><b class="num">' + o.a + '</b><small>سُكّن ' + o.ad + '</small></div><div class="cr"><span>مغادرون</span><b class="num">' + o.d + '</b><small>غادر ' + o.dd + '</small></div></div>'; }).join('');
  }
  function tpPanel(A, D) {
    const sw = [['arrival', 'وصول'], ['departure', 'مغادرة'], ['0', 'اليوم'], ['1', 'غداً']];
    $('#tpSw').innerHTML = sw.map(([v, l]) => '<button type="button" class="qc' + ((v === tps.kind || v === String(tps.off)) ? ' on' : '') + '" data-tps="' + v + '">' + l + '</button>').join('');
    const R = tps.kind === 'arrival' ? A : D, on = !!(S.transport && S.transport[tps.kind]);
    $('#tpNote').innerHTML = !on ? '<div class="note">ℹ وسيلة النقل غير مفعّلة لهذه الحركة — يفعّلها المالك من ⚙.</div>' : '';
    const day = C.fmtDay(new Date(Date.now() + tps.off * 864e5)), hrs = [...Array(24).keys()], dat = { bus: Array(24).fill(0), car: Array(24).fill(0), train: Array(24).fill(0) };
    if (on && R) C.groupRecords(R.records).forEach(g => {
      const tp = C.transportFor(g.airCity, g.stayCity, g.pax, S.transport.busMin); if (!tp || !g.when) return;
      const t = tps.kind === 'departure' ? (C.movementTime(g.when, g.stayCity, g.airCity, S.lead) || g.when) : g.when;
      if (C.fmtDay(t) !== day) return; dat[tp][+C.fmtTime(t).slice(0, 2)] += g.pax;
    });
    const st = { x: { stacked: true, ticks: { color: css('--mut'), maxRotation: 0 }, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { color: css('--mut'), precision: 0 }, grid: { color: 'rgba(147,166,191,.15)' } } };
    chart('chT', 'bar', { labels: hrs.map(h => String(h).padStart(2, '0') + ':00'), datasets: [{ label: 'حافلة', data: dat.bus, backgroundColor: '#C5A059' }, { label: 'سيارة', data: dat.car, backgroundColor: '#0EA5E9' }, { label: 'قطار', data: dat.train, backgroundColor: '#34C47A' }] }, { scales: st });
  }

  function nxList(kind) {
    const d = state.data[kind], now = Date.now(); if (!d) return '<div class="empty">—</div>';
    const g = C.groupFlights(d.records).filter(x => x.when && x.done < x.pax && x.when.getTime() > now - 36e5).slice(0, 5);
    return g.length ? g.map(x => '<a class="nx" href="' + kind + '.html?q=' + encodeURIComponent(x.flight) + '"><span class="no">' + esc(x.flight) + '</span><span class="i">' + esc(x.airline || '') + '<small>' + C.fmtDayAr(x.when) + ' · ' + C.fmtTime(x.when) + ' · ' + x.pax + ' فرد</small></span><span class="c"><span class="cd" data-w="' + x.when.getTime() + '"></span></span></a>').join('') : '<div class="empty" style="padding:14px">لا توجد رحلات قادمة</div>';
  }
  function render() {
    const A = state.data.arrival, D = state.data.departure, now = Date.now();
    $('#stale').innerHTML = (state.err.arrival || state.err.departure) ? '<div class="stale">⚠ ' + esc(state.err.arrival || state.err.departure) + (A || D ? ' — تُعرض آخر بيانات محفوظة' : '') + ' <button class="btn sm" id="stSet">الإعدادات</button></div>' : '';
    if ($('#stSet')) $('#stSet').onclick = () => openSettings(false);
    if (!A && !D) { ['#rings', '#nxA', '#nxD', '#nat', '#natCnt', '#feed'].forEach(id => { const e = $(id); if (e) e.innerHTML = ''; }); $('#kpis').innerHTML = '<div class="empty" style="grid-column:1/-1">' + (state.err.arrival || state.err.departure ? 'تعذّر تحميل البيانات.' : 'جارٍ تحميل البيانات…') + '</div>'; return; }
    const sa = A ? C.summarize(A.records, now, S) : null, sd = D ? C.summarize(D.records, now, S) : null;
    const z = { total: 0, done: 0, pending: 0, danger: 0, dangerRows: 0, pct: 0 };
    const a = sa || z, d = sd || z;
    snap = { a, d };
    const target = (a.dangerRows || !d.dangerRows) ? 'arrival' : 'departure';
    $('#kpis').innerHTML =
      '<div class="kpi gold"><div class="l">إجمالي الحجاج القادمين</div><div class="v">' + a.total + '</div><div class="s">المغادرون: ' + d.total + '</div></div>' +
      '<div class="kpi ok"><div class="l">تم التسكين</div><div class="v">' + a.done + '</div><div class="s">' + a.pct + '% من القادمين</div></div>' +
      '<div class="kpi amber"><div class="l">بانتظار التسكين</div><div class="v">' + a.pending + '</div><div class="s">تستدعي الانتباه: ' + (sa ? sa.warn : 0) + '</div></div>' +
      '<div class="kpi sky"><div class="l">تمت المغادرة</div><div class="v">' + d.done + '</div><div class="s">' + d.pct + '% من المغادرين</div></div>' +
      '<div class="kpi amber"><div class="l">بانتظار المغادرة</div><div class="v">' + d.pending + '</div><div class="s">من أصل ' + d.total + '</div></div>' +
      '<a class="kpi red click' + ((a.dangerRows + d.dangerRows) ? ' pulse' : '') + '" href="' + target + '.html?status=danger"><div class="l">تنبيهات حرجة</div><div class="v">' + (a.dangerRows + d.dangerRows) + '</div><div class="s">وصول ' + a.dangerRows + ' · مغادرة ' + d.dangerRows + '</div></a>';
    $('#nxA').innerHTML = nxList('arrival'); $('#nxD').innerHTML = nxList('departure');
    $('#rings').innerHTML = ring(a.pct, '#34C47A', 'التسكين', 'مُسكَّن') + ring(d.pct, '#0EA5E9', 'المغادرة', 'غادر');

    const col = { ok: '#006C35', open: '#C5A059', sky: '#0EA5E9' };
    const dA = A ? byDay(A.records) : [], dD = D ? byDay(D.records) : [];
    const lab = ds => ds.map(x => x[0].slice(5).replace('-', '/'));
    chart('chA', 'bar', { labels: lab(dA), datasets: [{ label: 'تم التسكين', data: dA.map(x => x[1].done), backgroundColor: col.ok, borderRadius: 4 }, { label: 'بانتظار التسكين', data: dA.map(x => x[1].open), backgroundColor: col.open, borderRadius: 4 }] });
    chart('chD', 'bar', { labels: lab(dD), datasets: [{ label: 'تمت المغادرة', data: dD.map(x => x[1].done), backgroundColor: col.sky, borderRadius: 4 }, { label: 'بانتظار المغادرة', data: dD.map(x => x[1].open), backgroundColor: col.open, borderRadius: 4 }] });
    const h0 = Math.floor(now / 36e5) * 36e5, hl = [], ha = new Array(24).fill(0), hd = new Array(24).fill(0);
    for (let i = 0; i < 24; i++) hl.push(C.fmtTime(new Date(h0 + i * 36e5)));
    const put = (R, arr) => R && R.forEach(r => { if (!r.when) return; const i = Math.floor((r.when.getTime() - h0) / 36e5); if (i >= 0 && i < 24) arr[i] += r.pax; });
    put(A && A.records, ha); put(D && D.records, hd);
    chart('chH', 'bar', { labels: hl, datasets: [{ label: 'وصول', data: ha, backgroundColor: col.ok, borderRadius: 4 }, { label: 'مغادرة', data: hd, backgroundColor: col.sky, borderRadius: 4 }] }, { scales: { x: { stacked: false, ticks: { color: css('--mut'), maxRotation: 0, autoSkip: true }, grid: { display: false } }, y: { stacked: false, beginAtZero: true, ticks: { color: css('--mut'), precision: 0 }, grid: { color: 'rgba(147,166,191,.15)' } } } });

    // الجنسيات
    const all = [...(A ? A.records : [])]; const seen = new Set(all.map(r => r.key).filter(Boolean));
    (D ? D.records : []).forEach(r => { if (!r.key || !seen.has(r.key)) all.push(r); });
    const nm = new Map(); all.forEach(r => { const k = r.country ? r.country.iso2 : '?'; const o = nm.get(k) || { c: r.country, n: 0 }; o.n += r.pax; nm.set(k, o); });
    const arr = [...nm.values()].sort((x, y) => y.n - x.n), mx = arr.length ? arr[0].n : 1, tot = arr.reduce((s, x) => s + x.n, 0) || 1;
    $('#natCnt').textContent = arr.length + ' جنسية · ' + tot + ' فرد';
    $('#nat').innerHTML = arr.map(x => '<div class="nr">' + (x.c ? '<img class="flag" loading="lazy" alt="" src="' + C.flagUrl(x.c.iso2, 40) + '" onerror="this.style.visibility=\'hidden\'">' : '<span class="flag ph">؟</span>') + '<div><div class="nn"><span>' + esc(x.c ? x.c.ar : 'غير محدد') + '</span><b class="num">' + x.n + ' · ' + Math.round(x.n / tot * 100) + '%</b></div><div class="bar"><i style="width:' + (x.n / mx * 100) + '%"></i></div></div><span></span></div>').join('') || '<div class="empty">—</div>';

    // التنبيهات
    const items = []; [['arrival', A], ['departure', D]].forEach(([k, d]) => d && d.records.forEach(r => { if (ST[r._st] && ST[r._st].cls === 'danger') items.push({ k, r }); }));
    items.sort((x, y) => ST[y.r._st].lv - ST[x.r._st].lv || (x.r.when || 0) - (y.r.when || 0));
    $('#feed').innerHTML = items.length ? items.slice(0, 12).map(({ k, r }) => '<a class="nx" href="' + k + '.html?q=' + encodeURIComponent(r.passport || r.name) + '"><span class="no">' + esc(r.flight || '—') + '</span><span class="i">' + esc(r.name || '—') + '<small>' + (k === 'arrival' ? 'وصول' : 'مغادرة') + ' · ' + esc(r.country ? r.country.ar : r.natRaw) + '</small></span><span class="chip danger">' + esc(ST_LABEL[k][r._st]) + '</span><span class="c">' + (r.when ? '<span class="cd" data-w="' + r.when.getTime() + '"></span>' : '') + '</span></a>').join('') + (items.length > 12 ? '<div class="hint" style="padding:6px">+ ' + (items.length - 12) + ' أخرى — افتح صفحة الوصول/المغادرة وصفِّ بـ «حرجة»</div>' : '') : '<div class="empty" style="padding:18px">لا توجد تنبيهات حرجة حالياً ✓</div>';
    ovrPanel(now); latePanel(now); issPanel(now); peaksPanel(); cityPanel(A, D); tpPanel(A, D);
    tick();
  }
  $('#xPrint').insertAdjacentHTML('beforebegin', '<button class="btn" id="xWa">📋 ملخص اليوم</button>'); $('#xWa').onclick = openDaily;
  $('#tpSw').addEventListener('click', e => { const b = e.target.closest('[data-tps]'); if (!b) return; const v = b.dataset.tps; if (v === 'arrival' || v === 'departure') tps.kind = v; else tps.off = +v; tpPanel(state.data.arrival, state.data.departure); });
  $('#xPrint').onclick = () => window.print();
  $('#xXls').onclick = async () => {
    const A = state.data.arrival, D = state.data.departure; if (!A && !D) return toast('لا توجد بيانات بعد', 'warn');
    const now = Date.now(), sheets = [];
    const sm = snap || { a: {}, d: {} };
    sheets.push({ name: 'ملخص', rows: [{ 'المؤشر': 'إجمالي القادمين', 'القيمة': sm.a.total }, { 'المؤشر': 'تم التسكين', 'القيمة': sm.a.done }, { 'المؤشر': 'بانتظار التسكين', 'القيمة': sm.a.pending }, { 'المؤشر': 'إجمالي المغادرين', 'القيمة': sm.d.total }, { 'المؤشر': 'تمت المغادرة', 'القيمة': sm.d.done }, { 'المؤشر': 'بانتظار المغادرة', 'القيمة': sm.d.pending }, { 'المؤشر': 'سجلات حرجة', 'القيمة': (sm.a.dangerRows || 0) + (sm.d.dangerRows || 0) }] });
    if (A) { C.summarize(A.records, now, S); sheets.push({ name: 'الوصول', rows: A.records.map(r => exportRow('arrival', r, false)) }); }
    if (D) { C.summarize(D.records, now, S); sheets.push({ name: 'المغادرة', rows: D.records.map(r => exportRow('departure', r, false)) }); }
    try { await saveXlsx(sheets, 'hajj1447-dashboard-' + stamp() + '.xlsx'); toast('تم تصدير Excel (أرقام الجوازات مخفية جزئياً)', 'ok'); } catch (e) { toast(e.message, 'err'); }
  };
  $('#xPdf').onclick = async () => {
    if (!snap) return toast('لا توجد بيانات بعد', 'warn'); toast('جارٍ تجهيز PDF…');
    const { a, d } = snap, rows = [...$$('#nat .nr')].map((el, i) => [i + 1, el.querySelector('.nn span').textContent, el.querySelector('.nn b').textContent]);
    const html = reportHtml({ title: 'التقرير التنفيذي — حجاج 1447هـ', sub: 'ملخص الوصول والمغادرة والجوازات حسب الجنسية', kpis: [['القادمون', a.total], ['تم التسكين', a.done, '#006C35'], ['بانتظار التسكين', a.pending, '#F5A524'], ['المغادرون', d.total, '#0EA5E9'], ['تمت المغادرة', d.done, '#006C35'], ['تنبيهات حرجة', (a.dangerRows || 0) + (d.dangerRows || 0), '#E5484D']], head: ['#', 'الجنسية', 'العدد / النسبة'], rows });
    try { await savePDF(html, 'hajj1447-dashboard-' + stamp() + '.pdf', false); toast('تم إنشاء PDF', 'ok'); } catch (e) { toast('تعذّر إنشاء PDF: ' + e.message, 'err'); }
  };
  onData(() => { if (window.__themeChanged) { Object.keys(charts).forEach(k => { charts[k].destroy(); delete charts[k]; }); window.__themeChanged = false; } render(); });
  render();
}

/* ---------------- الإقلاع ---------------- */
let timer = null;
function startAuto() {
  clearInterval(timer); if (!sourceReady()) return;
  timer = setInterval(() => { if (!document.hidden) refresh(); }, Math.max(10, S.refreshSec) * 1000);
}
/* ---------------- تثبيت كتطبيق (PWA) ---------------- */
let instEv = null;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function initInstall() {
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
  if (isStandalone()) return;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), tools = $('#nav .tools'); if (!tools) return;
  const b = document.createElement('button'); b.className = 'ibtn'; b.id = 'bInst'; b.type = 'button'; b.hidden = true; b.title = 'تثبيت كتطبيق على الجوال'; b.setAttribute('aria-label', 'تثبيت التطبيق'); b.textContent = '⤓';
  tools.insertBefore(b, tools.firstChild);
  b.onclick = async () => {
    if (instEv) { instEv.prompt(); try { await instEv.userChoice; } catch (e) { } instEv = null; b.hidden = true; return; }
    const ov = modal('<h3>تثبيت التطبيق</h3><p>' + (ios ? 'في Safari: اضغط زر المشاركة ⬆ ثم «إضافة إلى الشاشة الرئيسية».' : 'من قائمة المتصفح ⋮ اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».') + '</p><p class="hint">ملاحظة: على آيفون يحتفظ التطبيق المثبّت ببيانات منفصلة عن Safari، فافتح رابط الزوار من داخله مرة واحدة، أو اطلب من المالك تثبيت الخادم عبر config.js فيعمل مباشرة.</p><div class="act"><button class="btn" data-n>إغلاق</button></div>');
    ov.querySelector('[data-n]').onclick = () => ov.close();
  };
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); instEv = e; b.hidden = false; });
  window.addEventListener('appinstalled', () => { b.hidden = true; });
  if (ios) b.hidden = false;
}
async function boot() {
  let th = 'dark'; try { th = localStorage.getItem(LS_THEME) || 'dark'; } catch (e) { }
  document.documentElement.dataset.theme = th;
  const page = document.body.dataset.page;
  kindsInUse = page === 'index' ? ['arrival', 'departure'] : [page];
  await initConnection();
  renderNav(page); initInstall(); if (REMOTE.configured) hydrate(kindsInUse); else if (!REMOTE.error) clearCaches();
  if (page === 'index') initDashboard(); else initTracker(page);
  setInterval(() => tick(), 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && sourceReady() && Date.now() - lastTry > S.refreshSec * 1000) refresh(); });
  if (!CONN.webapp) { openConnect(); return; }
  if (!REMOTE.configured) {
    const msg = REMOTE.error || 'المنظومة لم تُهيّأ بعد — يحتاج المالك إلى ضبط الإعدادات';
    kindsInUse.forEach(k => { state.err[k] = msg; }); emit();
    if (REMOTE.owner) openSettings(true);
    return;
  }
  refresh(); startAuto(); updateBadges();
}
document.addEventListener('DOMContentLoaded', boot);
})();
