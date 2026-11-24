/**
 * منظومة تحركات الحجاج 1447هـ — الخادم (Google Apps Script Web App)
 * ---------------------------------------------------------------------------
 *  • المالك: يدخل بالبريد وكلمة المرور (المكتوبين أدناه) فيضبط الإعدادات كلها ويحذفها.
 *  • الزائر: يرى البيانات بحسب ما يسمح به المالك، ويؤكد التسكين/المغادرة، ولا يرى الإعدادات ولا أي سر.
 *  • الإعدادات تُحفظ هنا (خصائص السكربت) لا في المتصفح، فتظهر لكل من يفتح الموقع.
 *  • الجدول يُقرأ ويُكتب عبر هذا السكربت فقط، فيمكن إبقاء الجدول خاصاً (غير منشور).
 *
 * طريقة التركيب: README.md  — بعد أي تعديل هنا: نشر ← إدارة عمليات النشر ← ✏ ← إصدار جديد.
 */
const CONFIG = {
  // حساب المالك (غيّرهما قبل النشر، وكلمة المرور طويلة وفريدة)
  OWNER_EMAIL: 'owner@example.com',
  OWNER_PASSWORD: 'CHANGE-ME-TO-A-LONG-PASSWORD',

  // اتركه فارغاً إذا أنشأت السكربت من داخل الجدول (الإضافات ← Apps Script)، أو ضع معرّف الملف.
  // وللمالك أن يحدد الملف من لوحته برابطه، فيُقدَّم الرابط على هذا المعرّف.
  SPREADSHEET_ID: '',

  // أسماء أعمدة التأكيد الافتراضية ونص التأكيد المكتوب فيها (للمالك تغيير العمود من «ربط الأعمدة»)
  KINDS: {
    arrival:   { checkHeader: 'Check',    atHeader: 'Check_At',    byHeader: 'Check_By',    textOn: 'تم التسكين'   },
    departure: { checkHeader: 'Check_De', atHeader: 'Check_De_At', byHeader: 'Check_De_By', textOn: 'تمت المغادرة' }
  },
  // 'text' → يكتب نص التأكيد، وعند التراجع يفرّغ الخلية | 'boolean' → TRUE/FALSE
  WRITE_AS: 'text',
  TEXT_OFF: '',

  SESSION_HOURS: 6,        // مدة جلسة المالك (الحد الأقصى 6 ساعات)
  MAX_OPS: 50,             // أقصى عدد سجلات في طلب كتابة واحد
  LOG_SHEET: 'Log',        // تبويب سجل التأكيدات (يُنشأ تلقائياً)
  READY_SHEET: 'Readiness',// تبويب الاستعداد المسبق للرحلات (يُنشأ تلقائياً)
  NOTES_SHEET: 'Notes',    // تبويب الملاحظات وحالة النقل للمجموعات (يُنشأ تلقائياً)
  BACKUP_PREFIX: 'Backup_',// بادئة تبويبات النسخ الاحتياطي داخل الملف
  BACKUP_KEEP: 12,         // عدد النسخ المحتفظ بها لكل صفحة (الأقدم يُحذف)
  BACKUP_BULK_MIN: 10,     // نسخة تلقائية قبل أي كتابة جماعية بهذا العدد أو أكثر
  BACKUP_GAP_MIN: 30,      // لا تُكرَّر نسخة الكتابة الجماعية قبل مرور هذه الدقائق
  BACKUP_HOUR: 3           // ساعة النسخ اليومي (بتوقيت الملف)
};

const PROP_KEY = 'HAJJ_SETTINGS';

