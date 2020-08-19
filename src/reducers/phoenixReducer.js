/*
 *
 * Phoenix Socket reducer
 *
 */
import produce from 'immer';
import {
  socketActionTypes,
  socketStatuses,
  channelActionTypes,
  PHOENIX_CLEAR_LOGIN_DETAILS,
  PHOENIX_UPDATE_LOGIN_DETAILS,
} from '../constants';
import { getDomainKeyFromUrl } from '../helpers';

export const initialState = {
  socket: false,
  domain: false,
  details: false,
  channels: {},
  socketStatus: false,
  presentUsers: false,
};
/* eslint-disable default-case, no-param-reassign, consistent-return */
export const phoenixReducer = (state = initialState, action) =>
  produce(state, (draft) => {
    switch (action.type) {
      case PHOENIX_UPDATE_LOGIN_DETAILS:
        {
          const { token, agentId } = action.data;
          draft.details = { token, agent_id: agentId };
        }
        break;
      case PHOENIX_CLEAR_LOGIN_DETAILS:
        draft.domain = false;
        draft.details = false;
        break;
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
        console.info('socketActionTypes.SOCKET_CONNECT', action);
        draft.socketStatus = socketStatuses.CONNECTING;
        draft.message = false;
        draft.details = action.socket.params();
        draft.domain = getDomainKeyFromUrl({ domainUrl: action.socket.endPoint });
        draft.socket = action.socket;
        break;
      case socketActionTypes.SOCKET_CLOSE:
      case socketActionTypes.SOCKET_DISCONNECT:
        console.info('socketActionTypes.SOCKET_DISCONNECT', action);
        return initialState;
      case socketActionTypes.SOCKET_ERROR:
        draft.socketStatus = socketStatuses.ERROR;
        draft.message = action.error;
        break;
    }
  });
