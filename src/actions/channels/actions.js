/* eslint-disable no-console */
import { Presence } from 'phoenix';
import find from 'lodash/find';
import get from 'lodash/get';
import {
  NO_ACTION,
  PHOENIX_CHANNEL_END_PROGRESS,
  PHOENIX_CHANNEL_LOADING_STATUS,
  PHOENIX_GET_CHANNEL,
  PHOENIX_PUSH_TO_CHANNEL,
  PHOENIX_CLEAR_LOGIN_DETAILS,
  PHOENIX_UPDATE_LOGIN_DETAILS,
  phoenixChannelStatuses,
  channelActionTypes,
  channelStatuses,
} from '../../constants';
import { hasValidSocket } from '../../utils';
import { isNullOrEmpty } from '../../helpers';
import { disconnectPhoenix } from '../sockets/actions';

/**
 * When joining a channel will sync the present users in the channel
 * @param {function} dispatch
 * @param {Object} presences
 */
export const syncPresentUsers = (dispatch, presences) => {
  const presentUsers = [];
  Presence.list(presences, (id, { metas: [first] }) => first.user).map(user =>
    presentUsers.push(user)
  );
  dispatch({ type: channelActionTypes.CHANNEL_PRESENCE_UPDATE, presentUsers });
};

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
 * Updates the saved phoenix socket connection paramaters in storage
 * @param {Object} params - parameters
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
 * Response after joining a phoenix channel
 * @param {Object} params - parameters
 * @param {Object} params.response - response from joining channel
 * @param {Object} params.channel - phoenix channel
 */
export function phoenixChannelJoin({ response, channel }) {
  return {
    type: channelActionTypes.CHANNEL_JOIN,
    response,
    channel,
  };
}
/**
 * Response after pushing a request to phoenix channel with an error
 * @param {Object} params - parameters
 * @param {string} params.error - phoenix channel error
 * @param {string} params.channelTopic - phoenix channel topic
 */
export function phoenixChannelError({ error, channelTopic }) {
  return {
    type: channelActionTypes.CHANNEL_PUSH_ERROR,
    channelTopic,
    error,
  };
}

/**
 * Response after joining a phoenix channel with an error
 * @param {Object} params - parameters
 * @param {string} params.error - phoenix channel error
 * @param {string} params.channelTopic - phoenix channel topic
 */
export function phoenixChannelJoinError({ error, channelTopic }) {
  return {
    type: channelActionTypes.CHANNEL_JOIN_ERROR,
    channelTopic,
    error,
  };
}

/**
 * Response after joining a phoenix channel with a timeout
 * @param {Object} params - parameters
 * @param {string} params.error - phoenix channel error
 * @param {string} params.channelTopic -  Name of channel/Topic
 */
export function phoenixChannelTimeOut({ error, channelTopic }) {
  return {
    type: channelActionTypes.CHANNEL_TIMEOUT,
    channelTopic,
    error,
  };
}

/**
 * When a response from the phoenix channel is received this action is dispatched to indicate
 * the progress is completed for the loadingStatusKey passed.
 * @param {Object} params - parameters
 * @param {string} params.dispatch
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {string?} params.loadingStatusKey - key to setting loading status on
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
 * Helper method to connect to channel within socket. Only used internally.
 * @param {Object} params - parameters
 * @param {Function} params.dispatch
 * @param {Object} params.socket - phoenix socket
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {Function} params.dispatch - React dispatcher
 */
export function connectToPhoenixChannel({ socket, channelTopic, dispatch }) {
  if (!hasValidSocket(socket)) {
    dispatch(disconnectPhoenix({ clearPhoenixDetails: true }));
    return null;
  }

  const channel = socket.channel(channelTopic);
  let presences = {};

  channel.on(phoenixChannelStatuses.CHANNEL_PRESENCE_STATE, state => {
    presences = Presence.syncState(presences, state);
    // TODO implement channel presence
  });

  channel.on(phoenixChannelStatuses.CHANNEL_PRESENCE_CHANGE, diff => {
    presences = Presence.syncDiff(presences, diff);
    // TODO implement channel presence
  });
  return channel;
}

