/**
 * منظومة تحركات الحجاج 1447هـ — الخادم (Google Apps Script Web App)
 * ---------------------------------------------------------------------------
 *  • الدخول إلزامي لكل أحد (اسم مستخدم + كلمة مرور). المالك: CONFIG.OWNER_USER وكلمة مروره في Script Properties (OWNER_PASSWORD).
 *  • بقية المستخدمين وصلاحياتهم في تبويب «Users» بالملف، والمالك يديرهم من الموقع. الإعدادات والمستخدمون للمالك وحده.
 *  • الإعدادات تُحفظ هنا (خصائص السكربت) لا في المتصفح، فتظهر لكل من يفتح الموقع.
 *  • الجدول يُقرأ ويُكتب عبر هذا السكربت فقط، فيمكن إبقاء الجدول خاصاً (غير منشور).
 *
 * طريقة التركيب: README.md  — بعد أي تعديل هنا: نشر ← إدارة عمليات النشر ← ✏ ← إصدار جديد.
 */
const CONFIG = {
  // حساب المالك: اسم المستخدم هنا، وكلمة المرور تُضبط في «خصائص السكربت» باسم OWNER_PASSWORD
  // (Apps Script ← Project Settings ← Script properties) فلا تُكتب في هذا الملف المرفوع على GitHub.
  OWNER_USER: 'prom1406',
  OWNER_PASSWORD: '',

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
  USERS_SHEET: 'Users',    // تبويب المستخدمين والصلاحيات (يُنشأ تلقائياً)
  ACTIVITY_SHEET: 'Activity', // تبويب سجل الدخول والنشاط (يُنشأ تلقائياً)
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
    const act = String(p.action || '');
    const ctx = auth_(p); p.ctx_ = ctx;
    if (act && act !== 'public' && act !== 'login' && !ctx) return json_({ ok: false, error: 'auth' });
    if (ctx && ctx.mustChange && ['public', 'whoami', 'logout', 'change_password'].indexOf(act) < 0) return json_({ ok: false, error: 'must_change' });
    switch (act) {
      case 'public':      return json_(publicInfo_(ctx));
      case 'login':       return json_(login_(payload_(p)));
      case 'whoami':      return json_({ ok: true, owner: ctx.owner, user: publicUser_(ctx) });
      case 'logout':      activity_(ctx || {}, ctx ? 'خروج' : '', ''); cache_().remove('s_' + p.s); return json_({ ok: true });
      case 'change_password': return json_(changePassword_(payload_(p), ctx, p.s));
      case 'owner_get':   requireOwner_(ctx); return json_(ownerGet_());
      case 'owner_save':  requireOwner_(ctx); { const r = ownerSave_(payload_(p)); bumpData_(); return json_(r); }
      case 'owner_test':  requireOwner_(ctx); return json_(ownerTest_(payload_(p)));
      case 'owner_reset': requireOwner_(ctx); PropertiesService.getScriptProperties().deleteProperty(PROP_KEY); bumpData_(); bumpUsers_(); return json_({ ok: true });
      case 'owner_backup':       requireOwner_(ctx); return json_(backupNow_('يدوي'));
      case 'owner_backup_info':  requireOwner_(ctx); return json_(backupInfo_());
      case 'owner_backup_daily': requireOwner_(ctx); return json_(backupDaily_(payload_(p).on === true));
      case 'users_get':   requireOwner_(ctx); return json_(usersGet_());
      case 'user_save':   requireOwner_(ctx); return json_(userSave_(payload_(p), ctx));
      case 'user_delete': requireOwner_(ctx); return json_(userDelete_(payload_(p), ctx));
      case 'activity_get':requireOwner_(ctx); return json_(activityGet_(payload_(p)));
      case 'ready_get':   return json_(memo_('ready', 15, readyGet_));
      case 'ready_set':   return json_(readySet_(payload_(p), ctx));
      case 'fc_get':      return json_(memo_('fc', 15, fcGet_));
      case 'fc_set':      return json_(fcSet_(payload_(p), ctx));
      case 'fc_lookup':   return json_(fcLookup_(payload_(p), ctx));
      case 'appr_get':    return json_(memo_('appr', 15, apprGet_));
      case 'appr_set':    return json_(apprSet_(payload_(p), ctx));
      case 'tasks_get':   return json_(memo_('tasks', 15, tasksGet_));
      case 'task_set':    return json_(taskSet_(payload_(p), ctx));
      case 'team_get':    return json_(teamGet_(ctx));
      case 'names_get':   return json_(namesCached_(p));
      case 'notes_get':   return json_(notesCached_(p));
      case 'note_set':    return json_(noteSet_(payload_(p), ctx));
      case 'read':        return json_(read_(p));
      case 'write':       return json_(write_(payload_(p), ctx));
      default:            return json_(act ? { ok: false, error: 'إجراء غير معروف: ' + act } : { ok: true, service: 'hajj-sync', v: 4 });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}


/* ============================ الحسابات والصلاحيات ============================ */
// المالك: اسمه في CONFIG.OWNER_USER وكلمة مروره في Script Properties باسم OWNER_PASSWORD (لا تُكتب في GitHub).
// بقية المستخدمين: تبويب «Users» في ملف البيانات. كلمات المرور تُخزَّن مشفّرة (HMAC-SHA256 + ملح) ولا يمكن قراءتها.
const PERM_KEYS = ['pDash', 'pArrival', 'pDeparture', 'pTransfers', 'pPilgrim', 'pFollow', 'confArr', 'confDep', 'notes', 'ready', 'appr', 'export', 'passports'];
const PAGE_PERMS = ['pDash', 'pArrival', 'pDeparture', 'pTransfers', 'pPilgrim', 'pFollow'];
function permSet_(list) { const o = {}; PERM_KEYS.forEach(function (k) { o[k] = list.indexOf(k) >= 0; }); return o; }
const ROLES = {
  supervisor:    { label: 'مشرف عام',     perms: permSet_(PAGE_PERMS.concat(['confArr', 'confDep', 'notes', 'ready', 'appr', 'export', 'passports'])) },
  arrival_sup:   { label: 'مشرف وصول',    perms: permSet_(['pDash', 'pArrival', 'pTransfers', 'pPilgrim', 'pFollow', 'confArr', 'notes', 'ready', 'export', 'passports']) },
  departure_sup: { label: 'مشرف مغادرة',  perms: permSet_(['pDash', 'pDeparture', 'pPilgrim', 'pFollow', 'confDep', 'notes', 'appr', 'export', 'passports']) },
  viewer:        { label: 'مشاهدة فقط',   perms: permSet_(PAGE_PERMS) },
  custom:        { label: 'مخصّص',        perms: permSet_([]) }
};
const CITY_KEYS = ['makkah', 'madinah', 'jeddah'];
const CITY_RE = { makkah: /makk?ah|mecca|مكه/, madinah: /madin[ae]h?|medina|المدينه/, jeddah: /\bjedd?ah\b|jidda|جده|\bjed\b/ };
const USER_HEADERS = ['اسم المستخدم', 'الاسم', 'بصمة كلمة المرور', 'ملح', 'النوع', 'صلاحيات مخصصة', 'الجوال', 'البريد', 'القسم', 'النطاق (المدن)', 'مفعّل', 'ينتهي في', 'تغيير الباس عند الدخول', 'أُنشئ في', 'أنشأه', 'آخر دخول'];
const U = { USER: 0, NAME: 1, HASH: 2, SALT: 3, ROLE: 4, PERMS: 5, PHONE: 6, EMAIL: 7, DEPT: 8, SCOPE: 9, ACTIVE: 10, EXP: 11, MUST: 12, CREATED: 13, BY: 14, LAST: 15 };
const TZ_ = 'Asia/Riyadh';

function ownerPassword_() {
  const v = PropertiesService.getScriptProperties().getProperty('OWNER_PASSWORD');
  return String(v || CONFIG.OWNER_PASSWORD || '');
}
function hashPw_(pw, salt) {
  const key = Utilities.newBlob(String(salt)).getBytes();
  let sig = Utilities.computeHmacSha256Signature(Utilities.newBlob(String(pw)).getBytes(), key);
  for (let i = 0; i < 40; i++) sig = Utilities.computeHmacSha256Signature(sig, key);
  return Utilities.base64Encode(sig);
}
function nowStr_() { return Utilities.formatDate(new Date(), TZ_, 'yyyy-MM-dd HH:mm'); }
function todayStr_() { return Utilities.formatDate(new Date(), TZ_, 'yyyy-MM-dd'); }
function isNo_(v) { return /^(لا|no|false|0|موقوف|متوقف|n)$/i.test(String(v == null ? '' : v).trim()); }
function isYes_(v) { return /^(نعم|yes|true|1|مفعل|مفعّل|y)$/i.test(String(v == null ? '' : v).trim()); }
function expired_(s) { s = String(s || '').trim(); return /^\d{4}-\d{2}-\d{2}$/.test(s) && todayStr_() > s; }
function userUsable_(u) { return !!u.hash && !u.inactive && !expired_(u.expires); }

function ownerCtx_() {
  const perms = {}; PERM_KEYS.forEach(function (k) { perms[k] = true; });
  return { owner: true, username: CONFIG.OWNER_USER, name: 'المالك', role: 'owner', roleLabel: 'المالك', perms: perms, scope: [], dept: '', phone: '', email: '', mustChange: false };
}
function effPerms_(u) {
  const base = (ROLES[u.role] || ROLES.viewer).perms, ov = u.perms || {}, o = {};
  PERM_KEYS.forEach(function (k) { o[k] = typeof ov[k] === 'boolean' ? ov[k] : !!base[k]; });
  return o;
}
function userCtx_(u) {
  return { owner: false, username: u.username, name: u.name || u.username, role: ROLES[u.role] ? u.role : 'viewer', roleLabel: (ROLES[u.role] || ROLES.viewer).label,
    perms: effPerms_(u), scope: u.scope || [], dept: u.dept || '', phone: u.phone || '', email: u.email || '', mustChange: !!u.must };
}
function publicUser_(ctx) {
  return { username: ctx.username, name: ctx.name, role: ctx.role, roleLabel: ctx.roleLabel, perms: ctx.perms, scope: ctx.scope, dept: ctx.dept, phone: ctx.phone, email: ctx.email, mustChange: !!ctx.mustChange, owner: !!ctx.owner };
}
function rowToUser_(r, row) {
  let perms = {}; try { const j = JSON.parse(String(r[U.PERMS] || '{}')); if (j && typeof j === 'object') perms = j; } catch (e) { }
  const scope = String(r[U.SCOPE] || '').toLowerCase().split(/[,،\s]+/).filter(function (x) { return CITY_KEYS.indexOf(x) >= 0; });
  return { row: row, username: String(r[U.USER] || '').trim(), name: String(r[U.NAME] || '').trim(), hash: String(r[U.HASH] || ''), salt: String(r[U.SALT] || ''),
    role: String(r[U.ROLE] || 'viewer').trim(), perms: perms, phone: String(r[U.PHONE] || '').trim(), email: String(r[U.EMAIL] || '').trim(), dept: String(r[U.DEPT] || '').trim(),
    scope: scope, inactive: isNo_(r[U.ACTIVE]), expires: String(r[U.EXP] || '').trim(), must: isYes_(r[U.MUST]), created: String(r[U.CREATED] || ''), by: String(r[U.BY] || ''), last: String(r[U.LAST] || '') };
}
function usersSheet_(st, create) {
  const ss = openSS_(st); let sh = ss.getSheetByName(CONFIG.USERS_SHEET);
  if (!sh && create) {
    sh = ss.insertSheet(CONFIG.USERS_SHEET);
    sh.getRange(1, 1, 1, USER_HEADERS.length).setValues([USER_HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
    [U.PHONE, U.EXP, U.CREATED, U.LAST].forEach(function (c) { sh.getRange(1, c + 1, sh.getMaxRows(), 1).setNumberFormat('@'); });
    try { sh.hideColumns(U.HASH + 1, 2); } catch (e) { }
  }
  return sh;
}
function usersRead_(st) {
  const map = {}; const sh = usersSheet_(st, false);
  if (sh && sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, USER_HEADERS.length).getDisplayValues().forEach(function (r, i) {
      const u = rowToUser_(r, i + 2); if (u.username) map[u.username.toLowerCase()] = u;
    });
  }
  return map;
}
function usersMap_() {
  const c = cache_(), raw = c.get('umap');
  if (raw) { try { return JSON.parse(raw); } catch (e) { } }
  const st = settings_(); let map = {};
  if (st) { try { map = usersRead_(st); } catch (e) { map = {}; } }
  try { c.put('umap', JSON.stringify(map), 120); } catch (e) { }
  return map;
}
function bumpUsers_() { try { cache_().remove('umap'); } catch (e) { } }
function sessVal_(u) { return 'u:' + u.username.toLowerCase() + '|' + String(u.hash).slice(0, 12); }
function newSession_(val) {
  const s = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  cache_().put('s_' + s, val, Math.min(21600, CONFIG.SESSION_HOURS * 3600));
  return s;
}
// يعيد سياق المستخدم من رمز الجلسة، أو null إن لم تصلح (انتهت، أُوقف الحساب، تغيّرت كلمة مروره…)
function auth_(p) {
  const s = String((p && p.s) || ''); if (s.length < 40) return null;
  const v = cache_().get('s_' + s); if (!v) return null;
  if (v === '@owner') return ownerCtx_();
  if (v.indexOf('u:') === 0) {
    const parts = v.slice(2).split('|'), u = usersMap_()[parts[0]];
    if (!u || !userUsable_(u) || String(u.hash).slice(0, 12) !== parts[1]) { cache_().remove('s_' + s); return null; }
    return userCtx_(u);
  }
  return null;
}
function requireOwner_(ctx) { if (!ctx || !ctx.owner) throw new Error('غير مصرّح — هذه الصفحة للمالك فقط'); }
function deny_(ctx, flag) { return ctx && ctx.perms && ctx.perms[flag] ? null : { ok: false, error: 'forbidden' }; }
function canKind_(ctx, kind) {
  const P = ctx.perms;
  if (kind === 'arrival') return !!(P.pDash || P.pArrival || P.pTransfers || P.pPilgrim || P.pFollow);
  if (kind === 'departure') return !!(P.pDash || P.pDeparture || P.pPilgrim || P.pFollow);
  if (kind === 'transfers') return !!(P.pTransfers || P.pPilgrim || P.pFollow);
  return false;
}
function byOf_(ctx) { return cell_((ctx.name + (ctx.owner ? '' : ' (' + ctx.username + ')')).replace(/[\r\n\t]/g, ' ').trim().slice(0, 60)); }

/* ---- نطاق المدن: يُطبَّق في الخادم على القراءة والكتابة ---- */
function normTxt_(s) { return String(s == null ? '' : s).toLowerCase().replace(/[ً-ٰٟـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي'); }
function inScope_(scope, cells) {
  if (!scope || !scope.length) return true;
  const t = normTxt_(cells.join(' | '));
  return scope.some(function (c) { return CITY_RE[c] && CITY_RE[c].test(t); });
}

/* ---- سجل الدخول والنشاط (تبويب Activity) ---- */
function activity_(who, ev, detail) {
  try {
    const st = settings_(); if (!st) return;
    const ss = openSS_(st); let sh = ss.getSheetByName(CONFIG.ACTIVITY_SHEET);
    if (!sh) { sh = ss.insertSheet(CONFIG.ACTIVITY_SHEET); sh.getRange(1, 1, 1, 5).setValues([['الوقت', 'اسم المستخدم', 'الاسم', 'الحدث', 'التفاصيل']]).setFontWeight('bold'); sh.setFrozenRows(1); }
    sh.appendRow([nowStr_(), cell_(who.username || ''), cell_(who.name || ''), ev, cell_(String(detail || '').slice(0, 200))]);
    if (sh.getLastRow() > 6000) sh.deleteRows(2, 1500);
  } catch (e) { /* السجل لا يعطّل العمل */ }
}
function activityGet_(req) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const ss = openSS_(st), who = String(req.username || '').trim().toLowerCase(), out = { ok: true, logins: [], ops: [] };
  const tail = function (sh, n) { const last = sh ? sh.getLastRow() : 0; if (last < 2) return []; const from = Math.max(2, last - n + 1); return sh.getRange(from, 1, last - from + 1, sh.getLastColumn()).getDisplayValues().reverse(); };
  tail(ss.getSheetByName(CONFIG.ACTIVITY_SHEET), 600).forEach(function (r) { if (!who || String(r[1]).toLowerCase() === who) out.logins.push(r.slice(0, 5)); });
  out.logins = out.logins.slice(0, 300);
  tail(ss.getSheetByName(CONFIG.LOG_SHEET), 600).forEach(function (r) { if (!who || String(r[3]).toLowerCase().indexOf('(' + who + ')') >= 0) out.ops.push(r.slice(0, 7)); });
  out.ops = out.ops.slice(0, 300);
  return out;
}

/* ---- الدخول ---- */
function login_(req) {
  const uname = String(req.username || req.email || '').trim().toLowerCase().slice(0, 60), pw = String(req.password || '');
  if (!uname || !pw) return { ok: false, error: 'أدخل اسم المستخدم وكلمة المرور' };
  const c = cache_(), fkey = 'f_' + uname, fails = Number(c.get(fkey) || 0), gf = Number(c.get('f_all') || 0);
  if (fails >= 5 || gf >= 60) return { ok: false, error: 'محاولات كثيرة خاطئة — انتظر 15 دقيقة ثم أعد المحاولة' };
  let ctx = null, rec = null, why = '';
  if (uname === String(CONFIG.OWNER_USER).toLowerCase()) {
    const op = ownerPassword_();
    if (!op) return { ok: false, error: 'لم تُضبط كلمة مرور المالك: أضِف OWNER_PASSWORD في خصائص السكربت (Project Settings ← Script properties)' };
    if (safeEq_(pw, op)) ctx = ownerCtx_();
  } else {
    const u = usersMap_()[uname];
    if (u && u.hash && safeEq_(hashPw_(pw, u.salt), u.hash)) {
      if (u.inactive) why = 'هذا الحساب موقوف — راجع المالك';
      else if (expired_(u.expires)) why = 'انتهت صلاحية هذا الحساب — راجع المالك';
      else { rec = u; ctx = userCtx_(u); }
    }
  }
  if (why) { activity_({ username: uname }, 'دخول مرفوض', why); return { ok: false, error: why }; }
  if (!ctx) {
    try { c.put(fkey, String(fails + 1), 900); c.put('f_all', String(gf + 1), 900); } catch (e) { }
    if (uname === String(CONFIG.OWNER_USER).toLowerCase() || usersMap_()[uname]) activity_({ username: uname }, 'فشل دخول', 'كلمة مرور خاطئة (' + (fails + 1) + ')');
    return { ok: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  }
  c.remove(fkey);
  const session = newSession_(ctx.owner ? '@owner' : sessVal_(rec));
  if (rec) { try { const st = settings_(); if (st) { usersSheet_(st, false).getRange(rec.row, U.LAST + 1).setValue(nowStr_()); bumpUsers_(); } } catch (e) { } }
  activity_(ctx, 'دخول', '');
  return { ok: true, session: session, email: ctx.username, user: publicUser_(ctx) };
}
function changePassword_(req, ctx, oldSession) {
  if (ctx.owner) return { ok: false, error: 'كلمة مرور المالك تُغيَّر من خصائص السكربت (OWNER_PASSWORD) في Apps Script' };
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const oldPw = String(req.oldPassword || ''), npw = String(req.newPassword || '');
  if (npw.length < 6 || npw.length > 64) return { ok: false, error: 'كلمة المرور الجديدة من 6 إلى 64 حرفاً' };
  if (npw === oldPw) return { ok: false, error: 'اختر كلمة مرور مختلفة عن الحالية' };
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const u = usersRead_(st)[ctx.username.toLowerCase()];
    if (!u || !safeEq_(hashPw_(oldPw, u.salt), u.hash)) return { ok: false, error: 'كلمة المرور الحالية غير صحيحة' };
    const salt = Utilities.getUuid(), hash = hashPw_(npw, salt), sh = usersSheet_(st, false);
    sh.getRange(u.row, U.HASH + 1, 1, 2).setValues([[hash, salt]]);
    sh.getRange(u.row, U.MUST + 1).setValue('لا');
    bumpUsers_();
    u.hash = hash; u.must = false;
    cache_().remove('s_' + oldSession);
    const session = newSession_(sessVal_(u));
    activity_(ctx, 'تغيير كلمة المرور', '');
    return { ok: true, session: session };
  } finally { try { lock.releaseLock(); } catch (x) { } }
}

/* ---- إدارة المستخدمين (للمالك) ---- */
function usersGet_() {
  const st = settings_(); if (!st) return { ok: false, error: 'اربط ملف البيانات من الإعدادات أولاً — يُنشأ تبويب Users داخله' };
  usersSheet_(st, true);
  const map = usersRead_(st);
  const users = Object.keys(map).map(function (k) {
    const u = map[k], x = userCtx_(u);
    return { username: u.username, name: u.name, role: ROLES[u.role] ? u.role : 'viewer', roleLabel: x.roleLabel, overrides: u.perms, perms: x.perms, phone: u.phone, email: u.email, dept: u.dept, scope: u.scope,
      active: !u.inactive, expires: u.expires, expired: expired_(u.expires), must: u.must, created: u.created, by: u.by, last: u.last, hasPw: !!u.hash };
  }).sort(function (a, b) { return a.name < b.name ? -1 : 1; });
  const roles = Object.keys(ROLES).map(function (k) { return { key: k, label: ROLES[k].label, perms: ROLES[k].perms }; });
  return { ok: true, users: users, roles: roles, permKeys: PERM_KEYS, owner: CONFIG.OWNER_USER };
}
function userSave_(req, ctx) {
  const st = settings_(); if (!st) return { ok: false, error: 'اربط ملف البيانات من الإعدادات أولاً' };
  const uname = String(req.username || '').trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,30}$/.test(uname)) return { ok: false, error: 'اسم المستخدم: 3 إلى 30 حرفاً إنجليزياً أو أرقاماً أو _ . -' };
  if (uname === String(CONFIG.OWNER_USER).toLowerCase()) return { ok: false, error: 'هذا اسم المالك — اختر اسماً آخر' };
  const name = str_(req.name, 60); if (!name) return { ok: false, error: 'اكتب اسم المستخدم الظاهر (الاسم الكامل)' };
  const role = ROLES[req.role] ? String(req.role) : 'viewer';
  const ov = {}; if (req.perms && typeof req.perms === 'object') PERM_KEYS.forEach(function (k) { if (typeof req.perms[k] === 'boolean') ov[k] = req.perms[k]; });
  const scope = (Array.isArray(req.scope) ? req.scope : []).filter(function (x) { return CITY_KEYS.indexOf(x) >= 0; });
  const expires = /^\d{4}-\d{2}-\d{2}$/.test(String(req.expires || '')) ? String(req.expires) : '';
  const pw = String(req.password || '');
  if (pw && (pw.length < 6 || pw.length > 64)) return { ok: false, error: 'كلمة المرور من 6 إلى 64 حرفاً' };
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const sh = usersSheet_(st, true), cur = usersRead_(st)[uname];
    if (!cur && !pw) return { ok: false, error: 'اكتب كلمة مرور للمستخدم الجديد' };
    let hash = cur ? cur.hash : '', salt = cur ? cur.salt : '';
    if (pw) { salt = Utilities.getUuid(); hash = hashPw_(pw, salt); }
    const must = req.mustChange === true ? true : (req.mustChange === false ? false : (cur ? cur.must : true));
    const row = [uname, cell_(name), hash, salt, role, JSON.stringify(ov), cell_(str_(req.phone, 25)), cell_(str_(req.email, 80)), cell_(str_(req.dept, 40)), scope.join(','),
      req.active === false ? 'لا' : 'نعم', expires, must ? 'نعم' : 'لا',
      cur ? cur.created : nowStr_(), cur ? cur.by : ctx.username, cur ? cur.last : ''];
    if (cur) sh.getRange(cur.row, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    bumpUsers_();
    activity_(ctx, cur ? 'تعديل مستخدم' : 'إضافة مستخدم', uname + ' · ' + (ROLES[role] || {}).label + (pw ? ' · كلمة مرور جديدة' : '') + (req.active === false ? ' · موقوف' : ''));
    return { ok: true, created: !cur };
  } finally { try { lock.releaseLock(); } catch (x) { } }
}
function userDelete_(req, ctx) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const uname = String(req.username || '').trim().toLowerCase();
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const u = usersRead_(st)[uname]; if (!u) return { ok: false, error: 'المستخدم غير موجود' };
    usersSheet_(st, false).deleteRow(u.row); bumpUsers_();
    activity_(ctx, 'حذف مستخدم', uname);
    return { ok: true };
  } finally { try { lock.releaseLock(); } catch (x) { } }
}
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
  if (!(p.ctx_ && p.ctx_.perms.passports)) return { ok: true, items: {}, hidden: true };
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
function publicInfo_(ctx) {
  const st = settings_();
  const o = { ok: true, service: 'hajj-sync', v: 4, configured: !!st };
  if (ctx) { o.settings = st ? publicSettings_(st) : null; o.user = publicUser_(ctx); }
  return o;
}
function ownerView_(st) { if (!st) return st; const o = JSON.parse(JSON.stringify(st)); o.pinSet = !!st.pin; o.pinArrSet = !!st.pinArr; o.pinDepSet = !!st.pinDep; delete o.pin; delete o.pinArr; delete o.pinDep; return o; }
function ownerGet_() {
  const st = settings_();
  return { ok: true, email: CONFIG.OWNER_USER, configured: !!st, settings: ownerView_(st) };
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
  const st = settings_(), ctx = p.ctx_;
  if (!st) return { ok: false, error: 'not_configured' };
  if (p.kind !== 'arrival' && p.kind !== 'departure' && p.kind !== 'transfers') return { ok: false, error: 'kind غير صالح' };
  if (!canKind_(ctx, p.kind)) return { ok: false, error: 'forbidden' };
  let rows = dataGet_('rows_' + p.kind);
  if (!rows) { rows = sheetOf_(st, p.kind).getDataRange().getDisplayValues(); dataPut_('rows_' + p.kind, rows, 20); }   // تُحفظ الصفوف الخام قبل التقنيع
  const hi = headerIdx_(rows), masked = !ctx.perms.passports, scope = ctx.owner ? [] : ctx.scope;
  if (masked) {
    const col = passCol_(st, p.kind, rows[hi] || []);
    if (col >= 0) for (let i = hi + 1; i < rows.length; i++) rows[i][col] = mask_(rows[i][col]);
  }
  if (scope.length) {   // نطاق المدن: تُفرَّغ الصفوف خارج النطاق وتبقى أرقام الصفوف كما هي
    for (let i = hi + 1; i < rows.length; i++) if (!inScope_(scope, rows[i])) rows[i] = rows[i].map(function () { return ''; });
  }
  return { ok: true, rows: rows, ts: Date.now(), masked: masked, scoped: scope.length > 0 };
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

function pgOf_(kind) { return kind === 'arrival' ? 'الوصول' : kind === 'transfers' ? 'التنقلات' : 'المغادرة'; }
function write_(req, ctx) {
  const st = settings_();
  if (!st) return { ok: false, error: 'not_configured' };
  const kind = req.kind, cfg = CONFIG.KINDS[kind];
  if (!cfg) return { ok: false, error: 'kind غير صالح' };
  const ops = (req.ops || []).slice(0, CONFIG.MAX_OPS);
  const denied = deny_(ctx, kind === 'arrival' ? 'confArr' : 'confDep'); if (denied) return denied;
  const by = byOf_(ctx);
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
    const masked = !ctx.perms.passports, scope = ctx.owner ? [] : ctx.scope;
    const pcol = masked ? passCol_(st, kind, headers) : -1;
    const norm = function (col, v) { v = String(v == null ? '' : v).trim(); return (masked && col === pcol) ? mask_(v) : v; };

    // قراءة واحدة لكل عمود مفتاحي ولصفوف النطاق، ثم كتابة دفعة واحدة لكل مجموعة صفوف متتالية (بدل خلية خلية)
    const keyCache = {}, lastRow = sh.getLastRow();
    const keyColVals = function (keyCol) {
      if (!keyCache[keyCol]) {
        const n = lastRow - headerRow;
        keyCache[keyCol] = n > 0 ? sh.getRange(headerRow + 1, keyCol + 1, n, 1).getDisplayValues().map(function (r) { return norm(keyCol, r[0]); }) : [];
      }
      return keyCache[keyCol];
    };
    let scopeRows = null;
    const rowVals = function (row) {
      if (!scopeRows) { const n = lastRow - headerRow; scopeRows = n > 0 ? sh.getRange(headerRow + 1, 1, n, sh.getLastColumn()).getDisplayValues() : []; }
      return scopeRows[row - headerRow - 1] || [];
    };
    const now = new Date(), seen = {}, todo = [];
    const results = ops.map(function (op) {
      try {
        let row = Number(op.row);
        if (!(row > headerRow) || row !== Math.floor(row) || row > sh.getMaxRows()) throw new Error('رقم صف غير صالح');
        const keyCol = op.keyHeader ? findCol_(headers, op.keyHeader) : -1;
        if (keyCol >= 0 && op.key) {
          const want = String(op.key).trim(), vals = keyColVals(keyCol);
          if (vals[row - headerRow - 1] !== want) {        // تغيّر ترتيب الصفوف: ابحث بالقيمة المفتاحية
            let found = -1, count = 0;
            vals.forEach(function (v, i) { if (v === want) { count++; found = headerRow + 1 + i; } });
            if (count === 0) throw new Error('لم يُعثر على السجل (تغيّر الجدول)');
            if (count > 1) throw new Error('القيمة المفتاحية مكرّرة — تعذّر تحديد الصف');
            row = found;
          }
        }
        if (scope.length && !inScope_(scope, rowVals(row))) throw new Error('هذا السجل خارج نطاق صلاحيتك');
        if (seen[row]) return { ok: true, row: row };
        seen[row] = 1; todo.push({ row: row, on: op.value === true });
        return { ok: true, row: row };
      } catch (err) {
        return { ok: false, error: String(err.message || err) };
      }
    });
    todo.sort(function (a, b) { return a.row - b.row; });
    const runs = [];
    todo.forEach(function (t) { const r = runs[runs.length - 1]; if (r && r.end + 1 === t.row) { r.end = t.row; r.items.push(t); } else runs.push({ start: t.row, end: t.row, items: [t] }); });
    const chk = function (on) { return CONFIG.WRITE_AS === 'text' ? (on ? (cfg.textOn || 'تم') : CONFIG.TEXT_OFF) : on; };
    runs.forEach(function (r) {
      const n = r.items.length;
      sh.getRange(r.start, colCheck + 1, n, 1).setValues(r.items.map(function (t) { return [chk(t.on)]; }));
      if (colAt >= 0) sh.getRange(r.start, colAt + 1, n, 1).setValues(r.items.map(function (t) { return [t.on ? now : '']; }));
      if (colBy >= 0) sh.getRange(r.start, colBy + 1, n, 1).setValues(r.items.map(function (t) { return [t.on ? by : '']; }));
    });
    SpreadsheetApp.flush(); bumpData_();
    log_(st, kind, ctx, by, ops[0] && ops[0].value === true, results, String(req.ctx || '').slice(0, 120));
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
  if (!(p.ctx_ && p.ctx_.perms.passports)) return { ok: true, items: {}, hidden: true };
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
function noteSet_(req, ctx) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  if (req.kind !== 'arrival' && req.kind !== 'departure' && req.kind !== 'transfers') return { ok: false, error: 'kind غير صالح' };
  const denied = deny_(ctx, 'notes'); if (denied) return denied;
  const key = String(req.key || '').trim().slice(0, 200); if (!key) return { ok: false, error: 'مفتاح المجموعة مفقود' };
  const status = NOTE_STATUS.indexOf(String(req.status || '')) >= 0 ? String(req.status || '') : '';
  const note = cell_(String(req.note || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 300));
  const pg = pgOf_(req.kind), by = byOf_(ctx);
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
    log_(st, req.kind, ctx, by, true, [{ ok: true }], 'ملاحظة/حالة: ' + (status || '—') + ' | ' + String(req.label || '').slice(0, 80), cleared ? 'مسح ملاحظة' : 'ملاحظة');
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
function readySet_(req, ctx) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const denied = deny_(ctx, 'ready'); if (denied) return denied;
  const key = String(req.key || '').trim().slice(0, 200); if (!key) return { ok: false, error: 'مفتاح الرحلة مفقود' };
  const status = READY_STATUS.indexOf(String(req.status || '')) >= 0 ? String(req.status || '') : '';
  const eta = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(String(req.eta || '')) ? String(req.eta) : '';
  const clean = function (v, n) { return cell_(String(v || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, n)); };
  const hall = clean(req.hall, 30), gate = clean(req.gate, 30), note = clean(req.note, 300), by = byOf_(ctx);
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
    log_(st, 'arrival', ctx, by, true, [{ ok: true }], 'استعداد: ' + (status || '—') + (eta ? ' ETA ' + eta : '') + ' | ' + clean(req.label, 80), cleared ? 'مسح استعداد' : 'استعداد مسبق');
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
function fcSet_(req, ctx) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const denied = deny_(ctx, 'notes'); if (denied) return denied;
  const key = String(req.key || '').trim().slice(0, 200); if (!key) return { ok: false, error: 'مفتاح الرحلة مفقود' };
  const status = FC_STATUS.indexOf(String(req.status || '')) >= 0 ? String(req.status || '') : '';
  const official = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(String(req.official || '')) ? String(req.official) : '';
  const by = byOf_(ctx);
  fcWrite_(st, { key: key, flight: fcClean_(req.flight, 20), airline: fcClean_(req.airline, 60), date: fcClean_(req.date, 12), status: status, official: official, mode: 'manual', note: fcClean_(req.note, 200), by: by });
  log_(st, 'arrival', ctx, by, true, [{ ok: true }], 'تحقق رحلة: ' + (status || '—') + ' | ' + fcClean_(req.label, 80), status ? 'تحقق من رحلة' : 'مسح تحقق رحلة');
  return { ok: true };
}
// يجلب رحلة من المزوّد → {found, official:'YYYY-MM-DD HH:MM' (بتوقيت مطار الوصول أو الإقلاع حسب role)}
function fcFetch_(flight, date, dep) {
  const P = PropertiesService.getScriptProperties(), key = P.getProperty('FLIGHT_API_KEY'), prov = (P.getProperty('FLIGHT_PROVIDER') || 'aerodatabox').toLowerCase();
  if (prov === 'aviationstack') {
    const r = UrlFetchApp.fetch('http://api.aviationstack.com/v1/flights?access_key=' + encodeURIComponent(key) + '&flight_iata=' + encodeURIComponent(flight) + '&flight_date=' + date, { muteHttpExceptions: true });
    const j = JSON.parse(r.getContentText() || '{}'); if (j.error) throw new Error(j.error.message || 'provider');
    const f = (j.data || [])[0]; if (!f) return { found: false };
    const sd = dep ? f.departure : f.arrival, t = (sd && (sd.scheduled || sd.estimated)) || '';
    return { found: true, official: t ? String(t).slice(0, 16).replace('T', ' ') : '' };
  }
  const r = UrlFetchApp.fetch('https://aerodatabox.p.rapidapi.com/flights/number/' + encodeURIComponent(flight) + '/' + date + '?dateLocalRole=' + (dep ? 'Departure' : 'Arrival'), { headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com' }, muteHttpExceptions: true });
  if (r.getResponseCode() === 404) return { found: false };
  if (r.getResponseCode() >= 400) throw new Error('provider ' + r.getResponseCode());
  const a = JSON.parse(r.getContentText() || '[]'), f = Array.isArray(a) ? a[0] : null; if (!f) return { found: false };
  const sd = dep ? f.departure : f.arrival, t = sd && sd.scheduledTime && sd.scheduledTime.local || '';
  return { found: true, official: t ? String(t).slice(0, 16).replace('T', ' ') : '' };
}
function fcLookup_(req, ctx) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const denied = deny_(ctx, 'notes'); if (denied) return denied;
  if (!fcHasKey_()) return { ok: false, error: 'no_key' };
  const key = String(req.key || '').trim().slice(0, 200), flight = String(req.flight || '').replace(/\s+/g, '').toUpperCase(), date = String(req.date || '');
  if (!key || !/^[A-Z0-9]{2}\d{1,4}[A-Z]?$/.test(flight) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'no_code' };
  let res; try { res = fcFetch_(flight, date, String(req.role) === 'departure'); } catch (e) { return { ok: false, error: String(e.message || e).slice(0, 120) }; }
  const item = { key: key, flight: flight, airline: fcClean_(req.airline, 60), date: date, status: res.found ? 'ok' : 'notfound', official: res.official || '', mode: 'auto', note: res.found ? '' : 'لم يجد المزوّد رحلة بهذا الرقم في هذا اليوم', by: 'تلقائي' };
  fcWrite_(st, item); item.at = new Date().toISOString();
  return { ok: true, item: item };
}

/* ============================ إسناد المهام واستلام التنبيهات ============================ */
// تبويب Tasks: صف لكل مجموعة/تنبيه — المسؤول عنه (إسناد) ومن استلم التنبيه ويتابعه الآن.
const TASKS_SHEET = 'Tasks';
const TASK_HEAD = ['المفتاح', 'الصفحة', 'الوصف', 'المسؤول', 'اسم المسؤول', 'استلمه', 'اسم من استلم', 'وقت الاستلام', 'بواسطة', 'آخر تحديث'];
function tasksSheet_(st, create) {
  const ss = openSS_(st); let sh = ss.getSheetByName(TASKS_SHEET);
  if (!sh && create) { sh = ss.insertSheet(TASKS_SHEET); sh.getRange(1, 1, 1, TASK_HEAD.length).setValues([TASK_HEAD]).setFontWeight('bold'); sh.setFrozenRows(1); sh.getRange(1, 8, sh.getMaxRows(), 1).setNumberFormat('@'); }
  return sh;
}
function tasksGet_() {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const sh = tasksSheet_(st, false), items = [];
  if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, TASK_HEAD.length).getDisplayValues().forEach(function (r) {
    if (r[0] && (r[3] || r[5])) items.push({ key: r[0], kind: r[1], label: r[2], owner: r[3], ownerName: r[4], ack: r[5], ackName: r[6], ackAt: r[7], by: r[8], at: r[9] });
  });
  return { ok: true, items: items, ts: Date.now() };
}
function canTask_(ctx) { const P = ctx.perms; return !!(ctx.owner || P.notes || P.confArr || P.confDep || P.ready || P.appr); }
function canAssignOthers_(ctx) { return !!(ctx.owner || ctx.role === 'supervisor'); }
// req: {key, kind, label, assign?: 'username' | '' , ack?: true|false}
function taskSet_(req, ctx) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  if (!canTask_(ctx)) return { ok: false, error: 'forbidden' };
  const key = String(req.key || '').trim().slice(0, 200); if (!key) return { ok: false, error: 'مفتاح المهمة مفقود' };
  const kind = ['arrival', 'departure', 'transfers', 'alert'].indexOf(String(req.kind)) >= 0 ? String(req.kind) : 'alert';
  const me = ctx.username.toLowerCase(), by = byOf_(ctx);
  let owner = null, ownerName = '';
  if (req.assign !== undefined) {
    owner = String(req.assign || '').trim().toLowerCase().slice(0, 30);
    if (owner && owner !== me && !canAssignOthers_(ctx)) return { ok: false, error: 'إسناد المهام لغيرك للمالك والمشرف العام فقط — يمكنك أن تتولاها بنفسك' };
    if (owner) {
      if (owner === String(CONFIG.OWNER_USER).toLowerCase()) ownerName = 'المالك';
      else { const u = usersMap_()[owner]; if (!u || !userUsable_(u)) return { ok: false, error: 'المستخدم غير موجود أو موقوف' }; ownerName = u.name || u.username; }
    }
  }
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const sh = tasksSheet_(st, true), last = sh.getLastRow();
    const rows = last > 1 ? sh.getRange(2, 1, last - 1, TASK_HEAD.length).getDisplayValues() : [];
    let at = -1, cur = null;
    for (let i = 0; i < rows.length; i++) if (rows[i][0] === key) { at = i + 2; cur = rows[i]; break; }
    const rec = cur ? cur.slice() : [cell_(key), kind, '', '', '', '', '', '', '', ''];
    rec[1] = kind; if (req.label) rec[2] = cell_(String(req.label).replace(/[\r\n\t]+/g, ' ').trim().slice(0, 120));
    let ev = '';
    if (owner !== null) { rec[3] = owner; rec[4] = cell_(ownerName); ev = owner ? 'إسناد: ' + ownerName : 'إلغاء إسناد'; }
    if (req.ack === true) { rec[5] = me; rec[6] = cell_(ctx.name || ctx.username); rec[7] = nowStr_(); ev = 'استلام تنبيه'; }
    else if (req.ack === false) { rec[5] = ''; rec[6] = ''; rec[7] = ''; ev = 'إلغاء استلام'; }
    rec[8] = by; rec[9] = nowStr_();
    if (!rec[3] && !rec[5]) { if (at > 0) sh.deleteRow(at); }
    else if (at > 0) sh.getRange(at, 1, 1, TASK_HEAD.length).setValues([rec]);
    else sh.getRange(last + 1, 1, 1, TASK_HEAD.length).setValues([rec]);
    SpreadsheetApp.flush(); bumpData_();
    log_(st, kind === 'departure' ? 'departure' : kind === 'transfers' ? 'transfers' : 'arrival', ctx, by, true, [{ ok: true }], ev + ' | ' + String(rec[2] || key).slice(0, 80), ev || 'مهمة');
    return { ok: true, item: { key: key, kind: kind, label: rec[2], owner: rec[3], ownerName: rec[4], ack: rec[5], ackName: rec[6], ackAt: rec[7], by: rec[8], at: rec[9] } };
  } finally { try { lock.releaseLock(); } catch (x) { } }
}
// قائمة الفريق لاختيار المسؤول: الاسم واليوزر والقسم فقط (بلا بيانات حساسة)
function teamGet_(ctx) {
  if (!canTask_(ctx)) return { ok: true, items: [] };
  const map = usersMap_(), items = [{ username: String(CONFIG.OWNER_USER).toLowerCase(), name: 'المالك', dept: '' }];
  Object.keys(map).forEach(function (k) { const u = map[k]; if (userUsable_(u)) items.push({ username: u.username.toLowerCase(), name: u.name || u.username, dept: u.dept || '' }); });
  return { ok: true, items: items, canAssign: canAssignOthers_(ctx), me: ctx.username.toLowerCase() };
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
function apprSet_(req, ctx) {
  const st = settings_(); if (!st) return { ok: false, error: 'not_configured' };
  const denied = deny_(ctx, 'appr'); if (denied) return denied;
  const key = String(req.key || '').trim().slice(0, 200); if (!key) return { ok: false, error: 'مفتاح الرحلة مفقود' };
  const approved = String(req.status || '') === 'approved';
  const clean = function (v) { return cell_(String(v || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 80)); };
  const by = byOf_(ctx);
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
    log_(st, 'departure', ctx, by, true, [{ ok: true }], 'اعتماد: ' + (approved ? 'معتمدة' : 'إلغاء') + ' | ' + clean(req.label), approved ? 'اعتماد رحلة' : 'إلغاء اعتماد');
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

function log_(st, kind, who, by, on, results, ctx, label) {
  try {
    const okN = results.filter(function (r) { return r.ok; }).length;
    if (!okN) return;
    const ss = openSS_(st);
    let sh = ss.getSheetByName(CONFIG.LOG_SHEET);
    if (!sh) { sh = ss.insertSheet(CONFIG.LOG_SHEET); sh.appendRow(['الوقت', 'الصفحة', 'الدور', 'الاسم', 'الإجراء', 'العدد', 'التفاصيل']); }
    sh.appendRow([new Date(), pgOf_(kind), (who && who.roleLabel) || 'زائر', by,
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