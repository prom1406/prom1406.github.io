/* =====================================================================
   منظومة تحركات الحجاج 1447هـ — الطبقة الأساسية (منطق بحت بلا DOM)
   تحليل CSV، اكتشاف الأعمدة، الدول والأعلام، الحالات، العدّ التنازلي
   ===================================================================== */
(function (root) {
'use strict';

/* ---------------- الإعدادات الافتراضية ---------------- */
const DEFAULTS = {
  // ملف Google Sheets واحد بعدة صفحات — يُطلب من المستخدم عند أول دخول ثم يُحفظ في المتصفح
  source: { link: '', arrivalTab: 'Arrival', departureTab: 'Departure' },
  arrival:   { checkHeader: 'Check'    },
  departure: { checkHeader: 'Check_De' },
  webapp: '',            // رابط Google Apps Script (…/exec)
  token: '',             // الرمز السري المطابق لما في Code.gs
  readVia: 'link',       // link = قراءة الملف بالرابط | webapp = القراءة عبر Apps Script (فورية وخاصة)
  refreshSec: 30,
  dateOrder: 'DMY',      // ترتيب التاريخ في الجدول: DMY أو MDY
  tz: '+03:00',          // توقيت الرحلات (الرياض)
  criticalH: 3,          // ساعات: الرحلة "وشيكة/حرجة"
  warnH: 12,             // ساعات: الرحلة "قريبة"
  lateH: 2,              // ساعات بعد الهبوط قبل اعتبار التسكين "متأخراً"
  lead: { 'makkah>jeddah': 4, 'makkah>madinah': 10, 'madinah>madinah': 4, 'madinah>jeddah': 10 },  // ساعات التحرك من الفندق قبل الإقلاع (صفحة المغادرة)
  transport: { arrival: true, departure: true, busMin: 4 },  // وسيلة النقل: حافلة إن كان العدد ≥ busMin (أي أكبر من 3) وإلا سيارة
  map: { arrival: {}, departure: {} }   // ربط يدوي: الحقل → اسم العمود
};

/* ---------------- رابط ملف Google Sheets ---------------- */
// يقبل رابط التحرير/المشاركة (…/d/<ID>/…) أو المعرّف وحده. رابط «النشر على الويب» (/d/e/2PACX…) يُرفض لأنه لا يحدد الصفحات بالاسم.
function sheetIdFromLink(link) {
  link = String(link || '').trim(); if (!link) return '';
  if (/\/d\/e\//.test(link)) return '';
  const m = link.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{30,}$/.test(link) ? link : '';
}
const isPublishedLink = link => /\/d\/e\/2PACX/.test(String(link || ''));
const gvizUrl = (id, tab) => 'https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(tab);


/* ---------------- أدوات النصوص ---------------- */
const toLatinDigits = s => String(s == null ? '' : s)
  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

// تطبيع عربي/إنجليزي للمقارنة: يزيل التشكيل والمسافات والرموز ويوحّد الهمزات والتاء المربوطة
const normAr = s => toLatinDigits(s).toLowerCase()
  .replace(/[ً-ٰٟـ]/g, '')
  .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[^a-z0-9؀-ۿ]+/g, '');

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- محلل CSV (RFC 4180) ---------------- */
function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  text = String(text).replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); rows.push(row); row = []; cur = '';
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

/* ---------------- الدول والأعلام ----------------
   iso2|iso3|الاسم بالعربية|English|مرادفات (اختياري) */
const COUNTRY_TABLE = `
sa|SAU|السعودية|Saudi Arabia|المملكة العربية السعودية,KSA,Saudi
eg|EGY|مصر|Egypt
pk|PAK|باكستان|Pakistan
in|IND|الهند|India
bd|BGD|بنغلاديش|Bangladesh
id|IDN|إندونيسيا|Indonesia|اندونيسيا
my|MYS|ماليزيا|Malaysia
tr|TUR|تركيا|Turkey|Turkish,Turkiye,Türkiye
ir|IRN|إيران|Iran
iq|IRQ|العراق|Iraq
sy|SYR|سوريا|Syria|سورية
lb|LBN|لبنان|Lebanon
jo|JOR|الأردن|Jordan
ps|PSE|فلسطين|Palestine|Palestinian Territory
ye|YEM|اليمن|Yemen
om|OMN|عُمان|Oman|سلطنة عمان
ae|ARE|الإمارات|United Arab Emirates|الامارات العربية المتحدة,UAE,Emirates
kw|KWT|الكويت|Kuwait
qa|QAT|قطر|Qatar
bh|BHR|البحرين|Bahrain
sd|SDN|السودان|Sudan
ss|SSD|جنوب السودان|South Sudan
ly|LBY|ليبيا|Libya
tn|TUN|تونس|Tunisia
dz|DZA|الجزائر|Algeria
ma|MAR|المغرب|Morocco
mr|MRT|موريتانيا|Mauritania
so|SOM|الصومال|Somalia
dj|DJI|جيبوتي|Djibouti
km|COM|جزر القمر|Comoros
er|ERI|إريتريا|Eritrea
et|ETH|إثيوبيا|Ethiopia|اثيوبيا
ke|KEN|كينيا|Kenya
tz|TZA|تنزانيا|Tanzania
ug|UGA|أوغندا|Uganda
rw|RWA|رواندا|Rwanda
bi|BDI|بوروندي|Burundi
cd|COD|الكونغو الديمقراطية|Democratic Republic of the Congo|DR Congo
cg|COG|الكونغو|Congo
ng|NGA|نيجيريا|Nigeria
ne|NER|النيجر|Niger
ml|MLI|مالي|Mali
sn|SEN|السنغال|Senegal
gm|GMB|غامبيا|Gambia
gn|GIN|غينيا|Guinea
gw|GNB|غينيا بيساو|Guinea-Bissau
sl|SLE|سيراليون|Sierra Leone
lr|LBR|ليبيريا|Liberia
gh|GHA|غانا|Ghana
ci|CIV|ساحل العاج|Ivory Coast|كوت ديفوار,Cote d'Ivoire
bf|BFA|بوركينا فاسو|Burkina Faso
tg|TGO|توغو|Togo
bj|BEN|بنين|Benin
cm|CMR|الكاميرون|Cameroon
td|TCD|تشاد|Chad
cf|CAF|أفريقيا الوسطى|Central African Republic
ga|GAB|الغابون|Gabon
za|ZAF|جنوب أفريقيا|South Africa|جنوب افريقيا
mz|MOZ|موزمبيق|Mozambique
mg|MDG|مدغشقر|Madagascar
mw|MWI|ملاوي|Malawi
zm|ZMB|زامبيا|Zambia
zw|ZWE|زيمبابوي|Zimbabwe
na|NAM|ناميبيا|Namibia
ao|AGO|أنغولا|Angola
mu|MUS|موريشيوس|Mauritius
af|AFG|أفغانستان|Afghanistan
lk|LKA|سريلانكا|Sri Lanka
np|NPL|نيبال|Nepal
mv|MDV|المالديف|Maldives|جزر المالديف
mm|MMR|ميانمار|Myanmar|Burma,بورما
th|THA|تايلاند|Thailand
kh|KHM|كمبوديا|Cambodia
vn|VNM|فيتنام|Vietnam
ph|PHL|الفلبين|Philippines
sg|SGP|سنغافورة|Singapore
bn|BRN|بروناي|Brunei
cn|CHN|الصين|China
jp|JPN|اليابان|Japan
kr|KOR|كوريا الجنوبية|South Korea|كوريا,Korea
ru|RUS|روسيا|Russia
kz|KAZ|كازاخستان|Kazakhstan
uz|UZB|أوزبكستان|Uzbekistan|اوزبكستان
tj|TJK|طاجيكستان|Tajikistan
kg|KGZ|قرغيزستان|Kyrgyzstan
tm|TKM|تركمانستان|Turkmenistan
az|AZE|أذربيجان|Azerbaijan|اذربيجان
ge|GEO|جورجيا|Georgia
am|ARM|أرمينيا|Armenia
al|ALB|ألبانيا|Albania
ba|BIH|البوسنة والهرسك|Bosnia and Herzegovina|البوسنة,Bosnia
xk|XKX|كوسوفو|Kosovo
mk|MKD|مقدونيا الشمالية|North Macedonia|مقدونيا
bg|BGR|بلغاريا|Bulgaria
ro|ROU|رومانيا|Romania
rs|SRB|صربيا|Serbia
me|MNE|الجبل الأسود|Montenegro
gb|GBR|بريطانيا|United Kingdom|المملكة المتحدة,UK,England,انجلترا
ie|IRL|أيرلندا|Ireland
fr|FRA|فرنسا|France
de|DEU|ألمانيا|Germany|المانيا
it|ITA|إيطاليا|Italy|ايطاليا
es|ESP|إسبانيا|Spain|اسبانيا
pt|PRT|البرتغال|Portugal
nl|NLD|هولندا|Netherlands|Holland
be|BEL|بلجيكا|Belgium
ch|CHE|سويسرا|Switzerland
at|AUT|النمسا|Austria
se|SWE|السويد|Sweden
no|NOR|النرويج|Norway
dk|DNK|الدنمارك|Denmark
fi|FIN|فنلندا|Finland
gr|GRC|اليونان|Greece
pl|POL|بولندا|Poland
ua|UKR|أوكرانيا|Ukraine|اوكرانيا
us|USA|الولايات المتحدة|United States|أمريكا,امريكا,America
ca|CAN|كندا|Canada
mx|MEX|المكسيك|Mexico
br|BRA|البرازيل|Brazil
ar|ARG|الأرجنتين|Argentina|الارجنتين
au|AUS|أستراليا|Australia|استراليا
nz|NZL|نيوزيلندا|New Zealand
fj|FJI|فيجي|Fiji
`;
const COUNTRIES = []; const CIDX = new Map(); const CLONG = [];
COUNTRY_TABLE.trim().split('\n').forEach(line => {
  const p = line.split('|');
  const c = { iso2: p[0], iso3: p[1], ar: p[2], en: p[3] };
  COUNTRIES.push(c);
  [p[0], p[1], p[2], p[3]].concat(p[4] ? p[4].split(',') : []).forEach(a => {
    const k = normAr(a);
    if (k && !CIDX.has(k)) CIDX.set(k, c);
    const s = k.replace(/^ال/, '');
    if (s.length >= 3) CLONG.push([s, c]);
  });
});
function countryOf(str) {
  const k = normAr(str); if (!k) return null;
  if (CIDX.has(k)) return CIDX.get(k);
  const s = k.replace(/^ال/, ''); if (CIDX.has(s)) return CIDX.get(s);
  if (s.length < 3) return null;
  // مطابقة بالبادئة تلتقط النسبة: «مصري» ↔ «مصر»، «Pakistani» ↔ «Pakistan»
  let best = null, bl = 0;
  for (const [a, c] of CLONG) {
    if (s.startsWith(a) || a.startsWith(s)) { const l = Math.min(a.length, s.length); if (l > bl) { best = c; bl = l; } }
  }
  return best;
}
const flagUrl = (iso2, w) => 'https://flagcdn.com/w' + (w || 40) + '/' + iso2 + '.png';

/* ---------------- اكتشاف الأعمدة ---------------- */
const FIELDS = {
  name:        { ar: 'الاسم',          al: ['name', 'fullname', 'pilgrim', 'pilgrimname', 'passengername', 'الاسم', 'اسم', 'اسمالحاج', 'الحاج', 'اسمالمعتمر', 'اسمالمسافر', 'المسافر'] },
  passport:    { ar: 'رقم الجواز',     al: ['passport', 'passportno', 'passportnumber', 'passportnum', 'رقمالجواز', 'الجواز', 'جواز', 'جوازالسفر', 'رقمجوازالسفر'] },
  nationality: { ar: 'الجنسية',        al: ['nationality', 'nation', 'country', 'citizenship', 'الجنسية', 'جنسية', 'الدولة', 'دولة', 'البلد'] },
  flight:      { ar: 'رقم الرحلة',     al: ['flight', 'flightno', 'flightnumber', 'flightnum', 'flt', 'رقمالرحلة', 'الرحلة', 'رحلة'] },
  airline:     { ar: 'الناقل',         al: ['airline', 'carrier', 'الناقل', 'شركةالطيران', 'الطيران', 'الخطوط'] },
  date:        { ar: 'التاريخ',        al: ['date', 'arrivaldate', 'departuredate', 'تاريخالوصول', 'تاريخالمغادرة', 'التاريخ', 'تاريخ', 'يومالوصول', 'يومالمغادرة'] },
  time:        { ar: 'الوقت',          al: ['time', 'arrivaltime', 'departuretime', 'eta', 'etd', 'وقتالوصول', 'وقتالمغادرة', 'الوقت', 'وقت', 'الساعة', 'ساعةالوصول', 'ساعةالمغادرة'] },
  hotel:       { ar: 'الفندق',         al: ['hotel', 'accommodation', 'فندق', 'الفندق', 'السكن', 'مقرالسكن', 'اسمالفندق'] },
  airport:     { ar: 'المطار',         al: ['airport', 'arrivalairport', 'departureairport', 'المطار', 'مطار', 'مطارالوصول', 'مطارالمغادرة', 'مطارالقدوم'] },
  airCity:     { ar: 'مدينة المطار',   al: ['arrivalcity', 'departurecity', 'airportcity', 'مدينةالوصول', 'مدينةالمغادرة', 'مدينةالمطار', 'مدينةالقدوم', 'مدينةالنزول'] },
  stayCity:    { ar: 'مدينة الإقامة',  al: ['staycity', 'hotelcity', 'residencecity', 'accommodationcity', 'city', 'مدينةالإقامة', 'مدينةالاقامة', 'مدينةالسكن', 'مدينةالفندق', 'المدينة', 'مدينةالوجهة', 'destinationcity', 'الوجهة', 'وجهة', 'destination'] },
  room:        { ar: 'الغرفة',         al: ['room', 'roomno', 'roomnumber', 'غرفة', 'الغرفة', 'رقمالغرفة'] },
  group:       { ar: 'المجموعة',       al: ['group', 'groupname', 'campaign', 'agent', 'مجموعة', 'المجموعة', 'الحملة', 'حملة', 'مكتب', 'المكتب', 'الوكيل'] },
  pax:         { ar: 'العدد',          al: ['pax', 'count', 'persons', 'عدد', 'العدد', 'عددالحجاج', 'عددالافراد', 'عددالأفراد'] },
  phone:       { ar: 'الجوال',         al: ['phone', 'mobile', 'tel', 'جوال', 'الجوال', 'هاتف', 'الهاتف', 'رقمالجوال'] },
  terminal:    { ar: 'الصالة',         al: ['terminal', 'صالة', 'الصالة', 'المبنى'] },
  route:       { ar: 'من / إلى',       al: ['from', 'to', 'origin', 'destination', 'route', 'قادممن', 'الوجهة', 'وجهة', 'من', 'الى', 'إلى'] },
  notes:       { ar: 'ملاحظات',        al: ['notes', 'note', 'remarks', 'ملاحظات', 'ملاحظة'] }
};
Object.values(FIELDS).forEach(f => { f.nal = f.al.map(normAr); });

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    if (rows[i].filter(c => String(c).trim() !== '').length >= 3) return i;
  }
  return -1;
}

