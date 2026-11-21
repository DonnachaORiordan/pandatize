// categories.js – calendar categories: looking them up, wording their defaults
// ("15 min before"), and the Settings › Categories screen where they're edited.

(function () {
  const ui = Pz.ui, h = ui.h;
  const C = {};

  C.all = () => Pz.data.categories;
  C.get = id => Pz.data.categories.find(c => c.id === id) || Pz.data.categories[0];

  // ---- Wording ----
  const UNIT_MIN = { min: 1, hour: 60, day: 1440, week: 10080, month: 43200 };
  // A custom reminder (my request, 21 Nov 2026) has unit 'exact' and its own date and time in "at",
  // e.g. { n: 0, unit: 'exact', at: '2026-11-25T14:00' }. It isn't "N before", so it counts as 0 minutes here.
  C.isExact = r => r.unit === 'exact';
  C.reminderMinutes = r => C.isExact(r) ? 0 : r.n * UNIT_MIN[r.unit];
  C.reminderKey = r => r.n + r.unit + (r.at || '');
  C.reminderLabel = r => {
    if (C.isExact(r)) return Pz.dates.short(r.at) + ' ' + r.at.slice(11, 16);
    if (r.n === 0) return r.at ? 'On the day ' + r.at : 'At the time';
    const unit = r.unit === 'min' ? 'min' : r.unit + (r.n === 1 ? '' : 's');
    return r.n + ' ' + unit + ' before' + (r.at ? ' ' + r.at : '');
  };
  // "N before" reminders first (furthest ahead first), then custom ones in date order.
  C.sortReminders = list => list.slice().sort((a, b) =>
    C.isExact(a) !== C.isExact(b) ? (C.isExact(a) ? 1 : -1)
      : C.isExact(a) ? (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)
      : C.reminderMinutes(b) - C.reminderMinutes(a));
  const R = (n, unit, at) => ({ n: n, unit: unit, at: at || null });
  C.reminderChoices = [R(0, 'min'), R(5, 'min'), R(15, 'min'), R(30, 'min'), R(1, 'hour'), R(2, 'hour'), R(3, 'hour'),
    R(1, 'day'), R(2, 'day'), R(1, 'week'), R(0, 'day', '09:00'), R(1, 'day', '09:00'), R(1, 'week', '09:00')];

  // "Custom…" reminder (my request, 21 Nov 2026): pick any "N minutes / hours / days / weeks before",
  // and for days and weeks optionally a set time, e.g. "the night before at 20:00" = 1 day before 20:00.
  // Opens a small sheet; gives back the reminder, or nothing if cancelled. Works for categories and items.
  C.pickReminder = () => new Promise(resolve => {
    const r = { n: 1, unit: 'day', at: '20:00' };
    let done = false, keepAt = '20:00';
    const body = h('div');
    const preview = h('div', { class: 'footnote' });
    const showPreview = () => { preview.textContent = 'Reminds you ' + (r.n === 0 && !r.at ? 'at the time' : C.reminderLabel(r).replace(/^On the day/, 'on the day')) + '.'; };
    function render() {
      body.innerHTML = '';
      const g = h('div', { class: 'group' });
      g.appendChild(ui.row('How long before', ui.stepper(r.n, 0, 99, v => { r.n = v; showPreview(); })));
      const units = ui.segmented([{ value: 'min', label: 'min' }, { value: 'hour', label: 'hours' }, { value: 'day', label: 'days' }, { value: 'week', label: 'weeks' }],
        r.unit, v => {
          if (v === 'min' || v === 'hour') { if (r.at) keepAt = r.at; r.at = null; }       // no set time for minutes / hours…
          else if (r.unit === 'min' || r.unit === 'hour') r.at = keepAt;                   // …and it comes back for days / weeks
          r.unit = v; render();
        });
      units.style.flex = '1';                     // the switch fills the row
      g.appendChild(h('div', { class: 'row' }, [units]));
      if (r.unit === 'day' || r.unit === 'week') {
        g.appendChild(ui.row('At a set time', ui.toggle(!!r.at, on => { if (r.at) keepAt = r.at; r.at = on ? keepAt : null; render(); })));
        if (r.at) g.appendChild(ui.row('Time', ui.pill('time', r.at, v => { r.at = v; showPreview(); }, { label: 'Reminder time' }).el));
      }
      body.appendChild(g); body.appendChild(preview); showPreview();
    }
    render();
    ui.sheet({ title: 'Custom reminder', saveLabel: 'Add', body: body,
      onSave: close => { done = true; close(); resolve(Object.assign({}, r)); },
      onClose: () => { if (!done) resolve(null); } });      // Cancel gives back nothing
  });

  C.COUNT_DAYS =[1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90];
  C.APPEAR_DAYS = [1, 2, 3, 5, 7, 10, 14, 21, 30];
  C.countdownLabel = days => days + (days === 1 ? ' day before' : ' days before');
  C.appearsLabel = days => days === 30 ? '1 month before' : days === 7 ? '1 week before' : C.countdownLabel(days);
  C.FREQ = [
    { value: 'once', label: 'Once', short: 'once' },
    { value: 'daily', label: 'Daily until ticked', short: 'daily' },
    { value: '2days', label: 'Every 2 days until ticked', short: 'every 2 days' },
    { value: 'weekly', label: 'Weekly until ticked', short: 'weekly' }
  ];
  C.TYPES = [{ value: 'event', label: 'Event' }, { value: 'deadline', label: 'Deadline' }, { value: 'allday', label: 'All-day' }];
  C.REPEATS = [{ value: 'none', label: 'None' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Every 2 weeks' }, { value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }];
  const labelOf = (list, v) => (list.find(o => o.value === v) || list[0]).label;

  // {title} = the item's title. {name} = the title without the category word and any 's
  // ("Sarah's birthday" in Birthday → "Sarah").
  C.fillTemplate = (tpl, title, cat) => {
    const t = (title || '').trim();
    const esc = cat.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const name = t.replace(new RegExp(esc, 'ig'), '').replace(/['’]s\b/ig, '').replace(/\s+/g, ' ').trim() || t;
    return tpl.replace(/\{title\}/g, t).replace(/\{name\}/g, name);
  };

  // ---- Settings › Categories screen ----
  C.openScreen = () => {
    let openId = null;
    const list = h('div');
    const save = () => Pz.storage.save();

    const addNew = () => {
      const used = C.all().map(c => c.color);
      const free = Pz.config.palette.find(p => !used.includes(p.hex)) || Pz.config.palette[0];
      const c = { id: 'cat-' + Pz.storage.uid(), name: 'New category', color: free.hex, defaultType: 'event', defaultRepeat: 'none', reminders: [], countdownDays: null, autoTask: null };
      C.all().push(c); openId = c.id; save(); render();
      const card = list.lastChild;
      card.scrollIntoView({ block: 'center' });
      const input = card.querySelector('input');
      if (input) { input.focus(); input.select(); }
    };

    const typeChip = c => labelOf(C.TYPES, c.defaultType) + (c.defaultRepeat !== 'none' ? ' · ' + labelOf(C.REPEATS, c.defaultRepeat).toLowerCase() : '');
    const line = (icon, text) => h('div', { class: 'cat-line' }, [Pz.icon(icon, 15), h('span', { text: text })]);
    const taskLine = c => !c.autoTask ? 'None' :
      '“' + c.autoTask.template + '” · ' + C.appearsLabel(c.autoTask.daysBefore) + ' · ' + C.FREQ.find(f => f.value === c.autoTask.frequency).short;

    function card(c, i) {
      const open = c.id === openId;
      const toggleOpen = () => { openId = open ? null : c.id; render(); };
      const nameEl = h('div', { class: 'cat-name', text: c.name });
      const el = h('div', { class: 'card cat-card' + (open ? ' open' : ''), style: { '--c': c.color } }, [
        h('button', { type: 'button', class: 'cat-head', onclick: toggleOpen }, [
          h('span', { class: 'sq', style: { background: c.color } }), nameEl,
          h('span', { class: 'chip', text: typeChip(c) }), Pz.icon(open ? 'down' : 'chevR', 18)
        ])
      ]);
      if (!open) {
        el.appendChild(h('div', { class: 'cat-lines', onclick: toggleOpen }, [
          line('bell', c.reminders.length ? C.sortReminders(c.reminders).map(C.reminderLabel).join(', ') : 'No reminders'),
          line('hourglass', c.countdownDays == null ? 'No countdown' : 'Countdown from ' + C.countdownLabel(c.countdownDays)),
          line('sparkle', taskLine(c))
        ]));
      } else el.appendChild(editor(c, i, nameEl));
      return el;
    }

    function editor(c, i, nameEl) {
      const change = fn => { fn(); save(); render(); };
      const box = h('div', { class: 'cat-edit' });
      const label = t => h('div', { class: 'section-label', text: t });

      // Name and colour
      box.appendChild(h('div', { class: 'group' }, [h('div', { class: 'row' }, [
        h('input', { type: 'text', value: c.name, placeholder: 'Category name', 'aria-label': 'Category name', enterkeyhint: 'done',
          oninput: e => { c.name = e.target.value.trim() || 'Untitled'; nameEl.textContent = c.name; save(); },
          onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } })
      ])]));
      box.appendChild(label('Colour'));
      box.appendChild(h('div', { class: 'dots' }, Pz.config.palette.map(p =>
        h('button', { type: 'button', class: 'dot' + (p.hex === c.color ? ' on' : ''), style: { background: p.hex }, 'aria-label': p.name, onclick: () => change(() => { c.color = p.hex; }) }))));

      // Type and repeat that new items start with
      box.appendChild(label('New items start as'));
      box.appendChild(h('div', { class: 'group' }, [
        ui.row('Type', ui.select(C.TYPES, c.defaultType, v => change(() => { c.defaultType = v; }))),
        ui.row('Repeat', ui.select(C.REPEATS, c.defaultRepeat, v => change(() => { c.defaultRepeat = v; })))
      ]));

      // Reminders
      box.appendChild(label('Reminders'));
      const rem = h('div', { class: 'group' });
      C.sortReminders(c.reminders).forEach(r => rem.appendChild(h('div', { class: 'row' }, [
        h('span', { class: 'row-icon' }, [Pz.icon('bell', 18)]), h('span', { class: 'row-grow', text: C.reminderLabel(r) }),
        h('button', { type: 'button', class: 'x-btn', 'aria-label': 'Remove reminder', onclick: () => change(() => { c.reminders = c.reminders.filter(x => x !== r); }) }, [Pz.icon('x', 16)])
      ])));
      rem.appendChild(h('button', { type: 'button', class: 'row link', text: '+ Add reminder', onclick: () => {
        const have = c.reminders.map(C.reminderKey);
        const add = r => { if (r && !have.includes(C.reminderKey(r))) change(() => { c.reminders.push(Object.assign({}, r)); }); };
        ui.actions({ title: 'Add a reminder', left: true, buttons: C.reminderChoices.filter(r => !have.includes(C.reminderKey(r))).map(r => ({ label: C.reminderLabel(r), value: r }))
          .concat([{ label: 'Custom…', value: 'custom' }]) })
          .then(r => { if (r === 'custom') C.pickReminder().then(add); else add(r); });
      } }));
      box.appendChild(rem);

      // Countdown
      box.appendChild(label('Countdown'));
      box.appendChild(h('div', { class: 'group' }, [
        ui.row('Starts', ui.select([{ value: 'never', label: 'Never' }].concat(C.COUNT_DAYS.map(n => ({ value: n, label: C.countdownLabel(n) }))),
          c.countdownDays == null ? 'never' : c.countdownDays, v => change(() => { c.countdownDays = v === 'never' ? null : +v; })))
      ]));

      // Auto-task
      box.appendChild(label('Auto-task'));
      const task = h('div', { class: 'group' });
      task.appendChild(ui.row('Create a to-do automatically', ui.toggle(!!c.autoTask, on => change(() => {
        c.autoTask = on ? { template: 'Prepare for {title}', daysBefore: 7, frequency: 'once' } : null;
      }))));
      if (c.autoTask) {
        const preview = h('div', { class: 'tpl-preview' });
        const showPreview = () => {
          preview.innerHTML = '';
          c.autoTask.template.split(/(\{title\}|\{name\})/).forEach(part => {
            if (part === '{title}' || part === '{name}') preview.appendChild(h('span', { class: 'tpl-pill', text: part }));
            else if (part) preview.appendChild(document.createTextNode(part));
          });
        };
        task.appendChild(h('div', { class: 'row row-sep' }, [
          h('input', { type: 'text', value: c.autoTask.template, placeholder: 'e.g. Study for {title}', 'aria-label': 'Auto-task text', enterkeyhint: 'done',
            oninput: e => { c.autoTask.template = e.target.value; showPreview(); save(); },
            onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } })
        ]));
        showPreview();
        task.appendChild(preview);
        task.appendChild(ui.row('Appears', ui.select(C.APPEAR_DAYS.map(n => ({ value: n, label: C.appearsLabel(n) })), c.autoTask.daysBefore, v => change(() => { c.autoTask.daysBefore = +v; })), 'row-sep'));
        task.appendChild(ui.row('Reminders', ui.select(C.FREQ, c.autoTask.frequency, v => change(() => { c.autoTask.frequency = v; }))));
      }
      box.appendChild(task);
      if (c.autoTask) box.appendChild(h('p', { class: 'footnote', text: '{title} is the item’s title. {name} is the title without the category word and any ’s, so “Sarah’s birthday” becomes “Sarah”.' }));

      // Reorder and delete
      const move = by => change(() => { const a = C.all(); a.splice(i, 1); a.splice(i + by, 0, c); });
      const up = h('button', { type: 'button', onclick: () => move(-1) }, [Pz.icon('up', 16), h('span', { text: 'Move up' })]);
      const down = h('button', { type: 'button', onclick: () => move(1) }, [Pz.icon('down', 16), h('span', { text: 'Move down' })]);
      up.disabled = i === 0; down.disabled = i === C.all().length - 1;
      const del = h('button', { type: 'button', class: 'danger', onclick: () => remove(c) }, [Pz.icon('trash', 16), h('span', { text: 'Delete' })]);
      del.disabled = C.all().length < 2;
      box.appendChild(h('div', { class: 'btn-row' }, [up, down, del]));
      return box;
    }

    // Deleting asks which category its items move to.
    function remove(c) {
      const mine = Pz.data.items.filter(it => it.categoryId === c.id);
      const others = C.all().filter(o => o.id !== c.id);
      const finish = toId => {
        const at = C.all().indexOf(c);
        mine.forEach(it => { it.categoryId = toId; });
        Pz.data.categories = C.all().filter(o => o.id !== c.id);
        openId = null; save(); render();
        ui.toast('Deleted “' + c.name + '”', 'Undo', () => {          // Undo: the category comes back, and so do its items
          C.all().splice(Math.min(at, C.all().length), 0, c);
          mine.forEach(it => { it.categoryId = c.id; });
          save(); render(); Pz.app.changed();
        });
      };
      if (mine.length) {
        ui.actions({ title: 'Delete “' + c.name + '”?', message: 'Choose the category its ' + mine.length + (mine.length === 1 ? ' item moves' : ' items move') + ' to.', left: true,
          buttons: others.map(o => ({ label: o.name, value: o.id, color: o.color })) }).then(id => { if (id) finish(id); });
      } else {
        ui.actions({ title: 'Delete “' + c.name + '”?', message: 'No items use this category.', buttons: [{ label: 'Delete', value: 'yes', danger: true }] })
          .then(v => { if (v) finish(others[0].id); });
      }
    }

    function render() { list.innerHTML = ''; C.all().forEach((c, i) => list.appendChild(card(c, i))); }
    render();

    Pz.nav.push(h('div', { class: 'screen-scroll' }, [
      h('div', { class: 'screen-top' }, [ui.backLink('Settings', Pz.nav.pop), ui.roundBtn('plus', 'New category', addNew)]),
      h('h1', { class: 'big-title', text: 'Categories' }),
      h('p', { class: 'lead', text: 'Defaults for every new item in a category. You can change them on any single item.' }),
      list,
      h('button', { type: 'button', class: 'dashed-btn', onclick: addNew }, [Pz.icon('plus', 18), h('span', { text: 'New category' })])
    ]), () => Pz.app.changed());
  };

  Pz.categories = C;
})();
