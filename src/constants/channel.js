export const channelStatuses = {
  CHANNEL_OK: 'ok',
  CHANNEL_TIMEOUT: 'timeout',
  CHANNEL_ERROR: 'error',
  CHANNEL_JOINED: 'joined',
};

export const channelActionTypes = {
  CHANNEL_JOIN: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_JOIN',
  CHANNEL_LEAVE: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_LEAVE',
  CHANNEL_PUSH: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_PUSH',
  CHANNEL_CLOSE: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_CLOSE',
  CHANNEL_PUSH_ERROR: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_PUSH_ERROR',
  CHANNEL_JOIN_ERROR: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_JOIN_ERROR',
  CHANNEL_ERROR: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_ERROR',
  CHANNEL_TIMEOUT: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_TIMEOUT',
  CHANNEL_PRESENCE_LOG: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_PRESENCE_LOG',
  CHANNEL_UPDATED: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_UPDATED',
  CHANNEL_PRESENCE_UPDATE: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_PRESENCE_UPDATE',
  CHANNEL_PRESENCE_LEAVE: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_PRESENCE_LEAVE',
  CHANNEL_PRESENCE_JOIN: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_PRESENCE_JOIN',
  CHANNEL_PRESENCE_STATE: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_PRESENCE_STATE',
  CHANNEL_PRESENCE_CHANGE: '@trixta/phoenix-to-redux-event/PHOENIX_CHANNEL_PRESENCE_CHANGE',
};

export const phoenixChannelStatuses = {
  CHANNEL_OK: 'ok',
  CHANNEL_TIMEOUT: 'timeout',
  CHANNEL_PRESENCE_STATE: 'presence_state',
  CHANNEL_PRESENCE_CHANGE: 'presence_diff',
  CHANNEL_ERROR: 'error',
};
