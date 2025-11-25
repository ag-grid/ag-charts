import type { Intersection, PlainObject } from '../interfaces/globalTypes';
import { isDecoratedObject, listDecoratedProperties } from './decorator';
import { entries } from './iterators';
import { isArray, isObject, isPlainObject } from './typeGuards';

type FalsyType = false | null | undefined;

export function strictObjectKeys<O extends object>(o: O): (keyof O)[] {
    return Object.keys(o) as (keyof O)[];
}

export function objectsEqual(a: unknown, b: unknown): boolean {
    if (Array.isArray(a)) {
        if (!Array.isArray(b)) return false;
        if (a.length !== b.length) return false;

        return a.every((av, i) => objectsEqual(av, b[i]));
    } else if (isPlainObject(a)) {
        if (!isPlainObject(b)) return false;

        return objectsEqualWith(a, b, objectsEqual);
    }

    return a === b;
}

export function objectsEqualWith<T extends PlainObject>(a: T, b: T, cmp: (a: T, b: T) => boolean): boolean {
    if (Object.is(a, b)) return true;
    for (const key of Object.keys(b)) {
        if (!(key in a)) return false;
    }
    for (const key of Object.keys(a)) {
        if (!(key in b)) return false;
        if (!cmp(a[key], b[key])) return false;
    }
    return true;
}

/**
 * Merge objects from left to right, with left-most properties having highest precedent.
 *
 * NOTE: `undefined` values take lower priority than actual values irrespective of precedent.
 */
export function mergeDefaults<TSource extends PlainObject, TArgs extends (TSource | FalsyType)[]>(
    ...sources: TArgs
): Intersection<Exclude<TArgs[number], FalsyType>>;
export function mergeDefaults<TSameSource extends PlainObject>(...sources: (TSameSource | undefined)[]): TSameSource;
export function mergeDefaults<TSource extends PlainObject, TArgs extends (TSource | FalsyType)[]>(...sources: TArgs) {
    const target: PlainObject = {};

    for (const source of sources) {
        if (!isObject(source)) continue;

        const keys = isDecoratedObject(source) ? listDecoratedProperties(source) : Object.keys(source);

        for (const key of keys) {
            if (isPlainObject(target[key]) && isPlainObject(source[key])) {
                target[key] = mergeDefaults(target[key], source[key]);
            } else {
                target[key] ??= source[key];
            }
        }
    }

    return target as Intersection<Exclude<TArgs[number], FalsyType>>;
}

/**
 * Merge objects from left to right, with left-most properties having highest precedent.
 */
export function merge<TSource extends PlainObject, TArgs extends (TSource | FalsyType)[]>(...sources: TArgs) {
    const target: PlainObject = {};

    for (const source of sources) {
        if (!isObject(source)) continue;

        const keys = isDecoratedObject(source) ? listDecoratedProperties(source) : Object.keys(source);

        for (const key of keys) {
            if (isPlainObject(target[key]) && isPlainObject(source[key])) {
                target[key] = merge(target[key], source[key]);
            } else if (!(key in target)) {
                target[key] ??= source[key];
            }
        }
    }

    return target as Intersection<Exclude<TArgs[number], FalsyType>>;
}

export function mergeArrayDefaults<T extends PlainObject>(dataArray: T[], ...itemDefaults: T[]) {
    if (itemDefaults && isArray(dataArray)) {
        return dataArray.map((item) => mergeDefaults(item, ...itemDefaults));
    }
    return dataArray;
}

export function mapValues<T extends PlainObject, R>(
    object: T,
    mapper: (value: T[keyof T], key: keyof T, object: T) => R
) {
    const result = {} as Record<keyof T, R>;
    for (const [key, value] of entries(object)) {
        result[key] = mapper(value, key, object);
    }
    return result;
}

