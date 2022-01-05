/* eslint-disable no-console */
import {
  PHOENIX_GET_CHANNEL,
  PHOENIX_LEAVE_CHANNEL,
  PHOENIX_LEAVE_CHANNEL_EVENTS,
  PHOENIX_PUSH_TO_CHANNEL,
} from '../../constants';

/**
 * Will leave the channel for  given channelTopic,Unsubscribes off of channel events
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 */
export function leavePhoenixChannel({ channelTopic }) {
  return {
    type: PHOENIX_LEAVE_CHANNEL,
    data: {
      channelTopic,
    },
  };
}

/**
 * Unsubscribes off of channel events for  given channelTopic
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {string[]} params.events - Array of event names to unsubscribe to
 */
export function leavePhoenixChannelEvents({ channelTopic, events }) {
  return {
    type: PHOENIX_LEAVE_CHANNEL_EVENTS,
    data: {
      channelTopic,
      events,
    },
  };
}

/**
 * Unsubscribes off of channel events for given channelTopic
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {string} params.event - event name to unsubscribe to
 */
export function leavePhoenixChannelEvent({ channelTopic, event }) {
  return {
    type: PHOENIX_LEAVE_CHANNEL_EVENTS,
    data: {
      channelTopic,
      events: [event],
    },
  };
}

/**
 * Will attempt to create a connection to the socket for the given channelTopic, Subscribes on channel events
 * @param {Object} params - parameters
 * @param {?Object[]}  params.events - [{eventName, eventActionType}, ...] event map to listen to on channel
 * @param {string} events[].eventName - The name of event to listen on channel.
 * @param {string} events[].eventActionType - The name of action to dispatch to reducer for the corresponding eventName.
 * @param {string?} params.domainUrl - url for socket to connect to, by default will use PHOENIX_SOCKET_DOMAIN storage key
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {String?} params.token - token for channel
 * @param {Boolean?} params.logPresence - determines if your presence should be tracked for the channel
 */
export function getPhoenixChannel({
  logPresence = false,
  channelTopic,
  channelResponseEvent = null,
  channelErrorResponseEvent = null,
  events = [],
  token = '',
  domainUrl = '',
}) {
  return {
    type: PHOENIX_GET_CHANNEL,
    data: {
      channelTopic,
      channelResponseEvent,
      channelErrorResponseEvent,
      logPresence,
      channelToken: token,
      domainUrl,
      events,
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
 * @param {?object} params.additionalData - this object will be available as additionalData on the response data object received from the channel for you to use on later note
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