function buildMapping(headers, kind, overrides, checkHeader) {
  const H = headers.map(normAr);
  const map = {}; const used = new Set();
  // عمود التأكيد (Check / Check_De): مطابقة تامة بعد التطبيع
  const ck = normAr(checkHeader);
  let ci = H.findIndex(h => h === ck);
  if (overrides && overrides.check) { const j = headers.indexOf(overrides.check); if (j >= 0) ci = j; }
  if (ci >= 0) { map.check = ci; used.add(ci); }
  // الربط اليدوي أولاً
  Object.keys(overrides || {}).forEach(f => {
    if (f === 'check' || !FIELDS[f]) return;
    const j = headers.indexOf(overrides[f]);
    if (j >= 0 && !used.has(j)) { map[f] = j; used.add(j); }
  });
  const cand = [];
  Object.keys(FIELDS).forEach(f => {
    if (map[f] != null) return;
    H.forEach((h, i) => {
      if (used.has(i) || !h || h.startsWith('check')) return;
      let sc = 0;
      FIELDS[f].nal.forEach(a => {
        if (h === a) sc = Math.max(sc, 100);
        else if (a.length >= 4 && h.includes(a)) sc = Math.max(sc, 40 + a.length);
      });
      if (!sc) return;
      if (f !== 'airCity' && f !== 'stayCity' && (h.includes('مدينه') || h.includes('city'))) sc -= 80;
      if (f === 'stayCity' && /وجهه|destination/.test(h)) sc += kind === 'arrival' ? 30 : -200;   // في المغادرة «الوجهة» وجهة الرحلة لا مدينة الفندق
      if (f === 'date' || f === 'time' || f === 'airport' || f === 'airCity') {
        const arr = /arriv|وصول/.test(h), dep = /depart|مغادر/.test(h);
        if (kind === 'arrival') { if (arr) sc += 30; if (dep) sc -= 60; }
        else { if (dep) sc += 30; if (arr) sc -= 60; }
      }
      if (sc > 0) cand.push({ f, i, sc });
    });
  });
  cand.sort((a, b) => b.sc - a.sc || a.i - b.i);
  cand.forEach(c => { if (map[c.f] == null && !used.has(c.i)) { map[c.f] = c.i; used.add(c.i); } });
  return map;
}

