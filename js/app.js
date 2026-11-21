// app.js – starts everything up when the page opens.

(function () {
  const listeners = [];
  let lastDay = null;

  // ---- Appearance: Auto (follow the phone), Light or Dark (Settings › Appearance) ----
  // The page gets a label, data-theme="light" or "dark", and css/theme.css picks the colours from it.
  const phoneDark = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function applyTheme() {
    const pick = (Pz.data && Pz.data.settings.theme) || 'auto';
    const mode = pick === 'auto' ? (phoneDark && !phoneDark.matches ? 'light' : 'dark') : pick;
    document.documentElement.setAttribute('data-theme', mode);
    // The colour of the iPhone's top bar follows too
    Array.from(document.querySelectorAll('meta[name="theme-color"]')).forEach(m => m.setAttribute('content', mode === 'light' ? '#E2EBFA' : '#000000'));
  }
  // When set to Auto and the phone switches between dark and light, follow it straight away
  if (phoneDark) {
    const follow = () => applyTheme();
    if (phoneDark.addEventListener) phoneDark.addEventListener('change', follow); else if (phoneDark.addListener) phoneDark.addListener(follow);
  }

  // ---- Use the whole screen (my request, 21 Nov 2026) ----
  // Opened from the iPhone home screen, the app is drawn under the status bar, but iOS can report
  // the app's height as the screen minus the status bar, which left an empty strip at the bottom.
  // So, only in the iPhone home-screen app, upright, and only if there really is a gap, the app is
  // pinned to the top and stretched to the full screen height. Everywhere else nothing changes.
  function fitScreen() {
    const app = document.getElementById('app');
    const full = Math.max(screen.width, screen.height), gap = full - window.innerHeight;
    const stretch = navigator.standalone === true && window.innerHeight > window.innerWidth && gap > 1 && gap < 120;
    app.classList.toggle('full-screen', stretch);
    app.style.height = stretch ? full + 'px' : '';
  }

  // Called whenever saved data changes, so every screen showing it redraws.
  function changed() {
    applyTheme();                     // (an imported backup may bring a different Appearance setting)
    Pz.todos.maintain();              // carry-over and auto-tasks first, so the screens draw the result
    Pz.calendar.refresh();
    Pz.today.refresh();
    Pz.habitsView.refresh();
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
    const today = Pz.dates.today(), newDay = today !== lastDay;
    if (newDay) { Pz.habitsView.newDay(lastDay); lastDay = today; }
    const moved = Pz.todos.maintain();
    if (moved || newDay) { Pz.calendar.tick(); changed(); }       // a new day, or to-dos moved: redraw everything
    else { Pz.calendar.tick(); Pz.today.tick(); }                 // otherwise just the clock-driven parts
    Pz.reminders.check(quiet);        // may slide a banner down for a reminder that has just come due
  }

  function start() {
    document.title = Pz.config.appName;
    fitScreen();
    window.addEventListener('resize', fitScreen);
    window.addEventListener('orientationchange', () => setTimeout(fitScreen, 300));
    Pz.storage.load();
    applyTheme();
    lastDay = Pz.dates.today();
    Pz.todos.maintain();
    Pz.habits.rememberBests();
    Pz.nav.init();
    Pz.today.init(Pz.nav.page('today'));
    Pz.habitsView.init(Pz.nav.page('habits'));
    Pz.calendar.init(Pz.nav.page('calendar'));
    Pz.lists.init(Pz.nav.page('lists'));
    Pz.reminders.init();

    setInterval(() => tick(false), 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(true); });
    startOffline();
  }

  // Offline support: switch on the service worker (sw.js). It only works on the live
  // https:// site, not when index.html is opened by double-clicking, so it's skipped there.
  function startOffline() {
    if (!('serviceWorker' in navigator) || !/^https:$|^http:$/.test(location.protocol)) return;
    const hadOne = !!navigator.serviceWorker.controller;          // false on the very first visit
    navigator.serviceWorker.register('sw.js').then(reg => {
      // Look for a new version each time the app comes back to the front
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => { /* no offline copy this time; the app still works online */ });
    // A new version has just been saved: offer to switch to it now (it is used next time anyway).
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadOne) Pz.ui.toast(Pz.config.appName + ' has been updated', 'Reload', () => location.reload());
    });
  }

  Pz.app = { changed: changed, listen: listen, applyTheme: applyTheme };
  start();
})();
