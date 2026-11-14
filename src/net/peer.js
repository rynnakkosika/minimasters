// Transport for friend play: a thin wrapper over PeerJS WebRTC data channels (research R1, R5).
// PeerJS is loaded only when the player creates or joins a game, so single-player never
// touches the network. The signalling server only introduces the two browsers to each other.
const PEERJS_URL = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
const ID_PREFIX = 'minimasters-';
const PING_MS = 3000;
const TIMEOUT_MS = 12000;
let loading = null;

export function loadPeerJs() {
  if (window.Peer) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PEERJS_URL;
      s.crossOrigin = 'anonymous';
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        s.remove();
        reject(new Error('offline'));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/**
 * One data channel plus its peer. handlers: onOpen, onMessage, onClose.
 * WebRTC often doesn't notice a closed tab for a long time, so both sides ping and treat
 * silence as a disconnect; a closing page also says 'bye'.
 */
function wrap(peer, handlers) {
  let conn = null;
  let lastSeen = 0;
  let timer = null;
  let closed = false;
  const lost = () => {
    if (closed) return;
    closed = true;
    clearInterval(timer);
    window.removeEventListener('pagehide', sayBye);
    handlers.onClose?.();
  };
  const sayBye = () => link.send({ type: 'bye' });
  const link = {
    send(msg) {
      if (conn && conn.open) conn.send(msg);
    },
    close() {
      closed = true;
      clearInterval(timer);
      window.removeEventListener('pagehide', sayBye);
      try {
        if (conn) {
          sayBye();
          conn.close();
        }
        peer.destroy();
      } catch {
        /* already closed */
      }
    },
    attach(c) {
      conn = c;
      c.on('open', () => {
        lastSeen = Date.now();
        timer = setInterval(() => {
          if (Date.now() - lastSeen > TIMEOUT_MS) lost();
          else link.send({ type: 'ping' });
        }, PING_MS);
        window.addEventListener('pagehide', sayBye);
        handlers.onOpen?.();
      });
      c.on('data', (m) => {
        lastSeen = Date.now();
        if (m && m.type === 'ping') return;
        if (m && m.type === 'bye') return lost();
        handlers.onMessage?.(m);
      });
      c.on('close', lost);
      c.on('error', lost);
    },
    get connected() {
      return !!(conn && conn.open);
    },
  };
  return link;
}

/**
 * Host: registers a code with the signalling server and accepts exactly one friend.
 * handlers.onReady(code) once the code works; a code already in use is replaced (5 tries).
 * handlers.onError(type) for 'offline' and server errors.
 */
export function hostGame(makeCode, handlers) {
  return loadPeerJs().then(() => new Promise((resolve) => {
    const attempt = (tries) => {
      const code = makeCode();
      const peer = new window.Peer(ID_PREFIX + code);
      const link = wrap(peer, handlers);
      peer.on('open', () => {
        handlers.onReady?.(code);
        resolve(link);
      });
      peer.on('connection', (c) => {
        if (link.connected || link.taken) {
          c.on('open', () => c.close());
          return;
        }
        link.taken = true;
        link.attach(c);
      });
      peer.on('error', (err) => {
        if (err.type === 'unavailable-id' && tries < 5) {
          peer.destroy();
          attempt(tries + 1);
          return;
        }
        handlers.onError?.(err.type || 'error');
      });
      peer.on('disconnected', () => {
        try {
          if (!peer.destroyed) peer.reconnect();
        } catch {
          /* signalling only; the data channel keeps working */
        }
      });
    };
    attempt(0);
  }));
}

/** Guest: connects to the host's code. handlers.onError('notfound') if there is no such game. */
export function joinGame(code, handlers) {
  return loadPeerJs().then(() => new Promise((resolve) => {
    const peer = new window.Peer();
    const link = wrap(peer, handlers);
    peer.on('open', () => {
      link.attach(peer.connect(ID_PREFIX + code, { reliable: true }));
      resolve(link);
    });
    peer.on('error', (err) => {
      handlers.onError?.(err.type === 'peer-unavailable' ? 'notfound' : err.type || 'error');
    });
  }));
}
