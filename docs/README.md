# Documentation
## Table of Contents
- [JS](js)
  - [Methods](js/methods.md)
  - [PhoenixJS](js/phoenix-js.md)
  - [Redux](js/redux.md)
  - [Reselect](js/reselect.md)

- [Maintenance](maintenance)
  - [Dependency Update](maintenance/dependency.md)

## Overview

### Quickstart
## Install
Install the package with npm

```npm i @trixta/phoenix-to-redux```
or yarn - whichever you prefer

```yarn add @trixta/phoenix-to-redux```

## 1. Setup Reducer
```javascript
/**
 * Combine all reducers in this file and export the combined reducers.
 */

import { combineReducers } from 'redux';
import { phoenixReducer } from '@trixta/phoenix-to-redux';

export default function createReducer() {
  const rootReducer = combineReducers({
    phoenix: phoenixReducer,
  });
  return rootReducer;
}
```

## 2. Setup Middleware
```javascript
import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'connected-react-router';
import { createPhoenixChannelMiddleware } from '@trixta/phoenix-to-redux';
import createReducer from './reducers';

const phoenixChannelMiddleWare = createPhoenixChannelMiddleware();

export default function configureStore(initialState = {}) {
  // Create the store with two middlewares
  // 1. phoenixChannelMiddleWare: Makes redux connected to phoenix channels
  const middlewares = [
    phoenixChannelMiddleWare,
  ];

  const enhancers = [applyMiddleware(...middlewares)];

  // If Redux DevTools Extension is installed use it, otherwise use Redux compose
  /* eslint-disable no-underscore-dangle, indent */
  const composeEnhancers =
    process.env.NODE_ENV !== 'production' &&
    typeof window === 'object' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
      : compose;
  /* eslint-enable */

  const store = createStore(
    createReducer(),
    initialState,
    composeEnhancers(...enhancers)
  );

  // Make reducers hot reloadable, see http://mxs.is/googmo
  /* istanbul ignore next */
  if (module.hot) {
    module.hot.accept('./reducers', () => {
      store.replaceReducer(createReducer());
    });
  }

  return store;
}
```
## 3. Setup Socket Details
```javascript
import { put } from 'redux-saga/effects';
import {  connectPhoenix } from '@trixta/phoenix-to-redux';
// update login details
yield put(connectPhoenix({ domainUrl: 'localhost:4000', token:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmF6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',agentId: 'john@doe.com'}));
```

## Redux Saga Example
In our saga for a container we listen for the dispatched action `REQUEST_LOGIN` and respond with `loginSaga` function

```javascript
import { put, select, takeLatest } from 'redux-saga/effects';
import { routePaths } from '../../route-paths';
import {
  REQUEST_LOGIN,
  REQUEST_LOGIN_FAILURE,
  REQUEST_LOGIN_SUCCESS,
  REQUEST_LOGIN_TIMEOUT,
} from './constants';
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

```javascript
import _ from 'lodash';
import { routePaths } from '../../route-paths';
import { put, select, takeLatest } from 'redux-saga/effects';
import {
  connectPhoenix
  getAnonymousPhoenixChannel,
  pushToPhoenixChannel,
} from '@trixta/phoenix-to-redux';
import {
  REQUEST_LOGIN,
  REQUEST_LOGIN_FAILURE,
  REQUEST_LOGIN_SUCCESS,
  REQUEST_LOGIN_TIMEOUT,
} from './constants';
/**
 *
 * @param data
 * @returns {IterableIterator<IterableIterator<*>|void|*>}
 */
