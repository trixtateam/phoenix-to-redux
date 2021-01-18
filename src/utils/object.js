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