/* ---------------- التاريخ والوقت ---------------- */
function parseDateParts(str, order) {
  str = toLatinDigits(str).trim(); if (!str) return null;
  let m;
  if ((m = str.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(?:[ T,]+(\d{1,2}):(\d{2}))?/)))
    return { y: +m[1], mo: +m[2], d: +m[3], h: m[4] != null ? +m[4] : null, mi: m[5] != null ? +m[5] : null };
  if ((m = str.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})(?:[ T,]+(\d{1,2}):(\d{2})\s*([APap]\.?[Mm]\.?|ص|م)?)?/))) {
    let a = +m[1], b = +m[2], y = +m[3]; if (y < 100) y += 2000;
    let d, mo; if (order === 'MDY') { mo = a; d = b; } else { d = a; mo = b; }
    if (mo > 12 && d <= 12) { const t = d; d = mo; mo = t; }
    let h = m[4] != null ? +m[4] : null; const ap = m[6];
    if (h != null && ap) { const pm = /^[Pp]|م/.test(ap); if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
    return { y, mo, d, h, mi: m[5] != null ? +m[5] : null };
  }
  const t = Date.parse(str);
  if (!isNaN(t)) { const d = new Date(t); return { y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate(), h: null, mi: null }; }
  return null;
}
function parseTimeParts(str) {
  str = toLatinDigits(str).trim(); if (!str) return null;
  let m = str.match(/(\d{1,2})\s*[:.]\s*(\d{2})(?::\d{2})?\s*([APap]\.?[Mm]\.?|ص|م)?/);
  if (!m) { const m4 = str.match(/^(\d{2})(\d{2})$/); if (m4) m = [null, m4[1], m4[2], null]; }
  if (!m) return null;
  let h = +m[1]; const mi = +m[2]; const ap = m[3];
  if (ap) { const pm = /^[Pp]|م/.test(ap); if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
  if (h > 23 || mi > 59) return null;
  return { h, mi };
}
const p2 = n => String(n).padStart(2, '0');
function buildWhen(dateStr, timeStr, order, tz) {
  const d = parseDateParts(dateStr, order); if (!d) return { when: null, approx: false };
  let h = d.h, mi = d.mi, approx = false;
  if (h == null) { const t = parseTimeParts(timeStr); if (t) { h = t.h; mi = t.mi; } }
  if (h == null) { h = 12; mi = 0; approx = true; }
  const dt = new Date(d.y + '-' + p2(d.mo) + '-' + p2(d.d) + 'T' + p2(h) + ':' + p2(mi) + ':00' + tz);
  return { when: isNaN(dt) ? null : dt, approx };
}
const TZ_NAME = 'Asia/Riyadh';
const fmtDay = d => new Intl.DateTimeFormat('en-CA', { timeZone: TZ_NAME }).format(d);
const fmtTime = d => new Intl.DateTimeFormat('en-GB', { timeZone: TZ_NAME, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
const fmtDayAr = d => new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { timeZone: TZ_NAME, weekday: 'short', day: '2-digit', month: '2-digit' }).format(d);
function fmtCountdown(ms) {
  const neg = ms < 0; let s = Math.floor(Math.abs(ms) / 1000);
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60;
  const hms = p2(h) + ':' + p2(m) + ':' + p2(s);
  return { neg, d, hms, text: (d ? d + 'ي ' : '') + hms };
}

/* ---------------- السجلات ---------------- */
const TRUE_SET = new Set(['true', '1', 'yes', 'y', 'x', 'نعم', 'تم', 'done', 'checked', 'تمالتسكين', 'تمتالمغادره', '✓', '✔', '☑']);
const isTrue = v => { const t = normAr(v) || String(v).trim().toLowerCase(); return TRUE_SET.has(t) || TRUE_SET.has(String(v).trim().toLowerCase()); };

function toRecords(rows, kind, cfg) {
  const hi = findHeaderRow(rows);
  if (hi < 0) return { headers: [], map: {}, records: [], headerRow: 0 };
  const headers = rows[hi].map(h => String(h == null ? '' : h).trim());
  const map = buildMapping(headers, kind, (cfg.map && cfg.map[kind]) || {}, cfg[kind].checkHeader);
  const get = (row, f) => map[f] != null ? String(row[map[f]] == null ? '' : row[map[f]]).trim() : '';
  const records = [];
  for (let i = hi + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => String(c).trim() === '')) continue;
    const name = get(row, 'name'), passport = get(row, 'passport'), flight = get(row, 'flight');
    if (!name && !passport && !flight) continue;
    const natRaw = get(row, 'nationality');
    const paxN = parseInt(toLatinDigits(get(row, 'pax')), 10);
    const w = buildWhen(get(row, 'date'), get(row, 'time'), cfg.dateOrder, cfg.tz);
    const keyField = map.passport != null ? 'passport' : (map.name != null ? 'name' : null);
    const r = {
      kind, row: i + 1, name, passport, flight, natRaw,
      country: countryOf(natRaw),
      airline: get(row, 'airline'), date: get(row, 'date'), time: get(row, 'time'),
      when: w.when, approx: w.approx,
      hotel: get(row, 'hotel'), room: get(row, 'room'), group: get(row, 'group'),
      airport: get(row, 'airport'), airCityRaw: get(row, 'airCity'), stayCityRaw: get(row, 'stayCity'),
      airCity: cityOf(get(row, 'airCity')) || cityOf(get(row, 'airport')), stayCity: cityOf(get(row, 'stayCity')) || cityOf(get(row, 'hotel')),
      pax: paxN > 0 ? paxN : 1, phone: get(row, 'phone'), terminal: get(row, 'terminal'),
      route: get(row, 'route'), notes: get(row, 'notes'),
      done: map.check != null ? isTrue(row[map.check]) : false,
      key: keyField ? get(row, keyField) : '', keyHeader: keyField ? headers[map[keyField]] : '',
      raw: headers.map((h, j) => [h || ('عمود ' + (j + 1)), String(row[j] == null ? '' : row[j]).trim()]).filter(x => x[1] !== '')
    };
    records.push(r);
  }
  return { headers, map, records, headerRow: hi + 1 };
}

