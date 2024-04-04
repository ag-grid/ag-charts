import { isArray, isDate, isObject, isPlainObject, isRegExp } from '../../util/type-guards';
import type { PlainObject } from '../../util/types';

type FalsyType = false | null | undefined;

/**
 * Performs a recursive diff between a source and target JSON structure, identifying differences.
 * It captures changes in type, primitives, array length/content, and object properties.
 *
 * @param source The original JSON structure.
 * @param target The JSON structure to compare against the source.
 * @param skip An array of keys to ignore during the diff.
 * @returns A `Partial<T>` object representing the differences, or `null` if no differences are found.
 */
export function difference<T extends unknown>(source: T, target: T, skip?: (keyof T)[]): Partial<T> | null {
    if (isArray(target)) {
        if (
            !isArray(source) ||
            source.length !== target.length ||
            target.some((v, i) => difference(source[i], v) != null)
        ) {
            return target;
        }
    } else if (isPlainObject(target)) {
        if (!isPlainObject(source)) {
            return target;
        }
        const result = {} as Partial<T>;
        const allKeys = new Set([
            ...(Object.keys(source) as Array<keyof T>),
            ...(Object.keys(target) as Array<keyof T>),
        ]);
        for (const key of allKeys) {
            // Cheap-and-easy equality check.
            if (source[key] === target[key] || skip?.includes(key)) continue;
            if (typeof source[key] === typeof target[key]) {
                const diff = difference(source[key], target[key]);
                if (diff !== null) {
                    result[key] = diff as T[keyof T];
                }
            } else {
                result[key] = target[key];
            }
        }
        return Object.keys(result).length ? result : null;
    } else if (source !== target) {
        return target;
    }
    return null;
}

/**
 * Recursively clones an object or array, providing options for shallow cloning specific properties.
 *
 * @param source The object or array to clone.
 * @param options An options object with a `shallow` property specifying keys to shallow clone.
 * @returns A deep clone of the source, with specified properties shallow cloned if `options.shallow` is provided.
 */
export function cloneDeep<T>(source: T, options?: { shallow?: string[] }): T {
    if (isArray(source)) {
        return source.map((item) => cloneDeep(item, options)) as T;
    }
    if (isPlainObject(source)) {
        return mapValues(source, (value, key) =>
            options?.shallow?.includes(key as string) ? cloneShallow(value) : cloneDeep(value, options)
        );
    }
    return cloneShallow(source);
}

/**
 * Creates a shallow clone of the source object, array, date, or regex.
 * Primitives are returned as-is.
 *
 * @param source The value to clone.
 * @returns A shallow clone of the source, or the original value if it's a primitive.
 */
export function cloneShallow<T>(source: T): T {
    if (isArray(source)) {
        return [...source] as T;
    }
    if (isPlainObject(source)) {
        return { ...source };
    }
    if (isDate(source)) {
        return new Date(source) as T;
    }
    if (isRegExp(source)) {
        return new RegExp(source.source, source.flags) as T;
    }
    return source;
}

/**
 * Traverses JSON object graphs, invoking a callback for each object encountered.
 * The function descends into arrays but only invokes the callback for non-array objects.
 *
 * @param json The JSON object to traverse.
 * @param visit The callback to invoke for each non-array object.
 * @param opts Optional. An object specifying properties to skip.
 * @param jsons Additional JSON objects to traverse in parallel.
 */
export function walk<T>(json: T, visit: (...nodes: T[]) => void, opts?: { skip?: string[] }, ...jsons: T[]) {
    if (isArray(json)) {
        visit(json, ...jsons);
        json.forEach((node, index) => {
            walk(node, visit, opts, ...keyMapper(jsons, index));
        });
    } else if (isPlainObject(json)) {
        visit(json, ...jsons);
        for (const key of Object.keys(json)) {
            if (opts?.skip?.includes(key)) {
                continue;
            }
            const value = json[key as keyof T] as T;
            if (isArray(value) || isPlainObject(value)) {
                walk(value, visit, opts, ...keyMapper(jsons, key));
            }
        }
    }
}

/**
 * Maps a key across an array of objects, extracting the value associated with the key from each object.
 *
 * @param data An array of objects.
 * @param key The key to map across the objects.
 * @returns An array of values associated with the key from each object.
 */
export function keyMapper<T>(data: T[], key: string | number) {
    return data.map((dataObject: T | undefined) => dataObject?.[key as keyof T] as T);
}

/**
 * Maps over the values of an object, applying a mapper function to each value.
 *
 * @param object The object to map over.
 * @param mapper The function to apply to each value of the object.
 * @returns A new object with the same keys as the original but with values transformed by the mapper function.
 */
export function mapValues<T extends PlainObject, R>(
    object: T,
    mapper: (value: T[keyof T], key: keyof T, object: T) => R
) {
    return Object.entries(object).reduce(
        (result, [key, value]) => {
            result[key as keyof T] = mapper(value, key, object);
            return result;
        },
        {} as Record<keyof T, R>
    );
}

/**
 * Recursively freezes an object or array, preventing any future modifications to it.
 *
 * @param values The object or array to freeze.
 */
export function freezeDeep(...values: unknown[]) {
    for (const value of values) {
        if (typeof value === 'object' && value !== null) {
            freezeDeep(...Object.values(value));
            Object.freeze(value);
        }
    }
}

/**
 * Recursively combines properties from source objects into a new object, preserving existing values.
 *
 * @param sources - Source objects to combine.
 * @returns The resulting object with combined and preserved properties.
 */
export function defaultsDeep<T extends PlainObject>(...sources: (T | FalsyType)[]): T {
    const target: PlainObject = {};

    for (const source of sources) {
        if (!isObject(source)) continue;
        for (const key of Object.keys(source)) {
            if (isPlainObject(target[key]) && isPlainObject(source[key])) {
                target[key] = defaultsDeep(target[key], source[key]);
            } else if (target[key] === undefined) {
                target[key] = source[key];
            }
        }
    }

    return target as T;
}
