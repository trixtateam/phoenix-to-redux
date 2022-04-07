import { createSelector } from 'reselect';
import { initialState } from '../../reducers/phoenixReducer';
import { isNullOrEmpty } from '../../utils';

export const getPhoenix = (state) => state.phoenix || initialState;
export const getPhoenixSocket = (state) => state.phoenix.socket;
export const getPhoenixSocketDomain = (state) => state.phoenix.domain;
export const getPhoenixSocketDetails = (state) => state.phoenix.details;
export const getPhoenixSocketAuthenticated = (state) =>
  state.phoenix.details && !isNullOrEmpty(state.phoenix.details.token);
export const getPhoenixChannelPresence = (state, channelTopic) =>
  state.phoenix.channelPresence[channelTopic] || null;

/**
 * Selects the current connected domain for socket
 */
export const selectPhoenixSocketDomain = () =>
  createSelector(getPhoenixSocketDomain, (domain) => domain);

/**
 * Selects the current params for the phoenix socket
 */
export const selectPhoenixSocketDetails = () =>
  createSelector(getPhoenixSocketDetails, (details) => details);

/**
 * Returns true or false if the phoenix socket has a token
 */
export const selectPhoenixSocketIsAuthenticated = () =>
  createSelector(getPhoenixSocketAuthenticated, (authenticated) => authenticated);

/**
 * Selects the current phoenix socket
 */
export const selectPhoenixSocket = () =>
  createSelector(getPhoenix, (phoenixState) => phoenixState.socket);

/**
 * Selects the current phoenix socket status
 */
export const selectPhoenixSocketStatus = () =>
  createSelector(getPhoenix, (phoenixState) => phoenixState.socketStatus);
