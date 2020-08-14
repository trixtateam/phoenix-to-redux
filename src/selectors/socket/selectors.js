import { createSelector } from 'reselect';
import { initialState } from '../../reducers/phoenixReducer';

const selectPhoenix = (state) => state.phoenix || initialState;

const makeSelectPhoenixSocket = () =>
  createSelector(selectPhoenix, (phoenixState) => phoenixState.socket);

const makeSelectPhoenixSocketStatus = () =>
  createSelector(selectPhoenix, (phoenixState) => phoenixState.socketStatus);

export { makeSelectPhoenixSocket, makeSelectPhoenixSocketStatus };
