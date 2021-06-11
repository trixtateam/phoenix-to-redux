export const socketActionTypes = {
  SOCKET_OPEN: '@trixta/phoenix-to-redux-event/PHOENIX_SOCKET_OPEN',
  SOCKET_CLOSE: '@trixta/phoenix-to-redux-event/PHOENIX_SOCKET_CLOSE',
  SOCKET_ERROR: '@trixta/phoenix-to-redux-event/PHOENIX_SOCKET_ERROR',
  SOCKET_CONNECT: '@trixta/phoenix-to-redux-event/PHOENIX_SOCKET_CONNECT',
  SOCKET_DISCONNECT: '@trixta/phoenix-to-redux-event/PHOENIX_SOCKET_DISCONNECT',
};

export const socketStatuses = {
  OPEN: 'open',
  CLOSING: 'closing',
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  CLOSED: 'closed',
  ERROR: 'error',
};
