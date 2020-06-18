import { Socket } from 'phoenix';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import {
  PHOENIX_CHANNEL_LOADING_STATUS,
  socketActionTypes,
  phoenixSocketStatuses,
} from '../../../constants';
import { disconnectPhoenix } from '../../../actions';
import { formatSocketDomain } from '../../../utils';
import { isNullOrEmpty } from '../../../helpers';

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

/**
 * Should the socket attempt to open, this action is dispatched to the
 * phoenix reducer
 */
export function openPhoenixSocket() {
  return {
    type: socketActionTypes.SOCKET_OPEN,
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
 * Update the loadingStatusKey for the channelTopic
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {string?} params.loadingStatusKey - key to setting loading status on
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
 * @param {?boolean} params.requiresAuthentication - determines if the socket needs authentication params
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
    socket.onError(() => {
      const connectionState = get(socket, 'conn.readyState');
      if (
        isEqual(connectionState, phoenixSocketStatuses.CLOSED) ||
        isEqual(connectionState, phoenixSocketStatuses.CLOSING)
      ) {
        if (isFunction(dispatch)) {
          dispatch(
            phoenixSocketError({
              message: 'Connection to server lost.',
              socketState: connectionState,
            })
          );
          dispatch(disconnectPhoenix({ clearPhoenixDetails: true }));
        }
      }
    });
    socket.onOpen(() => {
      dispatch(openPhoenixSocket());
    });
    socket.onClose(() => dispatch(closePhoenixSocket()));
    return {
      type: socketActionTypes.SOCKET_CONNECT,
      socket,
    };
  }
  return disconnectPhoenix({ clearPhoenixDetails: true });
}
