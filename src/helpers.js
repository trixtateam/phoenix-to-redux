import isNull from 'lodash/isNull';
import isArray from 'lodash/isArray';
import isUndefined from 'lodash/isUndefined';
import isEmpty from 'lodash/isEmpty';
/**
 * Returns true if the value is null or undefined or empty
 * @param value
 * @returns {boolean}
 */
export function isNullOrEmpty(value) {
  if (isNull(value)) {
    return true;
  }
  if (isUndefined(value)) {
    return true;
  }
  if (isArray(value) && isEmpty(value)) {
    return true;
  }
  if (!Number.isInteger(value) && Object.keys(value).length === 0) {
    return true;
  }
  if (value.length === 0) {
    return true;
  }

  return false;
}

export function isJsonString(stringValue) {
  try {
    JSON.parse(stringValue);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Cleans up domain url removing socket information and returning the
 * name portion
 * @param {Object} params
 * @param {String} params.domainUrl - url of socket domain
 */
export function getDomainKeyFromUrl({ domainUrl }) {
  return (
    domainUrl &&
    domainUrl
      .replace(/(wss?:\/\/|wss?:)/g, '')
      .replace('/socket', '')
      .replace('/websocket', '')
  );
}
