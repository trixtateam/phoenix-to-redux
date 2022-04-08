# Phoenix-to-Redux
<img src="https://raw.githubusercontent.com/trixtateam/phoenix-to-redux/master/assets/phoenix-to-redux.jpg" alt="phoenix to redux banner" align="center" />

<br />

![GitHub Release Date](https://img.shields.io/github/release-date/trixtateam/phoenix-to-redux?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/trixtateam/phoenix-to-redux?style=for-the-badge)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/trixtateam/phoenix-to-redux?style=for-the-badge)
![GitHub commits since latest release](https://img.shields.io/github/commits-since/trixtateam/phoenix-to-redux/latest?style=for-the-badge)
![GitHub top language](https://img.shields.io/github/languages/top/trixtateam/phoenix-to-redux?style=for-the-badge)

# Quick Start Guide
## Install
Install the package with npm

```npm i @trixtateam/phoenix-to-redux```
or yarn - whichever you prefer

```yarn add @trixtateam/phoenix-to-redux```

## 1. Setup Reducer
```javascript
/**
 * Combine all reducers in this file and export the combined reducers.
 */

import { combineReducers } from 'redux';
import { phoenixReducer } from '@trixtateam/phoenix-to-redux';

export default function createReducer() {
  const rootReducer = combineReducers({
    phoenix: phoenixReducer,
  });
  return rootReducer;
}
```

## 2. Setup Middleware
[See example to setup middleware](https://redux-toolkit.js.org/api/configureStore)
```javascript
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { createPhoenixChannelMiddleware } from '@trixtateam/phoenix-to-redux';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './rootSaga';
import createReducer from './reducers';


export default function configureStore(initialState = {}) {
  const reduxSagaMonitorOptions = {};
  // Makes redux connected to phoenix channels
  const phoenixChannelMiddleWare = createPhoenixChannelMiddleware();
  const sagaMiddleware = createSagaMiddleware(reduxSagaMonitorOptions);
  const middlewares = [sagaMiddleware,phoenixChannelMiddleWare];

  const enhancers = [];

  const store = configureStore({
    reducer: createReducer(),
    middleware: [
      ...getDefaultMiddleware({
        thunk: false,
        immutableCheck: {
          ignore: ['socket', 'channel', 'trixta', 'phoenix', 'router'],
        },
        serializableCheck: false,
      }),
      ...middlewares,
    ],
    devTools:
      /* istanbul ignore next line */
      process.env.NODE_ENV !== 'production' ||
      process.env.PUBLIC_URL.length > 0,
    enhancers,
  });

  sagaMiddleware.run(rootSaga);

  return store;
}
```
## 3. Setup Socket Details
```javascript
import { put } from 'redux-saga/effects';
import {  connectPhoenix } from '@trixtateam/phoenix-to-redux';
// update login details
yield put(connectPhoenix({ domainUrl: 'localhost:4000', params : { token:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmF6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',agentId: 'john@doe.com'} }));
```

## Communicate with Phoenix
To communicate with phoenix socket you can make use of the following dispatch [methods](docs/js/methods.md) or [service](docs/js/service.md)

## Documentation
- [**The detailed Guide to `phoenix-to-redux`**](docs/README.md)

## License

This project is licensed under the MIT license, Copyright (c) 2020 Trixta Inc. For more information see `LICENSE.md`.
