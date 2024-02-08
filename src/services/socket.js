// https://stackoverflow.com/questions/37876889/react-redux-and-websockets-with-socket-io
// https://gist.github.com/reggi/923c6704104dd50395e5
import { Socket } from 'phoenix';

export const getSocketParams = (s) =>
  s ? (typeof s.params === 'function' ? s.params() : s.params) : undefined;

export const socketService = {
  socket: undefined,
  domain: undefined,
  params: undefined,
  options: undefined,

  initialize: function initialize(domain, params, options) {
    if (!domain || !domain.length || !params) return undefined;
    if (this.socket) this.disconnect();
    this.domain = domain;
    this.params = params;
    this.options = options;
    this.socket = new Socket(domain, { params, ...options });
    return this.socket;
  },

  disconnect: function disconnect(...props) {
    if (!this.socket) return;
    this.socket.disconnect(...props);
    this.socket = undefined;
    this.domain = undefined;
    this.params = undefined;
    this.options = undefined;
  },

  channel: function channel(...props) {
    if (!this.socket) return undefined;
    return this.socket.channel(...props);
  },

  findChannel: function findChannel(topic) {
    return this.socket && this.socket.channels
      ? this.socket.channels.find((channel) => channel.topic === topic)
      : undefined;
  },

  leaveChannel: function leaveChannel(topic) {
    const channel = this.findChannel(topic);
    if (!channel) return undefined;
    return channel.leave();
  },
};
