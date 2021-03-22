import { createSelector } from 'reselect';
import { selectPhoenix } from '../socket/selectors';

export const makeSelectPhoenixChannels = () =>
  createSelector(selectPhoenix, (phoenixState) => phoenixState.socket.channels);

export const makeSelectPhoenixChannelByName = (name) =>
  createSelector(selectPhoenix, (phoenixState) =>
    phoenixState.socket.channels
      ? phoenixState.socket.channels.find((channel) => channel.topic === name)
      : undefined
  );
