// https://stackoverflow.com/questions/37876889/react-redux-and-websockets-with-socket-io
// https://gist.github.com/reggi/923c6704104dd50395e5
import { Socket } from 'phoenix';

export const socketService = {
  socket: undefined,

  connect: function connect(domainUrl, params) {
    if (!domainUrl || !domainUrl.length) return undefined;
    if (this.socket) this.disconnect();
    this.socket = new Socket(domainUrl, { params });
    this.socket.connect();
    return this.socket;
  },

  disconnect: function disconnect(cb) {
    if (!this.socket) return;
    this.socket.disconnect(cb, 1000, 'Socket disconnected.');
    this.socket = undefined;
  },

  emit: function emit(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('No socket connection.'));
      return this.socket.emit(event, data, (response) => {
        if (response.error) {
          console.error(response.error);
          return reject(response.error);
        }
        return resolve();
      });
    });
  },

  on(event, cb) {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('No socket connection.'));
      this.socket.on(event, cb);
      return resolve();
    });
  },
};
