const base = '@trixta/phoenix-to-redux-event';
export const socketActionTypes = {
  SOCKET_OPEN: `${base}/PHOENIX_SOCKET_OPEN`,
  SOCKET_CLOSE: `${base}/PHOENIX_SOCKET_CLOSE`,
  SOCKET_ERROR: `${base}/PHOENIX_SOCKET_ERROR`,
  SOCKET_CONNECT: `${base}/PHOENIX_SOCKET_CONNECT`,
  SOCKET_DISCONNECT: `${base}/PHOENIX_SOCKET_DISCONNECT`,
};

export const socketStatuses = {
  OPEN: 'open',
  CLOSING: 'closing',
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  CLOSED: 'closed',
  ERROR: 'error',
};
