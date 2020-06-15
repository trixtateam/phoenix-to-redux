# `reselect`

reselect memoizes ("caches") previous state trees and calculations based on said
tree. This means repeated changes and calculations are fast and efficient,
providing us with a performance boost over standard `mapStateToProps`
implementations.

The [official documentation](https://github.com/reactjs/reselect)
offers a good starting point!

## Usage
`phoenix-to-redux` makes use of reselect to provide selectors for the `phoenix` reducer
The following selectors are available

```JS
import { makeSelectPhoenixSocket, makeSelectPhoenixSocketStatus,makeSelectPhoenixChannels } from 'phoenix-to-redux'
```

### Phoenix Socket Selector

```javascript
const selectPhoenix = state => state.phoenix || initialState;

const makeSelectPhoenixSocket = () =>
  createSelector(
    selectPhoenix,
    phoenixState => phoenixState.socket
  );

const makeSelectPhoenixSocketStatus = () =>
  createSelector(
    selectPhoenix,
    phoenixState => phoenixState.socketStatus
  );
```

### Phoenix Channels Selector

```javascript
const selectPhoenix = state => state.phoenix || initialState;

const makeSelectPhoenixChannels = () =>
  createSelector(
    selectPhoenix,
    phoenixState => phoenixState.socket.channels
  );
```
