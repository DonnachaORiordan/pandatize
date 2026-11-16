// items.js – the calendar items themselves (events, deadlines, all-day items):
// creating, saving, deleting, ticking deadlines, and working out what is on a given day.
// (No screen code here – that's in calendar.js and itemsheet.js.)

(function () {
  const D = Pz.dates;
  const I = {};
  const clone = o => JSON.parse(JSON.stringify(o));

  I.get = id => Pz.data.items.find(it => it.id === id);

  // Build a repeat rule from one of the preset names. (Saved now; repeats start acting in step 2.)
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

  I.toDraft = it => {
    const d = { id: it.id, type: it.type, title: it.title, categoryId: it.categoryId, location: it.location || '', notes: it.notes || '',
      repeat: it.repeat ? clone(it.repeat) : null, reminders: it.reminders ? clone(it.reminders) : null,
      countdown: it.countdown ? clone(it.countdown) : null, autoTask: it.autoTask ? clone(it.autoTask) : null,
      isDone: (it.done || []).includes(it.start.slice(0, 10)) };
    d.sDate = it.start.slice(0, 10);
    if (it.type === 'allday') { d.sTime = '09:00'; d.eDate = it.end || it.start; d.eTime = '10:00'; }
    else {
      d.sTime = it.start.slice(11, 16);
      const end = it.type === 'event' ? it.end : D.addMinutes(it.start, 60);
      d.eDate = end.slice(0, 10); d.eTime = end.slice(11, 16);
    }
    return d;
  };

  // Turn a draft into a saved item (new, or replacing the old version).
  I.saveDraft = d => {
    const old = d.id ? I.get(d.id) : null;
    const now = new Date().toISOString();
    const it = {
      id: d.id || 'item-' + Pz.storage.uid(), type: d.type, title: d.title.trim(), categoryId: d.categoryId,
      start: d.type === 'allday' ? d.sDate : d.sDate + 'T' + d.sTime,
      end: d.type === 'event' ? d.eDate + 'T' + d.eTime : d.type === 'allday' ? d.eDate : null,
      location: d.location.trim(), notes: d.notes.trim(),
      repeat: d.repeat, exceptions: old ? old.exceptions || {} : {},
      done: d.type === 'deadline' && d.isDone ? [d.sDate] : [],
      reminders: d.reminders, countdown: d.countdown, autoTask: d.autoTask,
      created: old ? old.created : now, updated: now
    };
    if (old) Pz.data.items[Pz.data.items.indexOf(old)] = it; else Pz.data.items.push(it);
    Pz.storage.save();
    return it;
  };

  // Delete. Gives back an "undo" function that puts the item back where it was.
  I.remove = id => {
    const i = Pz.data.items.findIndex(it => it.id === id);
    if (i < 0) return () => {};
    const it = Pz.data.items.splice(i, 1)[0];
    Pz.storage.save();
    return () => { Pz.data.items.splice(Math.min(i, Pz.data.items.length), 0, it); Pz.storage.save(); };
  };

  // Tick / un-tick a deadline (key = the date of that occurrence).
  I.toggleDone = (it, key) => {
    it.done = it.done || [];
    const i = it.done.indexOf(key);
    if (i >= 0) it.done.splice(i, 1); else it.done.push(key);
    Pz.storage.save();
  };

  // The item's own setting, or its category's default if it hasn't been changed by hand.
  I.effective = it => {
    const c = Pz.categories.get(it.categoryId);
    return {
      reminders: it.reminders || c.reminders,
      countdown: it.countdown || { on: c.countdownDays != null, days: c.countdownDays },
      autoTask: it.autoTask || (c.autoTask ? Object.assign({ on: true }, c.autoTask) : { on: false })
    };
  };

  // Everything on one day, in order: all-day items first, then by time.
  // Each result ("occurrence") says which item, and which minutes of THIS day it covers.
  // Step 2 will also expand repeating items here; for now each item appears once.
  I.onDay = day => {
    const out = [];
    Pz.data.items.forEach(it => {
      const cat = Pz.categories.get(it.categoryId);
      const sd = it.start.slice(0, 10);
      const o = { item: it, key: sd, type: it.type, day: day, cat: cat, color: cat.color, done: false, segStart: 0, segEnd: 1440, min: -1 };
      if (it.type === 'allday') {
        if (!(sd <= day && day <= (it.end || sd))) return;
      } else if (it.type === 'deadline') {
        if (sd !== day) return;
        o.min = o.segStart = o.segEnd = D.toMin(it.start.slice(11));
        o.startTime = it.start.slice(11, 16);
        o.done = (it.done || []).includes(o.key);
      } else {
        const ed = it.end.slice(0, 10);
        if (!(sd <= day && day <= ed)) return;
        if (ed === day && sd < day && it.end.slice(11, 16) === '00:00') return;   // ended exactly at midnight
        o.startTime = it.start.slice(11, 16); o.endTime = it.end.slice(11, 16);
        if (sd === day) o.segStart = D.toMin(o.startTime);
        if (ed === day) o.segEnd = D.toMin(o.endTime);
        o.min = o.segStart;
      }
      out.push(o);
    });
    return out.sort((a, b) => a.min - b.min || a.item.title.localeCompare(b.item.title));
  };

  // The last date anything is on (so the Agenda knows when to stop looking).
  I.lastDate = () => Pz.data.items.reduce((max, it) => { const e = (it.end || it.start).slice(0, 10); return e > max ? e : max; }, '');

  Pz.items = I;
})();
