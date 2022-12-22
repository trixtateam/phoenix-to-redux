import {
  channelActionTypes,
  channelStatuses,
  PHOENIX_CONNECT_SOCKET,
  PHOENIX_DISCONNECT_SOCKET,
  PHOENIX_GET_CHANNEL,
  PHOENIX_LEAVE_CHANNEL,
  PHOENIX_LEAVE_CHANNEL_EVENTS,
  PHOENIX_PUSH_TO_CHANNEL,
  socketStatuses,
} from '../../constants';
import {
  selectPhoenixSocketDetails,
  selectPhoenixSocketDomain,
} from '../../selectors/socket/selectors';
import { formatSocketDomain, getDomainKeyFromUrl } from '../../services/helpers';
import { socketService } from '../../services/socket';
import { isEqual, isNullOrEmpty } from '../../utils';
import {
  connectToPhoenixChannelForEvents,
  endPhoenixChannelProgress,
  updatePhoenixChannelLoadingStatus,
  leaveEventsForPhoenixChannel,
} from './actions';
import {
  phoenixChannelLeave,
  phoenixChannelPushError,
  phoenixChannelTimeOut,
} from './actions/channel';
import {
  disconnectPhoenixSocket,
  connectPhoenixSocket,
  closePhoenixSocket,
  openPhoenixSocket,
  phoenixSocketError,
} from './actions/socket';

/**
 * Redux Middleware to integrate channel and socket messages from phoenix to redux
 * corresponding actions to dispatch to phoenix reducer
 */
