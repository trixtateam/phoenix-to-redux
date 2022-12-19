/* eslint-disable no-console */
import { PHOENIX_DISCONNECT_SOCKET, PHOENIX_CONNECT_SOCKET } from '../../constants';

/**
 * disconnects the socket and removes the socket from the phoenix reducer
 */
export function disconnectPhoenix() {
  return { type: PHOENIX_DISCONNECT_SOCKET };
}

/**
 * Will attempt to connect socket with the current passed socket params and options
 * https://hexdocs.pm/phoenix/1.5.9/js/index.html#socket
 * @param {Object} parameters - parameters
 * @param {String} parameters.domainUrl - domain for socket
 * @param {Object=} [parameters.params = {}] parameters.parms - socket params
 * @param {Object=} [parameters.options = {}] parameters.options - socket options
 */
export function connectPhoenix({ domainUrl, params = {}, options = {} }) {
  return {
    type: PHOENIX_CONNECT_SOCKET,
    data: {
      domainUrl,
      options,
      params,
    },
  };
}
