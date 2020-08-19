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
} from '../../constants';
import { formatSocketDomain, hasValidSocket } from '../../utils';
import { isNullOrEmpty } from '../../helpers';

import {
  connectToPhoenixChannelForEvents,
  findChannelByName,
  phoenixChannelError,
  endPhoenixChannelProgress,
  phoenixChannelTimeOut,
  disconnectPhoenix,
  clearPhoenixLoginDetails,
} from '../../actions';

import { disconnectPhoenixSocket, updatePhoenixChannelLoadingStatus, setUpSocket } from './actions';
import {
  selectPhoenixSocket,
  selectPhoenixSocketDetails,
  selectPhoenixSocketDomain,
} from '../../selectors/socket/selectors';

/**
 * Redux Middleware to integrate channel and socket messages from phoenix to redux
 * corresponding actions to dispatch to phoenix reducer
 */
export const createPhoenixChannelMiddleware = () => (store) => (next) => (action) => {
  switch (action.type) {
    case PHOENIX_CONNECT_SOCKET: {
      const { dispatch } = store;
      const { domainUrl, token, agentId } = action.data;
      console.info('PHOENIX_CONNECT_SOCKET domainUrl', domainUrl);
      const socket = selectPhoenixSocket(store.getState());
      console.info('PHOENIX_CONNECT_SOCKET socket', socket);
      if (!socket && domainUrl && token && agentId) {
        dispatch(
          setUpSocket({
            dispatch,
            domain: domainUrl,
            token,
            agentId,
            requiresAuthentication: true,
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
      const { clearPhoenixDetails } = action.data;
      console.info('PHOENIX_DISCONNECT_SOCKET socket', socket);
      if (socket && !isNullOrEmpty(socket) && socket.disconnect) {
        socket.disconnect();
        dispatch(disconnectPhoenixSocket({ domainKey, socket }));

        if (clearPhoenixDetails) {
          dispatch(clearPhoenixLoginDetails());
        }
      }
      return store.getState();
    }
    case PHOENIX_PUSH_TO_CHANNEL: {
      const { dispatch } = store;
      const currentState = store.getState();
      const socket = selectPhoenixSocket(currentState);
      if (!hasValidSocket(socket)) {
        console.info('PHOENIX_PUSH_TO_CHANNEL disconnectPhoenix invalid socket', socket);
        dispatch(disconnectPhoenix({ clearPhoenixDetails: true }));
      }
      console.info('PHOENIX_PUSH_TO_CHANNEL socket', socket);

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
              dispatch(phoenixChannelError({ error: data, channelTopic }));
            }
            dispatch(endPhoenixChannelProgress({ channelTopic, loadingStatusKey }));
            if (channelErrorResponseEvent) {
              if (additionalData) {
                dispatch({
                  type: channelErrorResponseEvent,
                  channelTopic,
                  error: merge(data, additionalData),
                  dispatch,
                });
              } else {
                dispatch({
                  type: channelErrorResponseEvent,
                  channelTopic,
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
                error: additionalData
                  ? merge({ message: 'Request time out' }, additionalData)
                  : 'Request time out',
              });
            }
            dispatch(phoenixChannelTimeOut({ error: data, channelTopic }));
            dispatch(endPhoenixChannelProgress({ channelTopic, loadingStatusKey }));
          });
      }
      return store.getState();
    }
    case PHOENIX_GET_CHANNEL: {
      const { dispatch } = store;
      const currentState = store.getState();
      let socket = selectPhoenixSocket(currentState);
      const socketDetails = selectPhoenixSocketDetails(currentState);
      const phoenixDomain = selectPhoenixSocketDomain(currentState);
      const socketDomain = socket ? socket.endPoint : '';
      const {
        requiresAuthentication,
        channelTopic,
        domainUrl,
        events,
        channelToken,
        responseActionType,
      } = action.data;
      console.info('PHOENIX_GET_CHANNEL phoenixDomain', phoenixDomain);
      console.info('PHOENIX_GET_CHANNEL socketDetails', socketDetails);
      console.info('PHOENIX_GET_CHANNEL channelTopic', channelTopic);
      console.info('PHOENIX_GET_CHANNEL requiresAuthentication', requiresAuthentication);
      console.info('PHOENIX_GET_CHANNEL domainUrl', domainUrl);
      const domain = formatSocketDomain({ domainString: domainUrl || phoenixDomain });
      console.info('PHOENIX_GET_CHANNEL domain', domain);
      const token = socketDetails.token ? socketDetails.token : null;
      console.info('PHOENIX_GET_CHANNEL token', token);
      const agentId = socketDetails.agent_id ? socketDetails.agent_id : null;
      console.info('PHOENIX_GET_CHANNEL agentId', agentId);

      const loggedInDomain = `${domain}/websocket`;
      if (!isEqual(socketDomain, loggedInDomain)) {
        socket = false;
      }

      console.info('PHOENIX_GET_CHANNEL socketDomain', socketDomain);
      console.info('PHOENIX_GET_CHANNEL loggedInDomain', loggedInDomain);

      const connectionState = socket && socket.connectionState();
      if (!socket || (connectionState === socketStatuses.CLOSED && socket.closeWasClean)) {
        console.info('PHOENIX_GET_CHANNEL no socket');
        dispatch(
          setUpSocket({
            dispatch,
            domain,
            token,
            agentId,
            requiresAuthentication,
          })
        );
        socket = selectPhoenixSocket(store.getState());
      }

      console.info('PHOENIX_GET_CHANNEL socket', socket);
      dispatch(
        connectToPhoenixChannelForEvents({
          dispatch,
          channelTopic,
          events,
          token: channelToken,
          responseActionType,
          socket,
        })
      );

      return store.getState();
    }
    default:
      return next(action);
  }
};
