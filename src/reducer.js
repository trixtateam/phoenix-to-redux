/*
 *
 * Phoenix Socket reducer
 *
 */
import { channelActionTypes, channelStatuses } from './constants/channel';
import { socketActionTypes, socketStatuses } from './constants/socket';

export const initialState = {
  socket: false,
  channel: false,
  currentRoom: false,
  socketStatus: false,
  channelStatus: false,
  message: false,
  presentUsers: false,
};

export const createPhoenixReducer = () => (state = initialState, action) => {
  switch (action.type) {
    case channelActionTypes.CHANNEL_TIMEOUT:
      return {
        ...state,
        channelStatus: channelStatuses.CHANNEL_TIMEOUT,
        message: action.error ? action.error : action.data,
      };
    case channelActionTypes.CHANNEL_PUSH_ERROR:
      return {
        ...state,
        channelStatus: channelStatuses.CHANNEL_ERROR,
        message: action.error,
      };
    case channelActionTypes.CHANNEL_PUSH:
      return {
        ...state,
        channelStatus: channelStatuses.CHANNEL_OK,
        message: action.data,
      };
    case channelActionTypes.CHANNEL_JOIN:
      return {
        ...state,
        currentRoom: null,
        channel: action.channel,
      };
    case channelActionTypes.CHANNEL_PRESENCE_UPDATE:
      return {
        ...state,
        presentUsers: action.presentUsers,
      };
    case channelActionTypes.CHANNEL_LEAVE:
      return {
        ...state,
      };
    case socketActionTypes.SOCKET_OPEN:
      return {
        ...state,
        socketStatus: socketStatuses.CONNECTED,
        message: false,
      };
    case socketActionTypes.SOCKET_CONNECT:
      return {
        ...state,
        socketStatus: socketStatuses.CONNECTING,
        socket: action.socket,
        message: false,
      };
    case socketActionTypes.SOCKET_CLOSE:
    case socketActionTypes.SOCKET_DISCONNECT:
      return initialState;
    case socketActionTypes.SOCKET_ERROR:
      return {
        ...state,
        socketStatus: socketStatuses.ERROR,
        message: action.error,
      };
    default:
      return state;
  }
};

export default createPhoenixReducer;
