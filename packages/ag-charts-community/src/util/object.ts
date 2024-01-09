import { isDecoratedObject, listDecoratedProperties } from './decorator';
import { isObject } from './type-guards';
import type { Intersection } from './types';

type FalsyType = false | null | undefined;

export function deepMerge<TSource extends Record<string, any>, TArgs extends (TSource | FalsyType)[]>(
    ...sources: TArgs
) {
    return mergeDefaults(...sources.reverse());
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
