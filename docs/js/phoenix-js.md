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
[`channel actions`](https://github.com/trixtateam/phoenix-to-redux/blob/master/src/actions/channels/actions.js)  - includes all channel related actions that will be dispatched to the `phoenix reducer`

[`socket actions`](https://github.com/trixtateam/phoenix-to-redux/blob/master/src/actions/sockets/actions.js)  - includes all socket related actions that will be dispatched to the `phoenix reducer`


### React component implementation
```javascript
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import {
  getPhoenixChannel,
  connectPhoenix,
  pushToPhoenixChannel,
  selectPhoenixSocketStatus,
} from '@trixtateam/phoenix-to-redux';

export class LoginPage extends React.Component {
constructor(props) {
   super(props);
   this.state = {};
}

  componentDidMount(){
    const {connect} = this.props;
    connect('localhost:3000');
  }

  render() {
  return (<div></div>)
  }

}

LoginPage.propTypes = {
  socketStatus: PropTypes.string,
  getPhoenixChannel: PropTypes.func,
  pushToChannel: PropTypes.func,
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    connect:(domainUrl) => {
      dispatch(connectPhoenix({ domainUrl }))
    },
    getChannel: ({domainUrl}) =>
      dispatch(getPhoenixChannel({ domainUrl, channelTopic })),
    pushToChannel: ({channelTopic,eventName,channelResponseEvent,channelErrorResponseEvent,requestData}) =>
      dispatch(pushToPhoenixChannel({ channelTopic,eventName,channelResponseEvent,channelErrorResponseEvent,requestData })),
  };
}

const mapStateToProps = createStructuredSelector({
  socketStatus: selectPhoenixSocketStatus(),
});

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps
);
export default compose(
  withConnect
)(LoginPage);
```

### Redux Saga Implementation
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
  updatePhoenixLoginDetails,
  connectPhoenix,
  getPhoenixChannel,
  pushToPhoenixChannel,
  formatSocketDomain,
  getUrlParameter,
} from '@trixtateam/phoenix-to-redux';
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
    yield put(connectPhoenix({ domainUrl: domain }));
    // get the anonymous channel and socket
    yield put(
      getPhoenixChannel({
        domainUrl: domain,
        channelTopic,
      })
    );
    // push the data to 'authentication' channel topic
    // domainDetails will be available on the response because its pass as additionalData
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
  PHOENIX_TOKEN,
  PHOENIX_SOCKET_DOMAIN,
  PHOENIX_AGENT_ID,
} from '../../config';
import {
  connectPhoenix,
} from '@trixtateam/phoenix-to-redux';

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
    const domainUrl = _.get(data, 'domain');
    const agentId = _.get(data, 'agent_id', '');
    const identity = _.get(data, 'identity', '');
    const token = _.get(data, 'jwt', '');
    // eslint-disable-next-line camelcase
    // update phoenix storage keys for future phoenix socket channel calls
    setLocalStorageItem(PHOENIX_SOCKET_DOMAIN, domainUrl);
    setLocalStorageItem(PHOENIX_TOKEN, token);
    setLocalStorageItem(PHOENIX_AGENT_ID, agentId);
    // connect authenticated phoenix socket
     yield put(connectPhoenix({ domainUrl, params: { agentId, token } }));
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

