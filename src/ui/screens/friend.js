// "Pelaa kaverin kanssa" (specs/002-friend-play): create or join a game, then one match between
// two devices. The host (player 0) referees; the guest (player 1) proposes its actions and applies
// whatever the host confirms, in the host's order. Nothing here touches the run or the saves.
import { h, mount } from '../dom.js';
import { t } from '../../data/i18n.js';
import { chooseAction } from '../../ai/index.js';
import {
  PROTOCOL_VERSION, HOST, GUEST, makeCode, normalizeCode, isValidCode, inviteLink, createFriendMatch,
  hostHandle, guestHandle, actMessage,
} from '../../net/protocol.js';
import { showOverlay, closeOverlay } from '../components/tooltip.js';
import { renderMatchView } from './match.js';

let active = null; // { link, closed } of the current game

/** Closes the connection of the current friend game, if any. */
export function leaveFriendGame() {
  if (active) {
    active.closed = true;
    active.link?.close();
  }
  active = null;
}

function randomSeed() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0];
}

function randomCode() {
  const a = new Uint32Array(6);
  crypto.getRandomValues(a);
  let i = 0;
  return makeCode(() => a[i++] / 4294967296);
}

function screen(root, ...content) {
  mount(root, h('section', { class: 'screen menu friend' }, h('h2', {}, t('friend.title')), ...content));
}

function errorText(type) {
  if (type === 'offline' || type === 'network' || type === 'server-error' || type === 'socket-error') return t('friend.err.offline');
  if (type === 'notfound') return t('friend.err.notFound');
  if (type === 'version') return t('friend.err.version');
  if (type === 'left') return t('friend.err.left');
  return t('friend.err.generic');
}

export function renderFriend(root, app) {
  leaveFriendGame();
  const invite = app.invite;
  app.invite = null;
  if (invite) return join(root, app, invite);

  const input = h('input', {
    class: 'code-input', type: 'text', inputmode: 'text', autocomplete: 'off', autocapitalize: 'characters',
    spellcheck: 'false', maxlength: '8', placeholder: 'ABC234', 'aria-label': t('friend.code'),
  });
  const tryJoin = () => {
    const code = normalizeCode(input.value);
    if (!isValidCode(code)) {
      app.toast(t('friend.err.badCode'));
      return;
    }
    join(root, app, code);
  };
  input.addEventListener('input', () => {
    input.value = normalizeCode(input.value);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryJoin();
  });
  screen(root,
    h('p', { class: 'tagline' }, t('friend.intro')),
    h('div', { class: 'menu-buttons' },
      h('button', { class: 'primary', onclick: () => host(root, app) }, t('friend.host')),
      h('div', { class: 'join-row' }, input, h('button', { onclick: tryJoin }, t('friend.join'))),
      h('p', { class: 'fine' }, t('friend.needsNet')),
      h('button', { onclick: () => app.go('menu') }, t('common.back'))));
}

function cancelButton(app) {
  return h('button', { onclick: () => { leaveFriendGame(); app.go('menu'); } }, t('match.cancel'));
}

function showError(root, app, type, retry) {
  leaveFriendGame();
  screen(root,
    h('p', { class: 'dialog-text', role: 'alert' }, errorText(type)),
    h('div', { class: 'menu-buttons' },
      retry ? h('button', { class: 'primary', onclick: retry }, t('friend.retry')) : null,
      h('button', { onclick: () => app.go('friend') }, t('common.back'))));
}

// ---- host ------------------------------------------------------------------

async function host(root, app) {
  leaveFriendGame();
  const game = { link: null, closed: false, started: false, onMessage: null, onClose: null };
  active = game;
  screen(root, h('p', { class: 'dialog-text' }, t('friend.loading')), h('div', { class: 'menu-buttons' }, cancelButton(app)));
  const retry = () => host(root, app);
  const fail = (type) => {
    if (game.closed) return;
    if (game.started) game.onClose?.();
    else showError(root, app, type, retry);
  };
  try {
    game.link = await (await import('../../net/peer.js')).hostGame(randomCode, {
      onReady: (code) => !game.closed && showCode(root, app, code),
      onMessage: (m) => {
        if (game.closed) return;
        if (game.started) return game.onMessage?.(m);
        if (!m || m.t !== 'hello') return;
        if (m.v !== PROTOCOL_VERSION) {
          game.link.send({ t: 'version', v: PROTOCOL_VERSION });
          return showError(root, app, 'version', retry);
        }
        const seed = randomSeed();
        game.link.send({ t: 'start', v: PROTOCOL_VERSION, seed });
        game.started = true;
        startHostMatch(root, app, game, seed);
      },
      onClose: () => fail('left'),
      onError: (type) => fail(type),
    });
    if (game.closed) game.link.close();
  } catch {
    fail('offline');
  }
}

// Inside the Android app the page address is the app's own localhost, so invites point to the
// published web version instead (README → Pelaa). A friend with the app can type the code.
const WEB_URL = 'https://rynnakkosika.github.io/minimasters/';
const inApp = () => !!window.Capacitor?.isNativePlatform?.();

