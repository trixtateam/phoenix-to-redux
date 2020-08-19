/* eslint-disable no-console */
import { PHOENIX_DISCONNECT_SOCKET, PHOENIX_CONNECT_SOCKET } from '../../constants';

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
 * @param {Object} params - parameters
 * @param {String} parmas.domainUrl - domain for socket
 * @param {String=} [parmas.token = null] parmas.token - token for socket
 * @param {String} parmas.agentId - agentId for socket
 */
export function connectPhoenix({ domainUrl, token = null, agentId }) {
  return {
    type: PHOENIX_CONNECT_SOCKET,
    data: {
      domainUrl,
      token,
      agentId,
    },
  };
}
