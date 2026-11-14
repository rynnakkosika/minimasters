// Offline support (FR-026). The whole game is precached at install, so it works with no
// connection at all. Requests go to the network first so a new version shows up at once;
// the cache answers when there is no connection. tools/update-sw.mjs regenerates the list.
const CACHE = 'minimasters-v5';
const FILES = [
  './',
  'data/cards/keywords.json',
  'data/cards/set-core.json',
  'data/i18n/en.json',
  'data/i18n/fi.json',
  'data/opponents.json',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/icon.svg',
  'index.html',
  'manifest.webmanifest',
  'privacy.html',
  'src/ai/evaluate.js',
  'src/ai/index.js',
  'src/ai/policy.js',
  'src/ai/styles.js',
  'src/data/cards.js',
  'src/data/i18n.js',
  'src/engine/actions.js',
  'src/engine/combat.js',
  'src/engine/db.js',
  'src/engine/effects.js',
  'src/engine/index.js',
  'src/engine/rng.js',
  'src/engine/rules.js',
  'src/engine/state.js',
  'src/engine/turn.js',
  'src/main.js',
  'src/net/peer.js',
  'src/net/protocol.js',
  'src/run/booster.js',
  'src/run/deckbuilder.js',
  'src/run/index.js',
  'src/run/ladder.js',
  'src/run/run.js',
  'src/storage/save.js',
  'src/ui/anim.js',
  'src/ui/components/board.js',
  'src/ui/components/card.js',
  'src/ui/components/energy-curve.js',
  'src/ui/components/hand.js',
  'src/ui/components/life.js',
  'src/ui/components/progress.js',
  'src/ui/components/tooltip.js',
  'src/ui/dom.js',
  'src/ui/screens/booster.js',
  'src/ui/screens/collection.js',
  'src/ui/screens/friend.js',
  'src/ui/screens/match.js',
  'src/ui/screens/menu.js',
  'src/ui/screens/opponent-intro.js',
  'src/ui/screens/records.js',
  'src/ui/screens/result.js',
  'src/ui/screens/rules.js',
  'src/ui/screens/run-summary.js',
  'src/ui/screens/settings.js',
  'src/ui/screens/tutorial.js',
  'src/ui/tutorial/script.js',
  'styles.css',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))));
});
