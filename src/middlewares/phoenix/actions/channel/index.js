import { channelActionTypes } from '../../../../constants';

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
