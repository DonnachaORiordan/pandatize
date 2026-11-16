// todos.js – day to-dos: the list each day has, carry-over of unfinished ones,
// and auto-tasks (to-dos the app creates by itself some days before an event).

(function () {
  const D = Pz.dates, ui = Pz.ui, h = ui.h;
  const T = {};
  let focusDay = null;     // after adding a to-do, keep the typing cursor in that day's "add" box

  T.forDay = day => Pz.data.todos.filter(t => t.date === day);
  T.leftCount = day => Pz.data.todos.filter(t => t.date === day && !t.done).length;
  const isAuto = t => !!(t.source && t.source.type === 'auto');

  T.add = (title, day) => {
    title = title.trim();
    if (!title) return;
    Pz.data.todos.push({ id: 'todo-' + Pz.storage.uid(), title: title, date: day, origDate: day, done: false, doneDate: null, source: null, created: new Date().toISOString() });
    Pz.storage.save();
  };
  T.toggle = t => { t.done = !t.done; t.doneDate = t.done ? D.today() : null; Pz.storage.save(); };
  T.remove = id => {
    const i = Pz.data.todos.findIndex(t => t.id === id);
    if (i < 0) return () => {};
    const t = Pz.data.todos.splice(i, 1)[0];
    Pz.storage.save();
    return () => { Pz.data.todos.splice(Math.min(i, Pz.data.todos.length), 0, t); Pz.storage.save(); };
  };

  // ---- Housekeeping: carry-over and auto-tasks. Runs at start-up, after every change and every minute. ----
  T.maintain = () => {
    const before = JSON.stringify(Pz.data.todos);
    const today = D.today(), I = Pz.items, C = Pz.categories;

    // 1. Carry over: unfinished to-dos from past days move to today (origDate remembers where they started).
    Pz.data.todos.forEach(t => { if (!t.done && !isAuto(t) && t.date < today) t.date = today; });

    // 2. Auto-tasks: work out which ones should exist right now…
    const wanted = {};
    Pz.data.items.forEach(it => {
      const at = I.effective(it).autoTask;
      if (!at.on || !at.template) return;
      I.keysBetween(it, today, D.addDays(today, at.daysBefore)).forEach(key => {          // occurrences close enough, and not passed
        if (it.type === 'deadline' && (it.done || []).includes(key)) return;              // a ticked deadline needs no auto-task
        const title = C.fillTemplate(at.template, it.title, C.get(it.categoryId)).trim();
        if (title) wanted[it.id + '|' + key] = { it: it, key: key, title: title, appear: D.addDays(key, -at.daysBefore), frequency: at.frequency };
      });
    });
    // …update the ones we have (they follow their event's title and date, and ride along to today)…
    Pz.data.todos = Pz.data.todos.filter(t => {
      if (!isAuto(t)) return true;
      const w = wanted[t.source.itemId + '|' + t.source.occ];
      if (!w) return t.done;                                    // event gone or passed: un-ticked auto-task goes too
      w.have = true;
      t.source.eventTitle = w.it.title; t.source.appear = w.appear; t.source.frequency = w.frequency;
      if (!t.done) { t.title = w.title; t.date = today; }
      return true;
    });
    // …and create the missing ones.
    Object.keys(wanted).forEach(k => {
      const w = wanted[k];
      if (w.have) return;
      Pz.data.todos.push({ id: 'todo-' + Pz.storage.uid(), title: w.title, date: today, origDate: w.appear, done: false, doneDate: null,
        source: { type: 'auto', itemId: w.it.id, occ: w.key, eventTitle: w.it.title, appear: w.appear, frequency: w.frequency }, created: new Date().toISOString() });
    });

    const changed = JSON.stringify(Pz.data.todos) !== before;
    if (changed) Pz.storage.save();
    return changed;
  };

  // ---- Screen pieces ----
  function row(t) {
    let chip = null;
    if (isAuto(t)) {
      const it = Pz.items.get(t.source.itemId);
      const color = it ? Pz.categories.get(it.categoryId).color : 'var(--check)';
      chip = h('button', { type: 'button', class: 'todo-chip', 'aria-label': 'Open ' + t.source.eventTitle, onclick: e => { e.stopPropagation(); if (it) Pz.itemSheet.open({ id: it.id, key: t.source.occ }); } },
        [Pz.icon('sparkle', 12), h('i', { style: { background: color } }), h('span', { text: t.source.eventTitle })]);
    } else if (t.origDate && t.origDate < t.date) {
      chip = h('span', { class: 'todo-chip' }, [h('span', { text: '→ Carried over from ' + D.dayName(t.origDate).slice(0, 3) })]);
    }
    const el = h('div', { class: 'todo-row' + (t.done ? ' done' : ''), role: 'button', onclick: () => {
      if (isAuto(t)) { const it = Pz.items.get(t.source.itemId); if (it) Pz.itemSheet.open({ id: it.id, key: t.source.occ }); } else openEdit(t);
    } }, [
      h('button', { type: 'button', class: 'todo-check', role: 'checkbox', 'aria-checked': String(t.done), 'aria-label': t.title,
        onclick: e => { e.stopPropagation(); T.toggle(t); Pz.app.changed(); } }, [Pz.icon('check', 14)]),
      h('div', { class: 'main' }, [h('div', { class: 'ttl', text: t.title }), chip])
    ]);
    return ui.swipeRow(el, () => {
      const undo = T.remove(t.id);
      Pz.app.changed();
      ui.toast('Deleted “' + t.title + '”', 'Undo', () => { undo(); Pz.app.changed(); });
    });
  }

  function addRow(day) {
    const input = h('input', { type: 'text', placeholder: 'Add a to-do', 'aria-label': 'Add a to-do', enterkeyhint: 'done', autocomplete: 'off' });
    const commit = stay => {
      const v = input.value; input.value = '';
      if (!v.trim()) return;
      if (stay) focusDay = day;
      T.add(v, day); Pz.app.changed();
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(true); } });
    input.addEventListener('blur', () => commit(false));
    if (focusDay === day) { focusDay = null; setTimeout(() => input.focus(), 0); }
    return h('label', { class: 'todo-add' }, [h('span', { class: 'plus' }, [Pz.icon('plus', 16)]), input]);
  }

  // All the rows for a day (to-dos, then the "add" row).
  T.rows = day => T.forDay(day).map(row).concat([addRow(day)]);

  // Rename a to-do or move it to another day.
  function openEdit(t) {
    let title = t.title, date = t.date;
    const input = h('input', { type: 'text', class: 'title-field', value: title, 'aria-label': 'To-do', enterkeyhint: 'done',
      oninput: e => { title = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } });
    const sheet = ui.sheet({ title: 'Edit to-do', body: h('div', null, [
      input,
      h('div', { class: 'group' }, [ui.row('Day', Pz.itemSheet.pill('date', date, v => { date = v; }, { label: 'Day' }).el)]),
      h('button', { type: 'button', class: 'delete-btn', text: 'Delete', onclick: () => {
        sheet.close();
        const undo = T.remove(t.id); Pz.app.changed();
        ui.toast('Deleted “' + t.title + '”', 'Undo', () => { undo(); Pz.app.changed(); });
      } })
    ]), onSave: close => {
      if (!title.trim()) { ui.toast('Give it a title first'); input.focus(); return; }
      t.title = title.trim();
      if (date !== t.date) { t.date = date; t.origDate = date; }      // moved by hand: no "carried over" tag
      Pz.storage.save(); close(); Pz.app.changed();
    } });
  }

  Pz.todos = T;
})();
