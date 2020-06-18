# Routing via `react-router` and `connected-react-router`

`react-router` is the de-facto standard routing solution for react applications.
The thing is that with redux and a single state tree, the URL is part of that
state. `connected-react-router` takes care of synchronizing the location of our
application with the application state.

(See the [`connected-react-router` FAQ](https://github.com/supasate/connected-react-router/blob/master/FAQ.md)
for more information)

## How it is implemented
`phoenix-to-redux` uses the `connected-react-router` `connectRouter` function to check for the `domainUrlParameter` that is passed to
`createPhoenixChannelMiddleware`. should the url parameter be found, will update the socket to use this domain url

```javascript
const routeLocation = currentState.router.location;
const urlDomain = getUrlParameter({
  search: get(routeLocation, 'search', ''),
  parameterName: domainUrlParameter,
});

```

