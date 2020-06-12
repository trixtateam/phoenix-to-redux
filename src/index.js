import { createPhoenixChannelMiddleware } from './middleware';
import { createPhoenixReducer } from './reducer';
import {
  pushToPhoenixChannel,
  getAnonymousPhoenixChannel,
  getPhoenixChannel,
  connectPhoenix,
  disconnectPhoenix,
  updatePhoenixLoginDetails,
  clearPhoenixLoginDetails,
} from './actions';
import { isAuthenticated } from './helpers';
import {
  makeSelectPhoenixChannels,
  makeSelectPhoenixSocket,
  makeSelectPhoenixSocketStatus,
} from './selectors';
import { channelActionTypes } from './constants/channel';
import { socketActionTypes, socketStatuses } from './constants/socket';
import {
  PHOENIX_AGENT_ID,
  PHOENIX_TOKEN,
  PHOENIX_SOCKET_DOMAIN,
} from './constants/storage';

module.exports = {
  middleware: { createPhoenixChannelMiddleware },
  storageKeys: { PHOENIX_AGENT_ID, PHOENIX_TOKEN, PHOENIX_SOCKET_DOMAIN },
  phoenixChannel: { channelActionTypes },
  reduxSocket: { socketActionTypes, socketStatuses },
  actionTypes: {},
  helpers: { isAuthenticated },
  reducers: { createPhoenixReducer },
  selectors: {
    makeSelectPhoenixChannels,
    makeSelectPhoenixSocket,
    makeSelectPhoenixSocketStatus,
  },
  actions: {
    pushToPhoenixChannel,
    getAnonymousPhoenixChannel,
    getPhoenixChannel,
    connectPhoenix,
    disconnectPhoenix,
    clearPhoenixLoginDetails,
    updatePhoenixLoginDetails,
  },
};
