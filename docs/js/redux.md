# Redux

If you haven't worked with Redux, it's highly recommended (possibly indispensable!)
to read through the (amazing) [official documentation](http://redux.js.org)
and/or watch this [free video tutorial series](https://egghead.io/series/getting-started-with-redux). `phoenix-to-redux` is a [middleware](https://redux.js.org/advanced/middleware) to redux.

## Imports
### reducers
```javascript
import { createPhoenixReducer } from '@trixta/phoenix-to-redux';
```
or
```javascript
import { reducers } from '@trixta/phoenix-to-redux';
reducers.createPhoenixReducer
```
### constants
```javascript
import { constants } from '@trixta/phoenix-to-redux';
```
or
```javascript
import { channelStatuses, channelActionTypes, phoenixChannelStatuses,socketActionTypes, socketStatuses, phoenixSocketStatuses, PHOENIX_TOKEN,PHOENIX_SOCKET_DOMAIN, PHOENIX_AGENT_ID } from '@trixta/phoenix-to-redux';
```
### actions
```javascript
import { actions } from '@trixta/phoenix-to-redux';
```
or
```javascript
import { updatePhoenixLoginDetails, getPhoenixChannel,  getAnonymousPhoenixChannel, pushToPhoenixChannel, disconnectPhoenix, connectPhoenix   } from '@trixta/phoenix-to-redux';
```

### middlewares
```javascript
import { middlewares } from '@trixta/phoenix-to-redux';
```
or
```javascript
import { createPhoenixChannelMiddleware } from '@trixta/phoenix-to-redux';
```

### helper methods
```javascript
import { helpers } from '@trixta/phoenix-to-redux';
helpers.isAuthenticated
```
or
```javascript
import { isAuthenticated } from '@trixta/phoenix-to-redux';
```


## Usage
`reducers.js`
```javascript
/**
 * Combine all reducers in this file and export the combined reducers.
 */

import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { createPhoenixReducer } from '@trixta/phoenix-to-redux';
import globalReducer from './containers/App/reducer';
import createHistory from 'history/createBrowserHistory';

const history = createHistory();

const phoenixReducer = createPhoenixReducer();

export default function createReducer() {
  const rootReducer = combineReducers({
    phoenix: phoenixReducer,
    global: globalReducer,
  });

  // Wrap the root reducer and return a new root reducer with router state
  const mergeWithRouterState = connectRouter(history);
  return mergeWithRouterState(rootReducer);
}
```

`configureStoreStore.js`
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
