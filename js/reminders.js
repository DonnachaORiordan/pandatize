// reminders.js – in-app reminders: working out which have come due, the bell
// button with its red count, the Reminders panel, and the banner that slides down.
// (iPhone web apps can't send real notifications without a server, so they live in here.)

(function () {
  const D = Pz.dates, ui = Pz.ui, h = ui.h;
  const R = {};
  const seen = {};            // reminders already noticed since the app opened (so a banner shows only once)
  let bellBtn = null, badge = null, panel = null;
  const UNIT_DAYS = { day: 1, week: 7, month: 30 };
  const nowDT = () => D.today() + 'T' + D.fromMin(D.nowMin());

  // When is this reminder due, for an occurrence?
  function dueAt(o, r) {
    if (r.at) return D.addDays(o.startDate, -r.n * (UNIT_DAYS[r.unit] || 0)) + 'T' + r.at;      // "1 week before 09:00"
    const base = o.type === 'allday' ? o.startDate + 'T09:00' : o.start;
    return D.addMinutes(base, -Pz.categories.reminderMinutes(r));
  }

  // "in 2 hours", "tomorrow 09:30", "Fri 20 Nov 14:00"…
  R.when = o => {
    const today = D.today();
    if (o.type === 'allday') {
      const n = D.diffDays(today, o.startDate);
      return n === 0 ? 'today' : n === 1 ? 'tomorrow' : D.short(o.startDate);
    }
    const mins = D.minutesBetween(nowDT(), o.start);
    const dayTime = (o.startDate === today ? '' : D.short(o.startDate) + ' ') + o.startTime;
    if (mins <= 0) return (o.type === 'deadline' ? 'was due ' : 'started ') + dayTime;
    if (o.startDate === today) {
      if (mins < 60) return 'in ' + mins + ' min';
      const hrs = Math.round(mins / 60);
      return 'in ' + hrs + (hrs === 1 ? ' hour' : ' hours');
    }
    if (o.startDate === D.addDays(today, 1)) return 'tomorrow ' + o.startTime;
    return dayTime;
  };

  // Every reminder that has come due and hasn't been dismissed (newest first).
  R.entries = () => {
    const I = Pz.items, C = Pz.categories, today = D.today(), now = nowDT(), gone = Pz.data.reminders.dismissed, out = [];
    Pz.data.items.forEach(it => {
      const rems = I.effective(it).reminders;
      if (!rems.length) return;
      const lead = Math.ceil(Math.max.apply(null, rems.map(C.reminderMinutes)) / 1440) + 1;       // how far ahead to look
      I.keysBetween(it, D.addDays(today, -7), D.addDays(today, lead)).forEach(key => {
        const o = I.occ(it, key);
        if (o.endDate < today || o.done) return;               // over, or a ticked deadline
        rems.forEach(r => {
          const id = it.id + '|' + key + '|' + C.reminderKey(r), due = dueAt(o, r);
          if (due <= now && !gone[id]) out.push({ id: id, due: due, title: it.title, color: o.color, o: o });
        });
      });
    });
    // Auto-tasks come up again as often as their "reminders" setting says, until ticked.
    Pz.data.todos.forEach(t => {
      const s = t.source;
      if (!s || s.type !== 'auto' || t.done) return;
      const it = I.get(s.itemId);
      if (!it) return;
      const step = { daily: 1, '2days': 2, weekly: 7 }[s.frequency];
      const since = Math.max(0, D.diffDays(s.appear, today));
      const day = step ? D.addDays(s.appear, Math.floor(since / step) * step) : s.appear;
      const id = t.id + '|' + day, due = day + 'T09:00';
      if (due <= now && !gone[id]) out.push({ id: id, due: due, title: t.title, color: C.get(it.categoryId).color, o: I.occ(it, s.occ), task: true });
    });
    return out.sort((a, b) => (a.due < b.due ? 1 : -1));
  };

  const openEntry = e => Pz.itemSheet.open({ id: e.o.item.id, key: e.o.key });
  const dismiss = ids => { ids.forEach(id => { Pz.data.reminders.dismissed[id] = true; }); Pz.storage.save(); R.check(true); };

  // A banner that slides down from the top for a few seconds.
  function banner(e, more) {
    const el = h('button', { type: 'button', class: 'banner', onclick: () => { hide(); openEntry(e); } }, [
      h('span', { class: 'bar', style: { background: e.color } }),
      h('span', { class: 'main' }, [h('span', { class: 'ttl', text: e.title }), h('span', { class: 'sub', text: (e.task ? 'To do · ' : '') + R.when(e.o) + (more ? ' · +' + more + ' more' : '') })]),
      Pz.icon('bell', 18)
    ]);
    const hide = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); };
    document.getElementById('app').appendChild(el);
    Pz.ui.nextFrame(() => el.classList.add('show'));
    setTimeout(hide, 5000);
  }

  // Look for due reminders: update the red count, refresh the panel, and (unless quiet) show a banner for new ones.
  R.check = quiet => {
    const list = R.entries();
    const fresh = list.filter(e => !seen[e.id]);
    list.forEach(e => { seen[e.id] = true; });
    if (!quiet && fresh.length && !document.hidden) banner(fresh[0], fresh.length - 1);
    if (badge) { badge.textContent = String(list.length); badge.style.display = list.length ? '' : 'none'; }
    if (bellBtn) bellBtn.setAttribute('aria-label', 'Reminders, ' + list.length + ' waiting');
    if (panel) fillPanel(list);
    return list;
  };

  function fillPanel(list) {
    panel.body.innerHTML = '';
    if (!list.length) { panel.body.appendChild(h('div', { class: 'panel-empty', text: 'No reminders right now. They appear here when they come due.' })); return; }
    list.forEach(e => panel.body.appendChild(ui.swipeRow(
      h('div', { class: 'item-row', role: 'button', onclick: () => { const p = panel; panel = null; p.close(); openEntry(e); } }, [
        h('span', { class: 'bar', style: { background: e.color } }),
        h('div', { class: 'main' }, [h('div', { class: 'ttl', text: e.title }), h('div', { class: 'sub', text: (e.task ? 'To do · ' : '') + R.when(e.o) })])
      ]), () => dismiss([e.id]), 'Clear')));
  }

  R.open = () => {
    panel = ui.panel('Reminders', 'Clear all', () => dismiss(R.entries().map(e => e.id)), () => { panel = null; });
    fillPanel(R.entries());
  };

  // The bell button (sits beside the gear on Today).
  R.bell = () => {
    badge = h('span', { class: 'badge-red' });
    bellBtn = ui.roundBtn('bell', 'Reminders', R.open, 'big');
    bellBtn.appendChild(badge);
    return bellBtn;
  };

  R.init = () => {
    // Tidy up: forget dismissals for things more than a week old
    const cut = D.addDays(D.today(), -7), gone = Pz.data.reminders.dismissed;
    Object.keys(gone).forEach(id => { const m = id.match(/\|(\d{4}-\d{2}-\d{2})/); if (m && m[1] < cut) delete gone[id]; });
    R.check(true);
  };

  Pz.reminders = R;
})();
