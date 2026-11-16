// search.js – the Search screen (magnifier button) and the Category filter screen
// (filter button) on the Calendar tab.

(function () {
  const D = Pz.dates, ui = Pz.ui, h = ui.h, I = Pz.items;
  const S = {};

  // ---- Shared pieces ----
  const dateBlock = date => h('div', { class: 'date-block' }, [
    h('span', { text: D.dayName(date).slice(0, 3).toUpperCase() }), h('b', { text: String(D.dayNum(date)) }), h('span', { text: D.monthName(date).slice(0, 3).toUpperCase() })
  ]);
  const timeText = o => o.type === 'allday' ? 'All day' : o.type === 'deadline' ? 'Due ' + o.startTime : o.startTime + ' – ' + o.endTime;
  const openOcc = o => Pz.itemSheet.open({ id: o.item.id, key: o.key });

  // ---- Matching, with a little typo tolerance ----
  // How many single-letter changes turn a into b (stops caring above 2).
  function distance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    let prev = []; for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  // Is the typed word close to this word (or to its beginning, while still typing)?
  function close(typed, word) {
    if (typed.length < 4) return false;
    const allowed = typed.length >= 8 ? 2 : 1;
    return [typed.length - 1, typed.length, typed.length + 1].some(n => n > 0 && distance(typed, word.slice(0, n)) <= allowed);
  }
  const wordsIn = text => { const out = [], re = /[^\s.,;:!?()\/\-]+/g; let m; while ((m = re.exec(text))) out.push({ w: m[0], at: m.index }); return out; };

  // Does the item match every typed word (in its title, location or notes)? Gives back which parts of the title to highlight.
  function match(it, typed) {
    const title = it.title.toLowerCase(), texts = [title, (it.location || '').toLowerCase(), (it.notes || '').toLowerCase()];
    const marks = [];
    for (const q of typed) {
      let ok = false;
      const at = title.indexOf(q);
      if (at >= 0) { marks.push([at, at + q.length]); ok = true; }
      else if (texts.some(t => t.indexOf(q) >= 0)) ok = true;
      else {
        const hit = wordsIn(title).find(x => close(q, x.w));
        if (hit) { marks.push([hit.at, hit.at + hit.w.length]); ok = true; }
        else ok = texts.some(t => wordsIn(t).some(x => close(q, x.w)));
      }
      if (!ok) return null;
    }
    return marks;
  }
  // The title with the matching parts highlighted in a tint of the category colour.
  function highlighted(title, marks) {
    const el = h('div', { class: 'ttl' });
    marks = marks.slice().sort((a, b) => a[0] - b[0]);
    let pos = 0;
    marks.forEach(m => {
      if (m[0] < pos) return;
      if (m[0] > pos) el.appendChild(document.createTextNode(title.slice(pos, m[0])));
      el.appendChild(h('mark', { text: title.slice(m[0], m[1]) }));
      pos = m[1];
    });
    el.appendChild(document.createTextNode(title.slice(pos)));
    return el;
  }

  // ---- Search screen ----
  S.open = () => {
    let query = '', show = 'all';
    const expanded = { upcoming: false, past: false };
    const results = h('div');
    const input = h('input', { type: 'text', placeholder: 'Search events and deadlines', 'aria-label': 'Search', autocomplete: 'off', autocapitalize: 'off', enterkeyhint: 'search',
      oninput: e => { query = e.target.value; expanded.upcoming = expanded.past = false; render(); } });
    const clear = h('button', { type: 'button', class: 'x-btn', 'aria-label': 'Clear search', onclick: () => { input.value = ''; query = ''; render(); input.focus(); } }, [Pz.icon('x', 16)]);

    function find() {
      const typed = query.toLowerCase().split(/\s+/).filter(Boolean), today = D.today();
      const up = [], past = [];
      if (!typed.length) return { up: up, past: past };
      Pz.data.items.forEach(it => {
        const marks = match(it, typed);
        if (!marks) return;
        if (!it.repeat) { const o = I.occ(it, I.startDate(it)); (o.endDate >= today ? up : past).push({ o: o, marks: marks }); return; }
        // Repeating: its next few and last few show straight away; the rest wait behind "N more".
        I.keysBetween(it, today, D.addDays(today, 365)).forEach((k, i) => up.push({ o: I.occ(it, k), marks: marks, extra: i >= 3 }));
        I.keysBefore(it, D.addDays(today, -1), 200).forEach((k, i) => past.push({ o: I.occ(it, k), marks: marks, extra: i >= 3 }));
      });
      up.sort((a, b) => (a.o.start < b.o.start ? -1 : 1));
      past.sort((a, b) => (a.o.start < b.o.start ? 1 : -1));
      return { up: up, past: past };
    }

    function group(name, key, rows, isPast) {
      if (!rows.length) return;
      let shown = expanded[key] ? rows.slice(0, 200) : rows.filter(r => !r.extra).slice(0, 8);
      const more = rows.length - shown.length;
      results.appendChild(h('div', { class: 'agenda-h res-head' }, [h('span', { text: name }),
        more > 0 && h('button', { type: 'button', class: 'link', text: more + ' more', onclick: () => { expanded[key] = true; render(); } })]));
      results.appendChild(h('div', { class: 'card', style: { padding: '2px 6px' } }, shown.map(r => {
        const o = r.o;
        return h('div', { class: 'res-row' + (isPast ? ' past' : ''), role: 'button', style: { '--c': o.color }, onclick: () => openOcc(o) }, [
          dateBlock(o.startDate), h('span', { class: 'bar', style: { background: o.color } }),
          h('div', { class: 'main' }, [highlighted(o.item.title, r.marks), h('div', { class: 'sub', text: timeText(o) + (o.item.location ? ' · ' + o.item.location : '') })])
        ]);
      })));
    }

    function render() {
      clear.style.visibility = query ? 'visible' : 'hidden';
      results.innerHTML = '';
      const found = find();
      if (!query.trim()) { results.appendChild(h('p', { class: 'lead', style: { textAlign: 'center', marginTop: '40px' }, text: 'Search titles, locations and notes, past and future.' })); return; }
      if (show !== 'past') group('Upcoming', 'upcoming', found.up, false);
      if (show !== 'upcoming') group('Past', 'past', found.past, true);
      if (!results.children.length) results.appendChild(h('div', { class: 'card empty-card' }, [h('b', { text: 'Nothing found' }), 'Try a different word.']));
    }

    const stop = Pz.app.listen(render);       // redraw if an item is edited while Search is open
    Pz.nav.push(h('div', { class: 'screen-scroll' }, [
      h('div', { class: 'search-top' }, [
        h('label', { class: 'search-field' }, [Pz.icon('search', 18), input, clear]),
        h('button', { type: 'button', class: 'link', text: 'Cancel', onclick: Pz.nav.pop })
      ]),
      ui.segmented([{ value: 'all', label: 'All' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }], show, v => { show = v; render(); }),
      results
    ]), stop);
    render();
    setTimeout(() => input.focus(), 350);
  };

  // ---- Category filter screen ----
  S.openFilter = () => {
    let picked = [];        // the ids of the selected categories (several can be on at once)
    const head = h('div'), chips = h('div', { class: 'chips-row' }), list = h('div');

    function render() {
      const cats = Pz.categories.all().filter(c => picked.includes(c.id));
      const cat = cats.length === 1 ? cats[0] : null;
      const today = D.today(), rows = [];
      Pz.data.items.forEach(it => {
        if (!cats.some(c => c.id === it.categoryId)) return;
        let key = it.repeat ? I.next(it, today) : I.startDate(it);       // repeating: its next occurrence
        while (key && it.repeat && (it.done || []).includes(key)) key = I.next(it, D.addDays(key, 1));
        if (!key) return;
        const o = I.occ(it, key);
        if (o.endDate >= today && !o.done) rows.push(o);
      });
      rows.sort((a, b) => (a.start < b.start ? -1 : 1));

      head.innerHTML = '';
      head.appendChild(h('h1', { class: 'big-title', style: { fontSize: '32px' }, text: cat ? cat.name : cats.length ? cats.length + ' categories' : 'Filter' }));
      head.appendChild(h('p', { class: 'lead', text: cats.length ? rows.length + ' upcoming · soonest first' : 'Pick one or more categories to see everything coming up in them.' }));

      chips.innerHTML = '';
      Pz.categories.all().forEach(c => {
        const on = picked.includes(c.id);
        chips.appendChild(h('button', { type: 'button', class: 'cat-chip' + (on ? ' on' : ''), 'aria-pressed': String(on),
          onclick: () => { picked = on ? picked.filter(id => id !== c.id) : picked.concat([c.id]); render(); } }, [      // tap to add, tap again to remove
          h('span', { class: 'sq sm', style: { background: c.color, color: Pz.glyphOn(c.color) } }, on ? [Pz.icon('check', 13)] : null), h('span', { text: c.name })
        ]));
      });

      list.innerHTML = '';
      rows.forEach(o => {
        const cd = I.countdown(o.startDate) || I.countdown(D.today());
        list.appendChild(h('div', { class: 'card filter-card', role: 'button', onclick: () => openOcc(o) }, [
          dateBlock(o.startDate),
          cats.length > 1 && h('span', { class: 'bar', style: { background: o.color } }),      // shows which category each card is from
          h('div', { class: 'main' }, [
            h('div', { class: 'ttl', text: o.item.title }),
            h('div', { class: 'sub' }, [Pz.icon(o.type === 'deadline' ? 'flag' : 'clock', 13),
              h('span', { text: D.short(o.startDate) + (o.type === 'allday' ? '' : ' · ' + o.startTime) + (o.repeating ? ' · ' + I.repeatLabel(o.item.repeat) : '') })])
          ]),
          h('span', { class: 'cd-chip ' + cd.level, text: cd.text })
        ]));
      });
      if (cats.length && !rows.length) list.appendChild(h('div', { class: 'card empty-card' }, [h('b', { text: 'Nothing coming up' }), 'No upcoming items in ' + (cat ? cat.name : 'these categories') + '.']));
    }

    const stop = Pz.app.listen(render);
    Pz.nav.push(h('div', { class: 'screen-scroll' }, [
      h('div', { class: 'screen-top' }, [ui.backLink('Calendar', Pz.nav.pop), h('button', { type: 'button', class: 'link', text: 'Clear', onclick: Pz.nav.pop })]),
      head, chips, list
    ]), stop);
    render();
  };

  Pz.search = S;
})();