/* ============================ نقطة الدخول ============================ */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    switch (p.action) {
      case 'public':      return json_(publicInfo_());
      case 'login':       return json_(login_(payload_(p)));
      case 'whoami':      return json_({ ok: true, owner: isOwner_(p.s) });
      case 'logout':      cache_().remove('s_' + p.s); return json_({ ok: true });
      case 'owner_get':   requireOwner_(p); return json_(ownerGet_());
      case 'owner_save':  requireOwner_(p); { const r = ownerSave_(payload_(p)); bumpData_(); return json_(r); }
      case 'owner_test':  requireOwner_(p); return json_(ownerTest_(payload_(p)));
      case 'owner_reset': requireOwner_(p); PropertiesService.getScriptProperties().deleteProperty(PROP_KEY); bumpData_(); return json_({ ok: true });
      case 'owner_backup':       requireOwner_(p); return json_(backupNow_('يدوي'));
      case 'owner_backup_info':  requireOwner_(p); return json_(backupInfo_());
      case 'owner_backup_daily': requireOwner_(p); return json_(backupDaily_(payload_(p).on === true));
      case 'ready_get':   return json_(memo_('ready', 15, readyGet_));
      case 'ready_set':   return json_(readySet_(payload_(p), isOwner_(p.s)));
      case 'fc_get':      return json_(memo_('fc', 15, fcGet_));
      case 'fc_set':      return json_(fcSet_(payload_(p), isOwner_(p.s)));
      case 'fc_lookup':   return json_(fcLookup_(payload_(p), isOwner_(p.s)));
      case 'appr_get':    return json_(memo_('appr', 15, apprGet_));
      case 'appr_set':    return json_(apprSet_(payload_(p), isOwner_(p.s)));
      case 'names_get':   return json_(namesCached_(p));
      case 'notes_get':   return json_(notesCached_(p));
      case 'note_set':    return json_(noteSet_(payload_(p), isOwner_(p.s)));
      case 'read':        return json_(read_(p));
      case 'write':       return json_(write_(payload_(p), isOwner_(p.s)));
      default:            return json_(p.action ? { ok: false, error: 'إجراء غير معروف: ' + p.action } : { ok: true, service: 'hajj-sync', v: 3 });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

/* ============================ المالك والجلسات ============================ */
function login_(req) {
  const c = cache_();
  const fails = Number(c.get('fails') || 0);
  if (fails >= 5) return { ok: false, error: 'محاولات كثيرة خاطئة — انتظر 15 دقيقة ثم أعد المحاولة' };
  const okMail = safeEq_(String(req.email || '').trim().toLowerCase(), String(CONFIG.OWNER_EMAIL).trim().toLowerCase());
  const okPass = safeEq_(String(req.password || ''), CONFIG.OWNER_PASSWORD);
  if (!(okMail && okPass) || /CHANGE-ME/.test(CONFIG.OWNER_PASSWORD)) {
    c.put('fails', String(fails + 1), 900);
    return { ok: false, error: /CHANGE-ME/.test(CONFIG.OWNER_PASSWORD) ? 'لم تُغيَّر كلمة مرور المالك في Code.gs' : 'البريد أو كلمة المرور غير صحيحة' };
  }
  c.remove('fails');
  const s = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  c.put('s_' + s, '1', Math.min(21600, CONFIG.SESSION_HOURS * 3600));
  return { ok: true, session: s, email: CONFIG.OWNER_EMAIL };
}
function isOwner_(s) { return !!s && cache_().get('s_' + s) === '1'; }
function requireOwner_(p) { if (!isOwner_(p.s)) throw new Error('غير مصرّح — سجّل دخول المالك'); }
function cache_() { return CacheService.getScriptCache(); }

/* ---- ذاكرة مؤقتة للقراءة: تقلّل فتح الملف وقراءة الأوراق كاملة عند كل طلب (أكبر مصدر لبطء الخادم) ----
   تُبطَل فوراً عند أي كتابة عبر bumpData_()، وتنتهي وحدها خلال ثوانٍ إن عُدّل الجدول يدوياً. */
const CHUNK_ = 25000;
function dv_() { return cache_().get('dv') || '0'; }
function bumpData_() { try { cache_().put('dv', String(Date.now()), 21600); } catch (e) { } }
function dataGet_(name) {
  try {
    const c = cache_(), key = name + '_' + dv_(), n = Number(c.get(key + ':n') || 0); if (!n) return null;
    const keys = []; for (let i = 0; i < n; i++) keys.push(key + ':' + i);
    const parts = c.getAll(keys); let s = '';
    for (let i = 0; i < n; i++) { const x = parts[key + ':' + i]; if (x == null) return null; s += x; }
    return JSON.parse(s);
  } catch (e) { return null; }
}
function dataPut_(name, val, ttl) {
  try {
    const key = name + '_' + dv_(), s = JSON.stringify(val), n = Math.ceil(s.length / CHUNK_); if (n > 90) return;
    const o = {}; for (let i = 0; i < n; i++) o[key + ':' + i] = s.substr(i * CHUNK_, CHUNK_);
    o[key + ':n'] = String(n); cache_().putAll(o, ttl);
  } catch (e) { }
}
function memo_(name, ttl, fn) {
  const hit = dataGet_(name); if (hit) return hit;
  const v = fn(); if (v && v.ok) dataPut_(name, v, ttl); return v;
}
function namesCached_(p) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  if (!isOwner_(p.s) && !(st.perms && st.perms.showPassports)) return { ok: true, items: {}, hidden: true };
  return memo_('names', 60, function () { return namesGet_(p); });
}
function notesCached_(p) {
  if (p.kind !== 'arrival' && p.kind !== 'departure' && p.kind !== 'transfers') return notesGet_(p);
  return memo_('notes_' + p.kind, 15, function () { return notesGet_(p); });
}
function safeEq_(a, b) {
  a = String(a); b = String(b);
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

/* ============================ الإعدادات ============================ */
function settings_() {
  const raw = PropertiesService.getScriptProperties().getProperty(PROP_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}
// ما يراه الزائر: كل شيء عدا رابط الملف ومعرّفه وأعمدة الجوازات
function publicSettings_(st) {
  const o = JSON.parse(JSON.stringify(st));
  if (o.source) delete o.source.link;
  delete o.sheetId; delete o.passCol; delete o.pin; delete o.pinArr; delete o.pinDep;
  o.pinSet = !!st.pin; o.pinArrSet = !!st.pinArr; o.pinDepSet = !!st.pinDep;
  return o;
}
function publicInfo_() {
  const st = settings_();
  return { ok: true, service: 'hajj-sync', v: 3, configured: !!st, settings: st ? publicSettings_(st) : null };
}
function ownerView_(st) { if (!st) return st; const o = JSON.parse(JSON.stringify(st)); o.pinSet = !!st.pin; o.pinArrSet = !!st.pinArr; o.pinDepSet = !!st.pinDep; delete o.pin; delete o.pinArr; delete o.pinDep; return o; }
function ownerGet_() {
  const st = settings_();
  return { ok: true, email: CONFIG.OWNER_EMAIL, configured: !!st, settings: ownerView_(st) };
}
function num_(v, d, lo, hi) { v = Number(v); return isFinite(v) && v >= lo && v <= hi ? v : d; }
function str_(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
function sheetIdFromLink_(l) { const m = /\/d\/([a-zA-Z0-9_-]{20,})/.exec(String(l || '')); return m ? m[1] : ''; }

// تنقية صارمة: لا يُحفظ إلا ما نعرفه وبحدود محددة
function clean_(o, old) {
  o = o || {};
  const src = o.source || {}, ld = o.lead || {}, tp = o.transport || {}, pm = o.perms || {}, pc = o.passCol || {};
  const link = str_(src.link, 400);
  if (link && !/^https:\/\/docs\.google\.com\/spreadsheets\//.test(link)) throw new Error('رابط الملف ليس رابط Google Sheets');
  const out = {
    source: { link: link, arrivalTab: str_(src.arrivalTab, 80) || 'Arrival', departureTab: str_(src.departureTab, 80) || 'Departure' },
    sheetId: sheetIdFromLink_(link),
    refreshSec: num_(o.refreshSec, 30, 10, 3600),
    dateOrder: o.dateOrder === 'MDY' ? 'MDY' : 'DMY',
    criticalH: num_(o.criticalH, 3, 0.1, 100), warnH: num_(o.warnH, 12, 0.1, 200), lateH: num_(o.lateH, 2, 0.1, 100),
    lead: {},
    transport: { arrival: tp.arrival !== false, departure: tp.departure !== false, busMin: num_(tp.busMin, 8, 1, 100) },
    map: { arrival: {}, departure: {} },
    perms: { showPassports: pm.showPassports === true, confirm: (pm.confirm === 'pin' || pm.confirm === 'off' || pm.confirm === 'roles') ? pm.confirm : 'all' },
    pin: o.pin === undefined ? ((old && old.pin) || '') : str_(String(o.pin), 32),
    pinArr: o.pinArr === undefined ? ((old && old.pinArr) || '') : str_(String(o.pinArr), 32),
    pinDep: o.pinDep === undefined ? ((old && old.pinDep) || '') : str_(String(o.pinDep), 32),
    passCol: { arrival: pcol_(pc.arrival), departure: pcol_(pc.departure) },
    updatedAt: Date.now()
  };
  const LEAD0 = { 'makkah>jeddah': 4, 'makkah>madinah': 10, 'madinah>madinah': 4, 'madinah>jeddah': 10 };
  Object.keys(LEAD0).forEach(function (k) { out.lead[k] = num_(ld[k], LEAD0[k], 0, 72); });
  ['arrival', 'departure'].forEach(function (k) {
    const m = (o.map && o.map[k]) || {};
    Object.keys(m).slice(0, 40).forEach(function (f) { if (/^[a-zA-Z]{1,20}$/.test(f) && typeof m[f] === 'string') out.map[k][f] = m[f].slice(0, 120); });
  });
  return out;
}
function pcol_(v) { if (v === null || v === undefined || v === '') return null; v = Number(v); return (isFinite(v) && v >= 0 && v < 200 && v === Math.floor(v)) ? v : null; }

function ownerSave_(o) {
  const st = clean_(o, settings_());
  if (st.perms.confirm === 'pin' && !st.pin) return { ok: false, error: 'حدّد رمز المشرف أولاً (وضع التأكيد بالرمز)' };
  if (st.perms.confirm === 'roles' && !st.pin && !st.pinArr && !st.pinDep) return { ok: false, error: 'حدّد رمز مشرف واحداً على الأقل (وضع الأدوار)' };
  const ss = openSS_(st);                       // يتحقق أن الملف مفتوح
  const tabs = ss.getSheets().map(function (s) { return s.getName(); });
  const miss = [st.source.arrivalTab, st.source.departureTab].filter(function (t) { return tabs.indexOf(t) < 0; });
  if (miss.length) return { ok: false, error: 'لا توجد صفحة باسم «' + miss.join('» و«') + '». الصفحات الموجودة: ' + tabs.join('، '), tabs: tabs };
  PropertiesService.getScriptProperties().setProperty(PROP_KEY, JSON.stringify(st));
  return { ok: true, name: ss.getName(), tabs: tabs, settings: ownerView_(st) };
}
function ownerTest_(req) {
  const st = { sheetId: sheetIdFromLink_(req && req.link) };
  const ss = openSS_(st);
  return { ok: true, name: ss.getName(), spreadsheetId: ss.getId(), tabs: ss.getSheets().map(function (s) { return s.getName(); }) };
}

/* ============================ القراءة ============================ */
function read_(p) {
  const st = settings_();
  if (!st) return { ok: false, error: 'not_configured' };
  if (p.kind !== 'arrival' && p.kind !== 'departure' && p.kind !== 'transfers') return { ok: false, error: 'kind غير صالح' };
  let rows = dataGet_('rows_' + p.kind);
  if (!rows) { rows = sheetOf_(st, p.kind).getDataRange().getDisplayValues(); dataPut_('rows_' + p.kind, rows, 20); }   // تُحفظ الصفوف الخام قبل التقنيع
  if (!isOwner_(p.s) && !(st.perms && st.perms.showPassports)) {
    const hi = headerIdx_(rows), col = passCol_(st, p.kind, rows[hi] || []);
    if (col >= 0) for (let i = hi + 1; i < rows.length; i++) rows[i][col] = mask_(rows[i][col]);
  }
  return { ok: true, rows: rows, ts: Date.now(), masked: !isOwner_(p.s) && !(st.perms && st.perms.showPassports) };
}
function mask_(v) { v = String(v == null ? '' : v).trim(); return v ? '••••' + v.slice(-4) : ''; }
function headerIdx_(rows) {
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    if (rows[i].filter(function (c) { return String(c).trim() !== ''; }).length >= 3) return i;
  }
  return 0;
}
function passCol_(st, kind, headers) {
  const c = st.passCol && st.passCol[kind];
  if (c != null && c < headers.length) return c;
  for (let i = 0; i < headers.length; i++) if (/جواز|passport/i.test(String(headers[i]))) return i;
  return -1;
}

/* ============================ الكتابة ============================ */
// صلاحية الكتابة للزائر بحسب وضع المالك (all / pin / off)؛ تعيد null إن سُمح
// area: arrival | departure (التنقلات والاعتمادات تتبع مشرف المغادرة). في وضع roles: رمز عام، أو رمز دور المنطقة؛ ومن لا يملك رمزاً مراقب (عرض فقط)
function visitorDenied_(st, req, owner, area) {
  if (owner) return null;
  const mode = (st.perms && st.perms.confirm) || 'all';
  if (mode === 'off') return { ok: false, error: 'readonly' };
  if (mode === 'roles') {
    const c = cache_(), pf = Number(c.get('pfails') || 0);
    if (pf >= 8) return { ok: false, error: 'locked' };
    const given = String(req.pin || ''), role = area === 'arrival' ? st.pinArr : st.pinDep;
    const ok = given && ((st.pin && safeEq_(given, st.pin)) || (role && safeEq_(given, role)));
    if (!ok) { c.put('pfails', String(pf + 1), 900); return { ok: false, error: 'bad_pin' }; }
    c.remove('pfails');
    return null;
  }
  if (mode === 'pin') {
    const c = cache_(), pf = Number(c.get('pfails') || 0);
    if (pf >= 8) return { ok: false, error: 'locked' };
    if (!st.pin || !safeEq_(String(req.pin || ''), st.pin)) { c.put('pfails', String(pf + 1), 900); return { ok: false, error: 'bad_pin' }; }
    c.remove('pfails');
  }
  return null;
}
function pgOf_(kind) { return kind === 'arrival' ? 'الوصول' : kind === 'transfers' ? 'التنقلات' : 'المغادرة'; }
function byOf_(req, owner) { return cell_(String(req.by || '').replace(/[\r\n\t]/g, ' ').trim().slice(0, 40)) || (owner ? 'المالك' : 'زائر'); }
function write_(req, owner) {
  const st = settings_();
  if (!st) return { ok: false, error: 'not_configured' };
  const kind = req.kind, cfg = CONFIG.KINDS[kind];
  if (!cfg) return { ok: false, error: 'kind غير صالح' };
  const ops = (req.ops || []).slice(0, CONFIG.MAX_OPS);
  const denied = visitorDenied_(st, req, owner, kind === 'arrival' ? 'arrival' : 'departure'); if (denied) return denied;
  const by = byOf_(req, owner);
  if (ops.length >= CONFIG.BACKUP_BULK_MIN) backupIfStale_(st, 'قبل تعديل جماعي');
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const sh = sheetOf_(st, kind);
    const headerRow = Number(req.headerRow) || detectHeaderRow_(sh);
    const headers = sh.getRange(headerRow, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
    const checkName = (st.map && st.map[kind] && st.map[kind].check) || cfg.checkHeader;
    const colCheck = findCol_(headers, checkName);
    if (colCheck < 0) return { ok: false, error: 'العمود ' + checkName + ' غير موجود في الورقة' };
    const colAt = cfg.atHeader ? findCol_(headers, cfg.atHeader) : -1;
    const colBy = cfg.byHeader ? findCol_(headers, cfg.byHeader) : -1;
    const masked = !owner && !(st.perms && st.perms.showPassports);
    const pcol = masked ? passCol_(st, kind, headers) : -1;
    const norm = function (col, v) { v = String(v == null ? '' : v).trim(); return (masked && col === pcol) ? mask_(v) : v; };

    const keyCache = {};
    const results = ops.map(function (op) {
      try {
        let row = Number(op.row);
        if (!(row > headerRow) || row !== Math.floor(row) || row > sh.getMaxRows()) throw new Error('رقم صف غير صالح');
        const keyCol = op.keyHeader ? findCol_(headers, op.keyHeader) : -1;
        if (keyCol >= 0 && op.key) {
          const cur = norm(keyCol, sh.getRange(row, keyCol + 1).getDisplayValue());
          if (cur !== String(op.key).trim()) {            // تغيّر ترتيب الصفوف: ابحث بالقيمة المفتاحية
            row = locateRow_(sh, headerRow, keyCol, String(op.key).trim(), keyCache, function (v) { return norm(keyCol, v); });
            if (row === -1) throw new Error('لم يُعثر على السجل (تغيّر الجدول)');
            if (row === -2) throw new Error('القيمة المفتاحية مكرّرة — تعذّر تحديد الصف');
          }
        }
        const on = op.value === true;
        sh.getRange(row, colCheck + 1).setValue(CONFIG.WRITE_AS === 'text' ? (on ? (cfg.textOn || 'تم') : CONFIG.TEXT_OFF) : on);
        if (colAt >= 0) sh.getRange(row, colAt + 1).setValue(on ? new Date() : '');
        if (colBy >= 0) sh.getRange(row, colBy + 1).setValue(on ? by : '');
        return { ok: true, row: row };
      } catch (err) {
        return { ok: false, error: String(err.message || err) };
      }
    });
    SpreadsheetApp.flush(); bumpData_();
    log_(st, kind, owner, by, ops[0] && ops[0].value === true, results, String(req.ctx || '').slice(0, 120));
    return { ok: true, results: results, v: 3 };
  } finally {
    try { lock.releaseLock(); } catch (x) { }
  }
}


/* ============================ أسماء الحجاج من تبويب Main ============================ */
// تعيد خريطة {رقم الجواز: «الاسم الأول الأخير»} من تبويب Main (أعمدة First_Name و Last_Name وعمود الجواز).
// لا تُرسل إلا لمن يحق له رؤية الجوازات (المالك أو عند تفعيل إظهار الجوازات).
const NAMES_SHEET = 'Main';
function namesGet_(p) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  if (!isOwner_(p.s) && !(st.perms && st.perms.showPassports)) return { ok: true, items: {}, hidden: true };
  const sh = openSS_(st).getSheetByName(NAMES_SHEET);
  if (!sh) return { ok: false, error: 'لا يوجد تبويب باسم ' + NAMES_SHEET };
  const rows = sh.getDataRange().getDisplayValues(), hi = headerIdx_(rows), H = rows[hi] || [];
  const cF = findCol_(H, 'First_Name'), cL = findCol_(H, 'Last_Name');
  let cP = -1; for (let i = 0; i < H.length; i++) if (/passport|جواز/i.test(String(H[i]))) { cP = i; break; }
  if (cP < 0 || (cF < 0 && cL < 0)) return { ok: false, error: 'لم تُوجد أعمدة الجواز والاسم في Main', headers: H };
  const items = {}; let n = 0;
  for (let i = hi + 1; i < rows.length; i++) {
    const key = String(rows[i][cP] || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (!key) continue;
    const name = [cF >= 0 ? rows[i][cF] : '', cL >= 0 ? rows[i][cL] : ''].map(function (x) { return String(x || '').trim(); }).filter(Boolean).join(' ');
    if (name) { items[key] = name; n++; }
  }
  return { ok: true, items: items, count: n };
}

/* ============================ الملاحظات وحالة النقل ============================ */
const NOTE_STATUS = ['', 'vehicle', 'enroute', 'delayed', 'issue'];
const NOTE_HEAD = ['المفتاح', 'الصفحة', 'الوصف', 'الحالة', 'الملاحظة', 'بواسطة', 'آخر تحديث'];
function notesSheet_(st, create) {
  const ss = openSS_(st);
  let sh = ss.getSheetByName(CONFIG.NOTES_SHEET);
  if (!sh && create) { sh = ss.insertSheet(CONFIG.NOTES_SHEET); sh.appendRow(NOTE_HEAD); }
  return sh;
}
function notesGet_(p) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  if (p.kind !== 'arrival' && p.kind !== 'departure' && p.kind !== 'transfers') return { ok: false, error: 'kind غير صالح' };
  const sh = notesSheet_(st, false), items = [];
  if (sh) {
    const rows = sh.getDataRange().getDisplayValues();
    const pg = pgOf_(p.kind);
    for (let i = 1; i < rows.length; i++) if (rows[i][1] === pg && rows[i][0]) items.push({ key: rows[i][0], status: rows[i][3], note: rows[i][4], by: rows[i][5], at: rows[i][6] });
  }
  return { ok: true, items: items, ts: Date.now() };
}
function noteSet_(req, owner) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  if (req.kind !== 'arrival' && req.kind !== 'departure' && req.kind !== 'transfers') return { ok: false, error: 'kind غير صالح' };
  const denied = visitorDenied_(st, req, owner, req.kind === 'arrival' ? 'arrival' : 'departure'); if (denied) return denied;
  const key = String(req.key || '').trim().slice(0, 200); if (!key) return { ok: false, error: 'مفتاح المجموعة مفقود' };
  const status = NOTE_STATUS.indexOf(String(req.status || '')) >= 0 ? String(req.status || '') : '';
  const note = cell_(String(req.note || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 300));
  const pg = pgOf_(req.kind), by = byOf_(req, owner);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const sh = notesSheet_(st, true), rows = sh.getDataRange().getDisplayValues();
    let at = -1;
    for (let i = 1; i < rows.length; i++) if (rows[i][0] === key && rows[i][1] === pg) { at = i + 1; break; }
    const cleared = !status && !note;
    if (cleared) { if (at > 0) sh.getRange(at, 1, 1, NOTE_HEAD.length).clearContent(); }
    else {
      const rec = [cell_(key), pg, cell_(String(req.label || '').slice(0, 120)), status, note, by, new Date()];
      if (at > 0) sh.getRange(at, 1, 1, rec.length).setValues([rec]); else sh.appendRow(rec);
    }
    SpreadsheetApp.flush(); bumpData_();
    log_(st, req.kind, owner, by, true, [{ ok: true }], 'ملاحظة/حالة: ' + (status || '—') + ' | ' + String(req.label || '').slice(0, 80), cleared ? 'مسح ملاحظة' : 'ملاحظة');
    return { ok: true, cleared: cleared };
  } finally { try { lock.releaseLock(); } catch (x) { } }
}

