// app.js – starts everything up when the page opens.

(function () {
  const ui = Pz.ui, h = ui.h;
  const listeners = [];

  // A simple "Coming soon" screen for tabs that later build steps will fill in.
  function comingSoon(page, title, text) {
    page.appendChild(h('div', { class: 'page-scroll' }, [
      h('div', { class: 'title-row' }, [h('h1', { class: 'big-title', text: title })]),
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
    Pz.today.refresh();
    Pz.lists.refresh();
    Pz.reminders.check(true);
    listeners.slice().forEach(fn => fn());
  }
  // A screen can ask to be told about changes while it is open; it gets back a "stop telling me" function.
  function listen(fn) {
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
  }

  // Runs every minute and when the app comes back to the front.
  function tick(quiet) {
    const newDay = Pz.dates.today() !== lastDay;
    lastDay = Pz.dates.today();
    const moved = Pz.todos.maintain();
    if (moved || newDay) { Pz.calendar.tick(); changed(); }       // a new day, or to-dos moved: redraw everything
    else { Pz.calendar.tick(); Pz.today.tick(); }                 // otherwise just the clock-driven parts
    Pz.reminders.check(quiet);        // may slide a banner down for a reminder that has just come due
  }
  let lastDay = null;

  function start() {
    document.title = Pz.config.appName;
    Pz.storage.load();
    lastDay = Pz.dates.today();
    Pz.todos.maintain();
    Pz.nav.init();
    Pz.today.init(Pz.nav.page('today'));
    comingSoon(Pz.nav.page('habits'), 'Habits', 'Habits, streaks and your progress graph arrive in build step 4.');
    Pz.calendar.init(Pz.nav.page('calendar'));
    Pz.lists.init(Pz.nav.page('lists'));
    Pz.reminders.init();

    setInterval(() => tick(false), 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(true); });
  }

  Pz.app = { changed: changed, listen: listen };
  start();
})();
