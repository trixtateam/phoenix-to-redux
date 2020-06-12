/* eslint-disable no-console */
import { Presence } from 'phoenix';
import find from 'lodash/find';
import get from 'lodash/get';
import {
  phoenixChannelStatuses,
  channelActionTypes,
  channelStatuses,
} from './constants/channel';
import { socketActionTypes } from './constants/socket';
import {
  NO_ACTION,
  PHOENIX_CHANNEL_END_PROGRESS,
  PHOENIX_CHANNEL_LOADING_STATUS,
  PHOENIX_GET_CHANNEL,
  PHOENIX_PUSH_TO_CHANNEL,
  PHOENIX_DISCONNECT_SOCKET,
  PHOENIX_CONNECT_SOCKET,
  PHOENIX_CLEAR_LOGIN_DETAILS,
  PHOENIX_UPDATE_LOGIN_DETAILS,
} from './constants';
import { hasValidSocket } from './utils';
import { isNullOrEmpty } from './helpers';
/**
 * When joining a channel will sync the present users in the channel
 * @param {*} dispatch
 * @param {*} presences
 */
const syncPresentUsers = (dispatch, presences) => {
  const presentUsers = [];
  Presence.list(presences, (id, { metas: [first] }) => first.user).map(user =>
    presentUsers.push(user)
  );
  dispatch({ type: channelActionTypes.CHANNEL_PRESENCE_UPDATE, presentUsers });
};

/**
 * disconnects the socket and removes the socket from the phoenix reducer
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
 * Clears all local storage details for phoenix socket
 * connection
 */
export function clearPhoenixLoginDetails() {
  return {
    type: PHOENIX_CLEAR_LOGIN_DETAILS,
  };
}

/**
 *
 * @param {Object} params
 * @param {string?} params.agentId - agent id for phoenix socket
 * @param {string?} params.token - authentication token for phoenix socket
 */