/* ============================ الاستعداد المسبق للرحلات ============================ */
const READY_STATUS = ['', 'pending', 'entered', 'approved', 'fix'];
const READY_HEAD = ['المفتاح', 'الرحلة', 'الحالة', 'ETA', 'الصالة', 'البوابة', 'ملاحظة', 'بواسطة', 'آخر تحديث'];
function readySheet_(st, create) {
  const ss = openSS_(st); let sh = ss.getSheetByName(CONFIG.READY_SHEET);
  if (!sh && create) { sh = ss.insertSheet(CONFIG.READY_SHEET); sh.appendRow(READY_HEAD); }
  return sh;
}
function readyGet_() {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const sh = readySheet_(st, false), items = [];
  if (sh) { const rows = sh.getDataRange().getDisplayValues(); for (let i = 1; i < rows.length; i++) if (rows[i][0]) items.push({ key: rows[i][0], flight: rows[i][1], status: rows[i][2], eta: rows[i][3], hall: rows[i][4], gate: rows[i][5], note: rows[i][6], by: rows[i][7], at: rows[i][8] }); }
  return { ok: true, items: items, ts: Date.now() };
}
function readySet_(req, owner) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const denied = visitorDenied_(st, req, owner, 'arrival'); if (denied) return denied;
  const key = String(req.key || '').trim().slice(0, 200); if (!key) return { ok: false, error: 'مفتاح الرحلة مفقود' };
  const status = READY_STATUS.indexOf(String(req.status || '')) >= 0 ? String(req.status || '') : '';
  const eta = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(String(req.eta || '')) ? String(req.eta) : '';
  const clean = function (v, n) { return cell_(String(v || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, n)); };
  const hall = clean(req.hall, 30), gate = clean(req.gate, 30), note = clean(req.note, 300), by = byOf_(req, owner);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const sh = readySheet_(st, true), rows = sh.getDataRange().getDisplayValues(); let at = -1;
    for (let i = 1; i < rows.length; i++) if (rows[i][0] === key) { at = i + 1; break; }
    const cleared = !status && !eta && !hall && !gate && !note;
    if (cleared) { if (at > 0) sh.getRange(at, 1, 1, READY_HEAD.length).clearContent(); }
    else {
      const rowIdx = at > 0 ? at : sh.getLastRow() + 1, rec = [cell_(key), clean(req.label, 80), status, eta, hall, gate, note, by, new Date()];
      sh.getRange(rowIdx, 4).setNumberFormat('@');      // ETA نص صريح كي لا يتحول إلى تاريخ
      sh.getRange(rowIdx, 1, 1, rec.length).setValues([rec]);
    }
    SpreadsheetApp.flush(); bumpData_();
    log_(st, 'arrival', owner, by, true, [{ ok: true }], 'استعداد: ' + (status || '—') + (eta ? ' ETA ' + eta : '') + ' | ' + clean(req.label, 80), cleared ? 'مسح استعداد' : 'استعداد مسبق');
    return { ok: true, cleared: cleared };
  } finally { try { lock.releaseLock(); } catch (x) { } }
}

