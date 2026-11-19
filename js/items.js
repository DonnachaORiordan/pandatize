// items.js – the calendar items themselves (events, deadlines, all-day items):
// creating, saving, deleting, ticking deadlines, repeats, and working out what is on a given day.
// (No screen code here – that's in calendar.js and itemsheet.js.)
//
// A repeating item is stored ONCE with its rule. Each time it happens is an "occurrence",
// named by the date it starts on (its "key"), e.g. "2026-11-17".

(function () {
  const D = Pz.dates;
  const I = {};
  const clone = o => JSON.parse(JSON.stringify(o));
  const newId = () => 'item-' + Pz.storage.uid();

  I.get = id => Pz.data.items.find(it => it.id === id);
  I.startDate = it => it.start.slice(0, 10);

  // Build a repeat rule from one of the preset names.
  I.makeRepeat = (preset, date, previous) => {
    const dow = D.dow(date);
    const until = previous ? previous.until : null;
    const rule = (freq, interval, weekdays) => ({ preset: preset, freq: freq, interval: interval, weekdays: weekdays || [], until: until || null });
    if (preset === 'daily') return rule('daily', 1);
    if (preset === 'weekly') return rule('weekly', 1, [dow]);
    if (preset === 'biweekly') return rule('weekly', 2, [dow]);
    if (preset === 'monthly') return rule('monthly', 1);
    if (preset === 'yearly') return rule('yearly', 1);
    if (preset === 'custom') return rule('daily', 2);
    return null;
  };
  I.repeatLabel = r => {
    if (!r) return '';
    const names = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly', yearly: 'Yearly' };
    if (names[r.preset]) return names[r.preset];
    return 'Every ' + r.interval + ' ' + { daily: 'days', weekly: 'weeks', monthly: 'months', yearly: 'years' }[r.freq];
  };

  // ---- Repeats: does this item start on this date? ----
  I.occursOn = (it, date) => {
    const sd = it.start.slice(0, 10);
    if (date < sd) return false;
    const r = it.repeat;
    if (!r) return date === sd;
    if (r.until && date > r.until) return false;
    if (it.exceptions && it.exceptions[date]) return false;        // that one occurrence was deleted or changed
    if (date === sd) return true;
    const n = r.interval || 1;
    if (r.freq === 'daily') return D.diffDays(sd, date) % n === 0;
    if (r.freq === 'weekly') {
      const dayOk = r.weekdays && r.weekdays.length ? r.weekdays.includes(D.dow(date)) : D.dow(date) === D.dow(sd);
      return dayOk && (D.diffDays(D.monday(sd), D.monday(date)) / 7) % n === 0;
    }
    if (r.freq === 'monthly') return date.slice(8) === sd.slice(8) && ((+date.slice(0, 4) - +sd.slice(0, 4)) * 12 + (+date.slice(5, 7) - +sd.slice(5, 7))) % n === 0;
    if (r.freq === 'yearly') return date.slice(5) === sd.slice(5) && (+date.slice(0, 4) - +sd.slice(0, 4)) % n === 0;
    return false;
  };

  // The dates an item starts on between two dates (soonest first), up to "max" of them.
  I.keysBetween = (it, from, to, max) => {
    const out = [], sd = it.start.slice(0, 10);
    if (!it.repeat) { if (sd >= from && sd <= to) out.push(sd); return out; }
    const end = it.repeat.until && it.repeat.until < to ? it.repeat.until : to;
    const first = from < sd ? sd : from, f = it.repeat.freq;
    // Speed (step 6): monthly and yearly repeats jump straight to the same date each month / year
    // instead of checking every single day. (A date that doesn't exist, like 31 Feb, is skipped.)
    if (f === 'monthly' || f === 'yearly') {
      let y = +first.slice(0, 4), m = +first.slice(5, 7);
      while (true) {
        const d = f === 'yearly' ? y + sd.slice(4) : y + '-' + String(m).padStart(2, '0') + sd.slice(7);
        if (d.slice(0, 7) > end.slice(0, 7)) break;
        if (d >= first && d <= end && D.addDays(d, 0) === d && I.occursOn(it, d)) { out.push(d); if (max && out.length >= max) break; }
        if (f === 'yearly') y++; else if (++m > 12) { m = 1; y++; }
      }
      return out;
    }
    for (let d = first; d <= end; d = D.addDays(d, 1)) {
      if (I.occursOn(it, d)) { out.push(d); if (max && out.length >= max) break; }
    }
    return out;
  };
  // The same, going backwards from a date (most recent first).
  I.keysBefore = (it, to, max) => {
    const out = [], sd = it.start.slice(0, 10);
    if (!it.repeat) { if (sd <= to) out.push(sd); return out; }
    const from = it.repeat.until && it.repeat.until < to ? it.repeat.until : to;
    for (let d = from; d >= sd; d = D.addDays(d, -1)) {
      if (I.occursOn(it, d)) { out.push(d); if (max && out.length >= max) break; }
    }
    return out;
  };
  I.next = (it, from) => I.keysBetween(it, from, D.addDays(from, 800), 1)[0] || null;

  // One occurrence, described for the screens. "day" is the day being drawn
  // (an event that runs past midnight is drawn on two days).
  I.occ = (it, key, day) => {
    const cat = Pz.categories.get(it.categoryId);
    const sd = it.start.slice(0, 10);
    const shift = key === sd ? 0 : D.diffDays(sd, key);
    const o = { item: it, key: key, type: it.type, day: day || key, cat: cat, color: cat.color, repeating: !!it.repeat, done: false, segStart: 0, segEnd: 1440, min: -1, startDate: key };
    o.endDate = it.end ? (shift ? D.addDays(it.end.slice(0, 10), shift) : it.end.slice(0, 10)) : key;
    if (it.type === 'allday') { o.start = key; o.end = o.endDate; return o; }
    o.startTime = it.start.slice(11, 16);
    o.start = key + 'T' + o.startTime;
    if (it.type === 'deadline') {
      o.end = o.start;
      o.min = o.segStart = o.segEnd = D.toMin(o.startTime);
      o.done = (it.done || []).includes(key);
    } else {
      o.endTime = it.end.slice(11, 16);
      o.end = o.endDate + 'T' + o.endTime;
      if (o.startDate === o.day) o.segStart = D.toMin(o.startTime);
      if (o.endDate === o.day) o.segEnd = D.toMin(o.endTime);
      o.min = o.segStart;
    }
    return o;
  };

  // Everything on one day, in order: all-day items first, then by time.
  I.onDay = day => {
    const out = [];
    Pz.data.items.forEach(it => {
      const sd = it.start.slice(0, 10);
      if (day < sd) return;
      const ed = it.end ? it.end.slice(0, 10) : sd;
      const span = ed === sd ? 0 : D.diffDays(sd, ed);              // how many extra days one occurrence covers
      if (!it.repeat && day > ed) return;
      for (let k = 0; k <= span; k++) {
        const key = k ? D.addDays(day, -k) : day;
        if (!I.occursOn(it, key)) continue;
        const o = I.occ(it, key, day);
        if (it.type === 'event' && o.endDate === day && o.startDate < day && o.endTime === '00:00') continue;   // ended exactly at midnight
        out.push(o);
      }
    });
    return out.sort((a, b) => a.min - b.min || a.item.title.localeCompare(b.item.title));
  };

  // The last date anything is on (so the Agenda knows when to stop looking). Endless repeats: 2 years ahead.
  I.lastDate = () => {
    const far = D.addDays(D.today(), 730);
    return Pz.data.items.reduce((max, it) => {
      let e = (it.end || it.start).slice(0, 10);
      if (it.repeat) e = it.repeat.until && it.repeat.until < far ? it.repeat.until : far;
      return e > max ? e : max;
    }, '');
  };

  // ---- Countdowns ----
  // "Today", "Tomorrow", "3 days"; orange at 3 days or fewer, red at 1 day or fewer. Null once it has passed.
  I.countdown = date => {
    const n = D.diffDays(D.today(), date);
    if (n < 0) return null;
    return { days: n, text: n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n + ' days', level: n <= 1 ? 'red' : n <= 3 ? 'orange' : '' };
  };
  // Every countdown that should be showing now (for the Today screen): the next occurrence of each
  // item whose countdown is on and has started, soonest first.
  I.countdowns = () => {
    const today = D.today(), out = [];
    Pz.data.items.forEach(it => {
      const cd = I.effective(it).countdown;
      if (!cd.on) return;
      let key = I.next(it, today);
      while (key && it.type === 'deadline' && (it.done || []).includes(key)) key = it.repeat ? I.next(it, D.addDays(key, 1)) : null;
      if (!key || D.diffDays(today, key) > cd.days) return;
      out.push({ o: I.occ(it, key), countdown: I.countdown(key) });
    });
    return out.sort((a, b) => (a.o.start < b.o.start ? -1 : 1));
  };

  // ---- Drafts ----
  // A "draft" is a working copy the add/edit sheet changes freely; nothing is saved until Save.
  I.newDraft = (date, time) => {
    const today = D.today();
    const sDate = date || today;
    let sTime = time;
    if (!sTime) sTime = sDate === today ? D.fromMin(Math.min(23, Math.floor(D.nowMin() / 60) + 1) * 60) : '09:00';
    const end = D.addMinutes(sDate + 'T' + sTime, 60);
    const cat = Pz.categories.all()[0];
    const d = { id: null, type: cat.defaultType, title: '', categoryId: cat.id, sDate: sDate, sTime: sTime, eDate: end.slice(0, 10), eTime: end.slice(11),
      location: '', notes: '', repeat: I.makeRepeat(cat.defaultRepeat, sDate), reminders: null, countdown: null, autoTask: null, isDone: false };
    if (d.type === 'allday') d.eDate = d.sDate;
    return d;
  };

  // A draft of one occurrence (key = which one; left out = the first).
  I.toDraft = (it, key) => {
    const o = I.occ(it, key || I.startDate(it));
    const d = { id: it.id, type: it.type, title: it.title, categoryId: it.categoryId, location: it.location || '', notes: it.notes || '',
      repeat: it.repeat ? clone(it.repeat) : null, reminders: it.reminders ? clone(it.reminders) : null,
      countdown: it.countdown ? clone(it.countdown) : null, autoTask: it.autoTask ? clone(it.autoTask) : null,
      isDone: (it.done || []).includes(o.key) };
    d.sDate = o.startDate;
    if (it.type === 'allday') { d.sTime = '09:00'; d.eDate = o.endDate; d.eTime = '10:00'; }
    else {
      d.sTime = o.startTime;
      const end = it.type === 'event' ? o.end : D.addMinutes(o.start, 60);
      d.eDate = end.slice(0, 10); d.eTime = end.slice(11, 16);
    }
    return d;
  };

  const fields = d => ({
    type: d.type, title: d.title.trim(), categoryId: d.categoryId,
    start: d.type === 'allday' ? d.sDate : d.sDate + 'T' + d.sTime,
    end: d.type === 'event' ? d.eDate + 'T' + d.eTime : d.type === 'allday' ? d.eDate : null,
    location: d.location.trim(), notes: d.notes.trim(),
    reminders: d.reminders, countdown: d.countdown, autoTask: d.autoTask
  });
  const shiftDT = (dt, days) => days ? D.addDays(dt.slice(0, 10), days) + dt.slice(10) : dt;
  const shiftKeys = (obj, delta, keep) => {
    const out = {};
    Object.keys(obj || {}).forEach(k => { if (!keep || keep(k)) out[delta ? D.addDays(k, delta) : k] = obj[k]; });
    return out;
  };
  const shiftList = (list, delta, keep) => (list || []).filter(k => !keep || keep(k)).map(k => (delta ? D.addDays(k, delta) : k));
  const setDone = (list, key, on) => { const l = (list || []).filter(k => k !== key); if (on) l.push(key); return l; };
  // Auto-task to-dos are linked to (item, occurrence). When those move, the links follow.
  const relink = (fromId, test, toId, delta) => Pz.data.todos.forEach(t => {
    const s = t.source;
    if (s && s.type === 'auto' && s.itemId === fromId && test(s.occ)) { s.itemId = toId; if (delta) s.occ = D.addDays(s.occ, delta); }
  });

  // Save a new item, or an existing one that doesn't repeat.
  I.saveDraft = d => {
    const old = d.id ? I.get(d.id) : null;
    const now = new Date().toISOString();
    const it = Object.assign({ id: d.id || newId() }, fields(d), {
      repeat: d.repeat, exceptions: {}, done: d.type === 'deadline' && d.isDone ? [d.sDate] : [],
      created: old ? old.created : now, updated: now
    });
    if (old) {
      if (old.seriesId) it.seriesId = old.seriesId;
      const oldKey = I.startDate(old);
      relink(old.id, k => k === oldKey, old.id, D.diffDays(oldKey, d.sDate));
      Pz.data.items[Pz.data.items.indexOf(old)] = it;
    } else Pz.data.items.push(it);
    Pz.storage.save();
    return it;
  };

  // Save a change made to ONE occurrence (key) of a repeating item.
  // scope: 'one' = this one only, 'future' = this and future ones, 'all' = the whole series.
  I.saveOccurrence = (d, key, scope) => {
    const s = I.get(d.id), sd = I.startDate(s), now = new Date().toISOString();
    const delta = D.diffDays(key, d.sDate);                    // how many days this occurrence was moved
    const dlDone = d.type === 'deadline' && d.isDone;
    if (scope === 'future' && key === sd) scope = 'all';       // "this and future" from the very first one = all
    if (scope === 'one') {
      // Take this occurrence out of the series and make it an item of its own.
      s.exceptions = s.exceptions || {}; s.exceptions[key] = { deleted: true };
      s.done = setDone(s.done, key, false);
      const it = Object.assign({ id: newId() }, fields(d), { repeat: null, exceptions: {}, done: dlDone ? [d.sDate] : [], seriesId: s.id, created: now, updated: now });
      relink(s.id, k => k === key, it.id, delta);
      Pz.data.items.push(it);
    } else if (scope === 'future') {
      // End the old series the day before, and start a new one from here with the changes.
      const later = k => k >= key, earlier = k => k < key;
      const it = Object.assign({ id: newId() }, fields(d), { repeat: d.repeat, exceptions: shiftKeys(s.exceptions, delta, later),
        done: setDone(shiftList(s.done, delta, later), d.sDate, dlDone), created: now, updated: now });
      s.repeat.until = D.addDays(key, -1);
      s.exceptions = shiftKeys(s.exceptions, 0, earlier); s.done = shiftList(s.done, 0, earlier); s.updated = now;
      relink(s.id, later, it.id, delta);
      Pz.data.items.push(it);
    } else {
      const f = fields(d);
      if (d.repeat) {
        // The draft shows this occurrence's dates; the series itself starts earlier by the same gap as before.
        const back = D.diffDays(key, sd);
        f.start = shiftDT(f.start, back); if (f.end) f.end = shiftDT(f.end, back);
        Object.assign(s, f, { repeat: d.repeat, exceptions: shiftKeys(s.exceptions, delta), done: setDone(shiftList(s.done, delta), d.sDate, dlDone), updated: now });
        relink(s.id, () => true, s.id, delta);
      } else {
        Object.assign(s, f, { repeat: null, exceptions: {}, done: dlDone ? [d.sDate] : [], updated: now });
        relink(s.id, k => k === key, s.id, delta);
      }
    }
    Pz.storage.save();
  };

  // Delete an item, or part of a repeating one (same three scopes).
  I.removeOccurrence = (id, key, scope) => {
    const it = I.get(id);
    if (!it) return;
    if (it.repeat && scope === 'future' && key === I.startDate(it)) scope = 'all';
    if (it.repeat && scope === 'one') { it.exceptions = it.exceptions || {}; it.exceptions[key] = { deleted: true }; it.done = setDone(it.done, key, false); }
    else if (it.repeat && scope === 'future') it.repeat.until = D.addDays(key, -1);
    else Pz.data.items.splice(Pz.data.items.indexOf(it), 1);
    Pz.storage.save();
  };

  // Remember how things are now; gives back an "undo" function that puts them back.
  I.snapshot = () => {
    const saved = JSON.stringify([Pz.data.items, Pz.data.todos]);
    return () => { const back = JSON.parse(saved); Pz.data.items = back[0]; Pz.data.todos = back[1]; Pz.storage.save(); };
  };

  // Tick / un-tick a deadline (key = the date of that occurrence).
  I.setDone = (it, key, on) => { it.done = setDone(it.done, key, on); Pz.storage.save(); };
  I.toggleDone = (it, key) => I.setDone(it, key, !(it.done || []).includes(key));

  // The item's own setting, or its category's default if it hasn't been changed by hand.
  I.effective = it => {
    const c = Pz.categories.get(it.categoryId);
    return {
      reminders: it.reminders || c.reminders,
      countdown: it.countdown || { on: c.countdownDays != null, days: c.countdownDays },
      autoTask: it.autoTask || (c.autoTask ? Object.assign({ on: true }, c.autoTask) : { on: false })
    };
  };

  Pz.items = I;
})();
