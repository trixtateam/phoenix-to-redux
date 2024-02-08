import { socketActionTypes } from '../../../../constants';
import { getSocketParams } from '../../../../services/socket';

/** Should an error occur from the phoenix socket, this action will be dispatched
 * @param {Object} params - parameters
 * @param {string} params.error
 * @param {string} params.socketState
 * @param {string} params.domainKey - domain for socket
 */
export function phoenixSocketError({ error, socketState, domainKey }) {
  return {
    type: socketActionTypes.SOCKET_ERROR,
    error,
    domainKey,
    socketState,
  };
}

/**
 * Should the socket attempt to open, this action is dispatched to the
 * phoenix reducer
 * @param {Object} params - parameters
 * @param {string} params.domainKey - domain for socket
 * @param {Object} params.socket = socket being opened
 */
export function openPhoenixSocket({ socket, domainKey }) {
  return {
    type: socketActionTypes.SOCKET_OPEN,
    params: getSocketParams(socket),
    socket,
    domainKey,
  };
}

/**
 * Should the socket attempt to connect, this action is dispatched to the
 * phoenix reducer
 * @param {Object} params - parameters
 * @param {string} params.domainKey - domain for socket
 * @param {Object} params.socket = socket being opened
 * @param {Object=} params.options = {} parameters.options - socket options
 */

export function connectPhoenixSocket({ socket, domainKey, options }) {
  return {
    type: socketActionTypes.SOCKET_CONNECT,
    socket,
    params: getSocketParams(socket),
    options,
    domainKey,
  };
}

/**
 * Should the socket attempt to close, this action is dispatched to the
 * phoenix reducer
 * @param {Object} params - parameters
 * @param {Object} params.socket = socket being closed
 * @param {string} params.domainKey - domain for socket
 */
export function closePhoenixSocket({ domainKey, socket }) {
  return {
    type: socketActionTypes.SOCKET_CLOSE,
    params: getSocketParams(socket),
    domainKey,
    socket,
  };
}

/**
 * Disconnects the phoenix socket
 * @param {Object} params - parameters
 * @param {Object} params.socket = socket being disconnected
 * @param {string} params.domainKey - domain for socket
 */
export function disconnectPhoenixSocket({ domainKey, socket }) {
  return {
    type: socketActionTypes.SOCKET_DISCONNECT,
    params: getSocketParams(socket),
    domainKey,
    socket,
  };
}