/* ============================ التحقق من رحلات الطيران ============================ */
// المفاتيح (اختيارية) في Project Settings ▸ Script Properties:
//   FLIGHT_PROVIDER = aerodatabox | aviationstack     FLIGHT_API_KEY = <المفتاح>
// بدون مفتاح يعمل التأكيد اليدوي فقط، ويعيد fc_lookup الخطأ no_key.
const FC_SHEET = 'FlightCheck';
const FC_HEAD = ['المفتاح', 'الرحلة', 'شركة الطيران', 'التاريخ', 'الحالة', 'الوقت الرسمي', 'الطريقة', 'ملاحظة', 'بواسطة', 'آخر تحديث'];
const FC_STATUS = ['', 'ok', 'mismatch', 'notfound'];
function fcSheet_(st, create) {
  const ss = openSS_(st); let sh = ss.getSheetByName(FC_SHEET);
  if (!sh && create) { sh = ss.insertSheet(FC_SHEET); sh.appendRow(FC_HEAD); }
  return sh;
}
function fcHasKey_() { return !!PropertiesService.getScriptProperties().getProperty('FLIGHT_API_KEY'); }
function fcGet_() {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const sh = fcSheet_(st, false), items = [];
  if (sh) { const rows = sh.getDataRange().getDisplayValues(); for (let i = 1; i < rows.length; i++) if (rows[i][0]) items.push({ key: rows[i][0], flight: rows[i][1], airline: rows[i][2], date: rows[i][3], status: rows[i][4], official: rows[i][5], mode: rows[i][6], note: rows[i][7], by: rows[i][8], at: rows[i][9] }); }
  return { ok: true, items: items, lookup: fcHasKey_(), ts: Date.now() };
}
function fcClean_(v, n) { return cell_(String(v || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, n)); }
function fcWrite_(st, rec) {   // rec: {key,flight,airline,date,status,official,mode,note,by}
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const sh = fcSheet_(st, true), rows = sh.getDataRange().getDisplayValues(); let at = -1;
    for (let i = 1; i < rows.length; i++) if (rows[i][0] === rec.key) { at = i + 1; break; }
    if (!rec.status) { if (at > 0) sh.getRange(at, 1, 1, FC_HEAD.length).clearContent(); }
    else {
      const idx = at > 0 ? at : sh.getLastRow() + 1;
      sh.getRange(idx, 4, 1, 3).setNumberFormat('@');
      sh.getRange(idx, 1, 1, FC_HEAD.length).setValues([[cell_(rec.key), rec.flight, rec.airline, rec.date, rec.status, rec.official, rec.mode, rec.note, rec.by, new Date()]]);
    }
    SpreadsheetApp.flush(); bumpData_();
  } finally { try { lock.releaseLock(); } catch (x) { } }
}
function fcSet_(req, owner) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const denied = visitorDenied_(st, req, owner, 'arrival'); if (denied) return denied;
  const key = String(req.key || '').trim().slice(0, 200); if (!key) return { ok: false, error: 'مفتاح الرحلة مفقود' };
  const status = FC_STATUS.indexOf(String(req.status || '')) >= 0 ? String(req.status || '') : '';
  const official = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(String(req.official || '')) ? String(req.official) : '';
  const by = byOf_(req, owner);
  fcWrite_(st, { key: key, flight: fcClean_(req.flight, 20), airline: fcClean_(req.airline, 60), date: fcClean_(req.date, 12), status: status, official: official, mode: 'manual', note: fcClean_(req.note, 200), by: by });
  log_(st, 'arrival', owner, by, true, [{ ok: true }], 'تحقق رحلة: ' + (status || '—') + ' | ' + fcClean_(req.label, 80), status ? 'تحقق من رحلة' : 'مسح تحقق رحلة');
  return { ok: true };
}
// يجلب رحلة من المزوّد → {found, official:'YYYY-MM-DD HH:MM' (بتوقيت مطار الوصول)}
function fcFetch_(flight, date) {
  const P = PropertiesService.getScriptProperties(), key = P.getProperty('FLIGHT_API_KEY'), prov = (P.getProperty('FLIGHT_PROVIDER') || 'aerodatabox').toLowerCase();
  if (prov === 'aviationstack') {
    const r = UrlFetchApp.fetch('http://api.aviationstack.com/v1/flights?access_key=' + encodeURIComponent(key) + '&flight_iata=' + encodeURIComponent(flight) + '&flight_date=' + date, { muteHttpExceptions: true });
    const j = JSON.parse(r.getContentText() || '{}'); if (j.error) throw new Error(j.error.message || 'provider');
    const f = (j.data || [])[0]; if (!f) return { found: false };
    const t = (f.arrival && (f.arrival.scheduled || f.arrival.estimated)) || '';
    return { found: true, official: t ? String(t).slice(0, 16).replace('T', ' ') : '' };
  }
  const r = UrlFetchApp.fetch('https://aerodatabox.p.rapidapi.com/flights/number/' + encodeURIComponent(flight) + '/' + date + '?dateLocalRole=Arrival', { headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com' }, muteHttpExceptions: true });
  if (r.getResponseCode() === 404) return { found: false };
  if (r.getResponseCode() >= 400) throw new Error('provider ' + r.getResponseCode());
  const a = JSON.parse(r.getContentText() || '[]'), f = Array.isArray(a) ? a[0] : null; if (!f) return { found: false };
  const t = f.arrival && f.arrival.scheduledTime && f.arrival.scheduledTime.local || '';
  return { found: true, official: t ? String(t).slice(0, 16).replace('T', ' ') : '' };
}
function fcLookup_(req, owner) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  if (!fcHasKey_()) return { ok: false, error: 'no_key' };
  const key = String(req.key || '').trim().slice(0, 200), flight = String(req.flight || '').replace(/\s+/g, '').toUpperCase(), date = String(req.date || '');
  if (!key || !/^[A-Z0-9]{2}\d{1,4}[A-Z]?$/.test(flight) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'no_code' };
  let res; try { res = fcFetch_(flight, date); } catch (e) { return { ok: false, error: String(e.message || e).slice(0, 120) }; }
  const item = { key: key, flight: flight, airline: fcClean_(req.airline, 60), date: date, status: res.found ? 'ok' : 'notfound', official: res.official || '', mode: 'auto', note: res.found ? '' : 'لم يجد المزوّد رحلة بهذا الرقم في هذا اليوم', by: 'تلقائي' };
  fcWrite_(st, item); item.at = new Date().toISOString();
  return { ok: true, item: item };
}

/* ============================ اعتماد المغادرة للرحلات ============================ */
const APPR_SHEET = 'Approvals';
const APPR_HEAD = ['المفتاح', 'الرحلة', 'الحالة', 'بواسطة', 'آخر تحديث'];
function apprSheet_(st, create) {
  const ss = openSS_(st); let sh = ss.getSheetByName(APPR_SHEET);
  if (!sh && create) { sh = ss.insertSheet(APPR_SHEET); sh.appendRow(APPR_HEAD); }
  return sh;
}
function apprGet_() {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const sh = apprSheet_(st, false), items = [];
  if (sh) { const rows = sh.getDataRange().getDisplayValues(); for (let i = 1; i < rows.length; i++) if (rows[i][0] && rows[i][2] === 'approved') items.push({ key: rows[i][0], flight: rows[i][1], status: 'approved', by: rows[i][3], at: rows[i][4] }); }
  return { ok: true, items: items, ts: Date.now() };
}
function apprSet_(req, owner) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const denied = visitorDenied_(st, req, owner, 'departure'); if (denied) return denied;
  const key = String(req.key || '').trim().slice(0, 200); if (!key) return { ok: false, error: 'مفتاح الرحلة مفقود' };
  const approved = String(req.status || '') === 'approved';
  const clean = function (v) { return cell_(String(v || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 80)); };
  const by = byOf_(req, owner);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const sh = apprSheet_(st, true), rows = sh.getDataRange().getDisplayValues(); let at = -1;
    for (let i = 1; i < rows.length; i++) if (rows[i][0] === key) { at = i + 1; break; }
    if (!approved) { if (at > 0) sh.getRange(at, 1, 1, APPR_HEAD.length).clearContent(); }
    else {
      const rowIdx = at > 0 ? at : sh.getLastRow() + 1;
      sh.getRange(rowIdx, 1, 1, APPR_HEAD.length).setValues([[cell_(key), clean(req.label), 'approved', by, new Date()]]);
    }
    SpreadsheetApp.flush(); bumpData_();
    log_(st, 'departure', owner, by, true, [{ ok: true }], 'اعتماد: ' + (approved ? 'معتمدة' : 'إلغاء') + ' | ' + clean(req.label), approved ? 'اعتماد رحلة' : 'إلغاء اعتماد');
    return { ok: true, cleared: !approved };
  } finally { try { lock.releaseLock(); } catch (x) { } }
}

