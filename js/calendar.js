// calendar.js – the Calendar tab: the shared header, the Month / Week / Day /
// Agenda views, and the day panel that slides up when a day is tapped in Month.

(function () {
  const D = Pz.dates, ui = Pz.ui, h = ui.h, I = Pz.items;
  const VIEWS = [{ value: 'month', label: 'Month' }, { value: 'week', label: 'Week' }, { value: 'day', label: 'Day' }, { value: 'agenda', label: 'Agenda' }];
  const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  let headEl, viewEl, view, cursor, today, panel = null, panelDate = null, agendaDays = 90, agendaMore = false;

  const openItem = occ => Pz.itemSheet.open({ id: occ.item.id });
  const fill = color => ({ background: color, color: Pz.textOn(color) });

  function init(page) {
    view = Pz.data.settings.calendarView || 'month';
    today = cursor = D.today();
    headEl = h('div', { class: 'cal-head' });
    viewEl = h('div', { class: 'cal-view' });
    page.appendChild(headEl); page.appendChild(viewEl);
    viewEl.addEventListener('scroll', () => {            // Agenda: load more when near the bottom
      if (view === 'agenda' && agendaMore && viewEl.scrollTop + viewEl.clientHeight > viewEl.scrollHeight - 300) {
        agendaDays += 90; renderView(true);
      }
    });
    render();
  }

  function render(keepScroll) { renderHead(); renderView(keepScroll); }
  function setView(v) { view = v; Pz.data.settings.calendarView = v; Pz.storage.save(); closePanel(); render(); }
  function goDay(date) { cursor = date; setView('day'); }
  function move(dir) {
    closePanel();
    if (view === 'month') cursor = D.addMonths(cursor, dir);
    else cursor = D.addDays(cursor, dir * (view === 'week' ? 7 : 1));
    render();
  }
  // The + button adds to the day you're looking at.
  const addDate = () => view === 'day' ? cursor : panelDate || today;
  const soon = what => () => ui.toast(what + ' arrives in build step 2');

  // ---------- Header ----------
  function renderHead() {
    headEl.innerHTML = '';
    const btns = h('div', { class: 'cal-btns' }, [
      ui.roundBtn('search', 'Search', soon('Search')),
      ui.roundBtn('filter', 'Filter by category', soon('The category filter')),
      ui.roundBtn('plus', 'Add item', () => Pz.itemSheet.open({ date: addDate() }), 'filled')
    ]);
    let title, cls = '';
    if (view === 'month') { title = [D.monthName(cursor) + ' ', h('span', { class: 'yr', text: cursor.slice(0, 4) })]; if (D.monthName(cursor).length > 7) cls = ' long'; }
    else if (view === 'week') {
      const a = D.monday(cursor), b = D.addDays(a, 6);
      title = D.monthName(a).slice(0, 3) + ' ' + D.dayNum(a) + ' – ' + (a.slice(5, 7) !== b.slice(5, 7) ? D.monthName(b).slice(0, 3) + ' ' : '') + D.dayNum(b);
    } else if (view === 'day') { title = D.dayName(cursor) + ' ' + D.dayNum(cursor); cls = ' day'; }
    else title = 'Upcoming';
    const titleBtn = h('button', { type: 'button', class: 'cal-title' + cls, 'aria-label': 'Jump to today', onclick: () => { cursor = D.today(); closePanel(); render(); } }, title);
    const nav = h('div', { class: 'cal-nav' }, view === 'agenda' ? [titleBtn] : [
      ui.roundBtn('chevL', 'Previous', () => move(-1), 'small'), titleBtn, ui.roundBtn('chevR', 'Next', () => move(1), 'small')
    ]);
    if (view === 'day') {          // Day view: back link on top, then the big day title
      headEl.appendChild(h('div', { class: 'cal-top' }, [ui.backLink(D.monthName(cursor), () => setView('month')), btns]));
      headEl.appendChild(h('div', { class: 'cal-top' }, [nav]));
    } else headEl.appendChild(h('div', { class: 'cal-top' }, [nav, btns]));
    headEl.appendChild(ui.segmented(VIEWS, view, setView));
    if (view === 'day') {
      const mon = D.monday(cursor);
      headEl.appendChild(h('div', { class: 'week-strip' }, LETTERS.map((l, i) => {
        const day = D.addDays(mon, i);
        return h('button', { type: 'button', class: (day === cursor ? 'on' : '') + (day === today ? ' today' : ''), 'aria-label': D.long(day), onclick: () => { cursor = day; render(); } },
          [h('small', { text: l }), h('span', { text: String(D.dayNum(day)) })]);
      })));
    }
    if (view === 'month') headEl.appendChild(h('div', { class: 'month-letters' }, LETTERS.map(l => h('span', { text: l }))));
  }

  // ---------- Views ----------
  const scroller = () => viewEl.querySelector('.tg-scroll') || viewEl;
  function renderView(keepScroll) {
    today = D.today();
    const top = keepScroll ? scroller().scrollTop : null;
    viewEl.innerHTML = '';
    viewEl.className = 'cal-view ' + view + (panel ? ' panel-open' : '');
    if (view === 'month') renderMonth();
    else if (view === 'week') renderWeek();
    else if (view === 'day') renderDay();
    else renderAgenda();
    if (top != null) scroller().scrollTop = top;
    else if (view === 'week' || view === 'day') {
      // Start around 08:00, or around now if today is showing
      const s = scroller(), hourH = +s.firstChild.dataset.h;
      const showsToday = view === 'day' ? cursor === today : D.monday(cursor) === D.monday(today);
      s.scrollTop = showsToday ? Math.max(0, D.nowMin() / 60 * hourH - 120) : 8 * hourH - 6;
    } else viewEl.scrollTop = 0;
  }

  // Month: the "open grid" – a coloured line per item, no titles.
  function renderMonth() {
    const first = cursor.slice(0, 8) + '01', month = first.slice(0, 7);
    const card = h('div', { class: 'month-card' });
    let day = D.monday(first);
    while (day.slice(0, 7) <= month) {
      const row = h('div', { class: 'month-row' });
      for (let i = 0; i < 7; i++, day = D.addDays(day, 1)) {
        const date = day, occ = I.onDay(date);
        row.appendChild(h('button', {
          type: 'button', 'data-day': date, 'aria-label': D.long(date) + ', ' + occ.length + ' items',
          class: 'month-day' + (date.slice(0, 7) !== month ? ' out' : '') + (date === today ? ' today' : '') + (date === panelDate ? ' sel' : ''),
          onclick: () => { if (panelDate === date) closePanel(); else openPanel(date); }
        }, [
          h('span', { class: 'num', text: String(D.dayNum(date)) }),
          h('div', { class: 'lines' }, occ.slice(0, 6).map(o => h('i', { class: o.done ? 'done' : '', style: { background: o.color } })))
        ]));
      }
      card.appendChild(row);
    }
    viewEl.appendChild(card);
  }

  // One row for an item, used in the day panel and the Agenda.
  function itemRow(o, agenda) {
    const it = o.item;
    let when, sub;
    if (o.type === 'allday') { when = 'All day'; sub = 'All day'; }
    else if (o.type === 'deadline') { when = o.startTime; sub = 'Due ' + o.startTime; }
    else { when = D.fromMin(o.segStart); sub = o.startTime + ' – ' + o.endTime; }
    if (agenda) sub = it.location; else if (it.location) sub += ' · ' + it.location;
    const mark = o.type === 'deadline'
      ? h('button', { type: 'button', class: 'flag-btn', style: { background: o.color, color: Pz.glyphOn(o.color) }, 'aria-label': o.done ? 'Mark as not done' : 'Mark as done',
        onclick: e => { e.stopPropagation(); I.toggleDone(it, o.key); Pz.app.changed(); } }, [Pz.icon(o.done ? 'check' : 'flag', 16)])
      : h('span', { class: 'bar', style: { background: o.color } });
    const row = h('div', { class: 'item-row' + (o.done ? ' done' : ''), role: 'button', onclick: () => openItem(o) }, [
      agenda && h('span', { class: 'when' }, o.type === 'allday' ? [h('small', { text: 'All day' })] : when),
      mark,
      h('div', { class: 'main' }, [h('div', { class: 'ttl', text: it.title }), sub && h('div', { class: 'sub', text: sub })])
    ]);
    return ui.swipeRow(row, () => deleteItem(it.id));
  }

  function deleteItem(id) {
    const it = I.get(id);
    if (!it) return;
    const undo = I.remove(id);
    Pz.app.changed();
    ui.toast('Deleted “' + it.title + '”', 'Undo', () => { undo(); Pz.app.changed(); });
  }

  // Agenda: upcoming items grouped by date; empty days are skipped.
  function renderAgenda() {
    const box = h('div', { class: 'agenda' });
    const last = I.lastDate();
    const horizon = D.addDays(today, agendaDays);
    let groups = 0;
    agendaMore = false;
    for (let day = today; day <= last; day = D.addDays(day, 1)) {
      // Past the first stretch of days, stop once the screen is comfortably full (more loads on scroll)
      if (day > horizon && groups >= 10) { agendaMore = true; break; }
      const occ = I.onDay(day);
      if (!occ.length) continue;
      groups++;
      box.appendChild(h('div', { class: 'agenda-h', text: (day === today ? 'Today · ' : '') + D.short(day) }));
      box.appendChild(h('div', { class: 'card' }, occ.map(o => itemRow(o, true))));
    }
    if (!box.children.length) box.appendChild(h('div', { class: 'card empty-card' }, [h('b', { text: 'Nothing coming up' }), 'Tap + to add an event, deadline or all-day item.']));
    viewEl.appendChild(box);
  }

  // ---------- Time grid (shared by Week and Day) ----------
  // Events that overlap are put side by side: each gets a column within its group.
  function layout(evs) {
    evs.sort((a, b) => a.s - b.s || b.e - a.e);
    let group = [], groupEnd = -1;
    const flush = () => { const n = Math.max.apply(null, group.map(x => x.col)) + 1; group.forEach(x => { x.cols = n; }); group = []; };
    evs.forEach(ev => {
      if (group.length && ev.s >= groupEnd) { flush(); groupEnd = -1; }
      const used = group.filter(x => x.e > ev.s).map(x => x.col);
      let c = 0; while (used.includes(c)) c++;
      ev.col = c; group.push(ev); groupEnd = Math.max(groupEnd, ev.e);
    });
    if (group.length) flush();
  }

  function timeGrid(days, o) {
    const H = o.hourH, y = min => min / 60 * H;
    const hours = h('div', { class: 'tg-hours' });
    for (let hr = o.labelEvery; hr < 24; hr += o.labelEvery) hours.appendChild(h('span', { text: D.pad(hr) + ':00', style: { top: hr * H + 'px' } }));
    const cols = h('div', { class: 'tg-cols' });
    days.forEach(day => {
      const col = h('div', { class: 'tg-col' + (day === today ? ' today' : '') });
      const occ = I.onDay(day);
      const evs = occ.filter(x => x.type === 'event').map(x => ({ o: x, s: x.segStart, e: Math.max(x.segEnd, x.segStart + 30) }));   // very short events still get a tappable block
      layout(evs);
      evs.forEach(ev => {
        const x = ev.o, mins = ev.e - ev.s, short = mins < 45;
        const times = x.startTime + ' – ' + x.endTime;
        col.appendChild(h('button', {
          type: 'button', class: 'ev' + (short ? ' short' : ''), 'aria-label': x.item.title + ', ' + times,
          style: Object.assign(fill(x.color), { top: y(ev.s) + 1 + 'px', height: y(mins) - 2 + 'px', left: 'calc(' + (ev.col / ev.cols * 100) + '% + 1px)', width: 'calc(' + (100 / ev.cols) + '% - 2px)' }),
          onclick: e => { e.stopPropagation(); openItem(x); }
        }, o.compact ? [h('b', { text: x.item.title })] : [
          h('b', { text: x.item.title }),
          h('span', { text: short ? x.startTime : times + (x.item.location ? ' · ' + x.item.location : '') })
        ]));
      });
      occ.filter(x => x.type === 'deadline').forEach(x => {
        col.appendChild(h('div', { class: 'dl' + (x.done ? ' done' : ''), style: { background: x.color, top: y(x.min) - 1 + 'px' } }, [
          h('button', { type: 'button', class: 'dl-pill', style: fill(x.color), 'aria-label': 'Deadline: ' + x.item.title + ', ' + x.startTime, onclick: e => { e.stopPropagation(); openItem(x); } },
            [Pz.icon('flag', o.compact ? 8 : 11), h('span', { text: o.compact ? x.item.title : x.startTime + ' · ' + x.item.title })])
        ]));
      });
      if (day === today) col.appendChild(h('div', { class: 'now-line', style: { top: y(D.nowMin()) + 'px' } }));
      if (o.onSlot) col.addEventListener('click', e => {      // tap an empty slot: add an event there (to the half hour)
        if (e.target !== col) return;
        o.onSlot(day, D.fromMin(Math.min(1410, Math.max(0, Math.floor(e.offsetY / H * 2) * 30))));
      });
      cols.appendChild(col);
    });
    return h('div', { class: 'tg' + (o.compact ? ' compact' : ''), 'data-h': String(H), style: { height: 24 * H + 'px', '--hour': H + 'px' } }, [hours, cols]);
  }

  const adPill = o => h('button', { type: 'button', class: 'ad-pill', style: fill(o.color), text: o.item.title, onclick: () => openItem(o) });

  function renderWeek() {
    const mon = D.monday(cursor), days = LETTERS.map((l, i) => D.addDays(mon, i));
    const card = h('div', { class: 'tg-card' });
    card.appendChild(h('div', { class: 'week-head' }, days.map((day, i) =>
      h('button', { type: 'button', class: day === today ? 'today' : '', 'aria-label': 'Open ' + D.long(day), onclick: () => goDay(day) }, [h('span', { text: LETTERS[i] }), h('span', { class: 'n', text: String(D.dayNum(day)) })]))));
    const allday = days.map(day => I.onDay(day).filter(o => o.type === 'allday'));
    if (allday.some(a => a.length)) card.appendChild(h('div', { class: 'allday-row' }, [h('span', { class: 'lbl', text: 'all-day' })].concat(allday.map(a => h('div', { class: 'cell' }, a.map(adPill))))));
    card.appendChild(h('div', { class: 'tg-scroll' }, [timeGrid(days, { hourH: 44, labelEvery: 2, compact: true })]));
    viewEl.appendChild(card);
  }

  function renderDay() {
    const card = h('div', { class: 'tg-card' });
    const allday = I.onDay(cursor).filter(o => o.type === 'allday');
    if (allday.length) card.appendChild(h('div', { class: 'allday-row wide' }, [h('span', { class: 'lbl', text: 'All day' })].concat(allday.map(adPill))));
    card.appendChild(h('div', { class: 'tg-scroll' }, [timeGrid([cursor], { hourH: 50, labelEvery: 1, onSlot: (date, time) => Pz.itemSheet.open({ date: date, time: time }) })]));
    viewEl.appendChild(card);
  }

  // ---------- Day panel ----------
  function fillPanel() {
    const occ = I.onDay(panelDate);
    const count = (type, one, many) => { const n = occ.filter(o => o.type === type).length; return n ? n + ' ' + (n === 1 ? one : many) : null; };
    const summary = [count('event', 'event', 'events'), count('deadline', 'deadline', 'deadlines'), count('allday', 'all-day item', 'all-day items')].filter(Boolean).join(' · ') || 'Nothing planned';
    const list = h('div', { class: 'panel-list' }, occ.length ? occ.map(o => itemRow(o, false)) : [h('div', { class: 'panel-empty', text: 'Tap + to add something to this day.' })]);
    const grab = h('div', { class: 'panel-grab', role: 'button', 'aria-label': 'Close day panel', onclick: closePanel }, [h('div', { class: 'grabber' })]);
    let startY = null;                       // drag the grabber down to close
    grab.addEventListener('pointerdown', e => { startY = e.clientY; });
    grab.addEventListener('pointermove', e => { if (startY != null && e.clientY - startY > 30) { startY = null; closePanel(); } });
    panel.innerHTML = '';
    panel.appendChild(grab);
    panel.appendChild(h('div', { class: 'panel-head' }, [
      h('div', { style: { flex: '1', minWidth: '0' } }, [h('div', { class: 'panel-title', text: D.long(panelDate) }), h('div', { class: 'panel-sub', text: summary })]),
      h('button', { type: 'button', class: 'link', style: { minHeight: '36px' }, text: 'Open day', onclick: () => goDay(panelDate) }),
      ui.roundBtn('plus', 'Add to this day', () => Pz.itemSheet.open({ date: panelDate }), 'filled')
    ]));
    panel.appendChild(list);
  }
  function markSelected() {
    viewEl.querySelectorAll('.month-day').forEach(b => b.classList.toggle('sel', b.dataset.day === panelDate));
  }
  function openPanel(date) {
    panelDate = date;
    if (!panel) {
      panel = h('div', { class: 'day-panel' });
      document.getElementById('panels').appendChild(panel);
      requestAnimationFrame(() => requestAnimationFrame(() => { if (panel) panel.classList.add('open'); }));
    }
    fillPanel(); markSelected();
    viewEl.classList.add('panel-open');
    // If the panel would cover the tapped day, scroll the month up so the day stays visible
    const cell = viewEl.querySelector('.month-day.sel');
    if (cell) {
      const hidden = cell.getBoundingClientRect().bottom - (viewEl.getBoundingClientRect().bottom + 96 - panel.offsetHeight) + 10;
      if (hidden > 0) viewEl.scrollTop += hidden;
    }
  }
  function closePanel() {
    if (!panel) return;
    const p = panel; panel = null; panelDate = null;
    p.classList.remove('open');
    setTimeout(() => p.remove(), 340);
    if (viewEl) { viewEl.classList.remove('panel-open'); markSelected(); }
  }

  // Something changed (item added, edited, deleted, ticked): redraw, staying where we are.
  function refresh() {
    renderView(true);
    if (panel) { fillPanel(); markSelected(); }
  }
  // Runs every minute: move the "now" line, and roll over to a new day at midnight.
  function tick() {
    if (D.today() !== today) { if (cursor === today) cursor = D.today(); render(true); return; }
    document.querySelectorAll('.now-line').forEach(n => { n.style.top = D.nowMin() / 60 * +n.closest('.tg').dataset.h + 'px'; });
  }

  Pz.calendar = { init: init, refresh: refresh, tick: tick, closePanel: closePanel, panelOpen: () => !!panel, deleteItem: deleteItem, goDay: goDay };
})();
