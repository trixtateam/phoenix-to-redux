import { createSelector } from 'reselect';
import { initialState } from '../../reducers/phoenixReducer';
import { isNullOrEmpty } from '../../utils';

export const selectPhoenix = (state) => state.phoenix || initialState;
export const selectPhoenixSocket = (state) => state.phoenix.socket;
export const selectPhoenixSocketDomain = (state) => state.phoenix.domain;
export const selectPhoenixSocketDetails = (state) => state.phoenix.details;
export const selectPhoenixSocketAuthenticated = (state) =>
  state.phoenix.details && !isNullOrEmpty(state.phoenix.details.token);

export const selectPhoenixChannelPresence = (state, channelTopic) =>
  state.phoenix.channelPresence[channelTopic] || null;

/**
 * Selects the current connected domain for socket
 */
export const makeSelectPhoenixSocketDomain = () =>
  createSelector(selectPhoenixSocketDomain, (domain) => domain);

/**
 * Selects the current params for the phoenix socket
 */
export const makeSelectPhoenixSocketDetails = () =>
  createSelector(selectPhoenixSocketDetails, (details) => details);

/**
 * Returns true or false if the phoenix socket has a token
 */
export const makeSelectPhoenixSocketIsAuthenticated = () =>
  createSelector(selectPhoenixSocketAuthenticated, (authenticated) => authenticated);

/**
 * Selects the current phoenix socket
 */
export const makeSelectPhoenixSocket = () =>
  createSelector(selectPhoenix, (phoenixState) => phoenixState.socket);

/**
 * Selects the current phoenix socket status
 */
export const makeSelectPhoenixSocketStatus = () =>
  createSelector(selectPhoenix, (phoenixState) => phoenixState.socketStatus);