/* ============================ النسخ الاحتياطي ============================ */
function stamp_(ss) { return Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyyMMdd-HHmm'); }
// ينسخ صفحتي الوصول والمغادرة إلى تبويبين جديدين داخل الملف، ويحذف الأقدم
function backupNow_(why) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const ss = openSS_(st), tag = stamp_(ss), made = [];
  ['arrival', 'departure'].forEach(function (k) {
    const src = sheetOf_(st, k), copy = src.copyTo(ss);
    copy.setName(CONFIG.BACKUP_PREFIX + tag + '_' + (k === 'arrival' ? 'A' : 'D')); made.push(copy.getName());
    try { copy.hideSheet(); } catch (e) { }
  });
  pruneBackups_(ss);
  PropertiesService.getScriptProperties().setProperty('HAJJ_LAST_BACKUP', JSON.stringify({ at: Date.now(), why: why || '' }));
  return { ok: true, made: made, why: why || '' };
}
function backupIfStale_(st, why) {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty('HAJJ_LAST_BACKUP'), last = raw ? JSON.parse(raw).at : 0;
    if (Date.now() - last > CONFIG.BACKUP_GAP_MIN * 60000) backupNow_(why);
  } catch (e) { /* النسخة لا تُفشل الكتابة */ }
}
function pruneBackups_(ss) {
  ['A', 'D'].forEach(function (suf) {
    const list = ss.getSheets().filter(function (s) { const n = s.getName(); return n.indexOf(CONFIG.BACKUP_PREFIX) === 0 && n.slice(-2) === '_' + suf; })
      .sort(function (a, b) { return a.getName() < b.getName() ? 1 : -1; });
    list.slice(CONFIG.BACKUP_KEEP).forEach(function (s) { ss.deleteSheet(s); });
  });
}
function backupInfo_() {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const ss = openSS_(st), props = PropertiesService.getScriptProperties().getProperty('HAJJ_LAST_BACKUP');
  const names = ss.getSheets().map(function (s) { return s.getName(); }).filter(function (n) { return n.indexOf(CONFIG.BACKUP_PREFIX) === 0; }).sort().reverse();
  const daily = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'dailyBackup'; });
  return { ok: true, daily: daily, last: props ? JSON.parse(props) : null, tabs: names.slice(0, 6), count: names.length };
}
function backupDaily_(on) {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'dailyBackup') ScriptApp.deleteTrigger(t); });
  if (on) ScriptApp.newTrigger('dailyBackup').timeBased().everyDays(1).atHour(CONFIG.BACKUP_HOUR).create();
  return backupInfo_();
}
// تُستدعى من المشغّل اليومي
function dailyBackup() { try { backupNow_('يومي تلقائي'); } catch (e) { } }

