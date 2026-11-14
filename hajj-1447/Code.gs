/**
 * منظومة تحركات الحجاج 1447هـ — خادم الكتابة والقراءة (Google Apps Script Web App)
 * ---------------------------------------------------------------------------
 * يكتب تأكيد التسكين في عمود Check (ورقة الوصول)، وتأكيد المغادرة في Check_De (ورقة المغادرة)،
 * ويحدّد الصف بالقيمة المفتاحية (رقم الجواز أو الاسم) فلا يُكتب في صف خاطئ لو تغيّر ترتيب الجدول.
 *
 * طريقة التركيب: README.md
 */
const CONFIG = {
  // غيّره إلى نص سري طويل، وضع نفس القيمة في «الإعدادات» داخل الصفحات
  TOKEN: 'CHANGE-ME-TO-A-LONG-RANDOM-SECRET',

  // اتركه فارغاً إذا أنشأت السكربت من داخل ملف الجدول: الإضافات ← Apps Script
  SPREADSHEET_ID: '',

  // الواجهة ترسل اسم الصفحة (الذي تكتبه في الإعدادات) فيُعتمد أولاً.
  // وإن لم يصل اسم: gid ثم الاسم ثم الترتيب (0 = أول ورقة)
  KINDS: {
    arrival:   { gid: null,       name: 'Arrival',   index: 0, checkHeader: 'Check',    atHeader: 'Check_At',    textOn: 'تم التسكين'   },
    departure: { gid: 1177268743, name: 'Departure', index: 1, checkHeader: 'Check_De', atHeader: 'Check_De_At', textOn: 'تمت المغادرة' }
  },

  // 'text' → يكتب نص التأكيد (textOn لكل ورقة: «تم التسكين» / «تمت المغادرة») وعند التراجع يفرّغ الخلية
  // 'boolean' → يكتب TRUE/FALSE (مناسب لخانات الاختيار)
  WRITE_AS: 'text',
  TEXT_OFF: ''
};

/* ---------- نقاط الدخول ---------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.token !== CONFIG.TOKEN) return json_({ ok: false, error: 'unauthorized' });
  if (p.action === 'ping') {
    const ss = getSS_();
    return json_({ ok: true, service: 'hajj-sync', ts: Date.now(), name: ss.getName(), spreadsheetId: ss.getId(),
      tabs: ss.getSheets().map(function (s) { return s.getName(); }) });
  }
  if (p.action === 'read') {
    const cfg = CONFIG.KINDS[p.kind];
    if (!cfg) return json_({ ok: false, error: 'kind غير صالح' });
    const sh = getSheet_(p.kind, p.sheet);
    return json_({ ok: true, rows: sh.getDataRange().getDisplayValues(), ts: Date.now() });
  }
  return json_({ ok: true, service: 'hajj-sync' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.token !== CONFIG.TOKEN) return json_({ ok: false, error: 'unauthorized' });
    const cfg = CONFIG.KINDS[req.kind];
    if (!cfg) return json_({ ok: false, error: 'kind غير صالح' });
    lock.waitLock(20000);

    const sh = getSheet_(req.kind, req.sheet);
    const headerRow = Number(req.headerRow) || detectHeaderRow_(sh);
    const headers = sh.getRange(headerRow, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
    const colCheck = findCol_(headers, cfg.checkHeader);
    if (colCheck < 0) return json_({ ok: false, error: 'العمود ' + cfg.checkHeader + ' غير موجود في الورقة' });
    const colAt = cfg.atHeader ? findCol_(headers, cfg.atHeader) : -1;

    const keyCache = {};
    const results = (req.ops || []).map(function (op) {
      try {
        let row = Number(op.row);
        const keyCol = op.keyHeader ? findCol_(headers, op.keyHeader) : -1;
        if (keyCol >= 0 && op.key) {
          const cur = String(sh.getRange(row, keyCol + 1).getDisplayValue()).trim();
          if (cur !== String(op.key).trim()) {          // تغيّر ترتيب الصفوف: ابحث بالقيمة المفتاحية
            row = locateRow_(sh, headerRow, keyCol, String(op.key).trim(), keyCache);
            if (row === -1) throw new Error('لم يُعثر على السجل (تغيّر الجدول)');
            if (row === -2) throw new Error('القيمة المفتاحية مكرّرة — تعذّر تحديد الصف');
          }
        }
        if (row <= headerRow || row > sh.getMaxRows()) throw new Error('رقم صف غير صالح');
        const on = op.value === true;
        sh.getRange(row, colCheck + 1).setValue(CONFIG.WRITE_AS === 'text' ? (on ? (cfg.textOn || 'تم') : CONFIG.TEXT_OFF) : on);
        if (colAt >= 0) sh.getRange(row, colAt + 1).setValue(on ? new Date() : '');
        return { ok: true, row: row };
      } catch (err) {
        return { ok: false, error: String(err.message || err) };
      }
    });
    SpreadsheetApp.flush();
    return json_({ ok: true, results: results });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) { }
  }
}

/* ---------- مساعدات ---------- */
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function getSS_() {
  return CONFIG.SPREADSHEET_ID ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}
function getSheet_(kind, tabName) {
  const cfg = CONFIG.KINDS[kind], ss = getSS_(), all = ss.getSheets();
  let sh = null;
  if (tabName) {                                    // الاسم القادم من إعدادات الواجهة
    sh = ss.getSheetByName(tabName);
    if (!sh) throw new Error('لا توجد صفحة باسم «' + tabName + '» في الملف');
    return sh;
  }
  if (cfg.gid != null) sh = all.filter(function (s) { return s.getSheetId() === Number(cfg.gid); })[0];
  if (!sh && cfg.name) sh = ss.getSheetByName(cfg.name);
  if (!sh) sh = all[cfg.index || 0];
  if (!sh) throw new Error('لم يُعثر على ورقة ' + kind);
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
function locateRow_(sh, headerRow, keyCol, key, cache) {
  if (!cache[keyCol]) {
    const n = sh.getLastRow() - headerRow;
    cache[keyCol] = n > 0 ? sh.getRange(headerRow + 1, keyCol + 1, n, 1).getDisplayValues().map(function (r) { return String(r[0]).trim(); }) : [];
  }
  let found = -1, count = 0;
  cache[keyCol].forEach(function (v, i) { if (v === key) { count++; found = headerRow + 1 + i; } });
  return count === 0 ? -1 : count > 1 ? -2 : found;
}
