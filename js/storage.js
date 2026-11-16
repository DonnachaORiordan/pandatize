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

      // Habits. Each: { id, title, color, icon, freq: { type: 'daily' | 'weekly', times: 3 },
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
      //   priority: null | 'low' | 'medium' | 'high', subtasks: [{ id, title, done }], pinned, created, updated }
      lists: startingLists(),

      // Reminders (step 2): which ones have been dismissed or already shown as a banner
      reminders: { dismissed: {}, shown: {} },

      settings: { sounds: true, calendarView: 'month', lastExport: null }
    };
  }

  // Converters: if dataVersion ever goes up, add a function here that turns the
  // old format into the next one, e.g.  1: data => { …change…; data.dataVersion = 2; return data; }
  const converters = {
    // Version 1 → 2: for a short while lists could be pinned; that was removed again.
    // Nothing needs converting (the leftover "pinned" on a list is cleared in upgrade() below).
    1: data => { data.dataVersion = 2; return data; }
  };

  function upgrade(data) {
    while (data.dataVersion < cfg.dataVersion && converters[data.dataVersion]) {
      data = converters[data.dataVersion](data);
    }
    // Safety net: make sure every section exists
    const fresh = freshData();
    Object.keys(fresh).forEach(k => { if (data[k] === undefined) data[k] = fresh[k]; });
    Object.keys(fresh.settings).forEach(k => { if (data.settings[k] === undefined) data.settings[k] = fresh.settings[k]; });
    data.lists.forEach(l => { delete l.pinned; });        // lists can't be pinned (only the notes and to-dos inside them)
    return data;
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

  Pz.storage = { load: load, save: save, uid: uid, freshData: freshData, upgrade: upgrade };
})();
