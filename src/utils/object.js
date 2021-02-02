/**
 * Returns true or false if the variable passed is an object
 * @param {any} variable - anything to check if is object
 */
export function isObject(variable) {
  return variable !== undefined && Object.prototype.toString.call(variable) === '[object Object]';
}

export function isEqual(object1, object2) {
  return JSON.stringify(object1) === JSON.stringify(object2);
}

// eslint-disable-next-line no-unused-vars
export function pickBy(object, predicate = (value, key) => value) {
  if (object === null) return {};
  return (
    Object.entries(object)
      // eslint-disable-next-line no-unused-vars
      .filter(([key, value]) => predicate(value, key))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  );
}

/**
 *
 * @param {Object} obj  - object to inspect and find path value
 * @param {string} path - dot path notation for key in object
 * @param {any} fallback - default value if key is not found
 */
export function get(obj, path, fallback) {
  if (!obj) return fallback;
  const arr = typeof path === 'string' ? path.split('.') : path;
  const valueFromPath = arr.reduce(
    (accumulator, currentValue) =>
      accumulator && accumulator[currentValue] !== undefined
        ? accumulator[currentValue]
        : undefined,
    obj
  );
  return valueFromPath !== undefined ? valueFromPath : fallback;
}
