export const channelStatuses = {
  CHANNEL_OK: 'ok',
  CHANNEL_TIMEOUT: 'timeout',
  CHANNEL_ERROR: 'error',
  CHANNEL_JOINED: 'joined',
};

export const channelActionTypes = {
  CHANNEL_JOIN: 'PHOENIX_CHANNEL_JOIN',
  CHANNEL_LEAVE: 'PHOENIX_CHANNEL_LEAVE',
  CHANNEL_PUSH: 'PHOENIX_CHANNEL_PUSH',
  CHANNEL_PUSH_ERROR: 'PHOENIX_CHANNEL_PUSH_ERROR',
  CHANNEL_JOIN_ERROR: 'PHOENIX_CHANNEL_JOIN_ERROR',
  CHANNEL_ERROR: 'PHOENIX_CHANNEL_ERROR',
  CHANNEL_TIMEOUT: 'PHOENIX_CHANNEL_TIMEOUT',
  CHANNEL_PRESENCE_UPDATE: 'PHOENIX_CHANNEL_PRESENCE_UPDATE',
};

export const phoenixChannelStatuses = {
  CHANNEL_OK: 'ok',
  CHANNEL_TIMEOUT: 'timeout',
  CHANNEL_PRESENCE_STATE: 'presence_state',
  CHANNEL_PRESENCE_CHANGE: 'presence_diff',
  CHANNEL_ERROR: 'error',
};
