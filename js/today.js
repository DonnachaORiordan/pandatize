// today.js – the Today tab: date header (with the bell and gear), the Now/next card,
// the Schedule timeline, today's To do list, Habits (step 4) and the Countdowns strip.
// Each section has its own box, so one can be redrawn without disturbing the others.

(function () {
  const D = Pz.dates, ui = Pz.ui, h = ui.h, I = Pz.items;
  const HOUR = 44;            // height of one hour on the Schedule timeline
  let dateBox, progBox, nowBox, schedBox, todoBox, habitBox, countBox, today = null;

  const openOcc = o => Pz.itemSheet.open({ id: o.item.id, key: o.key });
  const head = (title, right) => h('div', { class: 'sec-head' }, [h('h2', { text: title }), right]);
  const openDay = () => { Pz.nav.go('calendar'); Pz.calendar.goDay(D.today()); };

  function init(page) {
    dateBox = h('div'); progBox = h('div'); nowBox = h('section'); schedBox = h('section'); todoBox = h('section'); habitBox = h('section'); countBox = h('section');
    page.appendChild(h('div', { class: 'page-scroll today' }, [
      h('div', { class: 'title-row', style: { marginBottom: '0', alignItems: 'flex-start' } }, [dateBox,
        h('div', { class: 'cal-btns', style: { marginTop: '10px' } }, [Pz.reminders.bell(), ui.roundBtn('gear', 'Settings', Pz.settings.open, 'big')])]),
      progBox, nowBox, schedBox, todoBox, habitBox, countBox
    ]));
    refresh();
  }

  // ---- Header: "MONDAY" above "16 November" ----
  function renderDate() {
    dateBox.innerHTML = '';
    dateBox.appendChild(h('div', { class: 'today-day', text: D.dayName(today) }));
    dateBox.appendChild(h('h1', { class: 'big-title', style: { fontSize: '32px' }, text: D.dayNum(today) + ' ' + D.monthName(today) }));
  }

  // ---- Now / next card ----
  const metaLine = o => h('div', { class: 'nn-meta' }, [
    h('span', null, [Pz.icon('clock', 14), h('span', { text: o.startTime + ' – ' + o.endTime })]),
    o.item.location && h('span', null, [Pz.icon('pin', 14), h('span', { text: o.item.location })])
  ]);
  function renderNow() {
    nowBox.innerHTML = '';
    const now = D.nowMin(), nowDT = D.nowDT();
    const events = I.onDay(today).filter(o => o.type === 'event');
    const cur = events.find(o => o.segStart <= now && now < o.segEnd);
    const next = events.find(o => o.segStart > now);
    const card = h('div', { class: 'card now-card' });
    if (cur) {
      const total = D.minutesBetween(cur.start, cur.end), left = D.minutesBetween(nowDT, cur.end);
      card.appendChild(h('div', { class: 'nn-main', role: 'button', onclick: () => openOcc(cur) }, [
        h('div', { class: 'nn-top' }, [
          h('span', { class: 'nn-pill', style: { background: cur.color, color: Pz.textOn(cur.color) } }, [h('i'), 'NOW']),
          h('span', { class: 'nn-cat', text: cur.cat.name }), h('span', { class: 'nn-right', text: D.duration(left) + ' left' })]),
        h('div', { class: 'nn-title', text: cur.item.title }), metaLine(cur),
        h('div', { class: 'nn-progress' }, [h('i', { style: { width: Math.min(100, Math.max(0, (total - left) / total * 100)) + '%', background: cur.color } })])
      ]));
      if (next) card.appendChild(h('div', { class: 'nn-next', role: 'button', onclick: () => openOcc(next) }, [
        h('span', { class: 'lbl', text: 'NEXT' }), h('i', { style: { background: next.color } }), h('span', { class: 'ttl', text: next.item.title }),
        h('span', { class: 'nn-right', text: next.startTime + ' · in ' + D.duration(next.segStart - now) })]));
    } else if (next) {
      card.appendChild(h('div', { class: 'nn-main', role: 'button', onclick: () => openOcc(next) }, [
        h('div', { class: 'nn-top' }, [
          h('span', { class: 'nn-pill plain' }, [h('i', { style: { background: next.color } }), 'NEXT']),
          h('span', { class: 'nn-cat', text: next.cat.name }), h('span', { class: 'nn-right', text: 'in ' + D.duration(next.segStart - now) })]),
        h('div', { class: 'nn-title', text: next.item.title }), metaLine(next)
      ]));
    } else card.appendChild(h('div', { class: 'nn-none', text: 'Nothing else today' }));
    nowBox.appendChild(card);
  }

  // ---- Schedule: today as a timeline, from the first item to the last (at least 08:00–18:00) ----
  function renderSchedule() {
    schedBox.innerHTML = '';
    const occ = I.onDay(today);
    schedBox.appendChild(head('Schedule', h('button', { type: 'button', class: 'link', style: { fontSize: '15px' }, text: 'Open day', onclick: openDay })));
    if (!occ.length) { schedBox.appendChild(h('p', { class: 'quiet', text: 'Nothing scheduled' })); return; }
    const allday = occ.filter(o => o.type === 'allday'), timed = occ.filter(o => o.type !== 'allday');
    if (allday.length) schedBox.appendChild(h('div', { class: 'ad-chips' }, allday.map(o =>
      h('button', { type: 'button', class: 'ad-pill', style: { background: o.color, color: Pz.textOn(o.color) }, text: o.item.title, onclick: () => openOcc(o) }))));
    let from = 8, to = 18;
    timed.forEach(o => { from = Math.min(from, Math.floor(o.segStart / 60)); to = Math.max(to, Math.ceil(Math.max(o.segEnd, o.segStart + 30) / 60)); });
    const grid = Pz.calendar.timeGrid([today], { hourH: HOUR, labelEvery: 1 });
    grid.style.marginTop = -(from * HOUR) + 10 + 'px';             // slide the 24-hour grid up so it starts at "from"…
    schedBox.appendChild(h('div', { class: 'card sched-card' }, [h('div', { class: 'sched-crop', style: { height: (to - from) * HOUR + 20 + 'px' } }, [grid])]));   // …and cut it off at "to"
  }

  // ---- To do ----
  function renderTodos() {
    todoBox.innerHTML = '';
    const left = Pz.todos.leftCount(today);
    todoBox.appendChild(head('To do', h('span', { text: Pz.todos.count(today) ? left + ' left' : '' })));
    todoBox.appendChild(h('div', { class: 'card', style: { padding: '2px 6px' } }, Pz.todos.rows(today, 'today')));
  }

  // ---- Habits: the daily-habits progress bar (under the header) and the compact tiles ----
  function renderHabits() {
    const H = Pz.habits, shown = H.shown();
    progBox.innerHTML = ''; habitBox.innerHTML = '';
    const bar = Pz.habitsView.progressBar(today, 'Daily habits');
    if (bar) progBox.appendChild(bar);
    const perfect = Pz.celebrate.perfectCard(today);          // "Perfect day!" while every daily habit is done
    if (perfect) progBox.appendChild(perfect);
    habitBox.appendChild(head('Habits', h('span', { text: shown.length ? shown.filter(x => H.isDone(x, today)).length + ' of ' + shown.length : '' })));
    habitBox.appendChild(shown.length ? Pz.habitsView.tiles() : Pz.habitsView.emptyState());
  }

  // ---- Countdowns: a strip of cards that scrolls sideways ----
  function renderCountdowns() {
    countBox.innerHTML = '';
    const list = I.countdowns();
    countBox.appendChild(head('Countdowns'));
    if (!list.length) { countBox.appendChild(h('p', { class: 'quiet', text: 'Nothing to count down to right now' })); return; }
    const strip = h('div', { class: 'cd-strip' }, list.map(c => {
      const o = c.o;
      const when = o.type === 'allday' ? D.short(o.startDate) : c.countdown.days < 7 ? D.dayName(o.startDate).slice(0, 3) + ' ' + o.startTime : D.short(o.startDate);
      return h('button', { type: 'button', class: 'cd-card ' + c.countdown.level, onclick: () => openOcc(o) }, [
        h('span', { class: 'cd-when' }, [h('i', { style: { background: o.color } }), h('span', { text: when })]),
        h('span', { class: 'cd-big', text: c.countdown.text }),
        h('span', { class: 'cd-title', text: o.item.title })
      ]);
    }));
    ui.dragScroll(strip);
    countBox.appendChild(strip);
  }

  // Everything (after data changes, or on a new day).
  function refresh() {
    today = D.today();
    renderDate(); renderNow(); renderSchedule(); renderTodos(); renderHabits(); renderCountdowns();
  }
  // Every minute: only the parts that depend on the clock (so typing a to-do isn't interrupted).
  function tick() {
    if (D.today() !== today) { refresh(); return; }
    renderNow(); renderSchedule(); renderCountdowns();
  }

  Pz.today = { init: init, refresh: refresh, tick: tick };
})();
