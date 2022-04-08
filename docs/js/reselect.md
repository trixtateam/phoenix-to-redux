# `reselect`

reselect memoizes ("caches") previous state trees and calculations based on said
tree. This means repeated changes and calculations are fast and efficient,
providing us with a performance boost over standard `mapStateToProps`
implementations.

The [official documentation](https://github.com/reactjs/reselect)
offers a good starting point!

## Imports
```JS
import {
  getPhoenixSocket,
getPhoenixSocketDomain,
getPhoenixSocketDetails,
selectPhoenixSocketDomain,
selectPhoenixSocketDetails,
selectPhoenixSocket,
selectPhoenixSocketIsAuthenticated,
selectPhoenixSocketStatus,
selectPhoenixChannels,
 } from '@trixtateam/phoenix-to-redux'
```
or
```JS
import { selectors } from '@trixtateam/phoenix-to-redux'
selectors.selectPhoenixSocket
```
## Usage
`phoenix-to-redux` makes use of reselect to provide selectors for the `phoenix` reducer
The following selectors are available

### Phoenix Socket Selectors
[`socket selectors`](https://github.com/trixtateam/phoenix-to-redux/blob/master/src/selectors/socket/selectors.js)  - includes all socket related state selection

### Phoenix Channels Selector
[`channel selectors`](https://github.com/trixtateam/phoenix-to-redux/blob/master/src/selectors/channels/selectors.js)  - includes all channel related state selection

