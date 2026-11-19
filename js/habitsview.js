// habitsview.js – everything you SEE for habits: the Habits tab (progress bar, week
// strip, habit cards), the add/edit habit sheet, the compact tiles used on Today,
// and Settings › Archived habits. (The sums are in habits.js.)

(function () {
  const D = Pz.dates, ui = Pz.ui, h = ui.h, H = Pz.habits;
  const V = {};
  const ICONS = ['book', 'dumbbell', 'pawn', 'moon', 'stretch', 'drop', 'pen', 'music', 'leaf', 'heart', 'coffee', 'code',
    'piano', 'guitar', 'shower', 'language', 'wakeup', 'wsj', 'brain', 'cooking', 'phone', 'apple'];
  const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  let page = null, body = null, sel = null;         // sel = the day being ticked for (today unless another is picked)

  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const iconSq = (hb, size) => h('span', { class: 'habit-ic', style: { background: hb.color, color: Pz.glyphOn(hb.color), width: size + 'px', height: size + 'px' } }, [Pz.icon(hb.icon, Math.round(size * 0.55))]);
  const flame = () => h('span', { class: 'flame' }, [Pz.icon('flame', 14)]);
  // Bigger hit area: a tap anywhere on the right third of a habit card (or Today tile) ticks it
  const zone = card => ui.tapZone(card, 'right', () => card.querySelector('.habit-tick'));

  // The tick box: an outline in the habit's colour, filled with a check when done.
  // (The data-… labels let the animations find it again after the screen is redrawn.)
  const tickBox = (hb, date, size) => {
    const done = H.isDone(hb, date);
    return h('button', { type: 'button', class: 'habit-tick' + (done ? ' on' : ''), role: 'checkbox', 'aria-checked': String(done), 'aria-label': hb.title,
      'data-habit': hb.id, 'data-date': date,
      style: { width: size + 'px', height: size + 'px', borderColor: hb.color, background: done ? hb.color : 'transparent', color: done ? Pz.glyphOn(hb.color) : 'transparent' },
      onclick: e => { e.stopPropagation(); Pz.celebrate.tickHabit(hb, date); } }, [Pz.icon('check', Math.round(size * 0.56))]);
  };
  const strip = (hb, n) => {
    const today = D.today();
    return h('div', { class: 'h-strip' }, H.history(hb, n).map((state, i) => h('i', { class: state, 'data-day': D.addDays(today, i - n + 1) })));
  };

  // The streak words: "5 day streak" / "No streak yet" / "4 weeks in a row" on a card; "5 days" on a Today tile.
  V.streakWords = (hb, s, kind) => {
    if (kind === 'tile') return s ? plural(s, 'day', 'days') : 'No streak yet';
    return !s ? 'No streak yet' : H.isWeekly(hb) ? plural(s, 'week', 'weeks') + ' in a row' : s + ' day streak';
  };
  // "5 day streak · Best 12". The first part is its own piece so it can roll like a counter.
  function streakText(hb, live) {
    return [h('span', { 'data-streak': live ? hb.id : null, 'data-kind': 'card', text: V.streakWords(hb, H.streak(hb), 'card') }), ' · Best ' + H.best(hb)];
  }
  // "2 of 3 this week" with small pips
  function weekLine(hb, date) {
    const n = Math.min(H.weekCount(hb, date), hb.freq.times);
    const pips = []; for (let i = 0; i < hb.freq.times; i++) pips.push(h('i', { class: i < n ? 'on' : '' }));
    return h('div', { class: 'h-sub' }, [h('span', { class: 'pips' }, pips), h('span', { text: n + ' of ' + hb.freq.times + ' this week' })]);
  }

  // ---- The progress bar (Today and Habits): daily habits only ----
  V.progressBar = (date, label) => {
    const p = H.dayProgress(date);
    if (!p.total) return null;
    const fill = p.done ? p.doneHabits.map(x => h('i', { 'data-habit': x.id, style: { background: x.color, width: 'calc(' + (100 / p.total) + '% - 2px)' } }))      // one segment per done habit, 2px gaps
      : [h('i', { class: 'sliver' })];                                                                                              // nothing done yet: a small 3% sliver
    return h('div', { class: 'progress', 'data-date': date, role: 'progressbar', 'aria-valuenow': String(p.pct), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': 'Daily habits' }, [
      h('div', { class: 'progress-top' }, [h('span', { text: label }), h('span', { text: p.done + ' of ' + p.total + ' · ' + p.pct + '%' })]),
      h('div', { class: 'progress-track' }, fill)
    ]);
  };

  // ---- Empty state (no habits yet) ----
  V.emptyState = () => h('div', { class: 'card empty-card' }, [
    h('b', { text: 'No habits yet' }), 'Add your first habit, or start with a few examples you can change later.',
    h('div', { class: 'btn-row' }, [
      h('button', { type: 'button', onclick: () => openSheet(null) }, [Pz.icon('plus', 16), h('span', { text: 'Add a habit' })]),
      h('button', { type: 'button', onclick: () => { H.addExamples(); Pz.app.changed(); } }, [h('span', { text: 'Start with example habits' })])
    ])
  ]);

  // ---- Compact tiles for the Today screen (always tick for today) ----
  V.tiles = () => {
    const today = D.today();
    const tiles = H.shown().map(hb => {
      const done = H.isDone(hb, today);
      return zone(h('div', { class: 'habit-tile card' + (done ? ' done' : ''), 'data-habit-card': hb.id, style: { '--hc': hb.color }, role: 'button', onclick: () => Pz.nav.go('habits') }, [
        h('div', { class: 'ht-top' }, [iconSq(hb, 34), tickBox(hb, today, 30)]),
        h('div', { class: 'ht-title', text: hb.title }),
        H.isWeekly(hb) ? h('div', { class: 'h-sub', text: Math.min(H.weekCount(hb, today), hb.freq.times) + ' of ' + hb.freq.times + ' this week' })
          : h('div', { class: 'h-sub' }, [flame(), h('span', { 'data-streak': hb.id, 'data-kind': 'tile', text: V.streakWords(hb, H.streak(hb), 'tile') })]),
        strip(hb, 7)
      ]));
    });
    tiles.push(h('button', { type: 'button', class: 'habit-tile all', onclick: () => Pz.nav.go('habits') }, [h('span', { text: 'All habits →' })]));
    return h('div', { class: 'tile-grid' }, tiles);
  };

  // ---- The Habits tab ----
  function render() {
    const today = D.today();
    if (!sel) sel = today;
    body.innerHTML = '';
    const habits = H.shown();
    if (!habits.length) { body.appendChild(V.emptyState()); return; }

    const bar = V.progressBar(sel, 'Daily habits · ' + D.short(sel));
    if (bar) body.appendChild(bar);

    // Week strip: pick the day to tick for. Arrows (or a sideways swipe) change week.
    const mon = D.monday(sel);
    const days = h('div', { class: 'hw-days' }, LETTERS.map((l, i) => {
      const day = D.addDays(mon, i), p = H.dayProgress(day);
      return h('button', { type: 'button', class: (day === sel ? 'on' : '') + (day > today ? ' future' : '') + (day === today ? ' today' : ''), 'aria-label': D.long(day), onclick: () => { sel = day; render(); } }, [
        h('small', { text: l }), h('span', { text: String(D.dayNum(day)) }),
        h('span', { class: 'mini' }, [h('i', { style: { width: (p.total ? p.done / p.total * 100 : 0) + '%' } })])
      ]);
    }));
    const moveWeek = by => { sel = D.addDays(sel, 7 * by); render(); };
    ui.hdrag(days, { accept: () => true, move: () => {}, end: dx => { if (dx < -40) moveWeek(1); else if (dx > 40) moveWeek(-1); } });
    days.setAttribute('data-noswipe', '');
    body.appendChild(h('div', { class: 'hweek' }, [
      h('button', { type: 'button', class: 'hw-arrow', 'aria-label': 'Previous week', onclick: () => moveWeek(-1) }, [Pz.icon('chevL', 18)]), days,
      h('button', { type: 'button', class: 'hw-arrow', 'aria-label': 'Next week', onclick: () => moveWeek(1) }, [Pz.icon('chevR', 18)])
    ]));
    if (sel !== today) body.appendChild(h('div', { class: 'tick-banner' }, [
      h('span', { text: 'Ticking for ' + D.dayName(sel) + ' ' + D.dayNum(sel) + ' ' + D.monthName(sel).slice(0, 3) }),
      h('button', { type: 'button', class: 'link', text: 'Back to today', onclick: () => { sel = today; render(); } })
    ]));

    // Habit cards
    const cards = h('div', { class: 'habit-cards' }, habits.map(hb => {
      const done = H.isDone(hb, sel);
      return zone(h('div', { class: 'habit-card card' + (done ? ' done' : ''), 'data-habit-card': hb.id, style: { '--hc': hb.color }, 'data-reorder': '', role: 'button', onclick: () => openSheet(hb) }, [
        h('div', { class: 'hc-top' }, [
          iconSq(hb, 40),
          h('div', { class: 'main' }, [
            h('div', { class: 'hc-title', text: hb.title }),
            H.isWeekly(hb) && weekLine(hb, sel),
            h('div', { class: 'h-sub' }, [flame(), h('span', null, streakText(hb, true))])
          ]),
          tickBox(hb, sel, 32)
        ]),
        strip(hb, 20)
      ]));
    }));
    ui.reorder(cards, (from, to) => {           // press and hold, then drag
      const moved = ui.moveIn(habits.slice(), from, to);
      let i = 0;
      Pz.data.habits = Pz.data.habits.map(x => (x.archived ? x : moved[i++]));
      Pz.storage.save(); Pz.app.changed();
    });
    body.appendChild(cards);
  }

  V.init = p => {
    page = p; sel = D.today();
    body = h('div');
    page.appendChild(h('div', { class: 'page-scroll' }, [
      h('div', { class: 'title-row', style: { marginBottom: '16px' } }, [h('h1', { class: 'big-title', text: 'Habits' }), h('div', { class: 'cal-btns' }, [
        ui.roundBtn('graph', 'Progress graph', () => Pz.progress.open(), 'big'), ui.roundBtn('plus', 'New habit', () => openSheet(null), 'big')])]),
      body
    ]));
    render();
  };
  V.refresh = () => { if (page) render(); };
  // At midnight, if the Habits tab was on "today", it follows to the new day.
  V.newDay = yesterday => { if (sel === yesterday) sel = D.today(); };

  // ---- Deleting and archiving (both offer Undo) ----
  function removeHabit(hb) {
    ui.actions({ title: 'Delete ' + hb.title + '?', message: 'Its history will go with it.', buttons: [{ label: 'Delete', value: 'yes', danger: true }] }).then(ok => {
      if (!ok) return;
      // A gentle fade first, then it's removed
      Pz.fx.fadeAway(document.querySelectorAll('[data-habit-card="' + hb.id + '"]')).then(() => {
        const at = Pz.data.habits.indexOf(hb);
        if (at < 0) return;
        Pz.data.habits.splice(at, 1); Pz.storage.save(); Pz.app.changed();
        ui.toast('Deleted “' + hb.title + '”', 'Undo', () => { Pz.data.habits.splice(Math.min(at, Pz.data.habits.length), 0, hb); Pz.storage.save(); Pz.app.changed(); });
      });
    });
  }
  function archive(hb, on) {
    hb.archived = on; Pz.storage.save(); Pz.app.changed();
    ui.toast((on ? 'Archived “' : 'Unarchived “') + hb.title + '”', 'Undo', () => { hb.archived = !on; Pz.storage.save(); Pz.app.changed(); });
  }

  // ---- Add / edit habit sheet ----
  function openSheet(hb) {
    const d = hb ? { id: hb.id, title: hb.title, description: hb.description || '', color: hb.color, icon: hb.icon, freq: { type: hb.freq.type, times: hb.freq.times } } : H.blank();
    const preview = h('div'), colours = h('div', { class: 'swatches seven' }), icons = h('div', { class: 'icon-grid' }), freqBox = h('div', { class: 'group' });
    const label = t => h('div', { class: 'section-label', text: t });
    const inPalette = () => Pz.config.palette.some(p => p.hex.toLowerCase() === d.color.toLowerCase());

    const drawPreview = () => {             // a live preview card
      preview.innerHTML = '';
      const fake = { title: d.title.trim() || 'Habit name', color: d.color, icon: d.icon, freq: d.freq, done: hb ? hb.done : [], created: hb ? hb.created : D.today(), best: hb ? hb.best : 0 };
      preview.appendChild(h('div', { class: 'habit-card card preview', style: { '--hc': d.color } }, [
        h('div', { class: 'hc-top' }, [iconSq(fake, 40), h('div', { class: 'main' }, [
          h('div', { class: 'hc-title', text: fake.title }),
          d.freq.type === 'weekly' && weekLine(fake, D.today()),
          h('div', { class: 'h-sub' }, [flame(), h('span', null, streakText(fake, false))])
        ]), h('span', { class: 'habit-tick', style: { width: '32px', height: '32px', borderColor: d.color } })]),
        strip(fake, 20)
      ]));
    };
    const draw = () => {
      colours.innerHTML = ''; icons.innerHTML = ''; freqBox.innerHTML = '';
      Pz.config.palette.forEach(p => colours.appendChild(h('button', { type: 'button', class: 'swatch' + (p.hex.toLowerCase() === d.color.toLowerCase() ? ' on' : ''), style: { background: p.hex }, 'aria-label': p.name, onclick: () => { d.color = p.hex; draw(); } })));
      // The custom colour wheel: opens the phone's own colour picker
      const picker = h('input', { type: 'color', value: d.color, 'aria-label': 'Custom colour', oninput: e => { d.color = e.target.value.toUpperCase(); drawPreview(); wheel.classList.add('on'); Array.from(colours.querySelectorAll('.swatch.on')).forEach(s => { if (s !== wheel) s.classList.remove('on'); }); },
        onchange: () => draw() });
      const wheel = h('label', { class: 'swatch wheel' + (inPalette() ? '' : ' on') }, [picker]);
      colours.appendChild(wheel);
      ICONS.forEach(name => icons.appendChild(h('button', { type: 'button', 'aria-label': name, style: name === d.icon ? { background: d.color, color: Pz.glyphOn(d.color) } : null, onclick: () => { d.icon = name; draw(); } }, [Pz.icon(name, 22)])));
      freqBox.appendChild(h('div', { class: 'row' }, [ui.segmented([{ value: 'daily', label: 'Every day' }, { value: 'weekly', label: 'Times per week' }], d.freq.type, v => { d.freq.type = v; draw(); })]));
      if (d.freq.type === 'weekly') freqBox.appendChild(ui.row('Times per week', ui.stepper(d.freq.times, 1, 7, v => { d.freq.times = v; drawPreview(); })));
      drawPreview();
    };
    draw();

    const input = h('input', { type: 'text', class: 'title-field', placeholder: 'Habit name', value: d.title, 'aria-label': 'Habit name', enterkeyhint: 'done',
      oninput: e => { d.title = e.target.value; drawPreview(); }, onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } });
    // Description: a note to yourself, right under the name (e.g. "Scales first, then the new piece")
    const desc = h('textarea', { class: 'notes-box habit-desc', placeholder: 'Description', 'aria-label': 'Description', oninput: e => { d.description = e.target.value; } });
    desc.value = d.description;
    const parts = [preview, input, desc, label('Colour'), colours, label('Icon'), icons, label('Frequency'), freqBox, h('p', { class: 'footnote', text: 'Weeks run Monday to Sunday.' })];
    if (hb) parts.push(h('div', { class: 'btn-row', style: { marginTop: '24px' } }, [
      h('button', { type: 'button', style: { background: 'var(--field)' }, text: 'Archive', onclick: () => { sheet.close(); archive(hb, true); } }),
      h('button', { type: 'button', class: 'danger', style: { background: 'var(--field)' }, text: 'Delete', onclick: () => { sheet.close(); removeHabit(hb); } })
    ]));
    const sheet = ui.sheet({ title: hb ? 'Edit habit' : 'New habit', body: h('div', null, parts), onSave: close => {
      if (!d.title.trim()) { ui.toast('Give the habit a name first'); input.focus(); return; }
      H.save(d); close(); Pz.app.changed();
    } });
    if (!hb) setTimeout(() => input.focus(), 350);
  }
  V.openSheet = openSheet;

  // ---- Settings › Archived habits ----
  V.openArchived = () => {
    const list = h('div');
    const draw = () => {
      list.innerHTML = '';
      const arch = Pz.data.habits.filter(x => x.archived);
      if (!arch.length) { list.appendChild(h('div', { class: 'card empty-card' }, [h('b', { text: 'No archived habits' }), 'Archive a habit from its edit sheet to hide it but keep its history.'])); return; }
      arch.forEach(hb => list.appendChild(h('div', { class: 'card arch-card' }, [
        h('div', { class: 'hc-top' }, [iconSq(hb, 40), h('div', { class: 'main' }, [h('div', { class: 'hc-title', text: hb.title }),
          h('div', { class: 'h-sub', text: plural(hb.done.length, 'tick', 'ticks') + ' · Best ' + H.best(hb) })])]),
        h('div', { class: 'btn-row', style: { marginTop: '12px' } }, [
          h('button', { type: 'button', text: 'Unarchive', onclick: () => archive(hb, false) }),
          h('button', { type: 'button', class: 'danger', text: 'Delete', onclick: () => removeHabit(hb) })
        ])
      ])));
    };
    const stop = Pz.app.listen(draw);
    Pz.nav.push(h('div', { class: 'screen-scroll' }, [
      h('div', { class: 'screen-top' }, [ui.backLink('Settings', Pz.nav.pop)]),
      h('h1', { class: 'big-title', text: 'Archived habits' }),
      h('p', { class: 'lead', text: 'Hidden from Today, Habits and the graph. Their history is kept.' }),
      list
    ]), stop);
    draw();
  };

  Pz.habitsView = V;
})();
