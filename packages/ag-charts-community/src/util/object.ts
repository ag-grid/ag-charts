import { isDecoratedObject, listDecoratedProperties } from './decorator';
import type { Intersection } from './types';

type FalsyType = false | null | undefined;

export function deepMerge(target: any, source: any) {
    if (isPlainObject(target) && isPlainObject(source)) {
        const result: Record<string, any> = {};
        Object.keys(target).forEach((key) => {
            if (key in source) {
                result[key] = deepMerge(target[key], source[key]);
            } else {
                result[key] = target[key];
            }
        });
        Object.keys(source).forEach((key) => {
            if (!(key in target)) {
                result[key] = source[key];
            }
        });
        return result;
    }
    if ((Array.isArray(target) && !Array.isArray(source)) || (isObjectLike(target) && !isObjectLike(source))) {
        return target;
    }
    return source;
}

function isObjectLike(value: any): value is object {
    return typeof value === 'object' && value !== null;
}

function isObject(value: any): value is object {
    return isObjectLike(value) && !Array.isArray(value);
}

function isPlainObject(x: any): x is Object {
    return isObject(x) && x.constructor === Object;
}

export function mergeDefaults<TSource extends Record<string, any>, TArgs extends (TSource | FalsyType)[]>(
    ...sources: TArgs
) {
    const target: Record<string, any> = {};

    for (const source of sources) {
        if (!source) continue;

        const keys = isDecoratedObject(source) ? listDecoratedProperties(source) : Object.keys(source);

        for (const key of keys) {
            if (isObject(target[key]) && isObject(source[key])) {
                target[key] = mergeDefaults(target[key], source[key]);
            } else {
                target[key] ??= source[key];
            }
        }
    }

    return target as Intersection<Exclude<TArgs[number], FalsyType>>;
}
