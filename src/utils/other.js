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