/* ---------------- الحالات ---------------- */
const ST = {
  upcoming: { lv: 0, cls: 'info' }, soon: { lv: 1, cls: 'warn' }, critical: { lv: 3, cls: 'danger' },
  pending: { lv: 2, cls: 'warn' }, late: { lv: 4, cls: 'danger' }, missed: { lv: 4, cls: 'danger' },
  done: { lv: -1, cls: 'ok' }, nodate: { lv: 0, cls: 'mut' }
};
const ST_LABEL = {
  arrival:   { upcoming: 'قادمة', soon: 'تصل قريباً', critical: 'تصل خلال ساعات', pending: 'وصلت — بانتظار التسكين', late: 'تأخر التسكين', done: 'تم التسكين', nodate: 'بلا موعد' },
  departure: { upcoming: 'قادمة', soon: 'مغادرة قريبة', critical: 'مغادرة وشيكة', pending: 'بانتظار التأكيد', missed: 'لم يُؤكَّد بعد الإقلاع', late: 'متأخرة', done: 'تمت المغادرة', nodate: 'بلا موعد' }
};
function statusOf(r, now, c) {
  if (r.done) return 'done';
  if (!r.when) return 'nodate';
  const h = (r.when.getTime() - now) / 36e5;
  if (h > c.warnH) return 'upcoming';
  if (h > c.criticalH) return 'soon';
  if (h > 0) return 'critical';
  if (r.kind === 'arrival') return (-h > c.lateH) ? 'late' : 'pending';
  return 'missed';
}
function summarize(recs, now, c) {
  const o = { rows: recs.length, total: 0, done: 0, pending: 0, danger: 0, warn: 0, dangerRows: 0, by: {} };
  for (const r of recs) {
    const p = r.pax || 1; r._st = statusOf(r, now, c);
    o.total += p; if (r.done) o.done += p; else o.pending += p;
    const cls = ST[r._st].cls;
    if (cls === 'danger') { o.danger += p; o.dangerRows++; } else if (cls === 'warn') o.warn += p;
    o.by[r._st] = (o.by[r._st] || 0) + p;
  }
  o.pct = o.total ? Math.round(o.done / o.total * 100) : 0;
  return o;
}
function groupFlights(recs) {
  const m = new Map();
  for (const r of recs) {
    const k = (r.flight || '—') + '|' + (r.when ? fmtDay(r.when) : '');
    let g = m.get(k);
    if (!g) { g = { key: k, flight: r.flight || '—', airline: r.airline, when: r.when, rows: [], pax: 0, done: 0, kind: r.kind }; m.set(k, g); }
    g.rows.push(r); g.pax += r.pax; if (r.done) g.done += r.pax;
    if (r.when && (!g.when || r.when < g.when)) g.when = r.when;
  }
  return [...m.values()].sort((a, b) => (a.when ? a.when.getTime() : 9e15) - (b.when ? b.when.getTime() : 9e15));
}



