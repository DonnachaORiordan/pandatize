// app.js – starts everything up when the page opens.

(function () {
  const ui = Pz.ui, h = ui.h;

  // A simple "Coming soon" screen for tabs that later build steps will fill in.
  function comingSoon(page, title, text, button) {
    page.appendChild(h('div', { class: 'page-scroll' }, [
      h('div', { class: 'title-row' }, [h('h1', { class: 'big-title', text: title }), button]),
      h('div', { class: 'card soon' }, [
        h('img', { src: 'logo.png', alt: '', draggable: 'false' }),
        h('div', { class: 'soon-h', text: 'Coming soon' }),
        h('p', { text: text })
      ])
    ]));
  }

  // Called whenever saved data changes, so every screen showing it redraws.
  function changed() { Pz.calendar.refresh(); }

  function start() {
    document.title = Pz.config.appName;
    Pz.storage.load();
    Pz.nav.init();
    comingSoon(Pz.nav.page('today'), 'Today', 'Your day at a glance: what’s on now, your schedule, to-dos, habits and countdowns.',
      ui.roundBtn('gear', 'Settings', Pz.settings.open, 'big'));
    comingSoon(Pz.nav.page('habits'), 'Habits', 'Habits, streaks and your progress graph.');
    comingSoon(Pz.nav.page('lists'), 'Lists', 'To-do lists and notes.');
    Pz.calendar.init(Pz.nav.page('calendar'));

    // Keep the "now" line and today's date right while the app is open
    setInterval(Pz.calendar.tick, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) Pz.calendar.tick(); });
  }

  Pz.app = { changed: changed };
  start();
})();
