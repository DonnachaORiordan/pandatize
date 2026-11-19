// sw.js – the "service worker": a small helper the phone keeps in the background.
// The first time the app opens from the live site, it saves a copy of every app file.
// After that the app opens from those copies, so it works with no internet.
//
// IMPORTANT: raise VERSION by 1 every time ANY app file changes (html, css, js, icons,
// manifest). That is how phones notice there is something new to download.
// (It has to live in this file: phones only check this file for changes.)

const VERSION = 7;
const CACHE = 'pandatize-v' + VERSION;

// Every file the app needs. (logo.png is left out: it's the big original; the app uses the icons.)
const FILES = [
  './', 'index.html', 'manifest.json',
  'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'css/theme.css', 'css/app.css', 'css/calendar.css', 'css/features.css', 'css/lists.css', 'css/habits.css', 'css/motion.css',
  'js/config.js', 'js/dates.js', 'js/storage.js', 'js/icons.js', 'js/ui.js', 'js/sounds.js', 'js/fx.js', 'js/nav.js',
  'js/categories.js', 'js/items.js', 'js/itemsheet.js', 'js/todos.js', 'js/reminders.js', 'js/search.js', 'js/calendar.js',
  'js/habits.js', 'js/habitsview.js', 'js/celebrate.js', 'js/progress.js', 'js/today.js', 'js/lists.js', 'js/settings.js', 'js/app.js'
];

// Installing: download fresh copies of every file (skipping the browser's own short-term memory,
// so a new version never saves old files) and keep them under this version's name.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

// Switching on: throw away the copies saved by older versions.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.indexOf('pandatize-') === 0 && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Every time the app asks for a file: hand over the saved copy; only go to the internet
// for something that isn't saved. With no internet, opening the app still gets index.html.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).catch(() =>
        req.mode === 'navigate' ? cache.match('index.html') : Response.error()))
    )
  );
});