export const createPhoenixChannelMiddleware = () => (store) => (next) => (action) => {
  switch (action.type) {
    case PHOENIX_CONNECT_SOCKET: {
      const { dispatch, getState } = store;
      const currentState = getState();
      const { domainUrl, params } = action.data;
      const currentDomainKey = selectPhoenixSocketDomain(currentState);
      const domainKey = getDomainKeyFromUrl(domainUrl);

      // if socket exists
      if (socketService.socket) {
        if (
          isEqual(socketService.socket.params(), params) ||
          !isEqual(domainKey, currentDomainKey)
        ) {
          socketService.disconnect(null, 1000, 'Upgraded socket to authenticated session');
        }
      }

      const domain = formatSocketDomain(domainUrl);
      const socket = socketService.initialize(domain, params);
      if (socket) {
        socket.onError((error) =>
          dispatch(
            phoenixSocketError({
              domainKey,
              error,
              socketState: socket.connectionState(),
            })
          )
        );
        socket.onOpen(() => dispatch(openPhoenixSocket({ socket, domainKey })));
        socket.onClose(() => dispatch(closePhoenixSocket({ socket, domainKey })));
        socket.connect();
        dispatch(connectPhoenixSocket({ domainKey, socket }));
      }

      return store.getState();
    }
    case PHOENIX_DISCONNECT_SOCKET: {
      const { dispatch, getState } = store;
      const currentState = getState();
      const { socket } = socketService;
      const domainKey = selectPhoenixSocketDomain(currentState);
      if (socket) {
        socketService.disconnect(null, 1000, 'Intentionally disconnecting socket');
        dispatch(disconnectPhoenixSocket({ domainKey, socket }));
      }
      return store.getState();
    }
    case PHOENIX_PUSH_TO_CHANNEL: {
      const { dispatch } = store;
      const {
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
      } = action.data;
      const channel = socketService.findChannel(channelTopic);
      if (!channel) return store.getState();

      if (!isNullOrEmpty(loadingStatusKey)) {
        dispatch(updatePhoenixChannelLoadingStatus({ channelTopic, loadingStatusKey }));
      }
      channel
        .push(eventName, requestData, channelPushTimeOut)
        .receive(channelStatuses.CHANNEL_OK, (data) => {
          if (endProgressDelay) {
            setTimeout(() => {
              dispatch(endPhoenixChannelProgress({ channelTopic, loadingStatusKey }));
            }, endProgressDelay);
          } else {
            dispatch(endPhoenixChannelProgress({ channelTopic, loadingStatusKey }));
          }
          dispatch({ type: channelActionTypes.CHANNEL_PUSH, data });
          if (channelResponseEvent) {
            if (additionalData) {
              dispatch({
                type: channelResponseEvent,
                channelTopic,
                data,
                additionalData,
                dispatch,
              });
            } else {
              dispatch({ type: channelResponseEvent, channelTopic, data, dispatch });
            }
          }
        })
        .receive(channelStatuses.CHANNEL_ERROR, (error) => {
          if (dispatchChannelError) {
            dispatch(phoenixChannelPushError({ error, channelTopic, channel }));
          }
          dispatch(endPhoenixChannelProgress({ channelTopic, loadingStatusKey }));
          if (channelErrorResponseEvent) {
            if (additionalData) {
              dispatch({
                type: channelErrorResponseEvent,
                channelTopic,
                loadingStatusKey,
                additionalData,
                error,
                dispatch,
              });
            } else {
              dispatch({
                type: channelErrorResponseEvent,
                channelTopic,
                loadingStatusKey,
                error,
                dispatch,
              });
            }
          }
        })
        .receive(channelStatuses.CHANNEL_TIMEOUT, (error) => {
          if (channelTimeOutEvent) {
            dispatch({
              type: channelTimeOutEvent,
              channelTopic,
              loadingStatusKey,
              additionalData,
              error: { message: 'Request time out', ...error },
            });
          }
          dispatch(phoenixChannelTimeOut({ error, channelTopic, channel }));
          dispatch(endPhoenixChannelProgress({ channelTopic, loadingStatusKey }));
        });

      return store.getState();
    }
    case PHOENIX_LEAVE_CHANNEL: {
      const { dispatch } = store;
      const { channelTopic } = action.data;
      const channel = socketService.findChannel(channelTopic);
      if (channel) {
        socketService.leaveChannel(channelTopic).receive(channelStatuses.CHANNEL_OK, () => {
          dispatch(phoenixChannelLeave({ channel }));
        });
      }
      return store.getState();
    }
    case PHOENIX_LEAVE_CHANNEL_EVENTS: {
      const { dispatch } = store;
      const { channelTopic, events } = action.data;

      leaveEventsForPhoenixChannel({ channelTopic, events, dispatch });
      return store.getState();
    }
    case PHOENIX_GET_CHANNEL: {
      const { dispatch, getState } = store;
      const currentState = getState();
      let { socket } = socketService;
      const socketDetails = selectPhoenixSocketDetails(currentState);
      const phoenixDomain = selectPhoenixSocketDomain(currentState);
      const socketDomain = socket ? socket.endPoint : '';
      const { channelTopic, domainUrl, events, channelToken, logPresence, additionalData } =
        action.data;

      const domain = formatSocketDomain(domainUrl || phoenixDomain);
      const loggedInDomain = `${domain}/websocket`;
      const domainKey = getDomainKeyFromUrl(domain);

      if (!isEqual(getDomainKeyFromUrl(socketDomain), getDomainKeyFromUrl(loggedInDomain))) {
        socket = false;
      }

      const connectionState = socket && socket.connectionState();
      if (!socket || (connectionState === socketStatuses.CLOSED && socket.closeWasClean)) {
        socket = socketService.initialize(domain, socketDetails);
        if (socket) {
          socket.onError((error) =>
            dispatch(
              phoenixSocketError({
                domainKey,
                error,
                socketState: socket.connectionState(),
              })
            )
          );
          socket.onOpen(() => dispatch(openPhoenixSocket({ socket, domainKey })));
          socket.onClose(() => dispatch(closePhoenixSocket({ socket, domainKey })));
          socket.connect();
          dispatch(connectPhoenixSocket({ domainKey, socket }));
        }
      }
      dispatch(
        connectToPhoenixChannelForEvents({
          dispatch,
          channelTopic,
          additionalData,
          events,
          logPresence,
          token: channelToken,
        })
      );

      return store.getState();
    }
    default:
      return next(action);
  }
};