/**
 * Connects to given channel name and listens on eventNames and dispatches response to given corresponding eventActionTypes,
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {?Object[]}  params.events - [{eventName, eventActionType}, ...] event map to listen to on channel
 * @param {string} events[].eventName - The name of event to listen on channel.
 * @param {string} events[].eventActionType - The name of action to dispatch to reducer for the corresponding eventName.
 * @param {String} params.responseActionType - on connection of the channel action type to dispatch to
 * @param {Object} params.socket - phoenix socket
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
 * Will attempt to create a connection to the socket for the given channelTopic, events with the stored credentials
 * @param {Object} params - parameters
 * @param {?Object[]}  params.events - [{eventName, eventActionType}, ...] event map to listen to on channel
 * @param {string} events[].eventName - The name of event to listen on channel.
 * @param {string} events[].eventActionType - The name of action to dispatch to reducer for the corresponding eventName.
 * @param {?string} params.responseActionType - on connection of the channel, name of action to dispatch to reducer
 * @param {string} params.domainUrl - url for socket to connect to
 * @param {string} params.channelTopic - Name of channel/Topic
 */
export function getPhoenixChannel({
  channelTopic,
  events = [],
  domainUrl = null,
  responseActionType = channelActionTypes.CHANNEL_JOIN,
}) {
  return {
    type: PHOENIX_GET_CHANNEL,
    data: {
      requiresAuthentication: true,
      channelTopic,
      domainUrl,
      events,
      responseActionType,
    },
  };
}

/**
 * Will attempt to create a connection to the socket for the given channelTopic, events
 * without an authorization token
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {string} params.domainUrl - url for socket to connect to
 * @param {?Object[]}  params.events - [{eventName, eventActionType}, ...] event map to listen to on channel
 * @param {string} events[].eventName - The name of event to listen on channel.
 * @param {string} events[].eventActionType - The name of action to dispatch to reducer for the corresponding eventName.
 * @param {?string} params.responseActionType - on connection of the channel, name of action to dispatch to reducer
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
 * on any PHOENIX_CHANNEL_OK,PHOENIX_CHANNEL_ERROR, PHOENIX_CHANNEL_TIMEOUT the endProgress for the given loadingStatusKey will be dispatched
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {number} params.endProgressDelay - timeout in milliseconds if you want to delay the end progress of the loading indicator
 * @param {string} params.eventName - the name of the event on channel to push to
 * @param {?string} params.channelResponseEvent - name of action to dispatch to reducer on response from pushing to channel
 * @param {?string} params.channelErrorResponseEvent -  name of action to dispatch to reducer on  error from pushing to channel
 * @param {object} params.requestData - data payload to push on the channel
 * @param {?object} params.additionalData - this object will merge with the response data object received from the channel for you to use on later note
 * @param {?boolean} params.dispatchChannelError - false by default, determines if should an on channel error occur dispatch PHOENIX_CHANNEL_ERROR to the reducer
 * @param {?number} params.channelPushTimeOut - timeout in milliseconds for pushing to the channel, default is 1500
 * @param {?boolean || string} params.channelTimeOutEvent - name of action to dispatch to reducer on timeout from pushing to channel
 * @param {?string} params.loadingStatusKey - key indicator, to separate loading status for different actions, to push to reducer
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
 * @param {Object} params - parameters
 * @param {Function} params.dispatch
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {Object} params.socket - phoenix socket
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
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {Object} params.socket - phoenix socket
 * @returns {T} Channel
 */
export function findChannelByName({ channelTopic, socket }) {
  if (!hasValidSocket(socket)) {
    return null;
  }
  return socket.channels && socket.channels.find(channel => channel.topic === channelTopic);
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
