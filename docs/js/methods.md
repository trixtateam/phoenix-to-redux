## Phoenix Channel Methods
### getPhoenixChannel
```javascript
/**
 * Will attempt to create a connection to the socket for the given channelTopic, events with the stored credentials
 * @param {Object} params - parameters
 * @param {?Object[]}  params.events - [{eventName, eventActionType}, ...] event map to listen to on channel
 * @param {string} events[].eventName - The name of event to listen on channel.
 * @param {string} events[].eventActionType - The name of action to dispatch to reducer for the corresponding eventName.
 * @param {?string} params.responseActionType - on connection of the channel, name of action to dispatch to reducer
 * @param {string} params.domainUrl - url for socket to connect to
 * @param {string} params.channelTopic - Name of channel/Topic
 */
export function getPhoenixChannel({
  channelTopic,
  events = [],
  domainUrl = null,
  responseActionType = channelActionTypes.CHANNEL_JOIN,
})
```
### getAnonymousPhoenixChannel
```javascript
/**
 * Will attempt to create a connection to the socket for the given channelTopic, events
 * without an authorization token
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {string} params.domainUrl - url for socket to connect to
 * @param {?Object[]}  params.events - [{eventName, eventActionType}, ...] event map to listen to on channel
 * @param {string} events[].eventName - The name of event to listen on channel.
 * @param {string} events[].eventActionType - The name of action to dispatch to reducer for the corresponding eventName.
 * @param {?string} params.responseActionType - on connection of the channel, name of action to dispatch to reducer
 */
export function getAnonymousPhoenixChannel({
  channelTopic,
  domainUrl,
  events = [],
  responseActionType = channelActionTypes.CHANNEL_JOIN,
})
```
### pushToPhoenixChannel
```javascript
/**
 * Will attempt to find a channel by name and topic on the given socket and push the data to the found channel,
 * on any PHOENIX_CHANNEL_OK,PHOENIX_CHANNEL_ERROR, PHOENIX_CHANNEL_TIMEOUT the endProgress for the given loadingStatusKey will be dispatched
 * @param {Object} params - parameters
 * @param {string} params.channelTopic - Name of channel/Topic
 * @param {number} params.endProgressDelay - timeout in milliseconds if you want to delay the end progress of the loading indicator
 * @param {string} params.eventName - the name of the event on channel to push to
 * @param {?string} params.channelResponseEvent - name of action to dispatch to reducer on response from pushing to channel
 * @param {?string} params.channelErrorResponseEvent -  name of action to dispatch to reducer on  error from pushing to channel
 * @param {object} params.requestData - data payload to push on the channel
 * @param {?object} params.additionalData - this object will merge with the response data object received from the channel for you to use on later note
 * @param {?boolean} params.dispatchChannelError - false by default, determines if should an on channel error occur dispatch PHOENIX_CHANNEL_ERROR to the reducer
 * @param {?number} params.channelPushTimeOut - timeout in milliseconds for pushing to the channel, default is 1500
 * @param {?boolean || string} params.channelTimeOutEvent - name of action to dispatch to reducer on timeout from pushing to channel
 * @param {?string} params.loadingStatusKey - key indicator, to separate loading status for different actions, to push to reducer
 */
export function pushToPhoenixChannel({
  channelTopic,
  endProgressDelay,
  eventName,
  channelResponseEvent = null,
  channelErrorResponseEvent = null,
  requestData,
  additionalData = null,
  dispatchChannelError = false,
  channelPushTimeOut = 15000,
  channelTimeOutEvent = false,
  loadingStatusKey = null,
})
```
## Phoenix Socket Methods
### disconnectPhoenix
```javascript
/**
 * disconnects the socket and removes the socket from the phoenix reducer
 * @param {Object} params - parameters
 * @param {boolean?} params.clearPhoenixDetails - determines if the saved login details should be cleared. false by default
 */
export function disconnectPhoenix({ clearPhoenixDetails = false } = {})
```
### connectPhoenix
```javascript
/**
 * Will attempt to connect socket with the current stored credentials
 * in storage
 */
export function connectPhoenix()
```

## Other Methods

### isAuthenticated
```javascript
/**
 * Returns true if there is a PHOENIX_TOKEN present in local storage
 */
export function isAuthenticated()
```

### updatePhoenixLoginDetails
```javascript
/**
 * Updates the saved phoenix socket connection paramaters in storage
 * @param {Object} params - parameters
 * @param {string?} params.agentId - agent id for phoenix socket
 * @param {string?} params.token - authentication token for phoenix socket
 */
export function updatePhoenixLoginDetails({ agentId = null, token = null })
```

## Phoenix Middleware Methods
### createPhoenixChannelMiddleware
```javascript
/**
 * Redux Middleware to integrate channel and socket messages from phoenix to redux
 * corresponding actions to dispatch to phoenix reducer
 * @param {Object?} params - parameters
 * @param {Function?} getStorageFunction - function to call to retrieve stored PHOENIX_TOKEN,PHOENIX_SOCKET_DOMAIN,PHOENIX_AGENT_ID, by default using local storage
 * @param {Function?} removeStorageFunction - function to call to remove stored PHOENIX_TOKEN,PHOENIX_SOCKET_DOMAIN,PHOENIX_AGENT_ID, by default using local storage
 * @param {Function?} setStorageFunction - function to call to set stored PHOENIX_TOKEN,PHOENIX_SOCKET_DOMAIN,PHOENIX_AGENT_ID, by default using local storage
 * @param {String?} domainUrlParameter - url parameter to look for set the stored PHOENIX_SOCKET_DOMAIN by default is 'domain'
 */
export const createPhoenixChannelMiddleware = ({
  getStorageFunction = getLocalStorageItem,
  removeStorageFunction = removeLocalStorageItem,
  setStorageFunction = setLocalStorageItem,
  domainUrlParameter = 'domain',
} = {})
```
