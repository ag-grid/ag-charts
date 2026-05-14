import { warn } from '../../logging/logger';
import type { PlainObject } from '../../types/global';
import { isArray, isDate, isPlainObject, isRegExp } from '../types/typeGuards';

type StringSet = { has(value: string): boolean };
export type CloneOptions = { shallow?: StringSet; assign?: StringSet; seen?: unknown[] };

/**
 * Performs a recursive JSON-diff between a source and target JSON structure.
 *
 * On a per-property basis, takes the target property value where:
 * - types are different.
 * - type is primitive.
 * - type is array and length or content have changed.
 *
 * @param source starting point for diff
 * @param target target for diff vs. source
 * @param shallow object keys to only shallow compare during diff
 * @returns `null` if no differences, or an object with the subset of properties that have changed.
 */
export function jsonDiff<T>(source: T, target: T, shallow?: Set<keyof T>): Partial<T> | null {
    if (isArray(target)) {
        if (
            !isArray(source) ||
            source.length !== target.length ||
            target.some((v, i) => jsonDiff(source[i], v, shallow) != null)
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
            if (source[key] === target[key]) {
                continue;
            } else if (shallow?.has(key)) {
                result[key] = target[key];
            } else if (typeof source[key] === typeof target[key]) {
                const diff = jsonDiff(source[key], target[key], shallow);
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
 * Compares all properties of source against target's properties of the same name.
 *
 * @param source object to read properties from
 * @param target object to compare property values with
 *
 * @returns true if all properties in source have identical values in target
 */
export function jsonPropertyCompare<T>(source: Partial<T>, target: T) {
    for (const key of Object.keys(source) as (keyof T)[]) {
        if (source[key] === target?.[key]) continue;

        return false;
    }

    return true;
}

/**
 * Recursively clones of primitives and objects.
 *
 * @param source object | array
 * @param shallow
 *
 * @return deep clone of source
 */
export function deepClone<T>(source: T, opts?: CloneOptions): T {
    if (isArray(source)) {
        return cloneArray(source, opts) as T;
    }
    if (isPlainObject(source)) {
        return clonePlainObject(source, opts) as T;
    }
    if (source instanceof Map) {
        return new Map(deepClone(Array.from(source))) as T;
    }
    return shallowClone(source);
}

function cloneArray<T>(source: T[], opts?: CloneOptions): T[] {
    const result: T[] = [];
    const seen = opts?.seen;
    for (const item of source) {
        if (typeof item === 'object' && seen?.includes(item)) {
            warn('cycle detected in array', item);
            continue;
        }
        seen?.push(item);
        result.push(deepClone(item, opts));
        seen?.pop();
    }
    return result;
}

function clonePlainObject(source: PlainObject, opts?: CloneOptions) {
    const target: PlainObject = {};
    for (const key of Object.keys(source)) {
        if (opts?.assign?.has(key)) {
            target[key] = source[key];
        } else if (opts?.shallow?.has(key)) {
            target[key] = shallowClone(source[key]);
        } else {
            target[key] = deepClone(source[key], opts);
        }
    }
    return target;
}

/**
 * Clones of primitives and objects.
 *
 * @param source any value
 *
 * @return shallow clone of source
 */
export function shallowClone<T>(source: T): T {
    if (isArray(source)) {
        return source.slice(0) as T;
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
 * Walk the given JSON object graphs, invoking the visit() callback for every object encountered.
 * Arrays are descended into without a callback, however their elements will have the visit()
 * callback invoked if they are objects.
 *
 * @param json to traverse
 * @param visit callback for each non-primitive and non-array object found
 * @param skip property names to skip when walking
 * @param parallelJson to traverse in parallel
 * @param ctx
 * @param acc initial accumulator value
 */
export function jsonWalk<T, C, R>(
    json: T,
    visit: (node: T, parallelNode?: T, ctx?: C, acc?: R) => R,
    skip?: Set<string>,
    parallelJson?: T,
    ctx?: C,
    acc?: R
): R {
    if (isArray(json)) {
        acc = visit(json, parallelJson, ctx, acc);
        let index = 0;
        for (const node of json) {
            acc = jsonWalk(node, visit, skip, (parallelJson as any[])?.[index], ctx, acc);
            index++;
        }
    } else if (isPlainObject(json)) {
        acc = visit(json, parallelJson, ctx, acc);
        for (const key of Object.keys(json)) {
            if (skip?.has(key)) {
                continue;
            }
            const value = json[key as keyof T] as T;
            acc = jsonWalk(value, visit, skip, (parallelJson as any)?.[key], ctx, acc);
        }
    }

    return acc!;
}