export function without<T, K extends keyof T | string>(object: T | undefined, keys: readonly K[]): Omit<T, K>;
export function without(object: object | undefined, keys: readonly string[]): object;
export function without(object: object | undefined, keys: readonly string[]) {
    const clone = { ...object };
    for (const key of keys) {
        delete clone[key as keyof object];
    }
    return clone;
}

export function pick<T, K extends keyof T>(object: T | undefined, keys: readonly K[]): Pick<T, K>;
export function pick(object: object | undefined, keys: readonly string[]): object;
export function pick(object: object | undefined, keys: readonly string[]) {
    if (object == null) return;
    const picked = {};
    for (const key of keys) {
        if (Object.hasOwn(object, key)) {
            picked[key as keyof object] = object[key as keyof object];
        }
    }
    return picked;
}

export function every<T, K extends keyof T>(object: T | undefined, fn: (key: K, value: unknown) => boolean): boolean;
export function every(object: object | undefined, fn: (key: string, value: unknown) => boolean): boolean;
export function every(object: object | undefined, fn: (key: string, value: unknown) => boolean): boolean {
    if (object == null) return true;
    for (const [key, value] of entries(object)) {
        if (!fn(key, value)) return false;
    }
    return true;
}

export function fromPairs<K extends string>(pairs?: Array<[K, any]>): Record<K, any> {
    const object = {} as Record<K, any>;
    if (pairs == null) return object;
    for (const [key, value] of pairs) {
        object[key] = value;
    }
    return object;
}

export function getPath(object: object, path: string | string[]) {
    const pathArray = isArray(path) ? path : path.split('.');
    return pathArray.reduce<any>((value, pathKey) => value[pathKey], object);
}

export const SKIP_JS_BUILTINS = new Set(['__proto__', 'constructor', 'prototype']);

export function setPath(object: object, path: string | string[], newValue: unknown) {
    const pathArray = isArray(path) ? path.slice() : path.split('.');
    const lastKey = pathArray.pop()!;
    if (pathArray.some((p) => SKIP_JS_BUILTINS.has(p))) return;

    const lastObject = pathArray.reduce<any>((value, pathKey) => value[pathKey], object);
    lastObject[lastKey] = newValue;
    return lastObject[lastKey];
}

// Similar to Object.assign, but only copy an explicit set of keys.
export function partialAssign<T>(keysToCopy: (keyof T)[], target: T, source?: Partial<T>): T {
    if (source === undefined) {
        return target;
    }

    for (const key of keysToCopy) {
        const value: T[keyof T] | undefined = source[key];
        if (value !== undefined) {
            target[key] = value;
        }
    }

    return target;
}

export function assignIfNotStrictlyEqual<T extends object>(target: T, source: T): T {
    // Object.keys() + indexed loop is faster than for-in (avoids prototype chain traversal)
    const keys = Object.keys(source) as (keyof T & string)[];
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const newValue = source[key];
        if (target[key] !== newValue) {
            target[key] = newValue;
        }
    }
    return target;
}

export function deepFreeze<T>(obj: T): T {
    if (obj == null || typeof obj !== 'object' || !isPlainObject(obj)) {
        return obj;
    }

    // Freeze the current object
    Object.freeze(obj);

    // Get all properties of the object
    for (const prop of Object.getOwnPropertyNames(obj)) {
        const value = (obj as any)[prop];

        // If the value is an object, and not null, and hasn't already been frozen, recursively freeze it
        if (value !== null && (typeof value === 'object' || typeof value === 'function') && !Object.isFrozen(value)) {
            deepFreeze(value);
        }
    }

    return obj;
}

export function isObjectWithProperty<K extends string>(obj: unknown, key: K): obj is { [key in K]: unknown } {
    return isPlainObject(obj) && key in obj;
}

export function isObjectWithStringProperty<K extends string>(obj: unknown, key: K): obj is { [key in K]: string } {
    return isObjectWithProperty(obj, key) && typeof obj[key] === 'string';
}