export function updatePhoenixLoginDetails({ agentId = null, token = null }) {
  return {
    type: PHOENIX_UPDATE_LOGIN_DETAILS,
    data: {
      agentId,
      token,
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
 * @param {Object} params
 * @param {} params.dispatch
 * @returns {{type: string}}
 */
export function closePhoenixSocket() {
  return {
    type: socketActionTypes.SOCKET_CLOSE,
  };
}

/**
 * Disconnects the socket
 * @returns {{type: string}}
 */
export function disconnectPhoenixSocket() {
  return {
    type: socketActionTypes.SOCKET_DISCONNECT,
  };
}

/**
 * Should the socket attempt to open, this action is dispatched to the
 * phoenix reducer
 * @returns {{type: string}}
 */
export function openPhoenixSocket() {
  return {
    type: socketActionTypes.SOCKET_OPEN,
  };
}

/**
 *
 * @param {Object} params
 * @param {Function} params.dispatch
 */
export function phoenixChannelJoin({ response, channel }) {
  return {
    type: channelActionTypes.CHANNEL_JOIN,
    response,
    channel,
  };
}
/**
 *
 * @param {Object} params
 * @param {Function} params.dispatch
 */
export function phoenixChannelError({ error, channelTopic }) {
  return {
    type: channelActionTypes.CHANNEL_PUSH_ERROR,
    channelTopic,
    error,
  };
}

/**
 *
 * @param {Object} params
 * @param {Function} params.dispatch
 */
export function phoenixChannelJoinError({ error, channelTopic }) {
  return {
    type: channelActionTypes.CHANNEL_JOIN_ERROR,
    channelTopic,
    error,
  };
}

/**
 *
 * @param {Object} params
 * @param {Function} params.dispatch
 */
export function phoenixChannelTimeOut({ error, channelTopic }) {
  return {
    type: channelActionTypes.CHANNEL_TIMEOUT,
    channelTopic,
    error,
  };
}

/**
 * @param {Object} params
 * @param {*} message
 * @param {Function} params.dispatch
 * @param {*} message
 * @param {*} socketState
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
 *
 * @param {Object} params
 * @param {Function} params.dispatch
 */
export function endPhoenixChannelProgress({
  channelTopic,
  loadingStatusKey = null,
}) {
  return {
    type: PHOENIX_CHANNEL_END_PROGRESS,
    data: {
      channelTopic,
      loadingStatusKey,
    },
  };
}

/**
 *
 * @param {Object} params
 */
export function updatePhoenixChannelLoadingStatus({
  channelTopic,
  loadingStatusKey,
}) {
  return {
    type: PHOENIX_CHANNEL_LOADING_STATUS,
    data: { channelTopic, loadingStatusKey },
  };
}

/**
 * Helper method to connect to channel within socket. Only used internally.
 * @param {Object} params
 * @param {Function} params.dispatch
 * @param {Object} socket - phoenix socket
 * @param{string} channelTopic - Name of channel/Topic
 * @param dispatch - React dispatcher
 */
const connectToPhoenixChannel = ({ socket, channelTopic, dispatch }) => {
  if (!hasValidSocket(socket)) {
    dispatch(disconnectPhoenix({ clearPhoenixDetails: true }));
    return null;
  }

  const channel = socket.channel(channelTopic);
  let presences = {};

  channel.on(phoenixChannelStatuses.CHANNEL_PRESENCE_STATE, state => {
    presences = Presence.syncState(presences, state);
    syncPresentUsers(dispatch, presences);
  });

  channel.on(phoenixChannelStatuses.CHANNEL_PRESENCE_CHANGE, diff => {
    presences = Presence.syncDiff(presences, diff);
    syncPresentUsers(dispatch, presences);
  });
  return channel;
};

/**
 * Connects to given channel name and listens on eventNames and dispatches response to given corresponding eventActionTypes,
 * @param {Object} params
 * @param {Function} params.dispatch
 * @param{string} channelTopic - Name of channel/Topic
 * @param {Array}  events - [{eventName, eventActionType}, ...] event map to listen to on channel
 * @param {String} responseActionType - on connection of the channel action type to dispatch to
 * @param {Object} socket - phoenix socket
 * @returns {Object}
 */
export function connectToPhoenixChannelForEvents({
  dispatch,
  channelTopic,
  events,
  responseActionType,
  socket,
}) {
  if (!hasValidSocket(socket)) {
    dispatch(disconnectPhoenix({ clearPhoenixDetails: true }));
    return { type: NO_ACTION };
  }
  if (!Array.isArray(events)) {
    return { type: NO_ACTION };
  }
  let channel = findChannelByName({ channelTopic, socket });
  if (!channel && !isNullOrEmpty(channelTopic)) {
    channel = connectToPhoenixChannel({ socket, channelTopic, dispatch });
    channel
      .join()
      .receive(channelStatuses.CHANNEL_OK, response => {
        dispatch(
          phoenixChannelJoin({
            response,
            channel,
          })
        );
        dispatch(endPhoenixChannelProgress({ channelTopic }));
      })
      .receive(channelStatuses.CHANNEL_ERROR, response => {
        dispatch(phoenixChannelJoinError({ error: response, channelTopic }));
        dispatch(endPhoenixChannelProgress({ channelTopic }));
      })
      .receive(channelStatuses.CHANNEL_TIMEOUT, response => {
        dispatch(
          phoenixChannelTimeOut({
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

  if (channel) {
    events.forEach(({ eventName, eventActionType }) => {
      if (!find(get(channel, 'bindings', []), { event: eventName })) {
        channel.on(eventName, data => {
          dispatch({ type: eventActionType, data, eventName });
        });
      }
    });
  }
  return { type: NO_ACTION };
}

/**
 * Will attempt to create a connection to the socket for the given channel,
 * if there is a DOMAIN_URL_NAME parameter in the url will attempt to connect to that domain using the same
 * agent and token
 * @param {Function} dispatch - store.dispatch for receiving the callbacks from the channel
 * @param{string} channelTopic - Name of channel/Topic
 * @param {?Array}  events - [{eventName, eventActionType}, ...] event map to listen to on channel
 * @param{?string} responseActionType - on connection of the channel action type to dispatch to
 * @returns {IterableIterator<*>}
 */
export function getPhoenixChannel({
  channelTopic,
  events = [],
  responseActionType = channelActionTypes.CHANNEL_JOIN,
}) {
  return {
    type: PHOENIX_GET_CHANNEL,
    data: {
      requiresAuthentication: true,
      channelTopic,
      events,
      responseActionType,
    },
  };
}

/**
 * Will attempt to create a connection to the socket for the given channel,
 * if there is a DOMAIN_URL_NAME parameter in the url will attempt to connect to that domain using the same
 * agent and token
 * @param{string} channelTopic - Name of channel/Topic
 * @param{?string} responseActionType - on connection of the channel action type to dispatch to
 * @returns {IterableIterator<*>}
 */
export function getAnonymousPhoenixChannel({
  channelTopic,
  domainUrl,
  events = [],
  responseActionType = channelActionTypes.CHANNEL_JOIN,
}) {
  return {
    type: PHOENIX_GET_CHANNEL,
    data: {
      domainUrl,
      requiresAuthentication: false,
      channelTopic,
      events,
      responseActionType,
    },
  };
}

/**
 * Will attempt to find a channel by name and topic on the given socket and push the data to the found channel,
 * on any CHANNEL_OK,CHANNEL_ERROR, CHANNEL_TIMEOUT the endProgress for the given loadingStatusKey will be dispatched
 * @param{function} dispatch
 * @param{string} channelTopic - Name of channel/Topic
 * @param{number} endProgressDelay - timeout in milliseconds if you want to delay the end progress of the loading indicator
 * @param{string} eventName - the name of the event on channel to push to
 * @param{?string} channelResponseEvent - action type to dispatch to on response from pushing to channel
 * @param{?string} channelErrorResponseEvent -  action type to dispatch to on error from pushing to channel
 * @param{object} requestData - data payload to push on the channel
 * @param{object} socket - phoenix socket
 * @param{?object} additionalData - this object will merge with the response data object received from the channel for you to use on later note
 * @param{?boolean} dispatchChannelError - false by default, determines if should an
 * on channel error occur show it to the user via a toast
 * @param{?number} channelPushTimeOut - timeout in milliseconds for pushing to the channel, default is 1500
 * @param{?boolean || string} channelTimeOutEvent - action type to dispatch to on timeout from pushing to channel
 * @param{?string} loadingStatusKey - key to push to app reducer to set loading status on
 */
export function pushToPhoenixChannel({
  channelTopic,
  endProgressDelay,
  eventName,
  channelResponseEvent = null,
  channelErrorResponseEvent = null,
  requestData,
  additionalData = null,
  dispatchChannelError = false,
  channelPushTimeOut = 15000,
  channelTimeOutEvent = false,
  loadingStatusKey = null,
}) {
  return {
    type: PHOENIX_PUSH_TO_CHANNEL,
    data: {
      channelTopic,
      endProgressDelay,
      eventName,
      channelResponseEvent,
      channelErrorResponseEvent,
      requestData,
      additionalData,
      dispatchChannelError,
      channelPushTimeOut,
      channelTimeOutEvent,
      loadingStatusKey,
    },
  };
}

/**
 * Disconnects the channel by removing it from the socket
 *
 * @param {Object} params
 * @param {Function} params.dispatch
 * @param{string} channelTopic - Name of channel/Topic
 * @param {Object} socket - phoenix socket
 */
export function removeChannel({ dispatch, channelTopic, socket }) {
  if (!hasValidSocket(socket)) {
    dispatch(disconnectPhoenix({ clearPhoenixDetails: true }));
    return { type: NO_ACTION };
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
 * @param {Object} params
 * @param{string} channelTopic - Name of channel/Topic
 * @param {Object} socket - phoenix socket
 * @returns {T} Channel
 */
export function findChannelByName({ channelTopic, socket }) {
  if (!hasValidSocket(socket)) {
    return null;
  }
  return (
    socket.channels &&
    socket.channels.find(channel => channel.topic === channelTopic)
  );
}

/**
 * Searches the connected socket channels by the channelTopic and removes the channel by un-subscribing for the given topic
 * @param {Object} params
 * @param {Function} params.dispatch
 * @param {string} channelTopic - Name of channel/Topic
 * @param {Object} socket - phoenix socket
 */
export function leavePhoenixChannel({ channelTopic, socket }) {
  const channel = findChannelByName({ channelTopic, socket });
  if (channel) {
    channel.leave();
  }
}
