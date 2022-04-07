// for cases when outputting an action to the reducer is not valid
const base = '@trixta/phoenix-to-redux';
export const SOCKET_URI = 'socket';
export const SOCKET_PROTOCOL_SECURE = 'wss://';
export const SOCKET_PROTOCOL_UN_SECURE = 'ws://';
export const INVALID_SOCKET = `${base}/INVALID_SOCKET`;
export const NO_PHOENIX_CHANNEL_FOUND = `${base}/NO_PHOENIX_CHANNEL_FOUND`;
export const PHOENIX_CHANNEL_LOADING_STATUS = `${base}/CHANNEL_LOADING_STATUS`;
export const PHOENIX_CHANNEL_END_PROGRESS = `${base}/CHANNEL_PROGRESS_ENDED`;
export const PHOENIX_PUSH_TO_CHANNEL = `${base}/PHOENIX_PUSH_TO_CHANNEL`;
export const PHOENIX_GET_CHANNEL = `${base}/PHOENIX_GET_CHANNEL`;
export const PHOENIX_LEAVE_CHANNEL = `${base}/PHOENIX_LEAVE_CHANNEL`;
export const PHOENIX_LEAVE_CHANNEL_EVENTS = `${base}/PHOENIX_LEAVE_CHANNEL_EVENTS`;
export const PHOENIX_CONNECT_SOCKET = `${base}/PHOENIX_CONNECT_SOCKET`;
export const PHOENIX_DISCONNECT_SOCKET = `${base}/PHOENIX_DISCONNECT_SOCKET`;
