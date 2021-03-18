import { createSelector } from 'reselect';
import { selectPhoenix } from '../socket/selectors';

export const makeSelectPhoenixChannels = () =>
  createSelector(selectPhoenix, (phoenixState) => phoenixState.socket.channels);
