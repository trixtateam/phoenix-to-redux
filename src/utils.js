import startsWith from 'lodash/startsWith';
import isNull from 'lodash/isNull';
import isUndefined from 'lodash/isUndefined';
import { SOCKET_PROTOCOL_SECURE, SOCKET_PROTOCOL_UN_SECURE, SOCKET_URI } from './constants';

/**
 * Searches the object and returns the value associated for the given parameterName
 * @param{Object} search - search object of the location
 * @param{string} parameterName - name of parameter
 * @param defaultValue - default value to return if not found
 * @returns {string}
 */
function getUrlParameter({ search, parameterName, defaultValue = '' }) {
  // eslint-disable-next-line no-useless-escape
  const parameter = parameterName.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp(`[\\?&]${parameter}=([^&#]*)`);
  const results = regex.exec(search);
  return results === null ? defaultValue : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

/**
 * Based on the given domain parameter will format and return the correct space domain format
 * @param{string} domainString - domain string
 * @returns string
 */
function formatSocketDomain({ domainString }) {
  let domainUrl = domainString;
  if (typeof domainUrl !== 'string') {
    return '';
  }

  if (!domainUrl) {
    return '';
  }
  // connection should end in '/socket'
  if (!domainUrl.includes(`/${SOCKET_URI}`)) {
    domainUrl = `${domainUrl}/${SOCKET_URI}`;
  }
  // check if the domain string contains socketProtocol and should add it or not
  // check secure vs un secure
  if (
    !domainUrl.includes(SOCKET_PROTOCOL_SECURE) &&
    !domainUrl.includes(SOCKET_PROTOCOL_UN_SECURE)
  ) {
    if (startsWith(domainUrl, 'localhost')) {
      domainUrl = `${SOCKET_PROTOCOL_UN_SECURE}${domainUrl}`;
    } else {
      domainUrl = `${SOCKET_PROTOCOL_SECURE}${domainUrl}`;
    }
  }

  return domainUrl;
}

/**
 * Checks to see if we have a valid socket object
 * @param {Object} socket - phoenix socket
 * @returns {boolean}
 */
function hasValidSocket(socket) {
  if (socket === false) {
    return false;
  }
  if (isNull(socket)) {
    return false;
  }
  if (isUndefined(socket)) {
    return false;
  }

  return true;
}

export { hasValidSocket, formatSocketDomain, getUrlParameter };
