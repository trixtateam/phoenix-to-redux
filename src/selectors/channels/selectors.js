import { createSelector } from 'reselect';
import { getPhoenix } from '../socket/selectors';

export const selectPhoenixChannels = createSelector(
  getPhoenix,
  (phoenixState) => phoenixState.socket.channels
);

export const makeSelectPhoenixChannelByName = (name) =>
  createSelector(getPhoenix, (phoenixState) =>
    phoenixState.socket.channels
      ? phoenixState.socket.channels.find((channel) => channel.topic === name)
      : undefined
  );
