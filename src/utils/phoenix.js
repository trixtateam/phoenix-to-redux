import startsWith from 'lodash/startsWith';
import isNull from 'lodash/isNull';
import isUndefined from 'lodash/isUndefined';
import { SOCKET_PROTOCOL_SECURE, SOCKET_PROTOCOL_UN_SECURE, SOCKET_URI } from '../constants';

/**
 * Based on the given domain parameter will format and return the correct space domain format
 * @param{string} domainString - domain string
 * @returns string
 */
export function formatSocketDomain({ domainString }) {
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
export function hasValidSocket(socket) {
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