/* ---------------- المدن ووسيلة النقل ---------------- */
const CITY_DEF = {
  makkah: { ar: 'مكة المكرمة', kw: ['مكه', 'makkah', 'makka', 'mecca', 'mekka'] },
  madinah: { ar: 'المدينة المنورة', kw: ['المدينه', 'مدينهالمنوره', 'المنوره', 'madinah', 'medina', 'medinah', 'madina'] },
  jeddah: { ar: 'جدة', kw: ['جده', 'jeddah', 'jedda', 'jiddah', 'jidda'] }
};
const CITY_CODE = { jeddah: /\bjed\b/i, madinah: /\bmed\b/i };
const AIRPORT_KW = { jeddah: ['الملكعبدالعزيز'], madinah: ['الاميرمحمدبنعبدالعزيز'] };
function cityOf(text) {
  const raw = String(text == null ? '' : text); if (!raw.trim()) return null;
  const n = normAr(raw);
  for (const id of ['makkah', 'madinah', 'jeddah']) if (CITY_DEF[id].kw.some(k => n.includes(k))) return id;
  for (const id of ['jeddah', 'madinah']) if (CITY_CODE[id].test(raw) || AIRPORT_KW[id].some(k => n.includes(k))) return id;
  return null;
}
const TRANSPORT = { bus: { ar: 'حافلة' }, car: { ar: 'سيارة' }, train: { ar: 'قطار' } };
// مدينة المطار × مدينة الفندق → الوسيلة. المحلي (جدة↔مكة، المدينة↔المدينة): حافلة إن كان العدد ≥ busMin وإلا سيارة. بين المدينتين: قطار للجميع.
function transportFor(airCity, stayCity, pax, busMin) {
  if (!airCity || !stayCity) return null;
  const local = () => (pax >= (busMin || 4) ? 'bus' : 'car');
  if (airCity === 'jeddah' && stayCity === 'makkah') return local();
  if (airCity === 'jeddah' && stayCity === 'madinah') return 'train';
  if (airCity === 'madinah' && stayCity === 'madinah') return local();
  if (airCity === 'madinah' && stayCity === 'makkah') return 'train';
  return null;
}
// وقت التحرك من الفندق = وقت الإقلاع − ساعات حسب (مدينة الفندق > مدينة المطار). الصفر أو غياب القاعدة = لا وقت تحرك.
function leadHours(stayCity, airCity, lead) { const v = lead && lead[stayCity + '>' + airCity]; return v > 0 ? +v : 0; }
function movementTime(when, stayCity, airCity, lead) {
  if (!when || !stayCity || !airCity) return null;
  const h = leadHours(stayCity, airCity, lead); return h ? new Date(when.getTime() - h * 36e5) : null;
}
const cityName = (id, raw) => raw || (id && CITY_DEF[id] ? CITY_DEF[id].ar : '');

