# PhoenixJS
[Phoenix channels](https://hexdocs.pm/phoenix/channels.html#the-moving-parts) are highly reliant, fast and robust. The phoenix js
package makes it very easy to setup a connection and listen on channels and respond on channels.

Check out the [official documentation](https://hexdocs.pm/phoenix/js/index.html)
for a good explanation of the more intricate benefits it has.

## How it is implemented

In the [`phoenix reducer`](https://github.com/trixtateam/phoenix-to-redux/blob/master/src/reducers/phoenixReducer.js) we keep the socket and all channels. This keeps a context of our phoenix socket alive we
listen for any actions dispatched to this reducer related to sockets and channels. If we join or leave a channel, we update
the socket in the reducer with updated socket

## Methods
[`channel actions`](https://github.com/trixtateam/phoenix-to-redux/blob/master/src/channels/actions.js)  - includes all channel related actions that will be dispatched to the `phoenix reducer`

[`socket actions`](https://github.com/trixtateam/phoenix-to-redux/blob/master/src/sockets/actions.js)  - includes all socket related actions that will be dispatched to the `phoenix reducer`




### React component implementation
Include the `dispatch` function in your component with `mapDispatchToProps`
```JS
function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    dispatchRequestAuthentication: (data) =>
      dispatch(requestAuthentication({ data })),
  };
}
```

### Redux Saga Impementation
In our saga for a container we can connect a socket and get a channel using either
`getPhoenixChannel` or `getAnonymousChannel` helper methods. These helper methods create a socket using the
saved local storage locations `PHOENIX_SOCKET_DOMAIN,PHOENIX_TOKEN,PHOENIX_AGENT_ID` .

`getPhoenixChannel` - this function gets the socket from the `phoenix reducer`, checks for the given channel if it exists, if it does and the
events is not included will update the listening events for the channel with the ones specified.
```JS
import {
  all,
  call,
  fork,
  put,
  select,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';

  yield put(
    getPhoenixChannel({
       channelTopic: 'channel name',
       events: [
         {
           eventName: 'event name for phoenix channel',
           eventActionType: 'action name for event name to bind to your reducer',
         },
       ],
     });
```

`getAnonymousChannel` - this function gets a socket for a given channel without passing any parameters `PHOENIX_TOKEN,PHOENIX_AGENT_ID` . Generally used
for obtaining an authentication token for future authenticated channel joins
```JS
    yield put(getAnonymousPhoenixChannel({ domainUrl:domain, channelTopic }));
```


`pushToChannel` - this function expects the socket you receive from `getChannel`. On pushing
 something to the channel if a `loadingStatusKey` is provided that connected [LoadingStatusContainer](css/react-semantic-ui.md#LoadingStatusContainer)
 in your component will show progress. On any `CHANNEL_OK, CHANNEL_TIMEOUT,CHANNEL_ERROR,CHANNEL_JOINED` an `END_PROGRESS` action will be
 dispatched to the `app reducer` clearing  any `loadingStatusKey` or `loading` values.
 There are quite a few other parameters we can pass to this function
```
 @param{function} dispatch
 * @param{string} channelTopic - Name of channel/Topic
 * @param{number} endProgressDelay - timeout in milliseconds if you want to delay the end progress of the loading indicator
 * @param{string} eventName - the name of the event on channel to push to
 * @param{?string} channelResponseEvent - action type to dispatch to on response from pushing to channel
 * @param{?string} channelErrorResponseEvent -  action type to dispatch to on error from pushing to channel
 * @param{object} requestData - data payload to push on the channel
 * @param{object} socket - phoenix socket
 * @param{?object} additionalData - this object will merge with the response data object received from the channel
 * for you to use on later note
 * @param{?boolean} dispatchChannelError - false by default, determines if should an
 * on channel error occur show it to the user via a toast
 * @param{?number} channelPushTimeOut - timeout in milliseconds for pushing to the channel, default is 1500
 * @param{?boolean || string} channelTimeOutEvent - action type to dispatch to on timeout from pushing to channel
 * @param{?string} loadingStatusKey - key to push to app reducer to set loading status on
```

```JS
yield put(
    getPhoenixChannel({
       dispatch,
       channelTopic: 'channel name',
       events: [
         {
           eventName: 'event name for phoenix channel',
           eventActionType: 'action name for event name to bind to your reducer',
         },
       ],
     });
  yield put(
    pushToPhoenixChannel({
          channelTopic,
          endProgressDelay,
          eventName,
          channelResponseEvent = null,
          channelErrorResponseEvent = null,
          requestData,
          socket,
          additionalData = null,
          dispatchChannelError = false,
          channelPushTimeOut = 15000,
          channelTimeOutEvent = false,
          loadingStatusKey = null,
        })
```


## Saga Example

In our saga for a container we listen for the dispatched action `REQUEST_LOGIN` and respond with `loginSaga` function

```JS
export default function* loginPageSaga() {
  // listen for REQUEST_LOGIN action
  yield takeLatest(REQUEST_LOGIN, loginSaga);
// listen for REQUEST_LOGIN_SUCCESS action
  yield takeLatest(REQUEST_LOGIN_SUCCESS, handleLoginSuccessSaga);
// listen for REQUEST_LOGIN_FAILURE action
  yield takeLatest(REQUEST_LOGIN_FAILURE, handleLoginFailureSaga);
}
```


On `REQUEST_LOGIN` the below `loginSaga` function is going to do the following


```JS
/**
 *
 * @param dispatch
 * @param data
 * @returns {IterableIterator<IterableIterator<*>|void|*>}
 */
export function* loginSaga({ dispatch, data }) {
  try {
    // show loading indicator
    yield put(loggingIn());
    const channelTopic = socketChannels.AUTHENTICATION;
    // get the login domain data passed from the requestAuthentication action
    const domainDetails = _.get(data, 'domain', '');
    const domain = formatSocketDomain({ domainString: domainDetails });
    setLocalStorageItem(SOCKET_DOMAIN, domain);
    // get the anonymous channel and socket
    const socket = yield put(getAnonymousPhoenixChannel({ domainUrl:domain, channelTopic }));
    // push the data to socketChannels.AUTHENTICATION
    // domainDetails will be available on the response because its pass as additionalData
    // on OK response from channel dispatch REQUEST_LOGIN_SUCCESS
    // on error response from channel dispatch REQUEST_LOGIN_FAILURE
    yield put(
    pushToPhoenixChannel({
      dispatch,
      channelTopic,
      eventName: authenticationEvents.LOGIN,
      channelResponseEvent: REQUEST_LOGIN_SUCCESS,
      channelErrorResponseEvent: REQUEST_LOGIN_FAILURE,
      requestData: data,
      additionalData: { domainDetails },
      socket,
      dispatchChannelError: true,
      customerTimeoutEvent: REQUEST_LOGIN_TIMEOUT,
    });
  } catch (error) {
    yield put(loginFailed(error));
    yield put(updateError({ error: error.toString() }));
  }
}
```

On `REQUEST_LOGIN_SUCCESS` the below `handleLoginSuccessSaga` function is going to do the following
```JS
/**
 *
 * @param data
 * @param dispatch
 * @returns {IterableIterator<*>}
 */
export function* handleLoginSuccessSaga({ data, dispatch }) {
  // on success of login take the response data
  if (data) {
    const routeLocation = yield select(makeSelectRouteLocation());
    const redirectUrl = getAuthenticationRedirectUrl({
      routeLocation,
      defaultUrl: routePaths.HOME_PAGE,
    });
    // eslint-disable-next-line camelcase
    // additionalData you passed
    const domainDetails = _.get(data, 'domainDetails');
    const agent_id = _.get(data, 'agent_id', '');
    const identity = _.get(data, 'identity', '');
    const jwt = _.get(data, 'jwt', '');
    // eslint-disable-next-line camelcase
    const role_ids = _.get(data, 'role_ids', '');
    const loginResponse = {
      agent_id,
      identity,
      jwt,
      role_ids,
    };
    yield put(updateCurrentUser(loginResponse));
    // Reset/Upgrade socket to latest authorization
    const socket = yield select(makeSelectPhoenixSocket());
    disconnectSocket(socket);
    yield put(push(redirectUrl));
  } else {
    yield put(loginFailed());
  }
}
```

On `REQUEST_LOGIN_FAILURE` the below `handleLoginFailureSaga` function is going to do the following
```JS
export function* handleLoginFailureSaga(error) {
  yield put(
    updateError({
      error: _.get(error.data, 'reason', 'Authentication Failed'),
    }),
  );
  yield put(defaultLoad());
}

```

