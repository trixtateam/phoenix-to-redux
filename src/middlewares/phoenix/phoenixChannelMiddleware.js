import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import merge from 'lodash/merge';
import get from 'lodash/get';
import { Socket } from 'phoenix';
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
  phoenixSocketStatuses,
  socketActionTypes,
} from '../../constants';
import { getUrlParameter, formatSocketDomain, hasValidSocket } from '../../utils';
import {
  getLocalStorageItem,
  setLocalStorageItem,
  isNullOrEmpty,
  removeLocalStorageItem,
} from '../../helpers';

import {
  phoenixSocketError,
  openPhoenixSocket,
  closePhoenixSocket,
  connectToPhoenixChannelForEvents,
  findChannelByName,
  phoenixChannelError,
  endPhoenixChannelProgress,
  updatePhoenixChannelLoadingStatus,
  phoenixChannelTimeOut,
  disconnectPhoenix,
  disconnectPhoenixSocket,
} from '../../actions';

/**
 * Attempts to connect the socket and subscribes the socket events
 * to the corresponding phoenix reducer actions
 * @param {Object} params
 * @param {function} params.dispatch - store dispatch function
 * @param {string} params.token - authentication for socket
 * @param {string} params.domain - socket url to connect to
 * @param {string} params.agentId - agent id to connect socket
 * @param {?boolean} params.requiresAuthentication - determines if the socket needs authentication params
 */
export function setUpSocket({ dispatch, requiresAuthentication = true, agentId, domain, token }) {
  const domainUrl = formatSocketDomain({ domainString: domain });
  let socket = false;
  if (!isNullOrEmpty(domainUrl)) {
    socket = new Socket(
      domainUrl,
      requiresAuthentication && token && agentId ? { params: { token, agent_id: agentId } } : {}
    );
    socket.connect();
    socket.onError(() => {
      const connectionState = get(socket, 'conn.readyState');
      if (
        isEqual(connectionState, phoenixSocketStatuses.CLOSED) ||
        isEqual(connectionState, phoenixSocketStatuses.CLOSING)
      ) {
        if (isFunction(dispatch)) {
          dispatch(
            phoenixSocketError({
              message: 'Connection to server lost.',
              socketState: connectionState,
            })
          );
          dispatch(disconnectPhoenix({ clearPhoenixDetails: true }));
        }
      }
    });
    socket.onOpen(() => {
      dispatch(openPhoenixSocket());
    });
    socket.onClose(() => dispatch(closePhoenixSocket()));
    return {
      type: socketActionTypes.SOCKET_CONNECT,
      socket,
    };
  }
  return disconnectPhoenix({ clearPhoenixDetails: true });
}

const getSocketState = state => state.phoenix.socket;

/**
 * Redux Middleware to integrate channel and socket messages from phoenix to redux
 * corresponding actions to dispatch to phoenix reducer
 * @param {Object?} params - parameters
 * @param {Function?} getStorageFunction - function to call to retrieve stored PHOENIX_TOKEN,PHOENIX_SOCKET_DOMAIN,PHOENIX_AGENT_ID, by default using local storage
 * @param {Function?} removeStorageFunction - function to call to remove stored PHOENIX_TOKEN,PHOENIX_SOCKET_DOMAIN,PHOENIX_AGENT_ID, by default using local storage
 * @param {Function?} setStorageFunction - function to call to set stored PHOENIX_TOKEN,PHOENIX_SOCKET_DOMAIN,PHOENIX_AGENT_ID, by default using local storage
 * @param {String?} domainUrlParameter - url parameter to look for set the stored PHOENIX_SOCKET_DOMAIN by default is 'domain'
 */
export const createPhoenixChannelMiddleware = ({
  getStorageFunction = getLocalStorageItem,
  removeStorageFunction = removeLocalStorageItem,
  setStorageFunction = setLocalStorageItem,
  domainUrlParameter = 'domain',
} = {}) => store => next => action => {
  switch (action.type) {
    case PHOENIX_CONNECT_SOCKET: {
      const { dispatch } = store;
      const domain = getStorageFunction(PHOENIX_SOCKET_DOMAIN);
      const token = getStorageFunction(PHOENIX_TOKEN);
      const agentId = getStorageFunction(PHOENIX_AGENT_ID);
      if (domain && token && agentId) {
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
      const { token, agentId } = action.data;
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
      const socket = getSocketState(currentState);
      const { clearPhoenixDetails } = action.data;

      if (socket && !isNullOrEmpty(socket) && socket.disconnect) {
        socket.disconnect();
        dispatch(disconnectPhoenixSocket());
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
      const socket = getSocketState(currentState);
      if (!hasValidSocket(socket)) {
        dispatch(disconnectPhoenix({ clearPhoenixDetails: true }));
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
          .receive(channelStatuses.CHANNEL_OK, data => {
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
                  data: merge(data, additionalData),
                  dispatch,
                });
              } else {
                dispatch({ type: channelResponseEvent, data, dispatch });
              }
            }
          })
          .receive(channelStatuses.CHANNEL_ERROR, data => {
            if (dispatchChannelError) {
              dispatch(phoenixChannelError({ error: data, channelTopic }));
            }
            dispatch(endPhoenixChannelProgress({ channelTopic, loadingStatusKey }));
            if (channelErrorResponseEvent) {
              if (additionalData) {
                dispatch({
                  type: channelErrorResponseEvent,
                  error: merge(data, additionalData),
                  dispatch,
                });
              } else {
                dispatch({
                  type: channelErrorResponseEvent,
                  error: data,
                  dispatch,
                });
              }
            }
          })
          .receive(channelStatuses.CHANNEL_TIMEOUT, data => {
            if (channelTimeOutEvent) {
              dispatch({
                type: channelTimeOutEvent,
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
      let socket = getSocketState(currentState);
      const routeLocation = currentState.router.location;
      const socketDomain = socket ? socket.endPoint : '';
      const urlDomain = getUrlParameter({
        search: get(routeLocation, 'search', ''),
        parameterName: domainUrlParameter,
      });
      if (!isNullOrEmpty(urlDomain)) {
        setStorageFunction(PHOENIX_SOCKET_DOMAIN, formatSocketDomain({ domainString: urlDomain }));
      }
      const {
        requiresAuthentication,
        channelTopic,
        domainUrl,
        events,
        responseActionType,
      } = action.data;
      if (domainUrl) {
        setStorageFunction(PHOENIX_SOCKET_DOMAIN, formatSocketDomain({ domainString: domainUrl }));
      }
      const domain = getStorageFunction(PHOENIX_SOCKET_DOMAIN);
      const token = getStorageFunction(PHOENIX_TOKEN);
      const agentId = getStorageFunction(PHOENIX_AGENT_ID);
      const loggedInDomain = `${domain}/websocket`;
      if (!isEqual(socketDomain, loggedInDomain)) {
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
      dispatch(
        connectToPhoenixChannelForEvents({
          dispatch,
          channelTopic,
          events,
          responseActionType,
          socket: store.getState().phoenix.socket,
        })
      );
      return store.getState();
    }
    default:
      return next(action);
  }
};
