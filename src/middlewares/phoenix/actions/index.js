// eslint-disable-next-line no-unused-vars
import { Socket, Presence, Channel } from 'phoenix';
import {
  PHOENIX_CHANNEL_LOADING_STATUS,
  socketActionTypes,
  socketStatuses,
  channelActionTypes,
  PHOENIX_CHANNEL_END_PROGRESS,
  NO_PHOENIX_CHANNEL_FOUND,
  channelStatuses,
  phoenixChannelStatuses,
} from '../../../constants';
import {
  formatSocketDomain,
  getDomainKeyFromUrl,
  get,
  hasValidSocket,
  isNullOrEmpty,
} from '../../../utils';
import { disconnectPhoenix, leavePhoenixChannel } from '../../../actions';
import {
  channelPresenceJoin,
  channelPresenceLeave,
  channelPresenceUpdate,
  phoenixChannelClose,
  phoenixChannelError,
  phoenixChannelJoin,
  phoenixChannelJoinError,
  phoenixChannelLeave,
  phoenixChannelTimeOut,
} from './channel';
import { phoenixSocketError, openPhoenixSocket, closePhoenixSocket } from './socket';

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
 * @param {Function} params.dispatch - function to dispatch to redux store
 * @param {Object} params.socket - phoenix socket
 */
export function leaveChannel({ dispatch, channelTopic, socket }) {
  const channel = findChannelByName({ channelTopic, socket });
  if (channel) {
    channel.leave().receive(channelStatuses.CHANNEL_OK, () => {
      dispatch(phoenixChannelLeave({ channel }));
    });
  }
}

/**
 * When a response from the phoenix channel is received this action is dispatched to indicate
 * the progress is completed for the loadingStatusKey passed.
 * @param {Object} params - parameters
 * @param {Function} params.dispatch - function to dispatch to redux store
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
 * @param {Function} params.dispatch - function to dispatch to redux store
 * @param {Object} params.socket - phoenix socket
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {string=} [params.token=null] params.token - token for channel
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

  channel.on(phoenixChannelStatuses.CHANNEL_PRESENCE_CHANGE, (data) => {
    dispatch({
      type: channelActionTypes.CHANNEL_PRESENCE_CHANGE,
      data,
      eventName: phoenixChannelStatuses.CHANNEL_PRESENCE_CHANGE,
      channelTopic,
    });
  });

  channel.on(phoenixChannelStatuses.CHANNEL_PRESENCE_STATE, (data) => {
    dispatch({
      type: channelActionTypes.CHANNEL_PRESENCE_STATE,
      data,
      eventName: phoenixChannelStatuses.CHANNEL_PRESENCE_STATE,
      channelTopic,
    });
  });

  return channel;
}

/**
 * Pushes the presence for the channel in phoenixReducer to log
 * presence state
 * @param {Object} parameters
 * @param {Channel} - parameters.channel - phoenix channel
 */
export function connectPhoenixChannelPresence({ channel, dispatch }) {
  if (!channel) return null;

  const presence = new Presence(channel);
  presence.onJoin((id, current, newPrescence) => {
    dispatch(channelPresenceJoin({ id, current, newPrescence, channel }));
    if (!current) {
      // console.log('user has entered for the first time', newPrescence);
    } else {
      // console.log('user additional presence', newPrescence);
    }
  });

  // detect if user has left from all tabs/devices, or is still present
  presence.onLeave((id, current, leftPrescence) => {
    dispatch(channelPresenceLeave({ id, current, leftPrescence, channel }));
    if (current.metas.length === 0) {
      // console.log('user has left from all devices', leftPrescence);
    } else {
      // console.log('user left from a device', leftPrescence);
    }
  });
  // receive presence data from server
  presence.onSync(() => {
    dispatch(channelPresenceUpdate({ list: presence.list(), channel }));
  });

  return presence;
}

/**
 * Connects to given channel name and listens on eventNames and dispatches response to given corresponding eventActionTypes,
 * @param {Object} params - parameters
 * @param {Function} params.dispatch - function to dispatch to redux store
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {Object[]=} [params.events=[]]  params.events - [{eventName, eventActionType}, ...] event map to listen to on channel
 * @param {string} events[].eventName - The name of event to listen on channel.
 * @param {string} events[].eventActionType - The name of action to dispatch to reducer for the corresponding eventName.
 * @param {String} params.responseActionType - on connection of the channel action type to dispatch to
 * @param {String=} [params.token = null] params.token - token for channel
 * @param {Object} params.socket - phoenix socket
 * @param {Boolean} params.logPresence - determines if you presence should be tracked for the channel
 * @returns {Object}
 */
export function connectToPhoenixChannelForEvents({
  dispatch,
  channelTopic,
  logPresence,
  events,
  token = null,
  socket,
}) {
  let channel = findChannelByName({ channelTopic, socket });
  const presence = logPresence ? connectPhoenixChannelPresence({ dispatch, channel }) : false;

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
        if (response && response.reason === 'unauthorized') {
          dispatch(leavePhoenixChannel({ channelTopic }));
        }
        dispatch(phoenixChannelJoinError({ error: response, channelTopic, channel }));
        dispatch(endPhoenixChannelProgress({ channelTopic }));
      })
      .receive(channelStatuses.CHANNEL_TIMEOUT, (response) => {
        dispatch(
          phoenixChannelTimeOut({
            channelTopic,
            error: response,
            channel,
          })
        );
        dispatch(endPhoenixChannelProgress({ channelTopic }));
      });

    return {
      type: channelActionTypes.CHANNEL_UPDATED,
      presence,
      channel,
    };
  }

  if (channel && events) {
    events.forEach(({ eventName, eventActionType }) => {
      if (!get(channel, 'bindings', []).find({ event: eventName })) {
        channel.on(eventName, (data) => {
          dispatch({ type: eventActionType, data, eventName, channelTopic });
        });
      }
    });
  }
  return { type: channelActionTypes.CHANNEL_UPDATED, channel, presence };
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
      if (connectionState === socketStatuses.CLOSED || connectionState === socketStatuses.CLOSING) {
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
