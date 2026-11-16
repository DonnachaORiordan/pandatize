// app.js – starts everything up when the page opens.

(function () {
  const ui = Pz.ui, h = ui.h;
  const listeners = [];

  // A simple "Coming soon" screen for tabs that later build steps will fill in.
  function comingSoon(page, title, text, buttons) {
    page.appendChild(h('div', { class: 'page-scroll' }, [
      h('div', { class: 'title-row' }, [h('h1', { class: 'big-title', text: title }), buttons && h('div', { class: 'cal-btns' }, buttons)]),
      h('div', { class: 'card soon' }, [
        h('img', { src: 'logo.png', alt: '', draggable: 'false' }),
        h('div', { class: 'soon-h', text: 'Coming soon' }),
        h('p', { text: text })
      ])
    ]));
  }

  // Called whenever saved data changes, so every screen showing it redraws.
  function changed() {
    Pz.todos.maintain();              // carry-over and auto-tasks first, so the screens draw the result
    Pz.calendar.refresh();
    Pz.reminders.check(true);
    listeners.slice().forEach(fn => fn());
  }
  // A screen can ask to be told about changes while it is open; it gets back a "stop telling me" function.
  function listen(fn) {
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
  }

  // Runs every minute and when the app comes back to the front.
  function tick() {
    const moved = Pz.todos.maintain();
    Pz.calendar.tick();
    if (moved) Pz.calendar.refresh();
    Pz.reminders.check(false);        // may slide a banner down for a reminder that has just come due
  }

  function start() {
    document.title = Pz.config.appName;
    Pz.storage.load();
    Pz.todos.maintain();
    Pz.nav.init();
    comingSoon(Pz.nav.page('today'), 'Today', 'Your day at a glance: what’s on now, your schedule, to-dos, habits and countdowns.',
      [Pz.reminders.bell(), ui.roundBtn('gear', 'Settings', Pz.settings.open, 'big')]);
    comingSoon(Pz.nav.page('habits'), 'Habits', 'Habits, streaks and your progress graph.');
    comingSoon(Pz.nav.page('lists'), 'Lists', 'To-do lists and notes.');
    Pz.calendar.init(Pz.nav.page('calendar'));
    Pz.reminders.init();

    setInterval(tick, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { Pz.todos.maintain(); Pz.calendar.tick(); Pz.calendar.refresh(); Pz.reminders.check(true); } });
  }

  Pz.app = { changed: changed, listen: listen };
  start();
})();
