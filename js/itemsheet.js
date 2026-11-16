// itemsheet.js – the add/edit sheet for a calendar item (Event / Deadline / All-day).
// It works on a "draft" (a working copy) and only saves when Save is tapped.

(function () {
  const D = Pz.dates, ui = Pz.ui, h = ui.h, C = Pz.categories, I = Pz.items;
  const clone = o => JSON.parse(JSON.stringify(o));

  // A date or time "pill": type into it ("next fri", "7:30pm"), or tap its little
  // icon to open the normal iPhone picker.
  function pill(kind, value, onChange, opts) {
    opts = opts || {};
    let val = value || '';
    const fmt = v => !v ? '' : kind === 'date' ? D.short(v) : v;
    const text = h('input', { type: 'text', class: 'pill-text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done',
      placeholder: opts.empty || '', 'aria-label': opts.label || kind });
    const native = h('input', { type: kind, class: 'pill-native', tabindex: '-1', 'aria-label': (opts.label || kind) + ' picker' });
    const pick = h('span', { class: 'pill-pick' }, [Pz.icon(kind === 'date' ? 'calendar' : 'clock', 16), native]);
    const wrap = h('span', { class: 'pill' }, [text, pick]);
    const size = () => { text.style.width = Math.max(3, (text.value || text.placeholder).length) * 0.62 + 0.4 + 'em'; };
    const show = () => { text.value = fmt(val); native.value = val; size(); };
    const commit = v => { const changed = v !== val; val = v; show(); if (changed) onChange(v); };
    text.addEventListener('focus', () => text.select());
    text.addEventListener('input', size);
    text.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); text.blur(); } });
    text.addEventListener('blur', () => {
      const raw = text.value.trim();
      if (raw === fmt(val)) return;
      if (raw === '' || /^(never|none)$/i.test(raw)) { if (opts.empty) commit(''); else show(); return; }
      const parsed = kind === 'date' ? D.parseDate(raw) : D.parseTime(raw);
      if (parsed) commit(parsed);
      else { wrap.classList.add('bad'); setTimeout(() => wrap.classList.remove('bad'), 700); show(); }   // didn't understand: flash and put it back
    });
    native.addEventListener('change', () => { if (native.value) commit(native.value); else if (opts.empty) commit(''); });
    pick.addEventListener('click', () => { try { if (native.showPicker) native.showPicker(); } catch (e) { /* the tap itself opens it on iPhone */ } });
    show();
    return { el: wrap, set: v => { val = v || ''; show(); } };
  }

  function open(opts) {
    opts = opts || {};
    const existing = opts.id ? I.get(opts.id) : null;
    if (opts.id && !existing) return;
    const d = existing ? I.toDraft(existing) : I.newDraft(opts.date, opts.time);
    let typeTouched = !!existing, repeatTouched = !!existing;
    const cat = () => C.get(d.categoryId);
    const P = {};                       // the date/time pills currently on screen
    let weekdayBtns = null, taskPreview = null;

    const label = t => h('div', { class: 'section-label', text: t });
    const defLabel = () => h('span', { class: 'def-label', text: cat().name + ' default' });

    // ---- Type switch and title ----
    const typeSeg = h('div');
    const renderType = () => {
      typeSeg.innerHTML = '';
      typeSeg.appendChild(ui.segmented(C.TYPES, d.type, v => { typeTouched = true; setType(v); }));
    };
    const titleInput = h('input', { type: 'text', class: 'title-field', placeholder: 'Title', value: d.title, 'aria-label': 'Title', enterkeyhint: 'done',
      oninput: e => { d.title = e.target.value; updateTaskPreview(); },
      onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } });

    function setType(v) {
      d.type = v;
      if (v === 'allday') { if (d.eDate < d.sDate) d.eDate = d.sDate; }
      else if (d.eDate + 'T' + d.eTime <= d.sDate + 'T' + d.sTime) {       // coming back from all-day: default length 1 hour
        const end = D.addMinutes(d.sDate + 'T' + d.sTime, 60);
        d.eDate = end.slice(0, 10); d.eTime = end.slice(11);
      }
      renderMain();
    }

    // ---- Category, times, location ----
    const main = h('div', { class: 'group' });
    function setStart(nd, nt) {
      const length = D.minutesBetween(d.sDate + 'T' + d.sTime, d.eDate + 'T' + d.eTime);
      const dayShift = D.diffDays(d.sDate, nd), oldDow = D.dow(d.sDate);
      d.sDate = nd; d.sTime = nt;
      if (d.type === 'allday') d.eDate = D.addDays(d.eDate, dayShift);
      else { const end = D.addMinutes(nd + 'T' + nt, Math.max(length, 5)); d.eDate = end.slice(0, 10); d.eTime = end.slice(11); }   // the end moves with the start
      if (P.eDate) P.eDate.set(d.eDate);
      if (P.eTime) P.eTime.set(d.eTime);
      // A weekly repeat on the old weekday follows the item to its new weekday
      if (d.repeat && d.repeat.freq === 'weekly' && d.repeat.weekdays.length === 1 && d.repeat.weekdays[0] === oldDow) {
        d.repeat.weekdays = [D.dow(nd)]; syncWeekdays();
      }
    }
    function renderMain() {
      main.innerHTML = '';
      const c = cat(), allday = d.type === 'allday';
      main.appendChild(ui.row('Category', h('button', { type: 'button', class: 'row-value', onclick: pickCategory }, [
        h('span', { class: 'sq sm', style: { background: c.color } }), h('span', { text: c.name }), Pz.icon('chevR', 16)])));
      P.sDate = pill('date', d.sDate, v => setStart(v, d.sTime), { label: 'Start date' });
      P.sTime = allday ? null : pill('time', d.sTime, v => setStart(d.sDate, v), { label: 'Start time' });
      main.appendChild(ui.row(d.type === 'deadline' ? 'Due' : 'Starts', h('span', { class: 'pills' }, [P.sDate.el, P.sTime && P.sTime.el])));
      P.eDate = P.eTime = null;
      if (d.type !== 'deadline') {
        P.eDate = pill('date', d.eDate, v => { d.eDate = v; }, { label: 'End date' });
        if (!allday) P.eTime = pill('time', d.eTime, v => {
          d.eTime = v;
          if (d.eDate === d.sDate && v <= d.sTime) { d.eDate = D.addDays(d.sDate, 1); P.eDate.set(d.eDate); }   // "ends 01:00" after a 22:00 start means the next day
        }, { label: 'End time' });
        main.appendChild(ui.row('Ends', h('span', { class: 'pills' }, [P.eDate.el, P.eTime && P.eTime.el])));
      }
      main.appendChild(h('div', { class: 'row' }, [
        h('span', { class: 'row-icon' }, [Pz.icon('pin', 18)]),
        h('input', { type: 'text', placeholder: 'Location', value: d.location, 'aria-label': 'Location', enterkeyhint: 'done',
          oninput: e => { d.location = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } })
      ]));
      if (existing && d.type === 'deadline') main.appendChild(ui.row('Done', ui.toggle(d.isDone, on => { d.isDone = on; })));
    }
    function pickCategory() {
      ui.actions({ title: 'Category', left: true, buttons: C.all().map(c => ({ label: c.name, value: c.id, color: c.color, checked: c.id === d.categoryId })) }).then(id => {
        if (!id || id === d.categoryId) return;
        d.categoryId = id;
        const c = cat();
        if (!typeTouched && d.type !== c.defaultType) { d.type = c.defaultType; if (d.type === 'allday') d.eDate = d.sDate; renderType(); }
        if (!repeatTouched) d.repeat = I.makeRepeat(c.defaultRepeat, d.sDate);
        if (d.reminders) d.reminders.forEach(r => { delete r.def; });
        renderMain(); renderRepeat(); renderReminders(); renderCountdown(); renderAutoTask();
      });
    }

    // ---- Repeat ----
    const repeatBox = h('div');
    function syncWeekdays() {
      if (weekdayBtns && d.repeat) weekdayBtns.forEach((b, i) => b.classList.toggle('on', d.repeat.weekdays.includes(i + 1)));
    }
    function renderRepeat() {
      repeatBox.innerHTML = ''; weekdayBtns = null;
      const cur = d.repeat ? d.repeat.preset : 'none';
      repeatBox.appendChild(h('div', { class: 'rep-pills' }, C.REPEATS.concat([{ value: 'custom', label: 'Custom…' }]).map(o =>
        h('button', { type: 'button', class: o.value === cur ? 'on' : '', text: o.label, onclick: () => { repeatTouched = true; d.repeat = I.makeRepeat(o.value, d.sDate, d.repeat); renderRepeat(); } }))));
      if (!d.repeat) return;
      const r = d.repeat, g = h('div', { class: 'group', style: { marginTop: '12px' } });
      if (r.preset === 'custom') {
        g.appendChild(ui.row('Every', [
          ui.stepper(r.interval, 1, 99, v => { r.interval = v; }),
          ui.segmented([{ value: 'daily', label: 'days' }, { value: 'weekly', label: 'weeks' }, { value: 'monthly', label: 'months' }], r.freq, v => {
            r.freq = v; r.weekdays = v === 'weekly' ? [D.dow(d.sDate)] : []; renderRepeat();
          })
        ]));
      }
      if (r.freq === 'weekly' && r.preset !== 'biweekly') {
        weekdayBtns = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((letter, i) => h('button', { type: 'button', text: letter, 'aria-label': D.DAYS[i], onclick: () => {
          const n = i + 1, at = r.weekdays.indexOf(n);
          if (at >= 0) { if (r.weekdays.length > 1) r.weekdays.splice(at, 1); } else { r.weekdays.push(n); r.weekdays.sort(); }
          syncWeekdays();
        } }));
        g.appendChild(h('div', { class: 'row' }, [h('div', { class: 'weekdays' }, weekdayBtns)]));
        syncWeekdays();
      }
      g.appendChild(ui.row('End date', pill('date', r.until, v => { r.until = v || null; }, { empty: 'Never', label: 'Repeat end date' }).el));
      repeatBox.appendChild(g);
    }

    // ---- Reminders ----
    const remBox = h('div', { class: 'group' });
    function renderReminders() {
      remBox.innerHTML = '';
      // null = still following the category default
      const list = C.sortReminders(d.reminders || cat().reminders.map(r => Object.assign({}, r, { def: true })));
      list.forEach(r => remBox.appendChild(h('div', { class: 'row' }, [
        h('span', { class: 'row-icon' }, [Pz.icon('bell', 18)]),
        h('span', { class: 'row-grow', text: C.reminderLabel(r) }),
        r.def && defLabel(),
        h('button', { type: 'button', class: 'x-btn', 'aria-label': 'Remove reminder', onclick: () => { d.reminders = list.filter(x => x !== r); renderReminders(); } }, [Pz.icon('x', 16)])
      ])));
      remBox.appendChild(h('button', { type: 'button', class: 'row link', text: '+ Add reminder', onclick: () => {
        const have = list.map(C.reminderKey);
        ui.actions({ title: 'Add a reminder', left: true, buttons: C.reminderChoices.filter(r => !have.includes(C.reminderKey(r))).map(r => ({ label: C.reminderLabel(r), value: r })) })
          .then(r => { if (r) { d.reminders = list.concat([Object.assign({}, r)]); renderReminders(); } });
      } }));
    }

    // ---- Countdown ----
    const countBox = h('div');
    function renderCountdown() {
      countBox.innerHTML = '';
      const c = cat(), isDef = !d.countdown;
      const eff = d.countdown || { on: c.countdownDays != null, days: c.countdownDays || 14 };
      const g = h('div', { class: 'group' });
      g.appendChild(ui.row('Show countdown', [isDef && eff.on && defLabel(), ui.toggle(eff.on, on => { d.countdown = { on: on, days: eff.days }; renderCountdown(); })]));
      if (eff.on) g.appendChild(ui.row('Starts', [isDef && defLabel(),
        ui.select(C.COUNT_DAYS.map(n => ({ value: n, label: C.countdownLabel(n) })), eff.days, v => { d.countdown = { on: true, days: +v }; renderCountdown(); })]));
      countBox.appendChild(g);
      countBox.appendChild(h('p', { class: 'footnote', text: 'Shows on Today as “' + (d.title.trim() || 'Statistics exam') + ' · ' + eff.days + ' days”. Turns orange at 3 days, red at 1 day.' }));
    }

    // ---- Auto-task ----
    const taskBox = h('div');
    function updateTaskPreview() {
      if (!taskPreview) return;
      const eff = d.autoTask || cat().autoTask;
      taskPreview.textContent = eff ? '→ ' + C.fillTemplate(eff.template, d.title.trim() || 'Title', cat()) : '';
    }
    function renderAutoTask() {
      taskBox.innerHTML = ''; taskPreview = null;
      const c = cat();
      const eff = d.autoTask || (c.autoTask ? Object.assign({ on: true }, c.autoTask) : { on: false, template: 'Prepare for {title}', daysBefore: 7, frequency: 'once' });
      const own = () => { if (!d.autoTask) d.autoTask = clone(eff); return d.autoTask; };   // first change makes it this item's own
      const note = h('p', { class: 'footnote' });
      const showNote = () => { note.textContent = !eff.on && !d.autoTask ? 'Creates a to-do automatically some days before.' : d.autoTask ? 'Changed for this item only.' : 'From the ' + c.name + ' default. Changes here only affect this item.'; };
      const g = h('div', { class: 'group' });
      g.appendChild(ui.row('Auto-task', ui.toggle(eff.on, on => { own().on = on; renderAutoTask(); })));
      if (eff.on) {
        g.appendChild(h('div', { class: 'row' }, [
          h('span', { class: 'row-icon' }, [Pz.icon('sparkle', 18)]),
          h('input', { type: 'text', value: eff.template, placeholder: 'e.g. Study for {title}', 'aria-label': 'Auto-task text', enterkeyhint: 'done',
            oninput: e => { own().template = e.target.value; updateTaskPreview(); showNote(); }, onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } })
        ]));
        taskPreview = h('div', { class: 'tpl-preview' });
        g.appendChild(taskPreview);
        g.appendChild(ui.row('Appears', ui.select(C.APPEAR_DAYS.map(n => ({ value: n, label: C.appearsLabel(n) })), eff.daysBefore, v => { own().daysBefore = +v; renderAutoTask(); }), 'row-sep'));
        g.appendChild(ui.row('Reminders', ui.select(C.FREQ, eff.frequency, v => { own().frequency = v; renderAutoTask(); })));
      }
      taskBox.appendChild(g); taskBox.appendChild(note);
      showNote(); updateTaskPreview();
    }

    // ---- Notes, delete, save ----
    const notes = h('textarea', { class: 'notes-box', placeholder: 'Notes', 'aria-label': 'Notes', oninput: e => { d.notes = e.target.value; } });
    notes.value = d.notes;

    const body = h('div', null, [typeSeg, titleInput, main, label('Repeat'), repeatBox, label('Reminders'), remBox, label('Countdown'), countBox, label('Auto-task'), taskBox, label('Notes'), notes]);
    if (existing) body.appendChild(h('button', { type: 'button', class: 'delete-btn', text: 'Delete', onclick: () => {
      ui.actions({ title: 'Delete “' + existing.title + '”?', buttons: [{ label: 'Delete', value: 'yes', danger: true }] }).then(v => {
        if (!v) return;
        sheet.close();
        Pz.calendar.deleteItem(existing.id);
      });
    } }));

    function save(close) {
      if (!d.title.trim()) { ui.toast('Give it a title first'); titleInput.focus(); return; }
      if (d.type === 'event' && d.eDate + 'T' + d.eTime <= d.sDate + 'T' + d.sTime) { ui.toast('The end needs to be after the start'); return; }
      if (d.type === 'allday' && d.eDate < d.sDate) { ui.toast('The end date is before the start date'); return; }
      if (d.repeat && d.repeat.until && d.repeat.until < d.sDate) { ui.toast('The repeat ends before the item starts'); return; }
      I.saveDraft(d);
      close();
      Pz.app.changed();
    }

    renderType(); renderMain(); renderRepeat(); renderReminders(); renderCountdown(); renderAutoTask();
    const sheet = ui.sheet({ title: existing ? 'Edit item' : 'New item', onSave: save, body: body });
  }

  Pz.itemSheet = { open: open };
})();
