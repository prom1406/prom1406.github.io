/* =====================================================================
   منظومة تحركات الحجاج 1447هـ — طبقة الواجهة والمزامنة
   ===================================================================== */
(function () {
'use strict';
const C = window.HajjCore;
const { esc, normAr, ST, ST_LABEL } = C;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const LS_VIEW = 'hajj1447.view', LS_SET = 'hajj1447.settings', LS_THEME = 'hajj1447.theme', LS_BADGE = 'hajj1447.badges';
const LIBS = {
  xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  pdf: 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
};

/* ---------------- الإعدادات ---------------- */
const clone = o => JSON.parse(JSON.stringify(o));
function merge(a, b) { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) a[k] = merge(a[k] && typeof a[k] === 'object' ? a[k] : {}, b[k]); else a[k] = b[k]; } return a; }
let S; try { S = merge(clone(C.DEFAULTS), JSON.parse(localStorage.getItem(LS_SET) || '{}')); } catch (e) { S = clone(C.DEFAULTS); }
const saveSettings = () => { try { localStorage.setItem(LS_SET, JSON.stringify(S)); } catch (e) { } };

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
  eye: ic('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>')
};

/* ---------------- الحالة والمزامنة ---------------- */
const state = { data: { arrival: null, departure: null }, sync: { arrival: 0, departure: 0 }, err: {}, pending: { arrival: {}, departure: {} }, fn: [] };
const pkey = r => (r.key || ('r' + r.row));
const emit = () => state.fn.forEach(f => { try { f(); } catch (e) { console.error(e); } });
const onData = f => state.fn.push(f);

const tabOf = (kind, cfg) => {
  const s = ((cfg || S).source) || {};
  return ((kind === 'arrival' ? s.arrivalTab : s.departureTab) || '').trim() || (kind === 'arrival' ? 'Arrival' : 'Departure');
};
const sourceReady = () => !!(C.sheetIdFromLink(S.source.link) || (S.readVia === 'webapp' && S.webapp));
async function fetchRows(kind, cfg) {
  cfg = cfg || S; const tab = tabOf(kind, cfg);
  if (cfg.readVia === 'webapp' && cfg.webapp) {
    const u = cfg.webapp + (cfg.webapp.includes('?') ? '&' : '?') + 'action=read&kind=' + kind + '&sheet=' + encodeURIComponent(tab) + '&token=' + encodeURIComponent(cfg.token) + '&t=' + Date.now();
    const r = await fetch(u, { cache: 'no-store' }); const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'خطأ في تطبيق الويب'); return j.rows;
  }
  const id = C.sheetIdFromLink(cfg.source.link);
  if (!id) throw new Error('لم يُضبط مصدر البيانات — افتح الإعدادات ⚙ والصق رابط ملف Google Sheets');
  const r = await fetch(C.gvizUrl(id, tab) + '&t=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error('تعذّر فتح صفحة «' + tab + '» (' + r.status + ') — تأكد أن مشاركة الملف «أي شخص لديه الرابط: عارض»');
  const t = await r.text();
  if (/^\s*</.test(t)) throw new Error('لم يُرجع Google بيانات الصفحة «' + tab + '» — تأكد من مشاركة الرابط (عارض) ومن اسم الصفحة');
  return C.parseCSV(t);
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
  state.data[kind] = res; return res;
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
  } catch (e) { state.err[kind] = e.message || String(e); }
}
let kindsInUse = [], lastTry = 0;
async function refresh(kinds) {
  kinds = kinds || kindsInUse; lastTry = Date.now();
  const live = $('#live'), btn = $('#bRef');
  if (live) live.className = 'live load'; if (btn) btn.classList.add('spin');
  await Promise.all(kinds.map(loadKind));
  if (btn) btn.classList.remove('spin');
  updateBadges(); emit(); tick(true);
}
function hydrate(kinds) {
  kinds.forEach(k => {
    try { const c = JSON.parse(localStorage.getItem('hajj1447.cache.' + k) || 'null'); if (c && c.rows) { processRows(k, c.rows); state.sync[k] = c.ts; state.cached = true; } } catch (e) { }
  });
}

/* ---------------- الكتابة (Apps Script) ---------------- */
async function writeChecks(kind, recs, value) {
  if (!S.webapp) { toast('اضبط رابط Apps Script من الإعدادات أولاً', 'warn'); openSettings(false); return false; }
  const d = state.data[kind];
  if (d.map.check == null) { toast('لم يُعثر على عمود ' + S[kind].checkHeader + ' في الجدول', 'err'); return false; }
  recs.forEach(r => { r.done = value; r.syncing = true; state.pending[kind][pkey(r)] = { value, ts: Date.now() }; });
  emit();
  const revert = rs => rs.forEach(r => { delete state.pending[kind][pkey(r)]; r.done = !value; r.syncing = false; });
  try {
    const res = await fetch(S.webapp, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: S.token, kind, sheet: tabOf(kind), headerRow: d.headerRow, ops: recs.map(r => ({ row: r.row, key: r.key, keyHeader: r.keyHeader, value })) })
    });
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || 'فشل الحفظ');
    const bad = [];
    (j.results || []).forEach((x, i) => { if (!x.ok) bad.push([recs[i], x.error]); });
    revert(bad.map(b => b[0]));
    if (bad.length) toast('تعذّر حفظ ' + bad.length + ' سجل: ' + bad[0][1], 'err');
    const okN = recs.length - bad.length;
    if (okN) toast((value ? 'تم حفظ ' : 'تم التراجع عن ') + okN + ' سجل في Google Sheets', 'ok');
    emit();
    setTimeout(() => refresh([kind]), 2500); setTimeout(() => refresh([kind]), 9000);
    return true;
  } catch (e) {
    revert(recs); emit(); toast('فشل الحفظ: ' + (e.message || e), 'err'); return false;
  }
}

