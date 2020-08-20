import { Socket } from 'phoenix';
import isEqual from 'lodash/isEqual';
import {
  PHOENIX_CHANNEL_LOADING_STATUS,
  socketActionTypes,
  socketStatuses,
} from '../../../constants';
import { formatSocketDomain } from '../../../utils';
import { isNullOrEmpty, getDomainKeyFromUrl } from '../../../helpers';
import { disconnectPhoenix } from '../../../actions';

/** Should an error occur from the phoenix socket, this action will be dispatched
 * @param {Object} params - parameters
 * @param {string} params.message
 * @param {string} params.socketState
 * @param {string} params.domainKey - domain for socket
 */
export function phoenixSocketError({ error, socketState, domainKey }) {
  return {
    type: socketActionTypes.SOCKET_ERROR,
    error,
    data: {
      domainKey,
      socketState,
    },
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
    isAnonymous: !socket.params().token,
    socket,
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
    isAnonymous: !socket.params().token,
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
    isAnonymous: !socket.params().token,
    domainKey,
    socket,
  };
}

/**
 * Update the loadingStatusKey for the channelTopic
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {string=} [params.loadingStatusKey = null] params.loadingStatusKey - key to setting loading status on
 */
export function updatePhoenixChannelLoadingStatus({ channelTopic, loadingStatusKey }) {
  return {
    type: PHOENIX_CHANNEL_LOADING_STATUS,
    data: { channelTopic, loadingStatusKey },
  };
}

/**
 * Attempts to connect the socket and subscribes the socket events
 * to the corresponding phoenix reducer actions
 * @param {Object} params
 * @param {function} params.dispatch - store dispatch function
 * @param {string} params.token - authentication for socket
 * @param {string} params.domain - socket url to connect to
 * @param {string} params.agentId - agent id to connect socket
 * @param {boolean=} [params.requiresAuthentication = true] params.requiresAuthentication - determines if the socket needs authentication params
 */
export function setUpSocket({ dispatch, requiresAuthentication = true, agentId, domain, token }) {
  const domainUrl = formatSocketDomain({ domainString: domain });
  let socket = false;
  if (!isNullOrEmpty(domainUrl)) {
    socket = new Socket(
      domainUrl,
      requiresAuthentication && token && agentId ? { params: { token, agent_id: agentId } } : {}
    );
    socket.connect();
    socket.onError((error) => {
      const connectionState = socket.connectionState();
      if (
        isEqual(connectionState, socketStatuses.CLOSED) ||
        isEqual(connectionState, socketStatuses.CLOSING)
      ) {
        dispatch(disconnectPhoenix());
      }
      dispatch(
        phoenixSocketError({
          domainKey: getDomainKeyFromUrl({ domainUrl }),
          error,
          socketState: connectionState,
        })
      );
    });
    socket.onOpen(() => {
      dispatch(openPhoenixSocket({ socket, domainKey: getDomainKeyFromUrl({ domainUrl }) }));
    });
    socket.onClose(() => {
      dispatch(closePhoenixSocket({ socket, domainKey: getDomainKeyFromUrl({ domainUrl }) }));
    });

    return {
      type: socketActionTypes.SOCKET_CONNECT,
      socket,
      domainKey: getDomainKeyFromUrl({ domainUrl }),
    };
  }

  return disconnectPhoenix();
}
