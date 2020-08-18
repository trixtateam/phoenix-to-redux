/*
 *
 * Phoenix Socket reducer
 *
 */
import produce from 'immer';
import { socketActionTypes, socketStatuses, channelActionTypes } from '../constants';

export const initialState = {
  socket: false,
  channels: {},
  socketStatus: false,
  presentUsers: false,
};
/* eslint-disable default-case, no-param-reassign, consistent-return */
export const phoenixReducer = (state = initialState, action) =>
  produce(state, (draft) => {
    switch (action.type) {
      case channelActionTypes.CHANNEL_JOIN:
        draft.channels[action.channel.topic] = action.channel;
        break;
      case channelActionTypes.CHANNEL_PRESENCE_UPDATE:
        draft.presentUsers = action.presentUsers;
        break;
      case socketActionTypes.SOCKET_OPEN:
        draft.socketStatus = socketStatuses.CONNECTED;
        draft.message = false;
        break;
      case socketActionTypes.SOCKET_CONNECT:
        draft.socketStatus = socketStatuses.CONNECTING;
        draft.message = false;
        draft.socket = action.socket;
        break;
      case socketActionTypes.SOCKET_CLOSE:
      case socketActionTypes.SOCKET_DISCONNECT:
        return initialState;
      case socketActionTypes.SOCKET_ERROR:
        draft.socketStatus = socketStatuses.ERROR;
        draft.message = action.error;
        break;
    }
  });
