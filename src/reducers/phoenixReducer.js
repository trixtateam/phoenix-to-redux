/*
 *
 * Phoenix Socket reducer
 *
 */
import produce from 'immer';
import { socketActionTypes, socketStatuses, channelActionTypes } from '../constants';
import { getDomainKeyFromUrl } from '../helpers';

export const initialState = {
  socket: false,
  domain: false,
  details: false,
  channelPresence: {},
  channels: {},
  socketStatus: socketStatuses.CLOSED,
};
/* eslint-disable default-case, no-param-reassign, consistent-return */
export const phoenixReducer = (state = initialState, action) =>
  produce(state, (draft) => {
    switch (action.type) {
      case channelActionTypes.CHANNEL_LEAVE:
        delete draft.channels[action.channel.topic];
        break;
      case channelActionTypes.CHANNEL_UPDATED:
        if (action.presence) {
          if (!state.channelPresence[action.channel.topic]) {
            draft.channelPresence[action.channel.topic] = {
              presence: action.presence,
              users: [],
            };
          } else {
            draft.channelPresence[action.channel.topic].presence = action.presence;
          }
        }
        draft.channels[action.channel.topic] = action.channel;
        break;
      case channelActionTypes.CHANNEL_PRESENCE_UPDATE:
        draft.channelPresence[action.channel.topic].users = action.list;
        break;
      case socketActionTypes.SOCKET_OPEN:
        draft.socketStatus = socketStatuses.CONNECTED;
        break;
      case socketActionTypes.SOCKET_CONNECT:
        draft.socketStatus = socketStatuses.CONNECTING;
        draft.channels = {};
        draft.details = action.socket.params();
        draft.domain = getDomainKeyFromUrl({ domainUrl: action.socket.endPoint });
        draft.socket = action.socket;
        break;
      case socketActionTypes.SOCKET_DISCONNECT:
        return initialState;
      case socketActionTypes.SOCKET_ERROR:
        draft.socketStatus = socketStatuses.ERROR;
        break;
    }
  });
