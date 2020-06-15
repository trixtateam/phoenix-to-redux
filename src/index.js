import { createPhoenixChannelMiddleware } from './middlewares/phoenix/phoenixChannelMiddleware';
import { createPhoenixReducer } from './reducers/phoenixReducer';
import {
  pushToPhoenixChannel,
  getAnonymousPhoenixChannel,
  getPhoenixChannel,
  connectPhoenix,
  disconnectPhoenix,
  updatePhoenixLoginDetails,
  clearPhoenixLoginDetails,
} from './actions/index';
import { isAuthenticated } from './helpers';
import { formatSocketDomain, getUrlParameter } from './utils';
import {
  makeSelectPhoenixChannels,
  makeSelectPhoenixSocket,
  makeSelectPhoenixSocketStatus,
} from './selectors';
import { channelActionTypes } from './constants/channel';
import { socketActionTypes, socketStatuses } from './constants/socket';
import { PHOENIX_AGENT_ID, PHOENIX_TOKEN, PHOENIX_SOCKET_DOMAIN } from './constants/storage';

module.exports = {
  makeSelectPhoenixChannels,
  makeSelectPhoenixSocketStatus,
  makeSelectPhoenixSocket,
  isAuthenticated,
  pushToPhoenixChannel,
  getAnonymousPhoenixChannel,
  createPhoenixChannelMiddleware,
  getPhoenixChannel,
  connectPhoenix,
  socketActionTypes,
  socketStatuses,
  channelActionTypes,
  createPhoenixReducer,
  disconnectPhoenix,
  clearPhoenixLoginDetails,
  updatePhoenixLoginDetails,
  formatSocketDomain,
  getUrlParameter,
  PHOENIX_AGENT_ID,
  PHOENIX_TOKEN,
  PHOENIX_SOCKET_DOMAIN,
};

module.exports.reducers = {
  createPhoenixReducer,
};

module.exports.selectors = {
  makeSelectPhoenixChannels,
  makeSelectPhoenixSocketStatus,
  makeSelectPhoenixSocket,
};

module.exports.helpers = { isAuthenticated, formatSocketDomain, getUrlParameter };

module.exports.actions = {
  pushToPhoenixChannel,
  getAnonymousPhoenixChannel,
  getPhoenixChannel,
  connectPhoenix,
  disconnectPhoenix,
  clearPhoenixLoginDetails,
  updatePhoenixLoginDetails,
};

module.exports.middlewares = { createPhoenixChannelMiddleware };

module.exports.constants = {
  socketActionTypes,
  socketStatuses,
  channelActionTypes,
  PHOENIX_AGENT_ID,
  PHOENIX_TOKEN,
  PHOENIX_SOCKET_DOMAIN,
};

module.exports.storageKeys = { PHOENIX_AGENT_ID, PHOENIX_TOKEN, PHOENIX_SOCKET_DOMAIN };