/* ---------------- مكوّنات الواجهة ---------------- */
function toast(msg, type) {
  let c = $('.toasts'); if (!c) { c = document.createElement('div'); c.className = 'toasts'; c.setAttribute('aria-live', 'polite'); document.body.appendChild(c); }
  const t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.textContent = msg; c.appendChild(t); setTimeout(() => t.remove(), 4500);
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
  txt.textContent = err ? 'تعذّر التحديث' : (last ? 'آخر تحديث ' + new Intl.DateTimeFormat('en-GB', { timeZone: C.TZ_NAME, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(last) : 'جارٍ التحميل…');
}

/* ---------------- شريط التنقل ---------------- */
function renderNav(page) {
  const tabs = [['index', 'لوحة المؤشرات', 'dash'], ['arrival', 'متابعة الوصول', 'land'], ['departure', 'متابعة المغادرة', 'take']];
  const nav = $('#nav'); nav.className = 'nav';
  nav.innerHTML = '<a class="brand" href="index.html"><span class="logo">' + ICON.plane + '</span><span><b>منظومة تحركات الحجاج</b><small>موسم 1447هـ</small></span></a>' +
    '<nav class="tabs" aria-label="التنقل الرئيسي">' + tabs.map(t => '<a class="tab' + (t[0] === page ? ' active' : '') + '" href="' + t[0] + '.html"' + (t[0] === page ? ' aria-current="page"' : '') + '>' + ICON[t[2]] + '<span class="tl">' + t[1] + '</span>' + (t[0] !== 'index' ? '<span class="badge" id="bd-' + t[0] + '" hidden></span>' : '') + '</a>').join('') + '</nav>' +
    '<div class="tools"><span class="live" id="live"><i></i><em id="syncTxt">—</em></span>' +
    '<button class="ibtn" id="bRef" title="تحديث الآن" aria-label="تحديث">' + ICON.refresh + '</button>' +
    '<button class="ibtn" id="bTheme" title="الوضع الفاتح/الداكن" aria-label="تبديل السمة">' + ICON.theme + '</button>' +
    '<button class="ibtn" id="bSet" title="الإعدادات" aria-label="الإعدادات">' + ICON.gear + '</button></div>';
  $('#bRef').onclick = () => refresh();
  $('#bSet').onclick = () => openSettings(false);
  $('#bTheme').onclick = () => {
    const n = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = n; try { localStorage.setItem(LS_THEME, n); } catch (e) { }
    emit(window.__themeChanged = true);
  };
  updateBadges();
}

/* اختبار المصدر قبل اعتماده: يتحقق من الرابط، من Apps Script (إن وُجد)، ومن كل صفحة على حدة */
async function testSource(c) {
  const out = [];
  if (!c.link && !c.webapp) return [['err', 'الصق رابط ملف Google Sheets (أو رابط Apps Script).']];
  const cfg = clone(S);
  cfg.source = { link: c.link, arrivalTab: c.tabA, departureTab: c.tabD }; cfg.webapp = c.webapp; cfg.token = c.token; cfg.readVia = c.via;
  const id = C.sheetIdFromLink(c.link);
  if (c.link && !id) {
    out.push(['err', C.isPublishedLink(c.link)
      ? 'هذا رابط «نشر على الويب» ولا يحدد الصفحات بالاسم. استخدم رابط المشاركة العادي (…/d/معرّف-الملف/edit).'
      : 'الرابط ليس رابط Google Sheets صالحاً.']);
    if (c.via !== 'webapp') return out;
  }
  let tabs = null;
  if (c.webapp) {
    try {
      const j = await (await fetch(c.webapp + (c.webapp.includes('?') ? '&' : '?') + 'action=ping&token=' + encodeURIComponent(c.token))).json();
      if (!j.ok) throw new Error(j.error === 'unauthorized' ? 'الرمز السري غير مطابق' : (j.error || 'مرفوض'));
      tabs = j.tabs || null;
      out.push(['ok', 'Apps Script يعمل' + (j.name ? ' — الملف: ' + j.name : '')]);
      if (id && j.spreadsheetId && j.spreadsheetId !== id) out.push(['err', 'رابط Apps Script مرتبط بملف آخر غير الذي أدخلت رابطه.']);
    } catch (e) { out.push(['err', 'Apps Script: ' + (e.message || e)]); }
  }
  for (const [kind, tab, label] of [['arrival', c.tabA, 'الوصول'], ['departure', c.tabD, 'المغادرة']]) {
    if (tabs && !tabs.includes(tab)) { out.push(['err', 'لا توجد صفحة باسم «' + tab + '». الصفحات الموجودة: ' + tabs.join('، ')]); continue; }
    try {
      const r = C.toRecords(await fetchRows(kind, cfg), kind, cfg);
      if (!r.records.length) out.push(['err', label + ': لا توجد سجلات في صفحة «' + tab + '»']);
      else if (r.map.check == null) out.push(['warn', label + ': ' + r.records.length + ' سجل، لكن لم يُعثر على عمود ' + cfg[kind].checkHeader + ' — تأكد من اسم الصفحة']);
      else out.push(['ok', label + ': ' + r.records.length + ' سجل من «' + tab + '» · عمود التأكيد ' + cfg[kind].checkHeader + ' ✓']);
    } catch (e) { out.push(['err', label + ': ' + (e.message || e)]); }
  }
  return out;
}

/* ---------------- نافذة الإعدادات / معالج أول دخول ---------------- */
function openSettings(first) {
  first = first === true;
  const lab = (t, inner, full) => '<label' + (full ? ' class="full"' : '') + '>' + t + inner + '</label>';
  const inp = (id, v, ph, type, dir) => '<input id="' + id + '" type="' + (type || 'text') + '" value="' + esc(v) + '" placeholder="' + esc(ph || '') + '" dir="' + (dir || 'ltr') + '">';
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
  const ov = modal('<h3>' + (first ? 'مرحباً — اربط ملف Google Sheets' : 'الإعدادات') + '</h3>' +
    (first ? '<p class="hint">يُطلب هذا مرة واحدة فقط: الصق رابط ملف Google Sheets الذي يضم صفحتي الوصول والمغادرة، وسيبقى معتمداً في هذا المتصفح حتى تغيّره من ⚙.</p>' : '') +
    '<div class="set"><h4>ملف Google Sheets</h4>' +
    lab('رابط الملف', inp('sLink', S.source.link, 'https://docs.google.com/spreadsheets/d/…/edit'), true) +
    lab('اسم صفحة الوصول', inp('sTabA', S.source.arrivalTab, 'Arrival', 'text', 'auto')) +
    lab('اسم صفحة المغادرة', inp('sTabD', S.source.departureTab, 'Departure', 'text', 'auto')) +
    '<p class="hint" style="grid-column:1/-1;margin:0">يجب أن يطابق الاسمان تبويبي الملف تماماً. لقراءة الملف بالرابط وحده اجعل مشاركته «أي شخص لديه الرابط: عارض»، أو فعّل Apps Script أدناه ليبقى الملف خاصاً.</p>' +
    '<h4>التزامن الثنائي — Apps Script (للتأكيد والكتابة)</h4>' +
    lab('رابط تطبيق الويب (…/exec)', inp('sWeb', S.webapp, 'https://script.google.com/macros/s/…/exec'), true) +
    lab('الرمز السري (TOKEN)', inp('sTok', S.token, 'نفس القيمة في Code.gs', 'password')) +
    '<label class="sw" style="align-self:end"><input type="checkbox" id="sVia"' + (S.readVia === 'webapp' ? ' checked' : '') + '> القراءة عبر Apps Script (أدق وفورية)</label>' +
    '<h4>التوقيت والتنبيهات</h4>' +
    lab('فاصل التحديث (ثوانٍ)', inp('sRef', S.refreshSec, '', 'number')) +
    lab('ترتيب التاريخ في الجدول', '<select id="sOrd"><option value="DMY"' + (S.dateOrder === 'DMY' ? ' selected' : '') + '>يوم/شهر/سنة</option><option value="MDY"' + (S.dateOrder === 'MDY' ? ' selected' : '') + '>شهر/يوم/سنة</option></select>') +
    lab('«حرج» قبل الرحلة بـ (ساعات)', inp('sCrit', S.criticalH, '', 'number')) +
    lab('«قريب» قبل الرحلة بـ (ساعات)', inp('sWarn', S.warnH, '', 'number')) +
    lab('تأخر التسكين بعد الهبوط بـ (ساعات)', inp('sLate', S.lateH, '', 'number')) +
    mapHtml +
    '</div><div class="act"><button class="btn gold" id="sOk">اختبار واعتماد</button><button class="btn" id="sSaveRaw">حفظ دون اختبار</button><button class="btn" id="sReset">إعادة الضبط</button><button class="btn" id="sClose">إغلاق</button></div><div id="sMsg" class="hint" style="margin-top:10px"></div>');
  const val = id => $('#' + id, ov).value.trim();
  const collect = () => {
    const webapp = val('sWeb');
    return { link: val('sLink'), tabA: val('sTabA') || 'Arrival', tabD: val('sTabD') || 'Departure', webapp, token: $('#sTok', ov).value, via: ($('#sVia', ov).checked && webapp) ? 'webapp' : 'link' };
  };
  const prevLink = S.source.link;
  const commit = c => {
    S.source = { link: c.link, arrivalTab: c.tabA, departureTab: c.tabD };
    S.webapp = c.webapp; S.token = c.token; S.readVia = c.via;
    S.refreshSec = Math.max(10, +val('sRef') || 30); S.dateOrder = val('sOrd');
    S.criticalH = +val('sCrit') || 3; S.warnH = +val('sWarn') || 12; S.lateH = +val('sLate') || 2;
    $$('[data-map]', ov).forEach(sel => { const [k, f] = sel.dataset.map.split('|'); S.map[k] = S.map[k] || {}; if (sel.value) S.map[k][f] = sel.value; else delete S.map[k][f]; });
    if ((S.source.link || '') !== (prevLink || '')) { ['arrival', 'departure'].forEach(k => { try { localStorage.removeItem('hajj1447.cache.' + k); } catch (e) { } state.data[k] = null; }); }
    saveSettings(); ov.close(); startAuto(); refresh();
  };
  $('#sClose', ov).onclick = () => ov.close();
  $('#sReset', ov).onclick = () => { try { localStorage.removeItem(LS_SET); } catch (e) { } location.reload(); };
  $('#sSaveRaw', ov).onclick = () => { commit(collect()); toast('تم حفظ الإعدادات', 'ok'); };
  $('#sOk', ov).onclick = async () => {
    const c = collect(), m = $('#sMsg', ov); m.textContent = 'جارٍ الاختبار…';
    const out = await testSource(c);
    const col = { ok: 'var(--ok)', warn: 'var(--amber)', err: 'var(--red)' }, mk = { ok: '✓ ', warn: '⚠ ', err: '✗ ' };
    m.innerHTML = out.map(([t, s]) => '<div style="color:' + col[t] + ';margin:3px 0">' + mk[t] + esc(s) + '</div>').join('');
    if (!out.some(o => o[0] === 'err')) { commit(c); toast('تم اعتماد المصدر وسيبقى محفوظاً', 'ok'); }
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
const exportRow = (kind, r, reveal) => ({
  'الاسم': r.name, 'الجنسية': r.country ? r.country.ar : r.natRaw, 'رقم الجواز': reveal ? r.passport : mask(r.passport),
  'الرحلة': r.flight, 'الناقل': r.airline, 'التاريخ': r.when ? C.fmtDay(r.when) : r.date, 'الوقت': r.when && !r.approx ? C.fmtTime(r.when) : r.time,
  'الفندق': r.hotel, 'الغرفة': r.room, 'المجموعة': r.group, 'الحالة': ST_LABEL[kind][r._st] || '', [kind === 'arrival' ? 'تم التسكين' : 'تمت المغادرة']: r.done ? 'نعم' : 'لا'
});

/* =====================================================================
   صفحة المتابعة (الوصول / المغادرة)
   ===================================================================== */
const KIND = {
  arrival: { title: 'متابعة الوصول', sub: 'رصد وصول الحجاج وتأكيد التسكين في الفنادق', doneL: 'تم التسكين', openL: 'بانتظار التسكين', act: 'تأكيد التسكين', total: 'إجمالي القادمين' },
  departure: { title: 'متابعة المغادرة', sub: 'متابعة مغادرة الفنادق وإنهاء إجراءات الجوازات قبل الرحلات', doneL: 'تمت المغادرة', openL: 'بانتظار التأكيد', act: 'تأكيد المغادرة (الفندق والجوازات)', total: 'إجمالي المغادرين' }
};
function initTracker(kind) {
  const K = KIND[kind], app = $('#app');
  let view = null; try { view = localStorage.getItem(LS_VIEW); } catch (e) { }
  if (view !== 'cards' && view !== 'table') view = window.matchMedia('(max-width:760px)').matches ? 'cards' : 'table';
  const ui = { q: '', status: 'all', nat: 'all', day: 'all', flight: 'all', sortK: 'when', dir: 1, reveal: false, limit: 150, sel: new Set(), open: new Set(), view, modal: null };
  const qs = new URLSearchParams(location.search); if (qs.get('status')) ui.status = qs.get('status'); if (qs.get('q')) ui.q = qs.get('q');
  let prevDanger = null, gmap = new Map(), ridx = new Map(), mo = null, shownGroups = [];

  app.innerHTML = '<section class="hero"><div><h1>' + K.title + '</h1><p>' + K.sub + '</p></div><div class="hero-actions">' +
    '<button class="btn green" id="xXls">' + ICON.xls + 'Excel</button><button class="btn sky" id="xPdf">' + ICON.pdf + 'PDF</button><button class="btn" id="xPrint">' + ICON.print + 'طباعة</button></div></section>' +
    '<div id="stale"></div><div class="kpis" id="kpis"></div><div id="alertbar"></div>' +
    '<section class="panel"><div class="panel-h"><h2>الرحلات النشطة</h2><span class="hint">اضغط رحلة لتصفية القائمة</span></div><div class="rail" id="rail"></div></section>' +
    '<section class="panel"><div class="toolbar">' +
    '<div class="field">' + ICON.search + '<input type="search" id="fQ" placeholder="بحث: اسم، جواز، رحلة، فندق…" value="' + esc(ui.q) + '"></div>' +
    '<select id="fStatus"><option value="all">كل الحالات</option><option value="open">' + K.openL + '</option><option value="done">' + K.doneL + '</option><option value="danger">حرجة / متأخرة</option><option value="warn">تستدعي الانتباه</option></select>' +
    '<select id="fNat"></select><select id="fDay"></select>' +
    '<label class="sw"><input type="checkbox" id="fReveal"> إظهار أرقام الجوازات</label><span class="sp"></span><span class="hint" id="cnt"></span>' +
    '<div class="seg" role="group" aria-label="طريقة العرض"><button data-view="table" title="عرض جدول">' + ICON.table + '<span>جدول</span></button><button data-view="cards" title="عرض بطاقات">' + ICON.cards + '<span>بطاقات</span></button></div></div>' +
    '<div class="bulk" id="bulk" hidden></div><div id="list"></div><div class="more" id="more"></div></section>';
  $('#fStatus').value = ui.status;

  const recs = () => (state.data[kind] ? state.data[kind].records : []);
  const flightKey = r => (r.flight || '—') + '|' + (r.when ? C.fmtDay(r.when) : '');
  const natLabel = r => r.country ? r.country.ar : (r.natRaw || 'غير محدد');
  function passes(r) {
    if (ui.q) { const h = r._h || (r._h = normAr([r.name, r.passport, r.flight, r.hotel, r.room, r.group, r.phone, r.natRaw, r.country && r.country.ar].join(' '))); if (!h.includes(normAr(ui.q))) return false; }
    if (ui.nat !== 'all' && C.natKey(r) !== ui.nat) return false;
    if (ui.day !== 'all' && !(r.when && C.fmtDay(r.when) === ui.day)) return false;
    if (ui.flight !== 'all' && flightKey(r) !== ui.flight) return false;
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
  const gAct = g => g.open === 0
    ? '<button class="btn sm" data-gact="undo" data-key="' + esc(g.key) + '"' + (g.allSyncing ? ' disabled' : '') + '>تراجع</button>'
    : '<button class="btn sm green" data-gact="ok" data-key="' + esc(g.key) + '"' + (g.allSyncing ? ' disabled' : '') + '>' + ICON.check + (kind === 'arrival' ? 'تسكين' : 'مغادرة') + (g.done ? ' المتبقي' : ' الكل') + '</button>';
  const ppBtn = g => '<button class="btn sm sky" data-grp="' + esc(g.key) + '">' + ICON.eye + 'الجوازات (' + g.rows.length + ')</button>';
  const gCd = g => g.when && g.open > 0 ? '<span class="cd" data-w="' + g.when.getTime() + '"></span>' : '<span class="sub">—</span>';

  /* ---- جدول المجموعات ---- */
  function tableHtml(groups, d) {
    const hasHotel = d.map.hotel != null;
    const cols = [
      { id: 'sel', th: '<input type="checkbox" data-selall aria-label="تحديد الكل">' }, { id: 'n', th: '#' },
      { id: 'flight', th: 'الرحلة', sort: 'flight' }, { id: 'when', th: kind === 'arrival' ? 'موعد الوصول' : 'موعد المغادرة', sort: 'when' }, { id: 'cd', th: 'العدّ التنازلي' },
      hasHotel && { id: 'hotel', th: 'الفندق', sort: 'hotel' }, { id: 'pax', th: 'العدد', sort: 'pax' }, { id: 'nat', th: 'الجنسيات' }, { id: 'pp', th: 'الجوازات' },
      { id: 'st', th: 'الحالة', sort: 'status' }, { id: 'act', th: '' }
    ].filter(Boolean);
    const cell = (c, g, i) => {
      switch (c.id) {
        case 'sel': return '<td><input type="checkbox" data-sel="' + esc(g.key) + '"' + (ui.sel.has(g.key) ? ' checked' : '') + ' aria-label="تحديد"></td>';
        case 'n': return '<td class="sub">' + (i + 1) + '</td>';
        case 'flight': return '<td><b>' + esc(g.flight) + '</b>' + (g.airline ? '<div class="sub">' + esc(g.airline) + '</div>' : '') + '</td>';
        case 'when': return '<td>' + gWhen(g) + '</td>';
        case 'cd': return '<td>' + gCd(g) + '</td>';
        case 'hotel': return '<td>' + esc(g.hotel || '—') + '</td>';
        case 'pax': return '<td><b class="num" style="font-size:17px">' + g.pax + '</b><div class="bar" style="width:70px;margin-top:4px"><i style="width:' + Math.round(g.done / g.pax * 100) + '%"></i></div></td>';
        case 'nat': return '<td>' + natChips(g, 3) + '</td>';
        case 'pp': return '<td>' + ppBtn(g) + '</td>';
        case 'st': return '<td>' + stChip(g) + '</td>';
        case 'act': return '<td>' + gAct(g) + '</td>';
      }
      return '<td></td>';
    };
    return '<div class="tablewrap"><table id="tbl"><thead><tr>' + cols.map(c => '<th' + (c.sort ? ' class="sort" data-sort="' + c.sort + '"' : '') + '>' + c.th + (c.sort && ui.sortK === c.sort ? '<span class="ar">' + (ui.dir > 0 ? '▲' : '▼') + '</span>' : '') + '</th>').join('') + '</tr></thead><tbody>' +
      (groups.length ? groups.map((g, i) => '<tr class="r ' + (g.open === 0 ? 'done ' : '') + (g.open && g.cls === 'danger' ? 'danger ' : g.open && g.cls === 'warn' ? 'warn ' : '') + (g.syncing ? 'syncing' : '') + '">' + cols.map(c => cell(c, g, i)).join('') + '</tr>').join('') :
        '<tr><td colspan="' + cols.length + '"><div class="empty">لا توجد نتائج مطابقة</div></td></tr>') + '</tbody></table></div>';
  }
  /* ---- بطاقات المجموعات ---- */
  function cardsHtml(groups) {
    if (!groups.length) return '<div class="empty">لا توجد نتائج مطابقة</div>';
    return '<div class="cards">' + groups.map(g =>
      '<article class="gcard ' + (g.open === 0 ? 'done ' : '') + (g.open && g.cls === 'danger' ? 'danger ' : g.open && g.cls === 'warn' ? 'warn ' : '') + '">' +
      '<header><label class="chk"><input type="checkbox" data-sel="' + esc(g.key) + '"' + (ui.sel.has(g.key) ? ' checked' : '') + ' aria-label="تحديد"></label><div class="gt"><b class="no">' + esc(g.flight) + '</b>' + (g.airline ? '<div class="sub">' + esc(g.airline) + '</div>' : '') + '</div><div class="gs">' + stChip(g) + '</div></header>' +
      '<div class="gbig"><div><b class="num">' + g.pax + '</b><span>فرد</span></div><div class="gcd">' + gCd(g) + '</div></div>' +
      '<div class="bar"><i style="width:' + Math.round(g.done / g.pax * 100) + '%"></i></div>' +
      '<dl class="gkv"><div><dt>الموعد</dt><dd>' + gWhen(g) + '</dd></div>' + (g.hotel ? '<div><dt>الفندق</dt><dd>' + esc(g.hotel) + '</dd></div>' : '') + '</dl>' +
      natChips(g, 4) + '<footer>' + ppBtn(g) + gAct(g) + '</footer></article>').join('') + '</div>';
  }

  function render() {
    const d = state.data[kind], now = Date.now();
    const stale = $('#stale');
    if (!d) {
      stale.innerHTML = state.err[kind] ? '<div class="stale">⚠ ' + esc(state.err[kind]) + ' <button class="btn sm" id="stSet">الإعدادات</button></div>' : '';
      if ($('#stSet')) $('#stSet').onclick = () => openSettings(false);
      $('#kpis').innerHTML = '<div class="empty" style="grid-column:1/-1">' + (state.err[kind] ? 'تعذّر تحميل البيانات.' : 'جارٍ تحميل البيانات…') + '</div>'; return;
    }
    stale.innerHTML = state.err[kind] ? '<div class="stale">⚠ تعذّر التحديث الأخير (' + esc(state.err[kind]) + ') — تُعرض آخر بيانات محفوظة.</div>' : (d.warn ? '<div class="stale">⚠ ' + esc(d.warn) + ' <button class="btn sm" id="stSet2">الإعدادات</button></div>' : '');
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
    if (prevDanger) { let n = 0; dk.forEach(k => { if (!prevDanger.has(k)) n++; }); if (n) toast('تنبيه: ' + n + ' حالة حرجة جديدة', 'err'); }
    prevDanger = dk;

    // شريط الرحلات
    const act = fl.filter(g => g.done < g.pax).slice(0, 40);
    $('#rail').innerHTML = act.length ? act.map(g => {
      const lv = g.when ? (g.when.getTime() < now ? (kind === 'arrival' ? 'warn' : 'danger') : ((g.when.getTime() - now) / 36e5 <= S.criticalH ? 'danger' : ((g.when.getTime() - now) / 36e5 <= S.warnH ? 'warn' : ''))) : '';
      return '<div class="fl ' + lv + (ui.flight === g.key ? ' on' : '') + '" data-flight="' + esc(g.key) + '"><div class="t"><span class="no">' + esc(g.flight) + '</span><span class="sub">' + (g.when ? C.fmtDayAr(g.when) : '') + '</span></div>' +
        '<div class="m"><span>' + esc(g.airline || '') + '</span><span class="num">' + (g.when ? C.fmtTime(g.when) : '') + '</span></div>' +
        '<div class="cd-wrap">' + (g.when ? '<span class="cd" data-w="' + g.when.getTime() + '" style="font-size:18px;font-weight:700"></span>' : '') + '</div>' +
        '<div class="bar" style="margin-top:8px"><i style="width:' + Math.round(g.done / g.pax * 100) + '%"></i></div>' +
        '<div class="row"><span class="num">' + g.done + ' / ' + g.pax + '</span><button class="btn sm" data-fok="' + esc(g.key) + '">' + ICON.check + 'تأكيد الكل</button></div></div>';
    }).join('') : '<div class="empty" style="width:100%;padding:16px">لا توجد رحلات نشطة — كل الرحلات مكتملة ✓</div>';

    // خيارات التصفية
    const nats = new Map(); R.forEach(r => nats.set(C.natKey(r), natLabel(r)));
    const nv = ui.nat; $('#fNat').innerHTML = '<option value="all">كل الجنسيات</option>' + [...nats.entries()].sort((a, b) => a[1].localeCompare(b[1], 'ar')).map(([k, v]) => '<option value="' + esc(k) + '">' + esc(v) + '</option>').join(''); $('#fNat').value = nv;
    const days = [...new Set(R.filter(r => r.when).map(r => C.fmtDay(r.when)))].sort();
    const dv = ui.day; $('#fDay').innerHTML = '<option value="all">كل الأيام</option>' + days.map(k => '<option value="' + k + '">' + k.slice(5).replace('-', '/') + '</option>').join(''); $('#fDay').value = dv;
    $$('.seg [data-view]').forEach(b => { const on = b.dataset.view === ui.view; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });

    // القائمة
    shownGroups = sortedGroups(allGroups);
    const shown = shownGroups.slice(0, ui.limit);
    $('#list').innerHTML = ui.view === 'cards' ? cardsHtml(shown) : tableHtml(shown, d);
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
    $('#gmBody', mo).innerHTML = '<h3>' + esc(gTitle(g)) + '</h3>' +
      '<div class="mhead"><span>' + gWhen(g) + '</span>' + (g.open > 0 && g.when ? '<span class="cd" data-w="' + g.when.getTime() + '"></span>' : '') + '<span><b class="num">' + g.pax + '</b> فرد · مكتمل <b class="num">' + g.done + '</b></span></div>' +
      '<div class="nfilter">' + chips + '</div>' +
      '<div class="toolbar"><label class="sw"><input type="checkbox" id="mReveal"' + (ui.reveal ? ' checked' : '') + '> إظهار أرقام الجوازات</label><span class="sp"></span>' +
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
      if (a === 'xls') { try { await saveXlsx([{ name: 'الحجاج', rows: list.map(r => exportRow(kind, r, ui.reveal)) }], 'hajj1447-' + kind + '-' + tag + '.xlsx'); toast('تم تصدير Excel', 'ok'); } catch (x) { toast(x.message, 'err'); } }
      if (a === 'pdf') {
        toast('جارٍ تجهيز PDF…'); const paxN = list.reduce((s, r) => s + r.pax, 0);
        const html = reportHtml({
          title: gTitle(g), sub: gWhen(g) + (ui.modal.nat !== 'all' ? ' · الجنسية: ' + (g.nats.get(ui.modal.nat) || {}).label : ''),
          kpis: [['العدد', paxN], [K.doneL, list.filter(r => r.done).reduce((s, r) => s + r.pax, 0), '#006C35'], ['المتبقي', list.filter(r => !r.done).reduce((s, r) => s + r.pax, 0), '#F5A524'], ['عدد الجوازات', list.length, '#0EA5E9']],
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
    if (list.length > 1 && !(await confirmBox(label, 'سيتم تحديث ' + list.length + ' سجل في Google Sheets. متابعة؟', 'نعم، تنفيذ'))) return;
    await writeChecks(kind, list, value);
  }
  app.addEventListener('click', e => {
    const t = e.target; let el;
    if ((el = t.closest('[data-gact]'))) { const g = gmap.get(el.dataset.key); if (g) doWrite(g.rows, el.dataset.gact === 'ok', K.act + ' — ' + gTitle(g)); return; }
    if ((el = t.closest('[data-grp]'))) { openGroup(el.dataset.grp, el.dataset.nat); return; }
    if ((el = t.closest('[data-view]'))) { ui.view = el.dataset.view; try { localStorage.setItem(LS_VIEW, ui.view); } catch (x) { } render(); return; }
    if ((el = t.closest('[data-fok]'))) { e.stopPropagation(); const g = C.groupFlights(recs()).find(x => x.key === el.dataset.fok); if (g) doWrite(g.rows, true, K.act + ' — رحلة ' + g.flight); return; }
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
  $('#fQ').oninput = e => { ui.q = e.target.value; ui.limit = 150; render(); };
  $('#fStatus').onchange = e => { ui.status = e.target.value; render(); };
  $('#fNat').onchange = e => { ui.nat = e.target.value; render(); };
  $('#fDay').onchange = e => { ui.day = e.target.value; render(); };
  $('#fReveal').onchange = e => { ui.reveal = e.target.checked; render(); };
  $('#xPrint').onclick = () => window.print();
  const groupExport = g => ({
    'الرحلة': g.flight, 'الناقل': g.airline, 'التاريخ': g.when ? C.fmtDay(g.when) : '', 'الوقت': g.when && !g.approx ? C.fmtTime(g.when) : '', 'الفندق': g.hotel,
    'العدد': g.pax, [K.doneL]: g.done, 'المتبقي': g.pax - g.done, 'عدد الجوازات': g.rows.length, 'الجنسيات': natText(g), 'الحالة': g.open ? (ST_LABEL[kind][g.st] || '') : ST_LABEL[kind].done
  });
  $('#xXls').onclick = async () => {
    try {
      const gs = shownGroups;
      await saveXlsx([{ name: 'المجموعات', rows: gs.map(groupExport) }, { name: 'الحجاج', rows: gs.flatMap(g => g.rows.map(r => exportRow(kind, r, ui.reveal))) }], 'hajj1447-' + kind + '-' + stamp() + '.xlsx');
      toast('تم تصدير Excel (ورقة المجموعات + ورقة الحجاج)', 'ok');
    } catch (e) { toast(e.message, 'err'); }
  };
  $('#xPdf').onclick = async () => {
    const gs = shownGroups, sm = C.summarize(recs(), Date.now(), S); toast('جارٍ تجهيز PDF…');
    const html = reportHtml({
      title: 'تقرير ' + K.title, sub: gs.length + ' مجموعة (حسب التصفية الحالية)',
      kpis: [[K.total, sm.total], [K.doneL, sm.done, '#006C35'], [K.openL, sm.pending, '#F5A524'], ['حرجة / متأخرة', sm.danger, '#E5484D'], ['نسبة الإنجاز', sm.pct + '%', '#0EA5E9']],
      head: ['#', 'الرحلة', 'الموعد', 'الفندق', 'العدد', 'الجنسيات', 'الحالة'],
      rows: gs.map((g, i) => [i + 1, g.flight, gWhen(g), g.hotel, g.pax, { html: g.natList.map(n => (n.c ? flagImg(n.c) : esc(n.label)) + ' (' + n.n + ')').join('&nbsp;&nbsp;') }, g.open ? (ST_LABEL[kind][g.st] || '') : ST_LABEL[kind].done])
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
    '<div id="stale"></div><div class="kpis" id="kpis"></div>' +
    '<div class="grid2"><section class="panel"><h2>أقرب الرحلات</h2><div class="cols2"><div><h3>الوصول</h3><div class="nxt" id="nxA"></div></div><div><h3>المغادرة</h3><div class="nxt" id="nxD"></div></div></div></section>' +
    '<section class="panel"><h2>نسب الإنجاز</h2><div class="rings" id="rings"></div></section></div>' +
    '<div class="grid2 even"><section class="panel"><h2>الوصول حسب اليوم</h2><div class="chartbox"><canvas id="chA"></canvas></div></section><section class="panel"><h2>المغادرة حسب اليوم</h2><div class="chartbox"><canvas id="chD"></canvas></div></section></div>' +
    '<div class="grid2"><section class="panel"><h2>حركة الرحلات خلال 24 ساعة القادمة</h2><div class="chartbox"><canvas id="chH"></canvas></div></section><section class="panel"><div class="panel-h"><h2>الجوازات حسب الجنسية</h2><span class="hint" id="natCnt"></span></div><div class="natl" id="nat"></div></section></div>' +
    '<section class="panel"><h2>تنبيهات حرجة تحتاج إجراءً</h2><div class="nxt feed" id="feed"></div></section>';
  let snap = null;

  function nxList(kind) {
    const d = state.data[kind], now = Date.now(); if (!d) return '<div class="empty">—</div>';
    const g = C.groupFlights(d.records).filter(x => x.when && x.done < x.pax && x.when.getTime() > now - 36e5).slice(0, 5);
    return g.length ? g.map(x => '<a class="nx" href="' + kind + '.html?q=' + encodeURIComponent(x.flight) + '"><span class="no">' + esc(x.flight) + '</span><span class="i">' + esc(x.airline || '') + '<small>' + C.fmtDayAr(x.when) + ' · ' + C.fmtTime(x.when) + ' · ' + x.pax + ' فرد</small></span><span class="c"><span class="cd" data-w="' + x.when.getTime() + '"></span></span></a>').join('') : '<div class="empty" style="padding:14px">لا توجد رحلات قادمة</div>';
  }
  function render() {
    const A = state.data.arrival, D = state.data.departure, now = Date.now();
    $('#stale').innerHTML = (state.err.arrival || state.err.departure) ? '<div class="stale">⚠ ' + esc(state.err.arrival || state.err.departure) + (A || D ? ' — تُعرض آخر بيانات محفوظة' : '') + ' <button class="btn sm" id="stSet">الإعدادات</button></div>' : '';
    if ($('#stSet')) $('#stSet').onclick = () => openSettings(false);
    if (!A && !D) { $('#kpis').innerHTML = '<div class="empty" style="grid-column:1/-1">' + (state.err.arrival || state.err.departure ? 'تعذّر تحميل البيانات.' : 'جارٍ تحميل البيانات…') + '</div>'; return; }
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
    tick();
  }
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
function boot() {
  let th = 'dark'; try { th = localStorage.getItem(LS_THEME) || 'dark'; } catch (e) { }
  document.documentElement.dataset.theme = th;
  const page = document.body.dataset.page;
  kindsInUse = page === 'index' ? ['arrival', 'departure'] : [page];
  renderNav(page); hydrate(kindsInUse);
  if (page === 'index') initDashboard(); else initTracker(page);
  setInterval(() => tick(), 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && sourceReady() && Date.now() - lastTry > S.refreshSec * 1000) refresh(); });
  if (!sourceReady()) { openSettings(true); return; }
  refresh(); startAuto(); updateBadges();
}
document.addEventListener('DOMContentLoaded', boot);
})();
