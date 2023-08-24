/**
 * Zip two arrays into an object of keys and values, or an object of keys with a single value.
 */
export function zipObject<K, V>(keys: Array<K>, values: Array<V> | V) {
    const zipped: { [key: string]: V } = {};

    if (Array.isArray(values)) {
        for (let i = 0; i < keys.length; i++) {
            zipped[`${keys[i]}`] = values[i];
        }
    } else {
        for (let i = 0; i < keys.length; i++) {
            zipped[`${keys[i]}`] = values;
        }
    }

    return zipped;
}
