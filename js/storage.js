// storage.js – ALL saving and loading happens in this one file.
// The rest of the app reads and changes Pz.data, then calls Pz.storage.save().
// (If online syncing is ever added, only this file needs to change.)

(function () {
  const cfg = Pz.config;

  // A short unique label for each new thing (habit, item, to-do…)
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Reminder shape: { n: 15, unit: 'min' | 'hour' | 'day' | 'week' | 'month', at: null or '09:00' }
  //   "15 min before"            = { n: 15, unit: 'min',  at: null }
  //   "On the day 09:00"         = { n: 0,  unit: 'day',  at: '09:00' }
  //   "1 week before 09:00"      = { n: 1,  unit: 'week', at: '09:00' }
  //   Custom date & time         = { n: 0,  unit: 'exact', at: '2026-11-25T14:00' }  (dataVersion 4; items only, not category defaults)
  const r = (n, unit, at) => ({ n: n, unit: unit, at: at || null });

  // The 8 starting categories with their defaults (SPEC.md section 4)
  function startingCategories() {
    const P = {}; cfg.palette.forEach(p => { P[p.name] = p.hex; });
    const cat = (id, name, color, defaultType, defaultRepeat, reminders, countdownDays, autoTask) =>
      ({ id: id, name: name, color: color, defaultType: defaultType, defaultRepeat: defaultRepeat, reminders: reminders, countdownDays: countdownDays, autoTask: autoTask });
    const task = (template, daysBefore, frequency) => ({ template: template, daysBefore: daysBefore, frequency: frequency });
    return [
      cat('cat-lecture', 'Lecture', P.Indigo, 'event', 'none', [r(15, 'min')], null, null),
      cat('cat-assignment', 'Assignment due', P.Red, 'deadline', 'none', [r(1, 'day'), r(3, 'hour')], 14, task('Start {title}', 10, '2days')),
      cat('cat-exam', 'Exam', P.Yellow, 'event', 'none', [r(1, 'week'), r(1, 'day')], 30, task('Study for {title}', 14, 'daily')),
      cat('cat-work', 'Work', P.Teal, 'event', 'none', [r(1, 'hour')], null, null),
      cat('cat-meeting', 'Team meeting', P.Sky, 'event', 'none', [r(15, 'min')], null, task('Prepare notes for {title}', 1, 'once')),
      cat('cat-football', 'Football', P.Lime, 'event', 'none', [r(2, 'hour')], null, null),
      cat('cat-social', 'Social', P.Pink, 'event', 'none', [r(1, 'hour')], null, null),
      cat('cat-birthday', 'Birthday', P.Orange, 'allday', 'yearly', [r(0, 'day', '09:00'), r(1, 'week', '09:00')], 30, task('Get a present for {name}', 30, 'weekly'))
    ];
  }

  function startingLists() {
    const P = {}; cfg.palette.forEach(p => { P[p.name] = p.hex; });
    return [
      { id: 'list-college', name: 'College', color: P.Indigo, icon: 'book', entries: [] },
      { id: 'list-shopping', name: 'Shopping', color: P.Green, icon: 'cart', entries: [] },
      { id: 'list-ideas', name: 'Ideas', color: P.Yellow, icon: 'bulb', entries: [] },
      { id: 'list-notes', name: 'General notes', color: P.Sky, icon: 'note', entries: [] }
    ];
  }

  // The data shape for the WHOLE app (dataVersion 1). Later build steps fill these in.
  function freshData() {
    return {
      app: 'pandatize',
      dataVersion: cfg.dataVersion,

      // Habits. Each: { id, title, description (a note to yourself; dataVersion 3), color, icon, freq: { type: 'daily' | 'weekly', times: 3 },
      //   created: 'YYYY-MM-DD', archived: false, done: ['YYYY-MM-DD', …], best: 12 (longest streak remembered) }
      //   – the list order is the display order
      habits: [],
      // Celebrations already shown: milestones = { habitId: [7, 30] }, perfectDays = ['YYYY-MM-DD', …]
      habitMeta: { milestones: {}, perfectDays: [] },

      // Calendar categories – shape shown in startingCategories() above. List order = display order.
      categories: startingCategories(),

      // Calendar items. Each:
      // { id, type: 'event' | 'deadline' | 'allday', title, categoryId,
      //   start: 'YYYY-MM-DDTHH:MM' (all-day: 'YYYY-MM-DD'), end: same (deadline: null),
      //   location, notes,
      //   repeat: null or { preset, freq: 'daily'|'weekly'|'monthly'|'yearly', interval, weekdays: [1–7], until: date or null },
      //   exceptions: { 'YYYY-MM-DD': { deleted: true } or { …changed fields } }   (one repeating occurrence changed)
      //   done: ['YYYY-MM-DD', …]   (deadline occurrences ticked as done)
      //   reminders: null (= use the category default) or [ reminder, … ],
      //   countdown: null (= default) or { on, days },
      //   autoTask:  null (= default) or { on, template, daysBefore, frequency: 'once'|'daily'|'2days'|'weekly' },
      //   created, updated }
      items: [],

      // (An occurrence changed with "This one only" becomes its own item with seriesId = the series it came from,
      //  and the series gets exceptions[date] = { deleted: true }.)

      // Day to-dos. Each: { id, title, date (the day it shows on), origDate (the day it was first set for),
      //   done, doneDate, created,
      //   source: null, or for an auto-task { type: 'auto', itemId, occ (which occurrence), eventTitle, appear (date), frequency } }
      todos: [],

      // Lists. Each list: { id, name, color, icon, entries: [ … ] }. Each entry:
      // { id, kind: 'todo' | 'note', title, body, done, doneAt, due, dueTime,
      //   start (to-dos: null, or the day it starts showing on the daily to-do list every day until ticked; dataVersion 3),
      //   priority: null | 'low' | 'medium' | 'high', subtasks: [{ id, title, done }], pinned, created, updated }
      lists: startingLists(),

      // Reminders (step 2): which ones have been dismissed or already shown as a banner
      reminders: { dismissed: {}, shown: {} },

      // theme: 'auto' (follow the phone) | 'light' | 'dark'  (dataVersion 3)
      settings: { sounds: true, calendarView: 'month', lastExport: null, theme: 'auto' }
    };
  }

  // Converters: if dataVersion ever goes up, add a function here that turns the
  // old format into the next one, e.g.  1: data => { …change…; data.dataVersion = 2; return data; }
  const converters = {
    // Version 1 → 2: for a short while lists could be pinned; that was removed again.
    // Nothing needs converting (the leftover "pinned" on a list is cleared in upgrade() below).
    1: data => { data.dataVersion = 2; return data; },
    // Version 2 → 3 (19 Nov 2026): habits get a description, list to-dos a start date, settings an Appearance choice.
    2: data => {
      (data.habits || []).forEach(x => { if (x && typeof x.description !== 'string') x.description = ''; });
      (data.lists || []).forEach(l => ((l && l.entries) || []).forEach(e => { if (e && e.start === undefined) e.start = null; }));
      if (data.settings && !data.settings.theme) data.settings.theme = 'auto';
      data.dataVersion = 3; return data;
    },
    // Version 3 → 4 (21 Nov 2026): a reminder can now be a custom date & time (unit 'exact').
    // Older data has none, so nothing needs converting.
    3: data => { data.dataVersion = 4; return data; }
  };

  function upgrade(data) {
    while (data.dataVersion < cfg.dataVersion && converters[data.dataVersion]) {
      data = converters[data.dataVersion](data);
    }
    // Safety net: make sure every section exists
    const fresh = freshData();
    Object.keys(fresh).forEach(k => { if (data[k] === undefined) data[k] = fresh[k]; });
    Object.keys(fresh.settings).forEach(k => { if (data.settings[k] === undefined) data.settings[k] = fresh.settings[k]; });
    if (!data.habitMeta.milestones) data.habitMeta.milestones = {};
    if (!Array.isArray(data.habitMeta.perfectDays)) data.habitMeta.perfectDays = [];
    if (!data.reminders.dismissed) data.reminders.dismissed = {};
    if (!data.reminders.shown) data.reminders.shown = {};
    data.lists.forEach(l => { delete l.pinned; if (!Array.isArray(l.entries)) l.entries = []; });   // lists can't be pinned (only the notes and to-dos inside them)
    return data;
  }

  // ---------- Backups (build step 5) ----------
  // A backup file is simply ALL the data written out as text (JSON), plus the moment it was made.
  const backupName = () => 'pandatize-backup-' + Pz.dates.today() + '.json';
  const exportText = () => JSON.stringify(Object.assign({}, Pz.data, { exportedAt: new Date().toISOString() }));
  const markExported = () => { Pz.data.settings.lastExport = new Date().toISOString(); save(); };

  // Read a backup file's text. Gives back { data } if it's a real Pandatize backup, or { error: 'message' }.
  const COLLECTIONS = ['habits', 'categories', 'items', 'todos', 'lists'];
  const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  function readBackup(text) {
    let d;
    try { d = JSON.parse(text); } catch (e) { return { error: 'This file isn’t a Pandatize backup, so nothing was changed.' }; }
    if (!isObj(d) || d.app !== 'pandatize' || typeof d.dataVersion !== 'number') return { error: 'This file isn’t a Pandatize backup, so nothing was changed.' };
    if (d.dataVersion > cfg.dataVersion) return { error: 'This backup was made by a newer version of Pandatize. Update the app first, then try again.' };
    const broken = { error: 'This backup looks damaged, so nothing was changed.' };
    if (d.dataVersion < 1 || (d.dataVersion < cfg.dataVersion && !converters[d.dataVersion])) return broken;
    if (COLLECTIONS.some(k => d[k] !== undefined && !Array.isArray(d[k]))) return broken;
    if (['settings', 'habitMeta', 'reminders'].some(k => d[k] !== undefined && !isObj(d[k]))) return broken;
    const exportedAt = d.exportedAt || null;
    delete d.exportedAt;
    d = upgrade(d);                                                     // old versions are converted here
    if (COLLECTIONS.some(k => d[k].some(x => !isObj(x) || typeof x.id !== 'string'))) return broken;
    return { data: d, exportedAt: exportedAt };
  }

  // "Replace everything": the backup becomes the data. Gives back an undo function.
  function replaceWith(d) {
    const old = Pz.data;
    if (old.settings.lastExport && (!d.settings.lastExport || old.settings.lastExport > d.settings.lastExport)) d.settings.lastExport = old.settings.lastExport;
    Pz.data = d; save();
    return () => { Pz.data = old; save(); };
  }

  // "Add what's missing": anything in the backup that isn't here yet is added; nothing here is
  // changed or removed (a habit that's in both gets any ticks it is missing). Gives back { added, undo }.
  function mergeIn(src) {
    const before = JSON.stringify(Pz.data), cur = Pz.data;
    let added = 0;
    const ids = arr => new Set(arr.map(x => x.id));
    ['categories', 'items', 'todos'].forEach(k => {
      const have = ids(cur[k]);
      src[k].forEach(x => { if (!have.has(x.id)) { cur[k].push(x); added++; } });
    });
    src.habits.forEach(x => {
      const mine = cur.habits.find(y => y.id === x.id);
      if (!mine) { cur.habits.push(x); added++; return; }
      const ticks = new Set(mine.done);
      (x.done || []).forEach(d => { if (!ticks.has(d)) { ticks.add(d); added++; } });
      mine.done = Array.from(ticks).sort();
      mine.best = Math.max(mine.best || 0, x.best || 0);
    });
    src.lists.forEach(l => {
      const mine = cur.lists.find(y => y.id === l.id);
      if (!mine) { cur.lists.push(l); added++; return; }
      const have = ids(mine.entries);
      l.entries.forEach(e => { if (!have.has(e.id)) { mine.entries.push(e); added++; } });
    });
    // Celebrations already shown and reminders already dismissed stay that way
    Object.keys(src.habitMeta.milestones).forEach(id => {
      cur.habitMeta.milestones[id] = Array.from(new Set((cur.habitMeta.milestones[id] || []).concat(src.habitMeta.milestones[id] || [])));
    });
    cur.habitMeta.perfectDays = Array.from(new Set(cur.habitMeta.perfectDays.concat(src.habitMeta.perfectDays))).sort();
    cur.reminders.dismissed = Object.assign({}, src.reminders.dismissed, cur.reminders.dismissed);
    save();
    return { added: added, undo: () => { Pz.data = JSON.parse(before); save(); } };
  }

  function load() {
    let data = null;
    try {
      const raw = localStorage.getItem(cfg.storageKey);
      if (raw) {
        try { data = JSON.parse(raw); }
        catch (e) { localStorage.setItem(cfg.storageKey + '-damaged', raw); }   // keep a copy, start fresh
      }
    } catch (e) { /* storage not available (e.g. private browsing): the app still runs, it just can't save */ }
    if (!data || data.app !== 'pandatize') data = freshData();
    Pz.data = upgrade(data);
    return Pz.data;
  }

  function save() {
    try { localStorage.setItem(cfg.storageKey, JSON.stringify(Pz.data)); return true; }
    catch (e) { return false; }
  }

  Pz.storage = { load: load, save: save, uid: uid, freshData: freshData, upgrade: upgrade,
    backupName: backupName, exportText: exportText, markExported: markExported, readBackup: readBackup, replaceWith: replaceWith, mergeIn: mergeIn };
})();
