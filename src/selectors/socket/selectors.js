import { createSelector } from 'reselect';
import { initialState } from '../../reducers/phoenixReducer';
import { isNullOrEmpty } from '../../helpers';

const selectPhoenix = (state) => state.phoenix || initialState;
const selectPhoenixSocket = (state) => state.phoenix.socket;
const selectPhoenixSocketDomain = (state) => state.phoenix.domain;
const selectPhoenixSocketDetails = (state) => state.phoenix.details;
const selectPhoenixSocketAuthenticated = (state) =>
  state.phoenix.details && !isNullOrEmpty(state.phoenix.details.token);
const makeSelectPhoenixSocketDomain = () =>
  createSelector(selectPhoenixSocketDomain, (domain) => domain);

const makeSelectPhoenixSocketDetails = () =>
  createSelector(selectPhoenixSocketDetails, (details) => details);

const makeSelectPhoenixSocketIsAuthenticated = () =>
  createSelector(selectPhoenixSocketAuthenticated, (authenticated) => authenticated);

const makeSelectPhoenixSocket = () =>
  createSelector(selectPhoenix, (phoenixState) => phoenixState.socket);

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
