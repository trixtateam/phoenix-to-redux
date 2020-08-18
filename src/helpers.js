import isNull from 'lodash/isNull';
import isArray from 'lodash/isArray';
import isUndefined from 'lodash/isUndefined';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import { PHOENIX_TOKEN } from './constants/storage';
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

/**
 * Returns true if there is a PHOENIX_TOKEN present in local storage
 */
export function isAuthenticated() {
  return !isNullOrEmpty(getLocalStorageItem(PHOENIX_TOKEN));
}

export function isJsonString(stringValue) {
  try {
    JSON.parse(stringValue);
  } catch (e) {
    return false;
  }
  return true;
}

/* Gets a local storage value for the given and returns the defaultValue if not found
 * @param key
 * @param defaultValue
 * @returns {string|*}
 */
export function getLocalStorageItem(key, defaultValue = null) {
  const localStorageValue = localStorage.getItem(key);
  if (isNullOrEmpty(localStorageValue)) {
    return defaultValue;
  }

  if (isJsonString(localStorageValue)) {
    return JSON.parse(localStorageValue);
  }

  return localStorageValue;
}

/* Remove a local storage value for the given
 * @param key - the key that we wish to remove
 */
export function removeLocalStorageItem(key) {
  localStorage.removeItem(key);
}

/* Sets a local storage value for the given
 * @param key - the key that we wish to set
 * @param{any} value - the value of the key we want to set in local storage
 */
export function setLocalStorageItem(key, value) {
  if (isObject(value) || isArray(value)) {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.setItem(key, value);
  }
}

/**
 * Returns the url with params intended to navigate to if unable to reach due to not being authenticated
 * @param routeLocation
 * @param defaultUrl
 * @returns {string|*}
 */
export function getAuthenticationRedirectUrl({ routeLocation, defaultUrl }) {
  const hasRedirect = routeLocation && routeLocation.state;
  if (hasRedirect) {
    const redirectPath = routeLocation.state.from.pathname;
    const redirectSearchParams = routeLocation.state.from.search;
    if (redirectPath && redirectSearchParams) {
      return `${redirectPath}${redirectSearchParams}`;
    }
    return redirectPath;
  }

  return defaultUrl;
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