/* ============================ سجل التأكيدات ============================ */
// يمنع تحويل نص يبدأ بـ = + - @ إلى معادلة في الجدول
function cell_(v) { v = String(v == null ? '' : v); return /^[=+\-@]/.test(v) ? "'" + v : v; }

function log_(st, kind, owner, by, on, results, ctx, label) {
  try {
    const okN = results.filter(function (r) { return r.ok; }).length;
    if (!okN) return;
    const ss = openSS_(st);
    let sh = ss.getSheetByName(CONFIG.LOG_SHEET);
    if (!sh) { sh = ss.insertSheet(CONFIG.LOG_SHEET); sh.appendRow(['الوقت', 'الصفحة', 'الدور', 'الاسم', 'الإجراء', 'العدد', 'التفاصيل']); }
    sh.appendRow([new Date(), pgOf_(kind), owner ? 'المالك' : 'زائر', by,
      label || (on ? (kind === 'arrival' ? 'تسكين' : 'مغادرة') : 'تراجع'), okN, cell_(ctx)]);
  } catch (e) { /* السجل لا يُفشل الكتابة */ }
}

/* ============================ مساعدات ============================ */
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function payload_(p) {
  if (!p.p) return {};
  return JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.p))).getDataAsString('UTF-8'));
}
function openSS_(st) {
  const id = (st && st.sheetId) || CONFIG.SPREADSHEET_ID;
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('لا يوجد ملف: ألصق رابط الملف في لوحة المالك أو ضع SPREADSHEET_ID');
  return ss;
}
function sheetOf_(st, kind) {
  const tab = kind === 'transfers' ? 'Transfers' : (kind === 'arrival' ? st.source.arrivalTab : st.source.departureTab);
  const sh = openSS_(st).getSheetByName(tab);
  if (!sh) throw new Error('لا توجد صفحة باسم «' + tab + '» في الملف');
  return sh;
}
function norm_(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, '');
}
function findCol_(headers, name) {
  const n = norm_(name);
  for (let i = 0; i < headers.length; i++) if (norm_(headers[i]) === n) return i;
  return -1;
}
function detectHeaderRow_(sh) {
  const vals = sh.getRange(1, 1, Math.min(15, sh.getLastRow()), sh.getLastColumn()).getDisplayValues();
  for (let i = 0; i < vals.length; i++) {
    if (vals[i].filter(function (c) { return String(c).trim() !== ''; }).length >= 3) return i + 1;
  }
  return 1;
}
function locateRow_(sh, headerRow, keyCol, key, cache, norm) {
  if (!cache[keyCol]) {
    const n = sh.getLastRow() - headerRow;
    cache[keyCol] = n > 0 ? sh.getRange(headerRow + 1, keyCol + 1, n, 1).getDisplayValues().map(function (r) { return norm(r[0]); }) : [];
  }
  let found = -1, count = 0;
  cache[keyCol].forEach(function (v, i) { if (v === key) { count++; found = headerRow + 1 + i; } });
  return count === 0 ? -1 : count > 1 ? -2 : found;
}