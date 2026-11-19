// dates.js – helpers for dates and times.
// Dates are kept as text like "2026-11-17" and times like "19:30" (24-hour clock).
// A date with a time is "2026-11-17T19:30". Weeks run Monday (1) to Sunday (7).

(function () {
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const pad = n => String(n).padStart(2, '0');
  const D = {};

  D.pad = pad;
  D.DAYS = DAYS;
  D.MONTHS = MONTHS;
  D.ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  D.parse = s => { const p = s.slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  D.toDate = dt => { const d = D.parse(dt); if (dt.length > 10) d.setHours(+dt.slice(11, 13), +dt.slice(14, 16)); return d; };
  D.today = () => D.ymd(new Date());
  D.nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
  D.nowDT = () => D.today() + 'T' + D.fromMin(D.nowMin());      // this very minute, e.g. "2026-11-17T19:30"
  D.duration = m => m < 60 ? m + ' min' : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '');   // "40 min", "1 h 40 min"
  // Speed (step 6): addDays and dow run thousands of times when drawing the calendar, and their answers
  // never change, so answers already worked out are remembered (the memory is emptied when it gets big).
  const memo = new Map();
  const remember = (key, work) => { let v = memo.get(key); if (v === undefined) { if (memo.size > 50000) memo.clear(); v = work(); memo.set(key, v); } return v; };
  D.addDays = (s, n) => remember(s.slice(0, 10) + '+' + n, () => { const d = D.parse(s); d.setDate(d.getDate() + n); return D.ymd(d); });
  D.addMonths = (s, n) => { const d = D.parse(s); d.setDate(1); d.setMonth(d.getMonth() + n); return D.ymd(d); };
  D.dow = s => remember(s.slice(0, 10) + 'w', () => { const g = D.parse(s).getDay(); return g === 0 ? 7 : g; });          // Mon = 1 … Sun = 7
  D.monday = s => D.addDays(s, 1 - D.dow(s));
  D.diffDays = (a, b) => Math.round((D.parse(b) - D.parse(a)) / 86400000);
  D.toMin = t => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  D.fromMin = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  D.datePart = dt => dt.slice(0, 10);
  D.timePart = dt => dt.slice(11, 16);
  D.addMinutes = (dt, n) => {
    const d = D.toDate(dt); d.setMinutes(d.getMinutes() + n);
    return D.ymd(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  };
  D.minutesBetween = (a, b) => Math.round((D.toDate(b) - D.toDate(a)) / 60000);

  // How dates are written on screen
  D.dayName = s => DAYS[D.dow(s) - 1];
  D.monthName = s => MONTHS[+s.slice(5, 7) - 1];
  D.dayNum = s => +s.slice(8, 10);
  D.short = s => {                                   // "Tue 17 Nov" (adds the year if it isn't this year)
    const txt = D.dayName(s).slice(0, 3) + ' ' + D.dayNum(s) + ' ' + D.monthName(s).slice(0, 3);
    return s.slice(0, 4) === D.today().slice(0, 4) ? txt : txt + ' ' + s.slice(0, 4);
  };
  D.long = s => D.dayName(s) + ' ' + D.dayNum(s) + ' ' + D.monthName(s);   // "Friday 20 November"

  // ---- Flexible typing -------------------------------------------------
  // Turn typed text like "7:30pm", "1930" or "7" into "19:30". Gives null if it makes no sense.
  D.parseTime = text => {
    const t = String(text).trim().toLowerCase().replace(/\s+/g, '');
    if (!t) return null;
    if (t === 'noon' || t === 'midday') return '12:00';
    if (t === 'midnight') return '00:00';
    const m = t.match(/^(\d{1,2})(?:[:.h]?(\d{2}))?(am|pm|a|p)?$/);
    if (!m) return null;
    let hr = +m[1];
    const mi = m[2] ? +m[2] : 0;
    const ap = m[3];
    if (ap) {
      if (hr < 1 || hr > 12) return null;
      if (ap[0] === 'p' && hr < 12) hr += 12;
      if (ap[0] === 'a' && hr === 12) hr = 0;
    }
    if (hr > 23 || mi > 59) return null;
    return pad(hr) + ':' + pad(mi);
  };

  const findByPrefix = (list, word) => {
    if (word.length < 3) return -1;
    return list.findIndex(name => name.toLowerCase().indexOf(word) === 0);
  };
  const build = (y, m, d) => {                       // only if it's a real date (no 31 Feb)
    const dt = new Date(y, m - 1, d);
    return (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) ? D.ymd(dt) : null;
  };
  // No year typed: use this year, unless that's more than ~6 months ago (then they mean next year).
  const guessYear = (m, d, today) => {
    const y = +today.slice(0, 4);
    const s = build(y, m, d);
    if (s && D.diffDays(s, today) > 180) return build(y + 1, m, d);
    return s;
  };

  // Turn typed text like "tomorrow", "fri", "next fri", "20 nov" or "20/11" into "2026-11-20".
  D.parseDate = (text, todayStr) => {
    const today = todayStr || D.today();
    const t = String(text).trim().toLowerCase().replace(/[,]/g, ' ').replace(/\s+/g, ' ');
    if (!t) return null;
    if (t === 'today' || t === 'tod' || t === 'now') return today;
    if (t === 'tomorrow' || t === 'tmrw' || t === 'tom') return D.addDays(today, 1);
    if (t === 'yesterday') return D.addDays(today, -1);
    let m;
    if ((m = t.match(/^in (\d+) (day|week)s?$/))) return D.addDays(today, +m[1] * (m[2] === 'week' ? 7 : 1));
    if ((m = t.match(/^(next |this )?([a-z]+)$/))) {
      const w = findByPrefix(DAYS, m[2]);
      if (w >= 0) {
        if (m[1] === 'next ') return D.addDays(D.monday(today), 7 + w);       // that day NEXT week
        return D.addDays(today, (w + 1 - D.dow(today) + 7) % 7);              // the coming one (today counts)
      }
    }
    if ((m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return build(+m[1], +m[2], +m[3]);
    if ((m = t.match(/^(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?$/))) {   // day first: 20/11 or 20/11/2026
      if (!m[3]) return guessYear(+m[2], +m[1], today);
      return build(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
    }
    let day, mon, yr;
    if ((m = t.match(/^(\d{1,2})(?:st|nd|rd|th)? ([a-z]+)(?: (\d{4}))?$/))) { day = +m[1]; mon = m[2]; yr = m[3]; }
    else if ((m = t.match(/^([a-z]+) (\d{1,2})(?:st|nd|rd|th)?(?: (\d{4}))?$/))) { day = +m[2]; mon = m[1]; yr = m[3]; }
    if (mon) {
      const mi = findByPrefix(MONTHS, mon);
      if (mi < 0) return null;
      return yr ? build(+yr, mi + 1, day) : guessYear(mi + 1, day, today);
    }
    if ((m = t.match(/^(\d{1,2})(?:st|nd|rd|th)?$/))) {                        // just "20": the next 20th
      const y = +today.slice(0, 4), mo = +today.slice(5, 7);
      const s = build(y, mo, +m[1]);
      if (s && s >= today) return s;
      const next = D.addMonths(today, 1);
      return build(+next.slice(0, 4), +next.slice(5, 7), +m[1]);
    }
    return null;
  };

  Pz.dates = D;
})();
