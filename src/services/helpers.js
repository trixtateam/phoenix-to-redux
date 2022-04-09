import { SOCKET_PROTOCOL_SECURE, SOCKET_PROTOCOL_UN_SECURE, SOCKET_URI } from '../constants';

/**
 * Cleans up domain url removing socket information and returning the
 * name portion
 * @param {String} domainUrl - url of socket domain
 */
export function getDomainKeyFromUrl(domainUrl) {
  return (
    domainUrl &&
    domainUrl
      .replace(/(wss?:\/\/|wss?:)/g, '')
      .replace('/socket', '')
      .replace('/websocket', '')
  );
}

/**
 * Based on the given domain parameter will format and return the correct space domain format
 * @param domain - domain string
 * @returns string
 */
export function formatSocketDomain(domain) {
  if (!domain || typeof domain !== 'string') return '';
  let domainUrl = domain;
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
    if (domainUrl.startsWith('localhost', 0)) {
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
  if (!socket) return false;
  if (typeof socket === 'undefined' || socket === 'undefined') {
    return false;
  }
  return true;
}
