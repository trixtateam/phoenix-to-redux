import { createSelector } from 'reselect';
import { getPhoenix } from '../socket/selectors';

export const selectPhoenixChannels = createSelector(
  getPhoenix,
  (phoenixState) => phoenixState.channels
);

export const makeSelectPhoenixChannelByName = (name) =>
  createSelector(selectPhoenixChannels, (channels) => (channels ? channels[name] : undefined));
