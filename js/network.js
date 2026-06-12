// PeerJS P2P 包裝：房主星狀拓撲 (所有加入者只連房主)
// 房主 peer.id = 房號；加入者 peer.connect(房號)。
// 訊息透過 reliable DataConnection 傳遞 (JSON 物件)。

const HANDLER_NAMES = ['onOpen', 'onJoin', 'onLeave', 'onData', 'onError', 'onHostClose'];

export function createNetwork() {
  let peer = null;
  let isHost = false;
  let selfId = null;
  const conns = new Map();   // peerId -> DataConnection (房主用)
  let hostConn = null;       // 加入者用

  const handlers = {};
  for (const n of HANDLER_NAMES) handlers[n] = () => {};

  function ensurePeerLib() {
    if (typeof window.Peer !== 'function') {
      throw new Error('PeerJS 尚未載入，請確認 index.html 的 CDN script。');
    }
  }

  function host(roomId) {
    ensurePeerLib();
    isHost = true;
    peer = new window.Peer(roomId, { debug: 1 });
    peer.on('open', (id) => { selfId = id; handlers.onOpen(id); });
    peer.on('connection', (conn) => setupHostConn(conn));
    peer.on('error', (err) => handlers.onError(err));
  }

  function setupHostConn(conn) {
    conn.on('open', () => { conns.set(conn.peer, conn); });
    conn.on('data', (data) => handlers.onData(conn.peer, data));
    conn.on('close', () => { conns.delete(conn.peer); handlers.onLeave(conn.peer); });
    conn.on('error', () => { conns.delete(conn.peer); handlers.onLeave(conn.peer); });
  }

  function join(roomId) {
    ensurePeerLib();
    isHost = false;
    peer = new window.Peer(undefined, { debug: 1 });
    peer.on('open', (id) => {
      selfId = id;
      hostConn = peer.connect(roomId, { reliable: true });
      hostConn.on('open', () => handlers.onOpen(id));
      hostConn.on('data', (data) => handlers.onData('host', data));
      hostConn.on('close', () => handlers.onHostClose());
      hostConn.on('error', (err) => handlers.onError(err));
    });
    peer.on('error', (err) => handlers.onError(err));
  }

  function broadcast(obj) {
    for (const c of conns.values()) if (c.open) c.send(obj);
  }
  function sendToHost(obj) {
    if (hostConn && hostConn.open) hostConn.send(obj);
  }
  function sendTo(peerId, obj) {
    const c = conns.get(peerId);
    if (c && c.open) c.send(obj);
  }

  function destroy() {
    try { if (peer) peer.destroy(); } catch (e) { /* ignore */ }
    peer = null; hostConn = null; conns.clear();
  }

  return {
    host, join, broadcast, sendToHost, sendTo, destroy,
    on(name, fn) { if (HANDLER_NAMES.includes(name)) handlers[name] = fn; },
    get isHost() { return isHost; },
    get id() { return selfId; },
    get connCount() { return conns.size; },
  };
}

// 產生易讀房號 (公開 broker 上需夠獨特，故加前綴)
export function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'fg-' + s;
}