export function* loginSaga({ data }) {
  try {
    // show loading indicator
    yield put(loggingIn());
    const channelTopic = 'authentication';
    // get the login domain data passed from the requestAuthentication action
    const domain = _.get(data, 'domain', '');
    // get the anonymous channel and socket
    yield put(
      getAnonymousPhoenixChannel({
        domainUrl: domain,
        channelTopic,
      })
    );
    // push the data to 'authentication' channel topic
    // domain will be available on the response because its passed as additionalData
    // on OK response from channel dispatch REQUEST_LOGIN_SUCCESS
    // on error response from channel dispatch REQUEST_LOGIN_FAILURE
     // on timeout response from channel dispatch REQUEST_LOGIN_TIMEOUT
    yield put(
    pushToPhoenixChannel({
      channelTopic,
      eventName: authenticationEvents.LOGIN,
      channelResponseEvent: REQUEST_LOGIN_SUCCESS,
      channelErrorResponseEvent: REQUEST_LOGIN_FAILURE,
      requestData: data,
      additionalData: { domainUrl },
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
```javascript
import _ from 'lodash';
import { routePaths } from '../../route-paths';
import { makeSelectRouteLocation } from '../App/selectors';
import { put, select } from 'redux-saga/effects';
import {
  updateError,
  defaultLoad,
  loginFailed,
} from '../App/actions';
import {
  connectPhoenix,
} from '@trixta/phoenix-to-redux';
import {
  PHOENIX_TOKEN,
  PHOENIX_SOCKET_DOMAIN,
  PHOENIX_AGENT_ID,
} from '../../config';
/**
 *
 * @param data
 * @returns {IterableIterator<*>}
 */
export function* handleLoginSuccessSaga({ data }) {
  // on success of login take the response data
  if (data) {

    // eslint-disable-next-line camelcase
    // additionalData you passed
    const domainUrl = _.get(data, 'domainUrl');
    const agentId = _.get(data, 'agent_id', '');
    const identity = _.get(data, 'identity', '');
    const token = _.get(data, 'jwt', '');
    // eslint-disable-next-line camelcase
    // update phoenix storage keys for future phoenix socket channel calls
    setLocalStorageItem(PHOENIX_SOCKET_DOMAIN, domainUrl);
    setLocalStorageItem(PHOENIX_TOKEN, token);
    setLocalStorageItem(PHOENIX_AGENT_ID, agentId);
    // connect authenticated phoenix socket
     yield put(connectPhoenix({ domainUrl, agentId, token }));
    yield put(push('/home'));
  } else {
    yield put(loginFailed());
  }
}
```

On `REQUEST_LOGIN_FAILURE` the below `handleLoginFailureSaga` function is going to do the following
```javascript
import _ from 'lodash';
import { put } from 'redux-saga/effects';
import {
  disconnectPhoenix,
  updatePhoenixLoginDetails,
  getAnonymousPhoenixChannel,
  pushToPhoenixChannel,
} from '@trixta/phoenix-to-redux';
import {
  updateError,
  defaultLoad,
} from '../App/actions';
export function* handleLoginFailureSaga(error) {
  yield put(
    updateError({
      error: _.get(error.data, 'reason', 'Authentication Failed'),
    }),
  );
  yield put(defaultLoad());
}
```

## Responding to Channel Events
```javascript
import {
  all,
  call,
  fork,
  put,
  select,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';
import {
  channelActionTypes,
} from '@trixta/phoenix-to-redux';



/**
 * Response after joining a phoenix channel with an error
 * @param {Object} params - parameters
 * @param {string} params.error - phoenix channel error
 * @param {string} params.channelTopic - phoenix channel topic
 */
export function* channelJoinErrorSaga({ error, channelTopic }) {
  console.error('channelJoinErrorSaga', error,, channelTopic);
}

/**
 * Invoked if the socket connection drops, or the channel crashes on the server. In either case, a channel rejoin is attempted automatically in an exponential backoff manner
 * @param {Object} params - parameters
 * @param {string} params.channel - phoenix channel
 * @param {string} params.channelTopic - phoenix channel topic
 */
export function* channelErrorSaga({ channel, channelTopic }) {
  console.error('channelErrorSaga', error, channel, channelTopic);
}

/**
 * Response after joining a phoenix channel with a timeout
 * @param {Object} params - parameters
 * @param {string} params.error - phoenix channel error
 * @param {string} params.channelTopic -  Name of channel/Topic
 */
export function* channelTimeOutErrorSaga({ error, channelTopic }) {
  console.error('channelTimeOutErrorSaga', error,, channelTopic);
}

/**
 * Response after pushing a request to phoenix channel with an error
 * @param {Object} params - parameters
 * @param {string} params.error - phoenix channel error
 * @param {string} params.channel - phoenix channel
 * @param {string} params.channelTopic - phoenix channel topic
 */
export function* channelPushErrorSaga({ error, channel, channelTopic }) {
  console.error('channelPushErrorSaga', error, channel, channelTopic);
}

/**
 * Response after joining a phoenix channel
 * @param {Object} params - parameters
 * @param {Object} params.response - response from joining channel
 * @param {Object} params.channel - phoenix channel
 */
export function* channelJoinSaga({ response, channel }) {
  console.info('channelJoinSaga', error, channel, channelTopic);
}

/**
 * Invoked only in two cases. 1) the channel explicitly closed on the server, or 2). The client explicitly closed, by calling channel.leave()
 * @param {Object} params - parameters
 * @param {Object} params.channel - phoenix channel
 */
export function* channelCloseSaga({  channel }) {
  console.info('channelCloseSaga',  channel);
}


export default function* defaultSaga() {
  yield takeEvery(channelActionTypes.CHANNEL_JOIN_ERROR, channelJoinErrorSaga);
  yield takeEvery(channelActionTypes.CHANNEL_ERROR, channelErrorSaga);
  yield takeEvery(channelActionTypes.CHANNEL_TIMEOUT, channelTimeOutErrorSaga);
  yield takeEvery(channelActionTypes.CHANNEL_PUSH_ERROR, channelPushErrorSaga);
  yield takeEvery(channelActionTypes.CHANNEL_JOIN, channelJoinSaga);
  yield takeEvery(channelActionTypes.CHANNEL_CLOSE, channelCloseSaga);
}

```

## Responding to Socket Events
```javascript
import {
  all,
  call,
  fork,
  put,
  select,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';
import {
  socketActionTypes,
} from '@trixta/phoenix-to-redux';


/**
 * Should the socket attempt to open, this action is dispatched to the
 * phoenix reducer
 * @param {Object} params - parameters
 * @param {string} params.domainKey - domain for socket
 * @param {Object} params.socket = socket being opened
 * @param {boolean} params.isAnonymous - true if socket was anonymous
 */
export function* socketConnectedSaga({ isAnonymous, socket, domainKey }) {
  console.info('socketConnectedSaga',{ isAnonymous, socket, domainKey });
}

/** Should an error occur from the phoenix socket, this action will be dispatched
 * @param {Object} params - parameters
 * @param {string} params.error
 * @param {string} params.socketState
 * @param {string} params.domainKey - domain for socket
 */
export function* socketErrorSaga({ error, socketState, domainKey }) {
  console.error('socketErrorSaga',{ error, socketState, domainKey });
}

/**
 * Should the socket attempt to close, this action is dispatched to the
 * phoenix reducer
 * @param {Object} params - parameters
 * @param {Object} params.socket = socket being closed
 * @param {string} params.domainKey - domain for socket
 * @param {boolean} params.isAnonymous - true if socket was anonymous
 */
export function* socketCloseSaga({ isAnonymous, socket, domainKey }) {
  console.info('socketCloseSaga',{ isAnonymous, socket, domainKey });
}
/**
 * After  phoenix socket disconnects
 * @param {Object} params - parameters
 * @param {Object} params.socket = socket being disconnected
 * @param {string} params.domainKey - domain for socket
 * @param {boolean} params.isAnonymous - true if socket was anonymous
 */
export function* socketDisconnectionSaga({ isAnonymous, socket, domainKey }) {
  console.info('socketDisconnectionSaga',{ isAnonymous, socket, domainKey });
}

export default function* defaultSaga() {
yield takeEvery(
    socketActionTypes.SOCKET_DISCONNECT,
    socketDisconnectionSaga
  );
  yield takeEvery(socketActionTypes.SOCKET_OPEN, socketConnectedSaga);
  yield takeEvery(socketActionTypes.SOCKET_ERROR, socketErrorSaga);
  yield takeEvery(socketActionTypes.SOCKET_CLOSE, socketCloseSaga);
}
```
## Responding to Channel Progress
```javascript
import _ from 'lodash';
import produce from 'immer';
import {
  socketActionTypes,
  PHOENIX_CHANNEL_END_PROGRESS,
  PHOENIX_CHANNEL_LOADING_STATUS,
} from '@trixta/phoenix-to-redux';

export const initialState = {
  loading: false,
  loadingStatus: {},
}

const appReducer = (state = initialState, action) =>
  produce(state, (draft) => {
    switch (action.type) {
      case socketActionTypes.SOCKET_ERROR:
        // when a socket error has occured
        break;
      case socketActionTypes.SOCKET_CONNECT:
        // when the socket has connected
        break;
      case PHOENIX_CHANNEL_END_PROGRESS:
        // when the progress for loadingStatusKey for channel has completed
        {
          const loadingStatusKey = _.get(
            action,
            'data.loadingStatusKey',
            false
          );
          if (!loadingStatusKey) {
            draft.loading = false;
          } else {
            delete draft.loadingStatus[loadingStatusKey];
          }
        }
        break;
      case PHOENIX_CHANNEL_LOADING_STATUS:
        // when the progress for loadingStatusKey is being updated
        draft.loadingStatus[_.get(action, 'data.loadingStatusKey', '')] = {
          status: true,
        };
        break;
          });
export default appReducer;
```
## Communicate with Phoenix
To communicate with phoenix socket, you can make use of the following dispatch [Methods](js/methods.md)
