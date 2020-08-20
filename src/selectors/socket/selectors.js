import { createSelector } from 'reselect';
import { initialState } from '../../reducers/phoenixReducer';
import { isNullOrEmpty } from '../../helpers';

const selectPhoenix = (state) => state.phoenix || initialState;
const selectPhoenixSocket = (state) => state.phoenix.socket;
const selectPhoenixSocketDomain = (state) => state.phoenix.domain;
const selectPhoenixSocketDetails = (state) => state.phoenix.details;
const selectPhoenixSocketAuthenticated = (state) =>
  state.phoenix.details && !isNullOrEmpty(state.phoenix.details.token);

/**
 * Selects the current connected domain for socket
 */
const makeSelectPhoenixSocketDomain = () =>
  createSelector(selectPhoenixSocketDomain, (domain) => domain);

/**
 * Selects the current params for the phoenix socket
 */
const makeSelectPhoenixSocketDetails = () =>
  createSelector(selectPhoenixSocketDetails, (details) => details);

/**
 * Returns true or false if the phoenix socket has a token
 */
const makeSelectPhoenixSocketIsAuthenticated = () =>
  createSelector(selectPhoenixSocketAuthenticated, (authenticated) => authenticated);

/**
 * Selects the current phoenix socket
 */
const makeSelectPhoenixSocket = () =>
  createSelector(selectPhoenix, (phoenixState) => phoenixState.socket);

/**
 * Selects the current phoenix socket status
 */
const makeSelectPhoenixSocketStatus = () =>
  createSelector(selectPhoenix, (phoenixState) => phoenixState.socketStatus);

export {
  selectPhoenixSocket,
  selectPhoenixSocketDomain,
  selectPhoenixSocketDetails,
  makeSelectPhoenixSocketDomain,
  makeSelectPhoenixSocketDetails,
  makeSelectPhoenixSocket,
  makeSelectPhoenixSocketIsAuthenticated,
  makeSelectPhoenixSocketStatus,
};
