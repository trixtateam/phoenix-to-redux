// eslint-disable-next-line no-unused-vars
import { Channel, Presence } from 'phoenix';
import { disconnectPhoenix, leavePhoenixChannel } from '../../../actions';
import {
  channelActionTypes,
  channelStatuses,
  NO_PHOENIX_CHANNEL_FOUND,
  phoenixChannelStatuses,
  PHOENIX_CHANNEL_END_PROGRESS,
  PHOENIX_CHANNEL_LOADING_STATUS,
} from '../../../constants';
import { hasValidSocket } from '../../../services/helpers';
import { socketService } from '../../../services/socket';
import { get, isNullOrEmpty } from '../../../utils';
import {
  channelPresenceJoin,
  channelPresenceLeave,
  channelPresenceUpdate,
  phoenixChannelClose,
  phoenixChannelError,
  phoenixChannelJoin,
  phoenixChannelJoinError,
  phoenixChannelTimeOut,
} from './channel';

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

  const channel = socketService.channel(channelTopic, token ? { token } : undefined);
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
 * @param {Object} params.socketService - socket service
 * @param {Boolean} params.logPresence - determines if you presence should be tracked for the channel
 * @returns {Object}
 */
export function connectToPhoenixChannelForEvents({
  dispatch,
  channelTopic,
  logPresence,
  events,
  token = null,
}) {
  const { socket } = socketService;
  let channel = socketService.findChannel(channelTopic);
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
        dispatch(endPhoenixChannelProgress({ channelTopic, loadingStatusKey: channelTopic }));
      })
      .receive(channelStatuses.CHANNEL_ERROR, (response) => {
        if (response && response.reason === 'unauthorized') {
          dispatch(leavePhoenixChannel({ channelTopic }));
        }
        dispatch(phoenixChannelJoinError({ error: response, channelTopic, channel }));
        dispatch(endPhoenixChannelProgress({ channelTopic, loadingStatusKey: channelTopic }));
      })
      .receive(channelStatuses.CHANNEL_TIMEOUT, (response) => {
        dispatch(
          phoenixChannelTimeOut({
            channelTopic,
            error: response,
            channel,
          })
        );
        dispatch(endPhoenixChannelProgress({ channelTopic, loadingStatusKey: channelTopic }));
      });

    return {
      type: channelActionTypes.CHANNEL_UPDATED,
      presence,
      channel,
    };
  }

  if (channel && events) {
    events.forEach(({ eventName, eventActionType }) => {
      const bindings = get(channel, 'bindings', []);
      if (!bindings.find(({ event }) => event === eventName)) {
        channel.on(eventName, (data) => {
          dispatch({ type: eventActionType, data, eventName, channelTopic });
        });
      }
    });
  }
  return { type: channelActionTypes.CHANNEL_UPDATED, channel, presence };
}

/**
 * Unsubscribes off of channel events to given channel name
 * @param {Object} params - parameters
 * @param {Function} params.dispatch - function to dispatch to redux store
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {string[]=} [params.events=[]]  params.events - [eventName] event map to unsubcribe to on channel
 * @param {Object} params.socket - phoenix socket
 * @returns {Object}
 */
export function leaveEventsForPhoenixChannel({ channelTopic, dispatch, events }) {
  const channel = socketService.findChannel(channelTopic);

  if (channel && events) {
    events.forEach((eventName) => {
      const bindings = get(channel, 'bindings', []);
      if (bindings.find(({ event }) => event === eventName)) {
        channel.off(eventName);
      }
    });
    dispatch({ type: channelActionTypes.CHANNEL_UPDATED, channel });
  }
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
