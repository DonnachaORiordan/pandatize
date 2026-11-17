// lists.js – the Lists tab: the screen showing all lists, the inside of one list
// (notes and to-dos mixed), and the sheets for editing a list or one of its items.
//
// A list holds "entries". An entry is either a to-do (checkbox, due date, priority,
// subtasks, notes) or a note (title and body text).

(function () {
  const D = Pz.dates, ui = Pz.ui, h = ui.h;
  const L = {};
  const ICONS = ['book', 'cart', 'bulb', 'note', 'star', 'home', 'heart', 'briefcase', 'gift', 'plane', 'music', 'check'];
  const PRIORITY = { low: '#FFD60A', medium: '#FF9F0A', high: '#FF453A' };
  const stamp = () => new Date().toISOString();
  const clone = o => JSON.parse(JSON.stringify(o));
  let page = null, body = null, openId = null, query = '';

  // ---- Data helpers ----
  L.all = () => Pz.data.lists;
  L.get = id => Pz.data.lists.find(l => l.id === id);
  L.find = entryId => {
    for (const list of Pz.data.lists) { const entry = list.entries.find(e => e.id === entryId); if (entry) return { list: list, entry: entry }; }
    return null;
  };
  // Tick / un-tick a list to-do (the day lists call this too, so both places always agree).
  L.toggle = e => { e.done = !e.done; e.doneAt = e.done ? D.nowDT() : null; e.updated = stamp(); Pz.storage.save(); };
  L.removeEntry = (list, e) => {
    const i = list.entries.indexOf(e);
    if (i < 0) return () => {};
    list.entries.splice(i, 1); Pz.storage.save();
    return () => { list.entries.splice(Math.min(i, list.entries.length), 0, e); Pz.storage.save(); };
  };
  const isDone = e => e.kind === 'todo' && e.done;
  const matches = (e, q) => [e.title, e.body || ''].concat((e.subtasks || []).map(s => s.title)).some(t => t.toLowerCase().indexOf(q) >= 0);
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const dueText = e => D.short(e.due) + (e.dueTime ? ' · ' + e.dueTime : '');

  function deleteEntry(list, e) {
    // A gentle fade first (a row that was swiped away has already faded), then it's removed
    const els = Array.from(document.querySelectorAll('[data-entry="' + e.id + '"]')).map(x => x.closest('.swipe-row') || x);
    Pz.fx.fadeAway(els).then(() => {
      const undo = L.removeEntry(list, e);
      Pz.app.changed();
      ui.toast('Deleted “' + (e.title || 'Note') + '”', 'Undo', () => { undo(); Pz.app.changed(); });
    });
  }

  // The quick pin button: hollow when not pinned, filled when pinned. One tap flips it.
  const pinBtn = (thing, name) => h('button', { type: 'button', class: 'pin-btn' + (thing.pinned ? ' on' : ''), 'aria-pressed': String(!!thing.pinned),
    'aria-label': (thing.pinned ? 'Unpin ' : 'Pin ') + name,
    onclick: ev => { ev.stopPropagation(); thing.pinned = !thing.pinned; Pz.storage.save(); Pz.app.changed(); } }, [Pz.icon(thing.pinned ? 'tackFill' : 'tack', 18)]);

  const searchField = (placeholder, onType) => h('label', { class: 'search-field', style: { marginBottom: '16px' } }, [
    Pz.icon('search', 18),
    h('input', { type: 'text', placeholder: placeholder, 'aria-label': placeholder, autocomplete: 'off', autocapitalize: 'off', enterkeyhint: 'search',
      oninput: e => { query = e.target.value.trim().toLowerCase(); onType(); } })
  ]);

  // A small row for one entry (used by "Recently edited" and "Search all lists").
  const smallRow = (list, e) => h('div', { class: 'res-row', role: 'button', onclick: () => { openId = list.id; show(); openEntry(list, e); } }, [
    h('span', { class: 'sq', style: { background: list.color, color: Pz.glyphOn(list.color) } }, [Pz.icon(e.kind === 'note' ? 'note' : 'habits', 16)]),
    h('div', { class: 'main' }, [h('div', { class: 'ttl', text: e.title || 'Note' }), h('div', { class: 'sub', text: list.name + ' · edited ' + ui.ago(e.updated) })])
  ]);

  // ---------- All lists ----------
  function overview() {
    body = h('div');
    page.appendChild(h('div', { class: 'page-scroll' }, [
      h('div', { class: 'title-row', style: { marginBottom: '14px' } }, [h('h1', { class: 'big-title', text: 'Lists' }), ui.roundBtn('plus', 'New list', () => editList(null), 'big')]),
      searchField('Search all lists', renderOverview),
      body
    ]));
    renderOverview();
  }

  function renderOverview() {
    body.innerHTML = '';
    if (query) {         // searching: show matching entries from every list
      const rows = [];
      L.all().forEach(l => l.entries.forEach(e => { if (matches(e, query)) rows.push(smallRow(l, e)); }));
      body.appendChild(rows.length ? h('div', { class: 'card', style: { padding: '2px 6px' } }, rows)
        : h('div', { class: 'card empty-card' }, [h('b', { text: 'Nothing found' }), 'Try a different word.']));
      return;
    }
    const today = D.today(), sunday = D.addDays(D.monday(today), 6);
    const cards = h('div');
    L.all().forEach(l => {
      const todos = l.entries.filter(e => e.kind === 'todo' && !e.done), notes = l.entries.filter(e => e.kind === 'note');
      const due = todos.filter(e => e.due && e.due <= sunday).length;
      cards.appendChild(h('div', { class: 'card list-card', 'data-reorder': '', role: 'button', onclick: () => { openId = l.id; show(); } }, [
        h('span', { class: 'sq list-sq', style: { background: l.color, color: Pz.glyphOn(l.color) } }, [Pz.icon(l.icon, 24)]),
        h('div', { class: 'main' }, [
          h('div', { class: 'name', text: l.name }),
          h('div', { class: 'sub', text: plural(todos.length, 'to-do', 'to-dos') + ' · ' + plural(notes.length, 'note', 'notes') }),
          due > 0 && h('div', { class: 'due', text: due + ' due this week' })
        ]),
        h('span', { class: 'row-icon' }, [Pz.icon('chevR', 18)])
      ]));
    });
    ui.reorder(cards, (from, to) => { ui.moveIn(Pz.data.lists, from, to); Pz.storage.save(); Pz.app.changed(); });      // press and hold to reorder
    body.appendChild(cards);
    body.appendChild(h('button', { type: 'button', class: 'dashed-btn', style: { marginTop: '0' }, onclick: () => editList(null) }, [Pz.icon('plus', 18), h('span', { text: 'New list' })]));

    const recent = [];
    L.all().forEach(l => l.entries.forEach(e => recent.push({ l: l, e: e })));
    recent.sort((a, b) => (a.e.updated < b.e.updated ? 1 : -1));
    if (recent.length) {
      body.appendChild(h('div', { class: 'sec-head', style: { marginTop: '24px' } }, [h('h2', { text: 'Recently edited' })]));
      body.appendChild(h('div', { class: 'card', style: { padding: '2px 6px' } }, recent.slice(0, 3).map(x => smallRow(x.l, x.e))));
    }
  }

  // New list / edit list sheet: name, colour and icon.
  function editList(list) {
    const used = L.all().map(l => l.color);
    const d = list ? { name: list.name, color: list.color, icon: list.icon }
      : { name: '', color: (Pz.config.palette.find(p => !used.includes(p.hex)) || Pz.config.palette[0]).hex, icon: 'note' };
    const colours = h('div', { class: 'swatches' }), icons = h('div', { class: 'icon-grid' });
    const draw = () => {
      colours.innerHTML = ''; icons.innerHTML = '';
      Pz.config.palette.forEach(p => colours.appendChild(h('button', { type: 'button', class: 'swatch' + (p.hex === d.color ? ' on' : ''), style: { background: p.hex }, 'aria-label': p.name, onclick: () => { d.color = p.hex; draw(); } })));
      ICONS.forEach(name => icons.appendChild(h('button', { type: 'button', class: name === d.icon ? 'on' : '', 'aria-label': name, style: name === d.icon ? { background: d.color, color: Pz.glyphOn(d.color) } : null,
        onclick: () => { d.icon = name; draw(); } }, [Pz.icon(name, 22)])));
    };
    draw();
    const input = h('input', { type: 'text', class: 'title-field', placeholder: 'List name', value: d.name, 'aria-label': 'List name', enterkeyhint: 'done',
      oninput: e => { d.name = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } });
    ui.sheet({ title: list ? 'Edit list' : 'New list', body: h('div', null, [
      input, h('div', { class: 'section-label', text: 'Colour' }), colours, h('div', { class: 'section-label', text: 'Icon' }), icons
    ]), onSave: close => {
      if (!d.name.trim()) { ui.toast('Give the list a name first'); input.focus(); return; }
      if (list) Object.assign(list, { name: d.name.trim(), color: d.color, icon: d.icon });
      else L.all().push({ id: 'list-' + Pz.storage.uid(), name: d.name.trim(), color: d.color, icon: d.icon, entries: [] });
      Pz.storage.save(); close(); show(); Pz.app.changed();
    } });
    if (!list) setTimeout(() => input.focus(), 350);
  }

  // ---------- Inside one list ----------
  function detail() {
    const l = L.get(openId);
    body = h('div');
    page.appendChild(h('div', { class: 'page-scroll list-detail' }, [
      h('div', { class: 'screen-top' }, [ui.backLink('Lists', () => { openId = null; show(); }), ui.roundBtn('dots', 'List options', () => listMenu(l))]),
      h('div', { class: 'list-title' }, [h('span', { class: 'sq list-sq', style: { background: l.color, color: Pz.glyphOn(l.color) } }, [Pz.icon(l.icon, 24)]), h('h1', { text: l.name })]),
      searchField('Search ' + l.name, renderDetail),
      body
    ]));
    // The two buttons bottom right, above the tab bar
    page.appendChild(h('div', { class: 'fab-row' }, [
      h('button', { type: 'button', class: 'fab', onclick: () => openEntry(l, null, 'note') }, [Pz.icon('note', 18), h('span', { text: 'Note' })]),
      h('button', { type: 'button', class: 'fab filled', onclick: () => openEntry(l, null, 'todo') }, [Pz.icon('plus', 18), h('span', { text: 'To-do' })])
    ]));
    renderDetail();
  }

  function listMenu(l) {
    ui.actions({ title: l.name, buttons: [{ label: 'Edit list', value: 'edit' }, { label: 'Delete list', value: 'delete', danger: true }] }).then(v => {
      if (v === 'edit') editList(l);
      if (v !== 'delete') return;
      const todos = l.entries.filter(e => e.kind === 'todo').length, notes = l.entries.length - todos;
      ui.actions({ title: 'Delete “' + l.name + '”?', message: 'Its ' + plural(todos, 'to-do', 'to-dos') + ' and ' + plural(notes, 'note', 'notes') + ' will go with it.',
        buttons: [{ label: 'Delete list', value: 'yes', danger: true }] }).then(ok => {
        if (!ok) return;
        const at = L.all().indexOf(l);
        Pz.data.lists = L.all().filter(x => x !== l); Pz.storage.save();
        openId = null; show(); Pz.app.changed();
        ui.toast('Deleted “' + l.name + '”', 'Undo', () => {          // Undo puts the whole list back where it was
          L.all().splice(Math.min(at, L.all().length), 0, l); Pz.storage.save();
          show(); Pz.app.changed();
        });
      });
    });
  }

  // One entry as a card.
  function entryCard(l, e) {
    const today = D.today();
    let inner;
    if (e.kind === 'todo') {
      const subs = e.subtasks || [], meta = [];
      if (e.due) meta.push(dueText(e));
      if (subs.length) meta.push(subs.filter(s => s.done).length + ' of ' + plural(subs.length, 'subtask', 'subtasks'));
      inner = [
        h('button', { type: 'button', class: 'todo-check', role: 'checkbox', 'aria-checked': String(e.done), 'aria-label': e.title,
          style: e.done ? { background: l.color, borderColor: l.color, color: Pz.glyphOn(l.color) } : null,
          onclick: ev => { ev.stopPropagation(); L.toggle(e); Pz.app.changed(); Pz.fx.todoTick('[data-entry="' + e.id + '"]', e.done); } }, [Pz.icon('check', 14)]),
        h('div', { class: 'main' }, [
          h('div', { class: 'ttl' }, [h('span', { class: 'strike', text: e.title })]),
          meta.length > 0 && h('div', { class: 'meta' + (e.due && !e.done && e.due < today ? ' overdue' : ''), text: meta.join(' · ') }),
          subs.length > 0 && h('div', { class: 'subs' }, subs.map(s => h('button', { type: 'button', class: 'sub-row' + (s.done ? ' done' : ''), 'data-sub': s.id, role: 'checkbox', 'aria-checked': String(s.done),
            onclick: ev => { ev.stopPropagation(); s.done = !s.done; e.updated = stamp(); Pz.storage.save(); Pz.app.changed(); Pz.fx.todoTick('.sub-row[data-sub="' + s.id + '"]', s.done); } },
            [h('span', { class: 'sub-check' }, [Pz.icon('check', 10)]), h('span', { class: 'strike', text: s.title })])))
        ]),
        h('div', { class: 'side' }, [
          e.priority && h('span', { style: { color: PRIORITY[e.priority] }, 'aria-label': e.priority + ' priority' }, [Pz.icon('flagFill', 16)]),
          !e.done && pinBtn(e, e.title)
        ])
      ];
    } else {
      inner = [
        h('span', { class: 'note-ic' }, [Pz.icon('note', 20)]),
        h('div', { class: 'main' }, [
          h('div', { class: 'ttl', text: e.title || 'Note' }),
          e.body && h('div', { class: 'note-body', text: e.body }),
          h('div', { class: 'meta', text: 'Note · edited ' + ui.ago(e.updated) })
        ]),
        h('div', { class: 'side' }, [pinBtn(e, e.title || 'note')])
      ];
    }
    const wrap = ui.swipeRow(h('div', { class: 'entry-card' + (isDone(e) ? ' done' : ''), 'data-entry': e.id, role: 'button', onclick: () => openEntry(l, e) }, inner), () => deleteEntry(l, e));
    wrap.classList.add('entry-wrap');
    wrap.setAttribute('data-reorder', '');
    return wrap;
  }

  function renderDetail() {
    const l = L.get(openId);
    body.innerHTML = '';
    const shown = l.entries.filter(e => !query || matches(e, query));
    const pinned = shown.filter(e => e.pinned && !isDone(e)), rest = shown.filter(e => !e.pinned && !isDone(e));
    const done = shown.filter(isDone).sort((a, b) => ((a.doneAt || '') < (b.doneAt || '') ? 1 : -1));
    const section = (title, entries, canReorder) => {
      if (!entries.length) return;
      if (title) body.appendChild(h('div', { class: 'section-label', style: { marginTop: '14px' }, text: title }));
      const box = h('div', null, entries.map(e => entryCard(l, e)));
      // Press and hold to reorder within the section (not while searching)
      if (canReorder && !query) ui.reorder(box, (from, to) => {
        const moved = ui.moveIn(entries.slice(), from, to);
        let i = 0;
        l.entries = l.entries.map(e => (entries.includes(e) ? moved[i++] : e));       // same slots, new order
        Pz.storage.save(); Pz.app.changed();
      });
      body.appendChild(box);
    };
    section(pinned.length ? 'Pinned' : '', pinned, true);
    section(pinned.length || done.length ? 'Everything else' : '', rest, true);
    section('Completed · ' + done.length, done, false);
    if (!shown.length) body.appendChild(h('div', { class: 'card empty-card' }, query ? [h('b', { text: 'Nothing found' }), 'Try a different word.']
      : [h('b', { text: 'Nothing here yet' }), 'Use the Note and To-do buttons below to add something.']));
  }

  // ---------- The sheet for one to-do or note ----------
  function openEntry(l, entry, kind) {
    const d = entry ? clone(entry) : { id: null, kind: kind, title: '', body: '', done: false, doneAt: null, due: null, dueTime: null, priority: null, subtasks: [], pinned: false };
    const todo = d.kind === 'todo';
    const label = t => h('div', { class: 'section-label', text: t });
    const titleInput = h('input', { type: 'text', class: 'title-field', placeholder: todo ? 'To-do' : 'Title', value: d.title, 'aria-label': 'Title', enterkeyhint: 'done',
      oninput: e => { d.title = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } });
    const text = h('textarea', { class: 'notes-box' + (todo ? '' : ' tall'), placeholder: todo ? 'Notes' : 'Write your note…', 'aria-label': todo ? 'Notes' : 'Note text', oninput: e => { d.body = e.target.value; } });
    text.value = d.body || '';
    const parts = [titleInput];

    if (todo) {
      const pill = Pz.itemSheet.pill;
      parts.push(h('div', { class: 'group' }, [
        ui.row('Due', h('span', { class: 'pills' }, [
          pill('date', d.due, v => { d.due = v || null; }, { empty: 'No date', label: 'Due date' }).el,
          pill('time', d.dueTime, v => { d.dueTime = v || null; }, { empty: 'Time', label: 'Due time' }).el])),
        ui.row('Priority', ui.segmented([{ value: '', label: 'None' }, { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }], d.priority || '', v => { d.priority = v || null; }))
      ]));
      // Subtasks
      const subBox = h('div', { class: 'group' });
      const drawSubs = focusLast => {
        subBox.innerHTML = '';
        d.subtasks.forEach(s => subBox.appendChild(h('div', { class: 'row' }, [
          h('button', { type: 'button', class: 'todo-check small' + (s.done ? ' on' : ''), role: 'checkbox', 'aria-checked': String(s.done), 'aria-label': 'Subtask done',
            onclick: ev => { s.done = !s.done; ev.currentTarget.classList.toggle('on', s.done); } }, [Pz.icon('check', 12)]),
          h('input', { type: 'text', value: s.title, placeholder: 'Subtask', 'aria-label': 'Subtask', enterkeyhint: 'done', oninput: e => { s.title = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } }),
          h('button', { type: 'button', class: 'x-btn', 'aria-label': 'Remove subtask', onclick: () => { d.subtasks = d.subtasks.filter(x => x !== s); drawSubs(); } }, [Pz.icon('x', 16)])
        ])));
        subBox.appendChild(h('button', { type: 'button', class: 'row link', text: '+ Add subtask', onclick: () => { d.subtasks.push({ id: 'sub-' + Pz.storage.uid(), title: '', done: false }); drawSubs(true); } }));
        if (focusLast) { const inputs = subBox.querySelectorAll('input'); inputs[inputs.length - 1].focus(); }
      };
      drawSubs();
      parts.push(label('Subtasks'), subBox, label('Notes'), text);
    } else parts.push(text);

    parts.push(h('div', { class: 'group', style: { marginTop: '16px' } }, [ui.row('Pinned to the top', ui.toggle(d.pinned, on => { d.pinned = on; }))]));
    if (entry) parts.push(h('button', { type: 'button', class: 'delete-btn', text: 'Delete', onclick: () => { sheet.close(); deleteEntry(l, entry); } }));

    const sheet = ui.sheet({ title: (entry ? 'Edit ' : 'New ') + (todo ? 'to-do' : 'note'), body: h('div', null, parts), onSave: close => {
      d.title = d.title.trim();
      if (!d.title && !todo && d.body.trim()) d.title = d.body.trim().split('\n')[0].slice(0, 60);      // a note with no title borrows its first line
      if (!d.title) { ui.toast('Give it a title first'); titleInput.focus(); return; }
      d.subtasks = d.subtasks.filter(s => s.title.trim()).map(s => Object.assign(s, { title: s.title.trim() }));
      if (!d.due) d.dueTime = null;
      d.updated = stamp();
      if (entry) Object.assign(entry, d);
      else l.entries.unshift(Object.assign(d, { id: 'entry-' + Pz.storage.uid(), created: d.updated }));        // new ones go on top
      Pz.storage.save(); close(); Pz.app.changed();
    } });
    if (!entry) setTimeout(() => titleInput.focus(), 350);
  }
  // Open the sheet for an entry from anywhere (a day's to-do list uses this).
  L.editEntry = entryId => { const x = L.find(entryId); if (x) openEntry(x.list, x.entry); };
  L.deleteEntry = entryId => { const x = L.find(entryId); if (x) deleteEntry(x.list, x.entry); };

  // ---------- Showing and refreshing ----------
  // Rebuild the whole tab (when moving between "all lists" and "inside a list").
  function show() {
    page.innerHTML = ''; query = '';
    if (openId && L.get(openId)) detail(); else { openId = null; overview(); }
  }
  // Data changed: redraw the cards, staying where we are.
  L.refresh = () => {
    if (!page) return;
    if (openId && !L.get(openId)) { show(); return; }
    if (openId) renderDetail(); else renderOverview();
  };
  L.init = p => { page = p; show(); };

  Pz.lists = L;
})();
