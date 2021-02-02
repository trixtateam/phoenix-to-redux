import { isObject } from './object';

/*
 * Returns true if the value if null or undefined or empty
 * @param value
 * @returns {boolean}
 */
export function isNullOrEmpty(value) {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (value === true || value === false) return false;
  if (!Number.isInteger(value) && isObject(value) && Object.keys(value).length === 0) return true;
  if (String(value).length === 0) return true;
  return false;
}
