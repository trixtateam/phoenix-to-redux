import isEqual from 'lodash/isEqual';
import merge from 'lodash/merge';
import {
  PHOENIX_GET_CHANNEL,
  PHOENIX_DISCONNECT_SOCKET,
  PHOENIX_CONNECT_SOCKET,
  PHOENIX_PUSH_TO_CHANNEL,
  PHOENIX_CLEAR_LOGIN_DETAILS,
  PHOENIX_UPDATE_LOGIN_DETAILS,
  PHOENIX_TOKEN,
  PHOENIX_AGENT_ID,
  PHOENIX_SOCKET_DOMAIN,
  channelStatuses,
  channelActionTypes,
} from '../../constants';
import { formatSocketDomain, hasValidSocket } from '../../utils';
import {
  getLocalStorageItem,
  setLocalStorageItem,
  isNullOrEmpty,
  removeLocalStorageItem,
} from '../../helpers';

import {
  connectToPhoenixChannelForEvents,
  findChannelByName,
  phoenixChannelError,
  endPhoenixChannelProgress,
  phoenixChannelTimeOut,
  disconnectPhoenix,
} from '../../actions';

import { disconnectPhoenixSocket, updatePhoenixChannelLoadingStatus, setUpSocket } from './actions';
import { selectPhoenixSocket } from '../../selectors/socket/selectors';

/**
 * Redux Middleware to integrate channel and socket messages from phoenix to redux
 * corresponding actions to dispatch to phoenix reducer
 * @param {Object?} params - parameters
 * @param {Function?} getStorageFunction(key) - function to call to retrieve stored PHOENIX_TOKEN,PHOENIX_SOCKET_DOMAIN,PHOENIX_AGENT_ID, by default using local storage
 * @param {Function?} removeStorageFunction(key) - function to call to remove stored PHOENIX_TOKEN,PHOENIX_SOCKET_DOMAIN,PHOENIX_AGENT_ID, by default using local storage
 * @param {Function?} setStorageFunction(key) - function to call to set stored PHOENIX_TOKEN,PHOENIX_SOCKET_DOMAIN,PHOENIX_AGENT_ID, by default using local storage
 * @param {String?} domainUrlParameter - url parameter to look for set the stored PHOENIX_SOCKET_DOMAIN by default is 'domain'
 */
export const createPhoenixChannelMiddleware = ({
  getStorageFunction = getLocalStorageItem,
  removeStorageFunction = removeLocalStorageItem,
  setStorageFunction = setLocalStorageItem,
} = {}) => (store) => (next) => (action) => {
  switch (action.type) {
    case PHOENIX_CONNECT_SOCKET: {
      const { dispatch } = store;
      const domain = getStorageFunction(PHOENIX_SOCKET_DOMAIN);
      const token = getStorageFunction(PHOENIX_TOKEN);
      const agentId = getStorageFunction(PHOENIX_AGENT_ID);
      const socket = selectPhoenixSocket(store.getState());
      if (!socket && domain && token && agentId) {
        dispatch(
          setUpSocket({
            dispatch,
            domain,
            token,
            agentId,
            requiresAuthentication: true,
          })
        );
      }
      return store.getState();
    }
    case PHOENIX_UPDATE_LOGIN_DETAILS: {
      const { token, agentId, domain } = action.data;
      if (domain) {
        setStorageFunction(PHOENIX_SOCKET_DOMAIN, domain);
      }
      if (token) {
        setStorageFunction(PHOENIX_TOKEN, token);
      }
      if (agentId) {
        setStorageFunction(PHOENIX_AGENT_ID, agentId);
      }
      return store.getState();
    }
    case PHOENIX_CLEAR_LOGIN_DETAILS: {
      removeStorageFunction(PHOENIX_SOCKET_DOMAIN);
      removeStorageFunction(PHOENIX_TOKEN);
      removeStorageFunction(PHOENIX_AGENT_ID);
      return store.getState();
    }
    case PHOENIX_DISCONNECT_SOCKET: {
      const { dispatch } = store;
      const currentState = store.getState();
      const socket = selectPhoenixSocket(currentState);
      const { clearPhoenixDetails } = action.data;

      if (socket && !isNullOrEmpty(socket) && socket.disconnect) {
        socket.disconnect();
        dispatch(disconnectPhoenixSocket({ socket }));

        if (clearPhoenixDetails) {
          removeStorageFunction(PHOENIX_SOCKET_DOMAIN);
          removeStorageFunction(PHOENIX_TOKEN);
          removeStorageFunction(PHOENIX_AGENT_ID);
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
      console.info('PHOENIX_PUSH_TO_CHANNEL channel', channel);
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
      const socketDomain = socket ? socket.endPoint : '';
      const {
        requiresAuthentication,
        channelTopic,
        domainUrl,
        events,
        channelToken,
        responseActionType,
      } = action.data;
      if (domainUrl) {
        setStorageFunction(PHOENIX_SOCKET_DOMAIN, formatSocketDomain({ domainString: domainUrl }));
      }
      const domain = getStorageFunction(PHOENIX_SOCKET_DOMAIN);
      const token = getStorageFunction(PHOENIX_TOKEN);
      const agentId = getStorageFunction(PHOENIX_AGENT_ID);
      console.info('PHOENIX_GET_CHANNEL channelTopic', channelTopic);
      console.info('PHOENIX_GET_CHANNEL domainUrl', domainUrl);
      console.info('PHOENIX_GET_CHANNEL socket', socket);
      const loggedInDomain = `${domain}/websocket`;
      console.info('PHOENIX_GET_CHANNEL loggedInDomain', loggedInDomain);
      console.info('PHOENIX_GET_CHANNEL socketDomain', socketDomain);
      if (!isEqual(socketDomain, loggedInDomain)) {
        console.info('PHOENIX_GET_CHANNEL notEqual');
        socket = false;
      }
      if (!socket || !socket.conn) {
        dispatch(
          setUpSocket({
            dispatch,
            domain,
            token,
            agentId,
            requiresAuthentication,
          })
        );
      }
      socket = selectPhoenixSocket(store.getState());
      console.info('PHOENIX_GET_CHANNEL socket after', socket);
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
