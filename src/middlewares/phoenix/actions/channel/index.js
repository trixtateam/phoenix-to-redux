// eslint-disable-next-line no-unused-vars
import { channelActionTypes } from '../../../../constants';

/**
 * Response after joining a phoenix channel
 * @param {Object} params - parameters
 * @param {Object} params.response - response from joining channel
 * @param {Object?} params.additionalData - addtionalData passed when joining a channel
 * @param {Channel} params.channel - phoenix channel
 */
export function phoenixChannelJoin({ response, channel, additionalData = null }) {
  return {
    type: channelActionTypes.CHANNEL_JOIN,
    response,
    additionalData,
    channel,
  };
}

/**
 * Response after leaving a phoenix channel
 * @param {Object} params - parameters
 * @param {Channel} params.channel - phoenix channel
 */
export function phoenixChannelLeave({ channel }) {
  return {
    type: channelActionTypes.CHANNEL_LEAVE,
    channel,
  };
}

/**
 * Pushes the presence list for the channel in phoenixReducer
 * @param {Object} params - parameters
 * @param {Array} params.list - list of present users
 * @param {Channel} params.channel - phoenix channel
 */
export function channelPresenceUpdate({ list, channel }) {
  return {
    type: channelActionTypes.CHANNEL_PRESENCE_UPDATE,
    list,
    channel,
  };
}

/**
 * Response when a user leaves a channel
 * @param {Object} params - parameters
 * @param {Object} params.leftPrescence
 * @param {String} params.id - id of user
 * @param {Object} params.current - metas for prescence
 * @param {Channel} params.channel - phoenix channel
 */
export function channelPresenceLeave({ id, current, leftPrescence, channel }) {
  return {
    type: channelActionTypes.CHANNEL_PRESENCE_LEAVE,
    id,
    current,
    leftPrescence,
    channel,
  };
}

/**
 * Response when a user leaves a channel
 * @param {Object} params - parameters
 * @param {Object} params.newPrescence
 * @param {String} params.id - id of user
 * @param {Object} params.current - !current user has entered for the first time
 * @param {Channel} params.channel - phoenix channel
 */
export function channelPresenceJoin({ id, current, newPrescence, channel }) {
  return {
    type: channelActionTypes.CHANNEL_PRESENCE_JOIN,
    id,
    current,
    newPrescence,
    channel,
  };
}

/**
 * Invoked only in two cases. 1) the channel explicitly closed on the server, or 2). The client explicitly closed, by calling channel.leave()
 * @param {Object} params - parameters
 * @param {Channel} params.channel - phoenix channel
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
 * @param {Channel} params.channel - phoenix channel
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
 * @param {Channel} params.channel - phoenix channel
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
 * @param {Object?} params.additionalData - addtionalData passed when joining a channel
 * @param {string} params.channelTopic - phoenix channel topic
 * @param {Channel} params.channel - phoenix channel
 */
export function phoenixChannelJoinError({ error, channelTopic, channel, additionalData = null }) {
  return {
    type: channelActionTypes.CHANNEL_JOIN_ERROR,
    channelTopic,
    additionalData,
    channel,
    error,
  };
}

/**
 * Response after joining a phoenix channel with a timeout
 * @param {Object} params - parameters
 * @param {string} params.error - phoenix channel error
 * @param {Object?} params.additionalData - addtionalData passed when joining a channel
 * @param {string} params.channelTopic -  Name of channel/Topic
 * @param {Channel} params.channel - phoenix channel
 */
export function phoenixChannelTimeOut({ error, channelTopic, channel, additionalData = null }) {
  return {
    type: channelActionTypes.CHANNEL_TIMEOUT,
    channelTopic,
    additionalData,
    channel,
    error,
  };
}
