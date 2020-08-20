/* eslint-disable no-console */
import find from 'lodash/find';
import get from 'lodash/get';
import {
  PHOENIX_CHANNEL_END_PROGRESS,
  PHOENIX_GET_CHANNEL,
  PHOENIX_PUSH_TO_CHANNEL,
  channelActionTypes,
  channelStatuses,
  NO_PHOENIX_CHANNEL_FOUND,
  INVALID_SOCKET,
  PHOENIX_CHANNEL_UPDATED,
} from '../../constants';
import { hasValidSocket } from '../../utils';
import { isNullOrEmpty } from '../../helpers';
import { disconnectPhoenix } from '../sockets/actions';

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
 * Invoked only in two cases. 1) the channel explicitly closed on the server, or 2). The client explicitly closed, by calling channel.leave()
 * @param {Object} params - parameters
 * @param {Object} params.channel - phoenix channel
 */
export function phoenixChannelClose({ channel }) {
  return {
    type: channelActionTypes.CHANNEL_CLOSE,
    channel,
  };
}
/**
 * Response after pushing a request to phoenix channel with an error
 * @param {Object} params - parameters
 * @param {string} params.error - phoenix channel error
 * @param {string} params.channel - phoenix channel
 * @param {string} params.channelTopic - phoenix channel topic
 */
export function phoenixChannelPushError({ error, channelTopic, channel }) {
  return {
    type: channelActionTypes.CHANNEL_PUSH_ERROR,
    channel,
    channelTopic,
    error,
  };
}

/**
 * Invoked if the socket connection drops, or the channel crashes on the server. In either case, a channel rejoin is attempted automatically in an exponential backoff manner
 * @param {Object} params - parameters
 * @param {string} params.channel - phoenix channel
 * @param {string} params.channelTopic - phoenix channel topic
 */
export function phoenixChannelError({ channelTopic, channel }) {
  return {
    type: channelActionTypes.CHANNEL_ERROR,
    channel,
    channelTopic,
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
 * Will attempt to create a connection to the socket for the given channelTopic, events with the stored credentials
 * @param {Object} params - parameters
 * @param {?Object[]}  params.events - [{eventName, eventActionType}, ...] event map to listen to on channel
 * @param {string} events[].eventName - The name of event to listen on channel.
 * @param {string} events[].eventActionType - The name of action to dispatch to reducer for the corresponding eventName.
 * @param {?string} params.responseActionType - on connection of the channel, name of action to dispatch to reducer
 * @param {string?} params.domainUrl - url for socket to connect to, by default will use PHOENIX_SOCKET_DOMAIN storage key
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {String?} params.token - token for channel
 */
export function getPhoenixChannel({
  channelTopic,
  events = [],
  token = null,
  domainUrl = null,
  responseActionType = channelActionTypes.CHANNEL_JOIN,
}) {
  return {
    type: PHOENIX_GET_CHANNEL,
    data: {
      requiresAuthentication: true,
      channelTopic,
      channelToken: token,
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
 * @param {String?} params.token - token for channel
 */
export function getAnonymousPhoenixChannel({
  channelTopic,
  domainUrl,
  events = [],
  token = null,
  responseActionType = channelActionTypes.CHANNEL_JOIN,
}) {
  return {
    type: PHOENIX_GET_CHANNEL,
    data: {
      domainUrl,
      requiresAuthentication: false,
      channelTopic,
      channelToken: token,
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
 * @param {number?|boolean} params.endProgressDelay - timeout in milliseconds if you want to delay the dispatch of the endProgress action
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
  endProgressDelay = false,
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
