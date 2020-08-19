export const socketActionTypes = {
  SOCKET_OPEN: 'PHOENIX_SOCKET_OPEN',
  SOCKET_CLOSE: 'PHOENIX_SOCKET_CLOSE',
  SOCKET_ERROR: 'PHOENIX_SOCKET_ERROR',
  SOCKET_CONNECT: 'PHOENIX_SOCKET_CONNECT',
  SOCKET_DISCONNECT: 'PHOENIX_SOCKET_DISCONNECT',
};

export const socketStatuses = {
  OPEN: 'open',
  CLOSING: 'closing',
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  CLOSED: 'closed',
  ERROR: 'error',
};