/* ---------------- تجميع الحجاج: نفس الرحلة + نفس اليوم + نفس الفندق ---------------- */
const natKey = r => r.country ? r.country.iso2 : '?' + normAr(r.natRaw);
const groupKey = r => (r.flight || '—') + '|' + (r.when ? fmtDay(r.when) : '') + '|' + normAr(r.hotel) + '|' + (r.stayCity || '');
function groupRecords(recs) {
  const m = new Map();
  for (const r of recs) {
    const k = groupKey(r); let g = m.get(k);
    if (!g) { g = { key: k, flight: r.flight || '—', airline: r.airline, when: null, hotel: r.hotel, rows: [], pax: 0, done: 0, nats: new Map(), approx: true, airport: '', airCityRaw: '', airCity: null, stayCityRaw: '', stayCity: null }; m.set(k, g); }
    g.rows.push(r); g.pax += r.pax; if (r.done) g.done += r.pax;
    if (r.when) { g.approx = g.approx && r.approx; if (!g.when || r.when < g.when) g.when = r.when; }
    if (!g.airline && r.airline) g.airline = r.airline;
    if (!g.hotel && r.hotel) g.hotel = r.hotel;
    if (!g.airport && r.airport) g.airport = r.airport;
    if (!g.airCityRaw && r.airCityRaw) g.airCityRaw = r.airCityRaw;
    if (!g.airCity && r.airCity) g.airCity = r.airCity;
    if (!g.stayCityRaw && r.stayCityRaw) g.stayCityRaw = r.stayCityRaw;
    if (!g.stayCity && r.stayCity) g.stayCity = r.stayCity;
    const nk = natKey(r); let n = g.nats.get(nk);
    if (!n) { n = { k: nk, c: r.country, label: r.country ? r.country.ar : (r.natRaw || 'غير محدد'), n: 0 }; g.nats.set(nk, n); }
    n.n += r.pax;
  }
  m.forEach(g => {
    const open = g.rows.filter(r => !r.done);
    g.open = open.length; g.syncing = g.rows.some(r => r.syncing); g.allSyncing = g.rows.every(r => r.syncing);
    g.st = !open.length ? 'done' : open.reduce((a, r) => (ST[r._st] && ST[r._st].lv > ST[a].lv) ? r._st : a, open[0]._st || 'upcoming');
    g.cls = ST[g.st].cls;
    g.natList = [...g.nats.values()].sort((a, b) => b.n - a.n);
    if (!g.when) g.approx = false;
  });
  return [...m.values()];
}

root.HajjCore = {
  DEFAULTS, sheetIdFromLink, isPublishedLink, gvizUrl, normAr, esc, toLatinDigits, parseCSV, COUNTRIES, countryOf, flagUrl, FIELDS,
  findHeaderRow, buildMapping, parseDateParts, parseTimeParts, buildWhen, fmtDay, fmtTime, fmtDayAr, fmtCountdown,
  isTrue, toRecords, ST, ST_LABEL, statusOf, summarize, groupFlights, groupRecords, natKey, groupKey, cityOf, transportFor, TRANSPORT, CITY_DEF, cityName, leadHours, movementTime, TZ_NAME
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.HajjCore;
})(typeof window !== 'undefined' ? window : globalThis);
