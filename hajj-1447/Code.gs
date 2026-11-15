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
    arrival:   { checkHeader: 'Check',    atHeader: 'Check_At',    textOn: 'تم التسكين'   },
    departure: { checkHeader: 'Check_De', atHeader: 'Check_De_At', textOn: 'تمت المغادرة' }
  },
  // 'text' → يكتب نص التأكيد، وعند التراجع يفرّغ الخلية | 'boolean' → TRUE/FALSE
  WRITE_AS: 'text',
  TEXT_OFF: '',

  SESSION_HOURS: 6,        // مدة جلسة المالك (الحد الأقصى 6 ساعات)
  MAX_OPS: 50              // أقصى عدد سجلات في طلب كتابة واحد
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
      case 'owner_save':  requireOwner_(p); return json_(ownerSave_(payload_(p)));
      case 'owner_test':  requireOwner_(p); return json_(ownerTest_(payload_(p)));
      case 'owner_reset': requireOwner_(p); PropertiesService.getScriptProperties().deleteProperty(PROP_KEY); return json_({ ok: true });
      case 'read':        return json_(read_(p));
      case 'write':       return json_(write_(payload_(p), isOwner_(p.s)));
      default:            return json_({ ok: true, service: 'hajj-sync', v: 3 });
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
  delete o.sheetId; delete o.passCol;
  return o;
}
function publicInfo_() {
  const st = settings_();
  return { ok: true, service: 'hajj-sync', v: 3, configured: !!st, settings: st ? publicSettings_(st) : null };
}
function ownerGet_() {
  const st = settings_();
  return { ok: true, email: CONFIG.OWNER_EMAIL, configured: !!st, settings: st };
}
function num_(v, d, lo, hi) { v = Number(v); return isFinite(v) && v >= lo && v <= hi ? v : d; }
function str_(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
function sheetIdFromLink_(l) { const m = /\/d\/([a-zA-Z0-9_-]{20,})/.exec(String(l || '')); return m ? m[1] : ''; }

// تنقية صارمة: لا يُحفظ إلا ما نعرفه وبحدود محددة
function clean_(o) {
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
    transport: { arrival: tp.arrival !== false, departure: tp.departure !== false, busMin: num_(tp.busMin, 4, 1, 100) },
    map: { arrival: {}, departure: {} },
    perms: { showPassports: pm.showPassports === true },
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
  const st = clean_(o);
  const ss = openSS_(st);                       // يتحقق أن الملف مفتوح
  const tabs = ss.getSheets().map(function (s) { return s.getName(); });
  const miss = [st.source.arrivalTab, st.source.departureTab].filter(function (t) { return tabs.indexOf(t) < 0; });
  if (miss.length) return { ok: false, error: 'لا توجد صفحة باسم «' + miss.join('» و«') + '». الصفحات الموجودة: ' + tabs.join('، '), tabs: tabs };
  PropertiesService.getScriptProperties().setProperty(PROP_KEY, JSON.stringify(st));
  return { ok: true, name: ss.getName(), tabs: tabs, settings: st };
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
  if (p.kind !== 'arrival' && p.kind !== 'departure') return { ok: false, error: 'kind غير صالح' };
  const sh = sheetOf_(st, p.kind);
  const rows = sh.getDataRange().getDisplayValues();
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
function write_(req, owner) {
  const st = settings_();
  if (!st) return { ok: false, error: 'not_configured' };
  const kind = req.kind, cfg = CONFIG.KINDS[kind];
  if (!cfg) return { ok: false, error: 'kind غير صالح' };
  const ops = (req.ops || []).slice(0, CONFIG.MAX_OPS);
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
        return { ok: true, row: row };
      } catch (err) {
        return { ok: false, error: String(err.message || err) };
      }
    });
    SpreadsheetApp.flush();
    return { ok: true, results: results, v: 3 };
  } finally {
    try { lock.releaseLock(); } catch (x) { }
  }
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
  const tab = kind === 'arrival' ? st.source.arrivalTab : st.source.departureTab;
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
