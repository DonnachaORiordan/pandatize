// habits.js – the habit sums (no screen code): ticking, streaks, best streaks,
// the history strip, the progress bar numbers and the "% done" figures for the graph.
//
// A habit is either "every day", or "X times per week" (weeks run Monday to Sunday).
// Its history is simply the list of dates it was ticked.

(function () {
  const D = Pz.dates;
  const H = {};
  const sets = new WeakMap();        // a quick look-up of each habit's ticked dates, rebuilt when they change

  H.all = () => Pz.data.habits;
  H.get = id => Pz.data.habits.find(h => h.id === id);
  H.isWeekly = h => h.freq.type === 'weekly';
  // Habits that count on a given day: not archived, and already created by then.
  H.active = date => Pz.data.habits.filter(h => !h.archived && h.created <= date);
  H.shown = () => Pz.data.habits.filter(h => !h.archived);

  const doneSet = h => {
    let c = sets.get(h);
    if (!c || c.from !== h.done) { c = { from: h.done, set: new Set(h.done) }; sets.set(h, c); }
    return c.set;
  };
  H.isDone = (h, date) => doneSet(h).has(date);
  H.toggle = (h, date) => {
    h.done = H.isDone(h, date) ? h.done.filter(d => d !== date) : h.done.concat([date]);     // a new list each time, so the look-up refreshes
    Pz.storage.save();
  };
  // How many times it was ticked in the Monday–Sunday week containing "date".
  H.weekCount = (h, date) => {
    const s = doneSet(h), mon = D.monday(date);
    let n = 0;
    for (let i = 0; i < 7; i++) if (s.has(D.addDays(mon, i))) n++;
    return n;
  };
  const weekMet = (h, date) => H.weekCount(h, date) >= h.freq.times;

  // ---- Streaks ----
  // Daily: days in a row, counting back from today if done today, otherwise from yesterday
  // (not ticking today yet doesn't break the streak until the day is over).
  // Weekly: weeks in a row the target was met, counting back from this week if already met, otherwise last week.
  H.streak = h => {
    const today = D.today(), s = doneSet(h);
    let n = 0;
    if (H.isWeekly(h)) {
      let w = D.monday(today);
      if (!weekMet(h, w)) w = D.addDays(w, -7);
      while (weekMet(h, w)) { n++; w = D.addDays(w, -7); }
    } else {
      let d = s.has(today) ? today : D.addDays(today, -1);
      while (s.has(d)) { n++; d = D.addDays(d, -1); }
    }
    return n;
  };
  // The longest streak in the whole history.
  function longest(h) {
    const dates = h.done.slice().sort();
    let best = 0, run = 0, prev = null;
    if (H.isWeekly(h)) {
      const weeks = Array.from(new Set(dates.map(D.monday))).filter(w => weekMet(h, w));     // each week that met the target, in order
      weeks.forEach(w => { run = prev && D.diffDays(prev, w) === 7 ? run + 1 : 1; best = Math.max(best, run); prev = w; });
    } else {
      dates.forEach(d => { if (d === prev) return; run = prev && D.diffDays(prev, d) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; });
    }
    return best;
  }
  // Best streak never goes down: the larger of the remembered best and the longest in the history.
  H.best = h => Math.max(h.best || 0, longest(h));
  // Remember each best when the app opens (not on every tick, so an accidental tick that is
  // straight away un-ticked doesn't leave a best streak that never really happened).
  H.rememberBests = () => {
    let changed = false;
    Pz.data.habits.forEach(h => { const b = longest(h); if (b > (h.best || 0)) { h.best = b; changed = true; } });
    if (changed) Pz.storage.save();
  };

  // ---- History strip: the last "n" days ending today ----
  // Each square is: 'done', 'missed' (a daily habit not done on a past day), 'today' (not done yet),
  // or 'neutral' (a weekly habit's day off, or a day before the habit existed).
  H.history = (h, n) => {
    const today = D.today(), out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = D.addDays(today, -i);
      out.push(H.isDone(h, d) ? 'done' : d === today ? 'today' : H.isWeekly(h) || d < h.created ? 'neutral' : 'missed');
    }
    return out;
  };

  // ---- Progress bar: daily habits only ----
  H.dayProgress = date => {
    const daily = H.active(date).filter(h => !H.isWeekly(h));
    const done = daily.filter(h => H.isDone(h, date));
    return { total: daily.length, done: done.length, colors: done.map(h => h.color), pct: daily.length ? Math.round(done.length / daily.length * 100) : 0 };
  };

  // ---- The graph: % of all habits completed on one day ----
  // Daily habits done ÷ daily habits that existed. On Sundays only, each weekly habit is added in:
  // it counts as done if its weekly target was met. Gives null if there was nothing to do (or the day is in the future).
  H.dayPct = date => {
    if (date > D.today()) return null;
    const sunday = D.dow(date) === 7;
    let total = 0, done = 0;
    H.active(date).forEach(h => {
      if (!H.isWeekly(h)) { total++; if (H.isDone(h, date)) done++; }
      else if (sunday) { total++; if (weekMet(h, date)) done++; }
    });
    return total ? done / total * 100 : null;
  };

  // ---- Adding ----
  H.blank = () => {
    const used = H.shown().map(h => h.color);
    return { id: null, title: '', color: (Pz.config.palette.find(p => !used.includes(p.hex)) || Pz.config.palette[7]).hex, icon: 'book', freq: { type: 'daily', times: 3 } };
  };
  H.save = d => {
    const old = d.id ? H.get(d.id) : null;
    if (old) Object.assign(old, { title: d.title.trim(), color: d.color, icon: d.icon, freq: d.freq });
    else Pz.data.habits.push({ id: 'habit-' + Pz.storage.uid(), title: d.title.trim(), color: d.color, icon: d.icon, freq: d.freq, created: D.today(), archived: false, done: [], best: 0 });
    Pz.storage.save();
  };
  // The 5 example habits (DESIGN.md section 4)
  H.addExamples = () => {
    const P = {}; Pz.config.palette.forEach(p => { P[p.name] = p.hex; });
    [['Read 20 pages', P.Blue, 'book', 'daily'], ['Gym', P.Orange, 'dumbbell', 'weekly'], ['Chess practice', P.Purple, 'pawn', 'daily'],
      ['No phone in bed', P.Green, 'moon', 'daily'], ['Stretch', P.Pink, 'stretch', 'daily']]
      .forEach(x => H.save({ title: x[0], color: x[1], icon: x[2], freq: { type: x[3], times: 3 } }));
  };

  Pz.habits = H;
})();
