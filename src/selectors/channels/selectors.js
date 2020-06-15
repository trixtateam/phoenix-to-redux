import { createSelector } from 'reselect';
import { initialState } from '../../reducers/phoenixReducer';

const selectPhoenix = state => state.phoenix || initialState;

const makeSelectPhoenixChannels = () =>
  createSelector(
    selectPhoenix,
    phoenixState => phoenixState.socket.channels
  );

export { makeSelectPhoenixChannels };
