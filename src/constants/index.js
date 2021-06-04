export * from './channel';
export * from './phoenixToRedux';
export * from './socket';

export const EMIT = 'EMIT';

export const actionSuccess = (action) => `${action}_SUCCESS`;
export const actionFailure = (action) => `${action}_FAILURE`;
