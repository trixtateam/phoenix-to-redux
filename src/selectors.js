import { createSelector } from 'reselect';
import { initialState } from './reducer';

const selectPhoenix = state => state.phoenix || initialState;

const makeSelectPhoenixSocket = () =>
  createSelector(
    selectPhoenix,
    phoenixState => phoenixState.socket
  );

const makeSelectPhoenixSocketStatus = () =>
  createSelector(
    selectPhoenix,
    phoenixState => phoenixState.socketStatus
  );

const makeSelectPhoenixChannels = () =>
  createSelector(
    selectPhoenix,
    phoenixState => phoenixState.socket.channels
  );

export {
  selectPhoenix,
  makeSelectPhoenixSocket,
  makeSelectPhoenixChannels,
  makeSelectPhoenixSocketStatus,
};
