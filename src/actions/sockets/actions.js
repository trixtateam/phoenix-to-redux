/* eslint-disable no-console */
import {
  socketActionTypes,
  PHOENIX_DISCONNECT_SOCKET,
  PHOENIX_CONNECT_SOCKET,
} from '../../constants';

/**
 * disconnects the socket and removes the socket from the phoenix reducer
 * @param {Object} params - parameters
 * @param {boolean?} params.clearPhoenixDetails - determines if the saved login details should be cleared. false by default
 */
export function disconnectPhoenix({ clearPhoenixDetails = false } = {}) {
  return {
    type: PHOENIX_DISCONNECT_SOCKET,
    data: {
      clearPhoenixDetails,
    },
  };
}

/**
 * Will attempt to connect socket with the current stored credentials
 * in storage
 */
export function connectPhoenix() {
  return {
    type: PHOENIX_CONNECT_SOCKET,
  };
}

/**
 * Should the socket attempt to close, this action is dispatched to the
 * phoenix reducer
 * @param {Object} params - parameters
 */
export function closePhoenixSocket() {
  return {
    type: socketActionTypes.SOCKET_CLOSE,
  };
}

/**
 * Disconnects the phoenix socket
 */
export function disconnectPhoenixSocket() {
  return {
    type: socketActionTypes.SOCKET_DISCONNECT,
  };
}

/**
 * Should the socket attempt to open, this action is dispatched to the
 * phoenix reducer
 */
export function openPhoenixSocket() {
  return {
    type: socketActionTypes.SOCKET_OPEN,
  };
}

/** Should an error occur from the phoenix socket, this action will be dispatched
 * @param {Object} params - parameters
 * @param {string} params.message
 * @param {string} params.socketState
 */
export function phoenixSocketError({ message, socketState }) {
  return {
    type: socketActionTypes.SOCKET_ERROR,
    error: message,
    data: {
      socketState,
    },
  };
}
