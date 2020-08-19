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
import { connectRouter } from 'connected-react-router';
import { phoenixReducer } from '@trixta/phoenix-to-redux';
import createHistory from 'history/createBrowserHistory';

const history = createHistory();

export default function createReducer() {
  const rootReducer = combineReducers({
    phoenix: phoenixReducer,
  });

  // Wrap the root reducer and return a new root reducer with router state
  const mergeWithRouterState = connectRouter(history);
  return mergeWithRouterState(rootReducer);
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
  // 2. routerMiddleware: Syncs the location/URL path to the state
  const middlewares = [
    phoenixChannelMiddleWare,
    routerMiddleware(history),
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
  disconnectPhoenix,
  connectPhoenix
  getAnonymousPhoenixChannel,
  pushToPhoenixChannel,
  getUrlParameter,
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
    // domain will be available on the response because its pass as additionalData
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
      additionalData: { domain },
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
  disconnectPhoenix,
  updatePhoenixLoginDetails,
} from '@trixta/phoenix-to-redux';

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
    const domain = _.get(data, 'domain');
    const agent_id = _.get(data, 'agent_id', '');
    const identity = _.get(data, 'identity', '');
    const jwt = _.get(data, 'jwt', '');
    // eslint-disable-next-line camelcase
    // update phoenix storage keys for future phoenix socket channel calls

    // close unauthenticated socket, future pushToPhoenixChannel
    yield put(disconnectPhoenix());
    // connect authenticated phoenix socket
     yield put(connectPhoenix({ domainUrl:domain, agentId: agent_id, token: jwt }));
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
  formatSocketDomain,
  getUrlParameter,
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

## Responding to Channel Errors
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
  channelActionTypes,
} from '@trixta/phoenix-to-redux';

/**
 * When a socket disconnection happens clear storage
 * and redirect to login page
 */
export function* socketDisconnectionSaga() {
  const location = yield select(makeSelectRouteLocation());
  yield put(unAuthenticate());
  yield put(defaultLoad());
  if (!isNullOrEmpty(location)) {
    yield put(push(`${routePaths.LOGIN_PAGE}${_.get(location, 'search', '')}`));
  } else {
    yield put(push(routePaths.LOGIN_PAGE));
  }
}

/**
 * If an error happens on joining a phoenix channel
 * @param {Object} params
 * @param {Object} params.error - error response
 * @param {string} params.channelTopic - name of phoenix channel
 */
export function* channelJoinErrorSaga({ error, channelTopic }) {
  yield put(updateError({ error: message }));
}

/**
 * If an error happens on a phoenix channel
 * @param {Object} params
 * @param {Object} params.error - error response
 * @param {string} params.channelTopic - name of phoenix channel
 */
export function* channelErrorSaga({ error }) {
  yield put(updateError({ error }));
}

/**
 * After the socket is connected,
 * @param {*} params
 */
export function* socketConnectedSaga({ }) {

}


export default function* defaultSaga() {
yield takeLatest(
    socketActionTypes.SOCKET_DISCONNECT,
    socketDisconnectionSaga
  );
  yield takeLatest(channelActionTypes.CHANNEL_PUSH_ERROR, channelErrorSaga);
  yield takeLatest(channelActionTypes.CHANNEL_JOIN_ERROR, channelJoinErrorSaga);
  yield takeEvery(socketActionTypes.SOCKET_OPEN, socketConnectedSaga);
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
