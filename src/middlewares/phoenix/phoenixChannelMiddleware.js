import isEqual from 'lodash/isEqual';
import merge from 'lodash/merge';
import {
  PHOENIX_GET_CHANNEL,
  PHOENIX_DISCONNECT_SOCKET,
  PHOENIX_CONNECT_SOCKET,
  PHOENIX_PUSH_TO_CHANNEL,
  channelStatuses,
  channelActionTypes,
  socketStatuses,
  PHOENIX_LEAVE_CHANNEL,
} from '../../constants';
import { formatSocketDomain, hasValidSocket } from '../../utils';
import { isNullOrEmpty, getDomainKeyFromUrl } from '../../helpers';
import { disconnectPhoenix } from '../../actions';
import {
  connectToPhoenixChannelForEvents,
  findChannelByName,
  endPhoenixChannelProgress,
  updatePhoenixChannelLoadingStatus,
  setUpSocket,
  leaveChannel,
} from './actions';
import {
  selectPhoenixSocket,
  selectPhoenixSocketDetails,
  selectPhoenixSocketDomain,
} from '../../selectors/socket/selectors';
import { disconnectPhoenixSocket } from './actions/socket';
import { phoenixChannelPushError, phoenixChannelTimeOut } from './actions/channel';

/**
 * Redux Middleware to integrate channel and socket messages from phoenix to redux
 * corresponding actions to dispatch to phoenix reducer
 */
export const createPhoenixChannelMiddleware = () => (store) => (next) => (action) => {
  switch (action.type) {
    case PHOENIX_CONNECT_SOCKET: {
      const { dispatch } = store;
      const { domainUrl, params } = action.data;
      const currentState = store.getState();
      let socket = selectPhoenixSocket(currentState);
      const socketDetails = selectPhoenixSocketDetails(currentState);
      const activeDomainKey = selectPhoenixSocketDomain(currentState);
      if (!isEqual(socketDetails, params)) {
        const domainKey = getDomainKeyFromUrl({ domainUrl });
        if (isEqual(domainKey, activeDomainKey)) {
          socket.disconnect(null, 1000, 'Upgraded socket to authenticated session');
          dispatch(
            setUpSocket({
              dispatch,
              domain: domainUrl,
              params,
            })
          );
        }
      }

      socket = selectPhoenixSocket(store.getState());
      if (!socket && domainUrl && params) {
        dispatch(
          setUpSocket({
            dispatch,
            domain: domainUrl,
            params,
          })
        );
      }
      return store.getState();
    }
    case PHOENIX_DISCONNECT_SOCKET: {
      const { dispatch } = store;
      const currentState = store.getState();
      const socket = selectPhoenixSocket(currentState);
      const domainKey = selectPhoenixSocketDomain(currentState);
      if (socket && !isNullOrEmpty(socket) && socket.disconnect) {
        socket.disconnect();
        dispatch(disconnectPhoenixSocket({ domainKey, socket }));
      }
      return store.getState();
    }
    case PHOENIX_PUSH_TO_CHANNEL: {
      const { dispatch } = store;
      const currentState = store.getState();
      const socket = selectPhoenixSocket(currentState);
      if (!hasValidSocket(socket)) {
        dispatch(disconnectPhoenix());
      }
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
      const channel = findChannelByName({ channelTopic, socket });

      if (channel) {
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
                  data: merge(data, additionalData),
                  dispatch,
                });
              } else {
                dispatch({ type: channelResponseEvent, data, dispatch });
              }
            }
          })
          .receive(channelStatuses.CHANNEL_ERROR, (data) => {
            if (dispatchChannelError) {
              dispatch(phoenixChannelPushError({ error: data, channelTopic, channel }));
            }
            dispatch(endPhoenixChannelProgress({ channelTopic, loadingStatusKey }));
            if (channelErrorResponseEvent) {
              if (additionalData) {
                dispatch({
                  type: channelErrorResponseEvent,
                  channelTopic,
                  loadingStatusKey,
                  data: additionalData,
                  error: data,
                  dispatch,
                });
              } else {
                dispatch({
                  type: channelErrorResponseEvent,
                  channelTopic,
                  loadingStatusKey,
                  error: data,
                  dispatch,
                });
              }
            }
          })
          .receive(channelStatuses.CHANNEL_TIMEOUT, (data) => {
            if (channelTimeOutEvent) {
              dispatch({
                type: channelTimeOutEvent,
                channelTopic,
                loadingStatusKey,
                data: additionalData,
                error: merge({ message: 'Request time out' }, data),
              });
            }
            dispatch(phoenixChannelTimeOut({ error: data, channelTopic, channel }));
            dispatch(endPhoenixChannelProgress({ channelTopic, loadingStatusKey }));
          });
      }
      return store.getState();
    }
    case PHOENIX_LEAVE_CHANNEL: {
      const { dispatch } = store;
      const currentState = store.getState();
      const socket = selectPhoenixSocket(currentState);

      const { channelTopic } = action.data;
      leaveChannel({ channelTopic, socket, dispatch });
      return store.getState();
    }
    case PHOENIX_GET_CHANNEL: {
      const { dispatch } = store;
      const currentState = store.getState();
      let socket = selectPhoenixSocket(currentState);
      const socketDetails = selectPhoenixSocketDetails(currentState);
      const phoenixDomain = selectPhoenixSocketDomain(currentState);
      const socketDomain = socket ? socket.endPoint : '';
      const { channelTopic, domainUrl, events, channelToken, logPresence } = action.data;

      const domain = formatSocketDomain({ domainString: domainUrl || phoenixDomain });
      const loggedInDomain = `${domain}/websocket`;

      if (!isEqual(socketDomain, loggedInDomain)) {
        socket = false;
      }

      const connectionState = socket && socket.connectionState();
      if (!socket || (connectionState === socketStatuses.CLOSED && socket.closeWasClean)) {
        dispatch(
          setUpSocket({
            dispatch,
            domain,
            params: socketDetails,
          })
        );
        socket = selectPhoenixSocket(store.getState());
      }
      dispatch(
        connectToPhoenixChannelForEvents({
          dispatch,
          channelTopic,
          events,
          logPresence,
          token: channelToken,
          socket,
        })
      );

      return store.getState();
    }
    default:
      return next(action);
  }
};
