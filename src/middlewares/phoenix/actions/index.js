import { Socket } from 'phoenix';
import isEqual from 'lodash/isEqual';
import find from 'lodash/find';
import get from 'lodash/get';
import {
  PHOENIX_CHANNEL_LOADING_STATUS,
  socketActionTypes,
  socketStatuses,
  PHOENIX_CHANNEL_UPDATED,
  INVALID_SOCKET,
  channelActionTypes,
  PHOENIX_CHANNEL_END_PROGRESS,
  NO_PHOENIX_CHANNEL_FOUND,
  channelStatuses,
} from '../../../constants';
import { formatSocketDomain, hasValidSocket } from '../../../utils';
import { isNullOrEmpty, getDomainKeyFromUrl } from '../../../helpers';
import { disconnectPhoenix } from '../../../actions';
import {
  phoenixChannelClose,
  phoenixChannelError,
  phoenixChannelJoin,
  phoenixChannelJoinError,
  phoenixChannelTimeOut,
} from './channel';
import { phoenixSocketError, openPhoenixSocket, closePhoenixSocket } from './socket';

/**
 * Disconnects the channel by removing it from the socket
 *
 * @param {Object} params - parameters
 * @param {Function} params.dispatch
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {Object} params.socket - phoenix socket
 */
export function removeChannel({ dispatch, channelTopic, socket }) {
  if (!hasValidSocket(socket)) {
    dispatch(disconnectPhoenix());
    return { type: INVALID_SOCKET };
  }
  const channel = findChannelByName({ channelTopic, socket });
  leavePhoenixChannel({ channelTopic, socket });
  if (channel) {
    socket.remove(channel);
  }
  return {
    type: channelActionTypes.CHANNEL_LEAVE,
    channel,
  };
}

/**
 * Searches the connected socket channels by the channelTopic and returns the found channel
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {Object} params.socket - phoenix socket
 * @returns {T} Channel
 */
export function findChannelByName({ channelTopic, socket }) {
  if (!hasValidSocket(socket)) {
    return null;
  }
  return socket.channels && socket.channels.find((channel) => channel.topic === channelTopic);
}

/**
 * Searches the connected socket channels by the channelTopic and removes the channel by un-subscribing for the given topic
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {Object} params.socket - phoenix socket
 */
export function leavePhoenixChannel({ channelTopic, socket }) {
  const channel = findChannelByName({ channelTopic, socket });
  if (channel) {
    channel.leave();
  }
}

/**
 * When a response from the phoenix channel is received this action is dispatched to indicate
 * the progress is completed for the loadingStatusKey passed.
 * @param {Object} params - parameters
 * @param {string} params.dispatch
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {string=} [params.loadingStatusKey=null] params.loadingStatusKey - key to setting loading status on
 */
export function endPhoenixChannelProgress({ channelTopic, loadingStatusKey = null }) {
  return {
    type: PHOENIX_CHANNEL_END_PROGRESS,
    data: {
      channelTopic,
      loadingStatusKey,
    },
  };
}

/**
 * Helper method to connect to channel within socket. Only used internally.
 * @param {Object} params - parameters
 * @param {Function} params.dispatch
 * @param {Object} params.socket - phoenix socket
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {string=} [params.token=null] params.token - token for channel
 * @param {Function} params.dispatch - React dispatcher
 */
export function connectToPhoenixChannel({ socket, channelTopic, dispatch, token }) {
  if (!hasValidSocket(socket)) {
    dispatch(disconnectPhoenix());
    return null;
  }

  const channel = socket.channel(channelTopic, token ? { token } : null);
  channel.onClose(() => {
    dispatch(phoenixChannelClose({ channel }));
  });

  channel.onError(() => {
    dispatch(phoenixChannelError({ channel, channelTopic }));
  });

  return channel;
}

/**
 * Connects to given channel name and listens on eventNames and dispatches response to given corresponding eventActionTypes,
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {Object[]=} [params.events=[]]  params.events - [{eventName, eventActionType}, ...] event map to listen to on channel
 * @param {string} events[].eventName - The name of event to listen on channel.
 * @param {string} events[].eventActionType - The name of action to dispatch to reducer for the corresponding eventName.
 * @param {String} params.responseActionType - on connection of the channel action type to dispatch to
 * @param {String=} [params.token = null] params.token - token for channel
 * @param {Object} params.socket - phoenix socket
 * @returns {Object}
 */
export function connectToPhoenixChannelForEvents({
  dispatch,
  channelTopic,
  events,
  responseActionType,
  token = null,
  socket,
}) {
  let channel = findChannelByName({ channelTopic, socket });
  if (!channel && !isNullOrEmpty(channelTopic)) {
    channel = connectToPhoenixChannel({ socket, channelTopic, dispatch, token });
    if (!channel) {
      return { type: NO_PHOENIX_CHANNEL_FOUND };
    }

    channel
      .join()
      .receive(channelStatuses.CHANNEL_OK, (response) => {
        dispatch(
          phoenixChannelJoin({
            response,
            channel,
          })
        );
        dispatch(endPhoenixChannelProgress({ channelTopic }));
      })
      .receive(channelStatuses.CHANNEL_ERROR, (response) => {
        dispatch(phoenixChannelJoinError({ error: response, channelTopic }));
        dispatch(endPhoenixChannelProgress({ channelTopic }));
      })
      .receive(channelStatuses.CHANNEL_TIMEOUT, (response) => {
        dispatch(
          phoenixChannelTimeOut({
            channelTopic,
            error: response,
          })
        );
        dispatch(endPhoenixChannelProgress({ channelTopic }));
      });

    return {
      type: responseActionType,
      channel,
    };
  }

  if (channel && events) {
    events.forEach(({ eventName, eventActionType }) => {
      if (!find(get(channel, 'bindings', []), { event: eventName })) {
        channel.on(eventName, (data) => {
          dispatch({ type: eventActionType, data, eventName, channelTopic });
        });
      }
    });
  }
  return { type: PHOENIX_CHANNEL_UPDATED, channel };
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
 * @param {Object} parameters
 * @param {function} parameters.dispatch - store dispatch function
 * @param {string} parameters.params - socket params
 * @param {Object} parameters.domain - socket url to connect to
 */
export function setUpSocket({ dispatch, domain, params }) {
  const domainUrl = formatSocketDomain({ domainString: domain });
  let socket = false;
  if (!isNullOrEmpty(domainUrl)) {
    socket = new Socket(domainUrl, { params });
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