function showCode(root, app, code) {
  const link = inviteLink(inApp() ? WEB_URL : location.href, code);
  const localOnly = !inApp() && (/^(localhost|127\.|\[::1\])/.test(location.hostname) || location.protocol === 'file:');
  const share = async () => {
    const text = t('friend.shareText', { code });
    try {
      if (navigator.share) {
        await navigator.share({ title: t('app.title'), text, url: link });
        return;
      }
    } catch {
      /* cancelled: fall back to copying */
    }
    try {
      await navigator.clipboard.writeText(link);
      app.toast(t('friend.copied'));
    } catch {
      app.toast(link);
    }
  };
  screen(root,
    h('p', {}, t('friend.giveCode')),
    h('div', { class: 'game-code', 'aria-label': t('friend.code') }, code),
    h('p', { class: 'invite-link' }, link),
    h('div', { class: 'menu-buttons' },
      h('button', { class: 'primary', onclick: share }, t('friend.share')),
      h('p', { class: 'waiting' }, t('friend.waiting')),
      localOnly ? h('p', { class: 'fine' }, t('friend.localNote')) : null,
      cancelButton(app)));
}

function startHostMatch(root, app, game, seed) {
  let api = null;
  let aiTookOver = false;
  let inbox = Promise.resolve();
  const session = {
    me: HOST,
    state: createFriendMatch(seed),
    opponent: { name: t('friend.opponent'), style: 'midrange', aiParams: {} },
    drawText: t('friend.draw'),
    save(state, events, action) {
      if (!aiTookOver) game.link.send(actMessage(state, action));
    },
    attach(a) {
      api = a;
    },
    finish() {
      leaveFriendGame();
      app.go('menu');
    },
  };
  game.onMessage = (m) => {
    inbox = inbox.then(async () => {
      if (aiTookOver || !api) return;
      const r = hostHandle(api.state(), m, seed);
      if (r.reply) game.link.send(r.reply);
      if (r.action && !(await api.receive(r.action))) game.link.send({ t: 'reject' });
    });
  };
  game.onClose = () => {
    if (aiTookOver || !api) return;
    aiTookOver = true;
    if (api.state().phase === 'GAME_OVER') return;
    showOverlay([
      h('h2', {}, t('friend.lostTitle')),
      h('p', { class: 'dialog-text' }, t('friend.friendLeft')),
      h('button', { class: 'primary', onclick: closeOverlay }, t('match.resume')),
    ], { dismissable: false });
    session.aiAction = (state, step) => chooseAction(state, GUEST, { style: 'midrange' }, (seed ^ Math.imul(step + 1, 2654435761)) >>> 0);
    api.resume();
  };
  app.screen = 'friend-match';
  renderMatchView(root, app, session);
}

// ---- guest -----------------------------------------------------------------

async function join(root, app, code) {
  leaveFriendGame();
  const game = { link: null, closed: false, started: false, onMessage: null, onClose: null };
  active = game;
  screen(root,
    h('p', { class: 'dialog-text' }, t('friend.connecting', { code })),
    h('div', { class: 'menu-buttons' }, cancelButton(app)));
  const retry = () => join(root, app, code);
  const fail = (type) => {
    if (game.closed) return;
    if (game.started) game.onClose?.();
    else showError(root, app, type, retry);
  };
  // A missing host is reported by the signalling server; a host that never answers is not.
  const timeout = setTimeout(() => !game.started && fail('notfound'), 20000);
  try {
    game.link = await (await import('../../net/peer.js')).joinGame(code, {
      onOpen: () => game.link.send({ t: 'hello', v: PROTOCOL_VERSION }),
      onMessage: (m) => {
        if (game.closed) return;
        if (game.started) return game.onMessage?.(m);
        if (m?.t === 'version' || (m?.t === 'start' && m.v !== PROTOCOL_VERSION)) {
          clearTimeout(timeout);
          return showError(root, app, 'version', null);
        }
        if (m?.t !== 'start' || typeof m.seed !== 'number') return;
        clearTimeout(timeout);
        game.started = true;
        startGuestMatch(root, app, game, m.seed >>> 0);
      },
      onClose: () => fail('left'),
      onError: (type) => {
        clearTimeout(timeout);
        fail(type);
      },
    });
    if (game.closed) game.link.close();
  } catch {
    clearTimeout(timeout);
    fail('offline');
  }
}

function startGuestMatch(root, app, game, seed) {
  let api = null;
  let syncing = false;
  let inbox = Promise.resolve();
  const session = {
    me: GUEST,
    state: createFriendMatch(seed),
    opponent: { name: t('friend.opponent'), style: 'midrange', aiParams: {} },
    drawText: t('friend.draw'),
    waitingText: t('friend.sending'),
    save() {
      /* friend matches are not saved */
    },
    propose(action) {
      game.link.send({ t: 'propose', action });
    },
    attach(a) {
      api = a;
    },
    finish() {
      leaveFriendGame();
      app.go('menu');
    },
  };
  const resync = () => {
    if (syncing) return;
    syncing = true;
    game.link.send({ t: 'resync' });
  };
  // Messages are handled one at a time, each after the previous action has been applied.
  game.onMessage = (m) => {
    inbox = inbox.then(async () => {
      if (!api) return;
      if (syncing && m?.t !== 'sync') return;
      const r = guestHandle(api.state(), m);
      if (r.rebuild) {
        syncing = false;
        api.rebuild(r.rebuild);
      }
      if (r.rejected) api.refused();
      if (r.reply?.t === 'resync') resync();
      if (r.action && !(await api.receive(r.action))) resync();
    });
  };
  game.onClose = () => {
    if (!api || api.state().phase === 'GAME_OVER') return;
    leaveFriendGame();
    showOverlay([
      h('h2', {}, t('friend.lostTitle')),
      h('p', { class: 'dialog-text' }, t('friend.hostLeft')),
      h('button', { class: 'primary', onclick: () => app.go('menu') }, t('match.toMenu')),
    ], { dismissable: false });
  };
  app.screen = 'friend-match';
  renderMatchView(root, app, session);
}
