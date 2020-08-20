import * as middlewares from './middlewares';
import * as reducers from './reducers';
import * as actions from './actions/index';
import * as utils from './utils';
import * as selectors from './selectors';
import * as constants from './constants';

module.exports = {
  ...reducers,
  ...middlewares,
  ...constants,
  ...selectors,
  ...actions,
  ...utils,
};

module.exports.reducers = {
  ...reducers,
};

module.exports.selectors = {
  ...selectors,
};

module.exports.utils = { ...utils };
module.exports.actions = {
  ...actions,
};

module.exports.middlewares = { ...middlewares };

module.exports.constants = {
  ...constants,
};
