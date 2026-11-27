/* نسخة العرض: خادم وهمي داخل المتصفح ببيانات تجريبية واقعية (لا أسماء ولا جوازات حقيقية).
   يُحمَّل فقط لشركة العرض (demo: true في config.js). كل ما يُحفظ يبقى في هذه النافذة، و«إعادة العرض» يرجعه كما بدأ. */
(function () {
  'use strict';
  const KEY = 'hajj1447.demoState.v3', TTL = 6 * 3600e3;
  let seed = 1447;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pad = n => String(n).padStart(2, '0');
  const dStr = d => pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  const tStr = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
  const now = () => Date.now();
  const stamp = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + tStr(d); };

  const NATS = [
    ['Egypt', ['Ahmed', 'Mohamed', 'Mahmoud', 'Mostafa', 'Fatma', 'Aya', 'Hoda'], ['Hassan', 'Abdelrahman', 'Saeed', 'Fathy', 'Ibrahim']],
    ['Indonesia', ['Budi', 'Siti', 'Agus', 'Dewi', 'Rizky', 'Nur'], ['Santoso', 'Rahmawati', 'Hidayat', 'Wibowo', 'Saputra']],
    ['Pakistan', ['Muhammad', 'Ali', 'Usman', 'Ayesha', 'Bilal', 'Sana'], ['Khan', 'Qureshi', 'Malik', 'Butt', 'Sheikh']],
    ['Nigeria', ['Abdullahi', 'Musa', 'Aisha', 'Ibrahim', 'Zainab'], ['Bello', 'Abubakar', 'Yusuf', 'Sani', 'Lawal']],
    ['Turkey', ['Mehmet', 'Ayse', 'Mustafa', 'Elif', 'Yusuf'], ['Yilmaz', 'Kaya', 'Demir', 'Sahin', 'Celik']],
    ['Malaysia', ['Ahmad', 'Nurul', 'Mohd', 'Siti', 'Hafiz'], ['Ismail', 'Abdullah', 'Rahman', 'Hamzah', 'Osman']],
    ['Morocco', ['Youssef', 'Fatima', 'Hamza', 'Khadija', 'Omar'], ['El Amrani', 'Benali', 'Alaoui', 'Tazi', 'Idrissi']],
    ['Bangladesh', ['Rahim', 'Karim', 'Nasrin', 'Hasan', 'Jamal'], ['Uddin', 'Hossain', 'Islam', 'Chowdhury', 'Miah']],
    ['Algeria', ['Karim', 'Amina', 'Sofiane', 'Nadia', 'Rachid'], ['Benaissa', 'Boudiaf', 'Mansouri', 'Haddad', 'Saidi']],
    ['India', ['Abdul', 'Mohammed', 'Shabana', 'Imran', 'Farhan'], ['Ansari', 'Siddiqui', 'Patel', 'Shaikh', 'Qadri']]
  ];
  const H_MAK = ['فندق منارات الضيافة', 'فندق أبراج السكينة', 'فندق نسائم الحرم', 'فندق دار الوفود'];
  const H_MED = ['فندق أنوار طيبة', 'فندق روضة الضيوف', 'فندق قباء الماسي'];
  const AIR = [['SV', 'Saudia'], ['MS', 'EgyptAir'], ['GA', 'Garuda'], ['PK', 'PIA'], ['TK', 'Turkish'], ['MH', 'Malaysia'], ['AT', 'Royal Air Maroc'], ['BG', 'Biman'], ['AH', 'Air Algerie'], ['AI', 'Air India']];
  const NAT_AIR = { Egypt: 'MS', Indonesia: 'GA', Pakistan: 'PK', Nigeria: 'SV', Turkey: 'TK', Malaysia: 'MH', Morocco: 'AT', Bangladesh: 'BG', Algeria: 'AH', India: 'AI' };
  const A_HEAD = ['Name', 'Passport', 'Nationality', 'Flight', 'Airline', 'Date', 'Time', 'Airport', 'Arrival City', 'Hotel', 'Stay City', 'Room', 'Group', 'Phone', 'Check', 'Check_At', 'Check_By'];
  const D_HEAD = ['Name', 'Passport', 'Nationality', 'Flight', 'Airline', 'Date', 'Time', 'Airport', 'Departure City', 'Hotel', 'Stay City', 'Room', 'Group', 'Phone', 'Check_De', 'Check_De_At', 'Check_De_By'];
  const STAFF = ['خالد — مشرف الوصول', 'سارة — مشرفة المغادرة', 'فهد — مشرف مكة'];

  function build() {
    seed = 1447;
    const base = new Date(); base.setMinutes(0, 0, 0);
    const H = 3600e3, people = [], A = [A_HEAD], D = [D_HEAD], T = [['Passport', 'الفندق 1', 'المدينة 1', 'تاريخ الدخول 1', 'تاريخ الخروج 1', 'الفندق 2', 'المدينة 2', 'تاريخ الدخول 2', 'تاريخ الخروج 2', 'الفندق 3', 'المدينة 3', 'تاريخ الدخول 3', 'تاريخ الخروج 3']];
    const names = {}, fkDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }), ready = {}, appr = {};
    const fkey = (fl, d) => fl + '|' + fkDay.format(d);
    // رحلات الوصول: من قبل يومين إلى بعد 5 أيام
    for (let f = 0; f < 26; f++) {
      const nat = pick(NATS), ac = NAT_AIR[nat[0]], al = AIR.find(a => a[0] === ac)[1];
      const fl = ac + int(301, 989), offH = -48 + Math.round(f * (168 / 26)) + int(-2, 2);
      const when = new Date(base.getTime() + offH * H + pick([0, 15, 30, 45]) * 60e3);
      const med = rnd() < 0.3, city = med ? 'Madinah' : 'Jeddah', stay = med ? 'Madinah' : 'Makkah', hs = med ? H_MED : H_MAK;
      const groups = [pick(hs)]; if (rnd() < 0.6) { const h2 = pick(hs); if (h2 !== groups[0]) groups.push(h2); }
      const ageH = (base.getTime() - when.getTime()) / H;
      // الاستعداد المسبق: مسجّل لأغلب الرحلات الماضية والقريبة، وبعض القادمة ما زالت بانتظاره (لتظهر التنبيهات)
      if (ageH > 0 ? rnd() < 0.85 : rnd() < 0.5) { const k = fkey(fl, when); ready[k] = { key: k, flight: fl, status: rnd() < 0.6 ? 'approved' : 'entered', eta: '', hall: '', gate: '', note: '', by: pick(STAFF), at: '' }; }
      groups.forEach((hotel, gi) => {
        const late = ageH > 3 && rnd() < 0.18, n = int(18, 70), grp = 'G' + (f + 1) + (gi ? '-' + (gi + 1) : '');
        for (let i = 0; i < n; i++) {
          const first = pick(nat[1]), last = pick(nat[2]), pp = String.fromCharCode(65 + int(0, 25)) + int(1000000, 9999999);
          let done = false;
          if (ageH > 3) done = late ? rnd() < 0.35 : rnd() < 0.97;
          else if (ageH > 0.5) done = rnd() < Math.min(0.9, ageH / 3);
          const doneAt = done ? new Date(when.getTime() + int(60, 170) * 60e3) : null;
          A.push([first + ' ' + last, pp, nat[0], fl, al, dStr(when), tStr(when), med ? 'MED' : 'JED', city, hotel, stay, String(int(101, 1420)), grp, '', done ? 'تم التسكين' : '', doneAt ? doneAt.getFullYear() + '-' + pad(doneAt.getMonth() + 1) + '-' + pad(doneAt.getDate()) + ' ' + tStr(doneAt) : '', done ? pick(STAFF) : '']);
          names[pp] = first + ' ' + last;
          people.push({ pp, name: first + ' ' + last, nat: nat[0], ac, al, arr: when, hotel, stay, med });
        }
      });
    }
    // المغادرة: كل حاج يغادر بعد إقامته (رحلات من أمس إلى بعد 6 أيام)
    const depFl = [];
    for (let f = 0; f < 18; f++) {
      const ac = pick(AIR)[0], when = new Date(base.getTime() + (-20 + Math.round(f * (164 / 18)) + int(-2, 2)) * H + pick([0, 20, 40]) * 60e3);
      depFl.push({ fl: ac + int(1100, 1990), ac, al: AIR.find(a => a[0] === ac)[1], when, med: rnd() < 0.35 });
      const df = depFl[depFl.length - 1], dh = (df.when.getTime() - base.getTime()) / H;
      if (dh < 0 ? rnd() < 0.9 : rnd() < 0.45) { const k = fkey(df.fl, df.when); appr[k] = { key: k, flight: df.fl, status: 'approved', by: pick(STAFF), at: '' }; }
    }
    people.forEach((p, i) => {
      // حجاج بمسار كامل (إقامة ← منى ← إقامة ← مغادرة) تتطابق تواريخه، والبقية بلا تبويب تنقلات
      const later = depFl.filter(d => d.when.getTime() - p.arr.getTime() >= 4 * 24 * H);
      const full = later.length && rnd() < 0.7;
      const cand = (full ? later : depFl).filter(d => d.ac === p.ac);
      const d = cand.length ? cand[i % cand.length] : (full ? later[i % later.length] : depFl[i % depFl.length]);
      const ageH = (base.getTime() - d.when.getTime()) / H;
      const stay = d.med ? 'Madinah' : 'Makkah', hotel = d.med ? pick(H_MED) : (full ? pick(H_MAK) : p.hotel);
      let done = false; if (ageH > -4) done = ageH > 2 ? rnd() < 0.96 : rnd() < 0.6;
      D.push([p.name, p.pp, p.nat, d.fl, d.al, dStr(d.when), tStr(d.when), d.med ? 'MED' : 'JED', d.med ? 'Madinah' : 'Jeddah', hotel, stay, String(int(101, 1420)), '', '', done ? 'تمت المغادرة' : '', '', done ? pick(STAFF) : '']);
      if (full) {
        const a = p.arr, m1 = new Date(a.getTime() + 2 * 24 * H), m2 = new Date(m1.getTime() + 2 * 24 * H);
        T.push([p.pp, p.hotel, p.stay, dStr(a), dStr(m1), 'مخيمات منى', 'Makkah', dStr(m1), dStr(m2), hotel, stay, dStr(m2), dStr(d.when)]);
      }
    });
    return { at: now(), rows: { arrival: A, departure: D, transfers: T }, names, notes: { arrival: {}, departure: {}, transfers: {} }, ready, appr, fc: {}, tasks: {} };
  }
  let ST = null;
  try { const s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (s && now() - s.at < TTL) ST = s; } catch (e) { }
  if (!ST) ST = build();
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } };
  save();

  const USER = { username: 'demo', name: 'مدير العرض', role: 'owner', roleLabel: 'المالك', owner: true, mustChange: false, scope: [], dept: '', phone: '', email: '',
    perms: { pDash: true, pArrival: true, pDeparture: true, pTransfers: true, pPilgrim: true, pFollow: true, confArr: true, confDep: true, notes: true, ready: true, appr: true, export: true, passports: true } };
  const SETTINGS = { source: { arrivalTab: 'Arrival', departureTab: 'Departure' }, refreshSec: 30, dateOrder: 'DMY', criticalH: 3, warnH: 12, lateH: 2,
    lead: { 'makkah>jeddah': 4, 'makkah>madinah': 10, 'madinah>madinah': 4, 'madinah>jeddah': 10 }, transport: { arrival: true, departure: true, busMin: 8 },
    map: { arrival: {}, departure: {} }, perms: { showPassports: true, confirm: 'all' }, passCol: { arrival: null, departure: null }, updatedAt: 1 };
  const TEAM = [{ username: 'demo', name: 'مدير العرض', dept: '' }, { username: 'khaled', name: 'خالد', dept: 'الوصول' }, { username: 'sara', name: 'سارة', dept: 'المغادرة' }, { username: 'fahad', name: 'فهد', dept: 'مكة' }];
  const NO = { ok: false, error: 'غير متاح في نسخة العرض — هذه الميزة تعمل في نسخة شركتك' };
  const list = o => Object.keys(o).map(k => o[k]);

  function handle(action, extra, p) {
    p = p || {}; extra = extra || {};
    switch (action) {
      case 'public': return { ok: true, service: 'hajj-sync', v: 6, configured: true, settings: SETTINGS, user: USER };
      case 'whoami': return { ok: true, owner: true, user: USER };
      case 'login': return { ok: true, session: 'demo'.repeat(16), user: USER };
      case 'logout': return { ok: true };
      case 'owner_get': return { ok: true, email: 'demo', configured: true, settings: SETTINGS };
      case 'read': return { ok: true, rows: JSON.parse(JSON.stringify(ST.rows[extra.kind] || [])), ts: now(), masked: false, scoped: false };
      case 'names_get': return { ok: true, items: ST.names, count: Object.keys(ST.names).length };
      case 'notes_get': return { ok: true, items: list(ST.notes[extra.kind] || {}), ts: now() };
      case 'ready_get': return { ok: true, items: list(ST.ready), ts: now() };
      case 'appr_get': return { ok: true, items: list(ST.appr), ts: now() };
      case 'fc_get': return { ok: true, items: list(ST.fc), lookup: false, ts: now() };
      case 'tasks_get': return { ok: true, items: list(ST.tasks), ts: now() };
      case 'team_get': return { ok: true, items: TEAM, canAssign: true, me: 'demo' };
      case 'write': {
        const rows = ST.rows[p.kind], h = rows[0], ck = h.indexOf(p.kind === 'arrival' ? 'Check' : 'Check_De'), by = h.indexOf(p.kind === 'arrival' ? 'Check_By' : 'Check_De_By'), at = h.indexOf(p.kind === 'arrival' ? 'Check_At' : 'Check_De_At');
        const results = (p.ops || []).map(op => {
          let r = op.row - 1; const kc = op.keyHeader ? h.indexOf(op.keyHeader) : -1;
          if (kc >= 0 && op.key && (!rows[r] || rows[r][kc] !== op.key)) r = rows.findIndex((x, i) => i > 0 && x[kc] === op.key);
          if (!(r > 0) || !rows[r]) return { ok: false, error: 'لم يُعثر على السجل' };
          rows[r][ck] = op.value ? (p.kind === 'arrival' ? 'تم التسكين' : 'تمت المغادرة') : ''; rows[r][by] = op.value ? 'مدير العرض' : ''; rows[r][at] = op.value ? stamp() : '';
          return { ok: true, row: r + 1 };
        });
        save(); return { ok: true, results, v: 3 };
      }
      case 'note_set': { const m = ST.notes[p.kind] = ST.notes[p.kind] || {}; if (!p.status && !p.note) delete m[p.key]; else m[p.key] = { key: p.key, status: p.status || '', note: p.note || '', by: 'مدير العرض', at: stamp() }; save(); return { ok: true }; }
      case 'ready_set': { if (!p.status && !p.eta && !p.hall && !p.gate && !p.note) delete ST.ready[p.key]; else ST.ready[p.key] = { key: p.key, flight: p.label || '', status: p.status || '', eta: p.eta || '', hall: p.hall || '', gate: p.gate || '', note: p.note || '', by: 'مدير العرض', at: stamp() }; save(); return { ok: true }; }
      case 'appr_set': { if (p.status === 'approved') ST.appr[p.key] = { key: p.key, flight: p.label || '', status: 'approved', by: 'مدير العرض', at: stamp() }; else delete ST.appr[p.key]; save(); return { ok: true }; }
      case 'fc_set': { if (!p.status) delete ST.fc[p.key]; else ST.fc[p.key] = { key: p.key, flight: p.flight, airline: p.airline, date: p.date, status: p.status, official: p.official || '', mode: 'manual', note: p.note || '', by: 'مدير العرض', at: stamp() }; save(); return { ok: true }; }
      case 'fc_lookup': return { ok: false, error: 'no_key' };
      case 'task_set': {
        const t = ST.tasks[p.key] || { key: p.key, kind: p.kind, label: '', owner: '', ownerName: '', ack: '', ackName: '', ackAt: '', by: '', at: '' };
        if (p.label) t.label = p.label;
        if (p.assign !== undefined) { const u = TEAM.find(x => x.username === p.assign); t.owner = u ? u.username : ''; t.ownerName = u ? u.name : ''; }
        if (p.ack === true) { t.ack = 'demo'; t.ackName = 'مدير العرض'; t.ackAt = stamp(); } else if (p.ack === false) { t.ack = ''; t.ackName = ''; t.ackAt = ''; }
        t.by = 'مدير العرض'; t.at = stamp();
        if (!t.owner && !t.ack) delete ST.tasks[p.key]; else ST.tasks[p.key] = t;
        save(); return { ok: true, item: ST.tasks[p.key] || { key: p.key } };
      }
      case 'users_get': return { ok: true, users: TEAM.slice(1).map(u => ({ username: u.username, name: u.name, role: u.dept === 'المغادرة' ? 'departure_sup' : 'arrival_sup', roleLabel: u.dept === 'المغادرة' ? 'مشرف مغادرة' : 'مشرف وصول', overrides: {}, perms: {}, dept: u.dept, scope: u.dept === 'مكة' ? ['makkah'] : [], active: true, expires: '', expired: false, must: false, created: '', by: 'demo', last: stamp(), hasPw: true })), roles: [['supervisor', 'مشرف عام'], ['arrival_sup', 'مشرف وصول'], ['departure_sup', 'مشرف مغادرة'], ['viewer', 'مشاهدة فقط'], ['custom', 'مخصّص']].map(r => ({ key: r[0], label: r[1], perms: {} })), permKeys: Object.keys(USER.perms), owner: 'demo' };
      case 'activity_get': return { ok: true, logins: [], ops: [] };
      case 'owner_backup_info': return { ok: true, daily: true, last: { at: now() - 3 * 3600e3, why: 'يومي تلقائي' }, tabs: [], count: 12 };
      default: return NO;
    }
  }
  window.HajjDemo = {
    handle: (a, e, p) => new Promise(res => setTimeout(() => res(handle(a, e, p)), 120 + Math.random() * 180)),
    reset: () => { try { sessionStorage.removeItem(KEY); } catch (e) { } }
  };
})();
