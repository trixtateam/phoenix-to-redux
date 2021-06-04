export const pushPromise = (channel, message, payload, timeout) => () =>
  new Promise((resolve, reject) => {
    if (!channel) return reject(new Error('Missing channel'));
    return channel
      .push(message, { body: payload }, timeout)
      .receive('ok', (response) => resolve(response))
      .receive('error', (err) => reject(new Error(err)))
      .receive('timeout', () => reject(new Error('Request timedout')));
  });
