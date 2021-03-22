import { EMIT } from '../constants';
export * from './channels';
export * from './sockets';

export const emit = (action, payload) => ({
  type: EMIT,
  payload,
  meta: { action },
});
