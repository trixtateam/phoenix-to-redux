# Phoenix-to-Redux
<img src="https://raw.githubusercontent.com/trixtateam/phoenix-to-redux/master/assets/phoenix-to-redux.jpg" alt="phoenix to redux banner" align="center" />

<br />

# Quick Start Guide
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
import { createPhoenixReducer } from '@trixta/phoenix-to-redux';
import createHistory from 'history/createBrowserHistory';

const history = createHistory();

const phoenixReducer = createPhoenixReducer();

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
## 3. Setup Login Details
```javascript
import { put } from 'redux-saga/effects';
import {  updatePhoenixLoginDetails } from '@trixta/phoenix-to-redux';
// update login details
yield put(updatePhoenixLoginDetails({token:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',agentId: 'john@doe.com'}));
```

## Commnuicate with Phoenix
To communicate with phoenix socket you can make use of the following dispatch [methods](docs/js/methods.md)

## Documentation
- [**The detailed Guide to `phoenix-to-redux`**](docs/README.md)

## License

This project is licensed under the MIT license, Copyright (c) 2020 Trixta Inc. For more information see `LICENSE.md`.
