import { Logger } from './logger';
import { mapValues } from './object';
import { isProperties } from './properties';
import { isArray, isDate, isFunction, isHtmlElement, isObject, isPlainObject, isRegExp } from './type-guards';
import type { DeepPartial } from './types';

const CLASS_INSTANCE_TYPE = 'class-instance';

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
 * @param skip object keys to skip during diff
 * @returns `null` if no differences, or an object with the subset of properties that have changed.
 */
export function jsonDiff<T extends unknown>(source: T, target: T, skip?: (keyof T)[]): Partial<T> | null {
    if (isArray(target)) {
        if (
            !isArray(source) ||
            source.length !== target.length ||
            target.some((v, i) => jsonDiff(source[i], v) != null)
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
            if (source[key] === target[key] || skip?.includes(key)) {
                continue;
            }
            if (typeof source[key] === typeof target[key]) {
                const diff = jsonDiff(source[key], target[key]);
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
 * Recursively clones of primitives and objects.
 *
 * @param source object | array
 * @param options
 *
 * @return deep clone of source
 */
export function deepClone<T>(source: T, options?: { shallow?: string[] }): T {
    if (isArray(source)) {
        return source.map((item) => deepClone(item, options)) as T;
    }
    if (isPlainObject(source)) {
        return mapValues(source, (value, key) =>
            options?.shallow?.includes(key as string) ? shallowClone(value) : deepClone(value, options)
        );
    }
    return shallowClone(source);
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
 * Walk the given JSON object graphs, invoking the visit() callback for every object encountered.
 * Arrays are descended into without a callback, however their elements will have the visit()
 * callback invoked if they are objects.
 *
 * @param json to traverse
 * @param visit callback for each non-primitive and non-array object found
 * @param opts
 * @param opts.skip property names to skip when walking
 * @param jsons to traverse in parallel
 */
export function jsonWalk<T>(json: T, visit: (...nodes: T[]) => void, opts?: { skip?: string[] }, ...jsons: T[]) {
    if (isArray(json)) {
        visit(json, ...jsons);
        json.forEach((node, index) => {
            jsonWalk(node, visit, opts, ...keyMapper(jsons, index));
        });
    } else if (isPlainObject(json)) {
        visit(json, ...jsons);
        for (const key of Object.keys(json)) {
            if (opts?.skip?.includes(key)) {
                continue;
            }
            const value = json[key as keyof T] as T;
            if (isArray(value) || isPlainObject(value)) {
                jsonWalk(value, visit, opts, ...keyMapper(jsons, key));
            }
        }
    }
}

export type JsonApplyParams = {
    constructedArrays?: WeakMap<Array<any>, new () => any>;
};

/**
 * Recursively apply a JSON object into a class-hierarchy, optionally instantiating certain classes
 * by property name.
 *
 * @param target to apply source JSON properties into
 * @param source to be applied
 * @param params
 * @param params.path path for logging/error purposes, to aid with pinpointing problems
 * @param params.matcherPath path for pattern matching, to lookup allowedTypes override.
 * @param params.skip property names to skip from the source
 * @param params.constructors dictionary of property name to class constructors for properties that
 *                            require object construction
 * @param params.constructedArrays map stores arrays which items should be initialised
 *                                 using a class constructor
 * @param params.allowedTypes overrides by path for allowed property types
 */
export function jsonApply<Target extends object, Source extends DeepPartial<Target>>(
    target: Target,
    source?: Source,
    params: {
        path?: string;
        matcherPath?: string;
        skip?: string[];
    } & JsonApplyParams = {}
): Target {
    const { path, constructedArrays, matcherPath = path?.replace(/(\[[0-9+]+])/i, '[]'), skip = [] } = params;

    if (target == null) {
        throw new Error(`AG Charts - target is uninitialised: ${path ?? '<root>'}`);
    }
    if (source == null) {
        return target;
    }

    if (isProperties(target)) {
        return target.set(source);
    }

    const targetAny = target as any;
    const targetType = classify(target);
    for (const property in source) {
        const propertyMatcherPath = `${matcherPath ? matcherPath + '.' : ''}${property}`;
        if (skip.includes(propertyMatcherPath)) continue;

        const newValue = source[property];
        const propertyPath = `${path ? path + '.' : ''}${property}`;
        const targetClass = targetAny.constructor;
        const currentValue = targetAny[property];
        let ctr: (new () => any) | undefined;
        try {
            const currentValueType = classify(currentValue);
            const newValueType = classify(newValue);

            if (targetType === CLASS_INSTANCE_TYPE && !(property in target)) {
                Logger.warn(`unable to set [${propertyPath}] in ${targetClass?.name} - property is unknown`);
                continue;
            }

            if (
                currentValueType != null &&
                newValueType != null &&
                newValueType !== currentValueType &&
                (currentValueType !== CLASS_INSTANCE_TYPE || newValueType !== 'object')
            ) {
                Logger.warn(
                    `unable to set [${propertyPath}] in ${targetClass?.name} - can't apply type of [${newValueType}], allowed types are: [${currentValueType}]`
                );
                continue;
            }

            if (newValueType === 'array') {
                ctr ??= constructedArrays?.get(currentValue);
                if (isProperties(targetAny[property])) {
                    targetAny[property].set(newValue);
                } else if (ctr == null) {
                    targetAny[property] = newValue;
                } else {
                    const newValueArray: any[] = newValue as any;
                    targetAny[property] = newValueArray.map((v) =>
                        jsonApply(new ctr!(), v, {
                            ...params,
                            path: propertyPath,
                            matcherPath: propertyMatcherPath + '[]',
                        })
                    );
                }
            } else if (newValueType === CLASS_INSTANCE_TYPE) {
                targetAny[property] = newValue;
            } else if (newValueType === 'object') {
                if (isProperties(currentValue)) {
                    targetAny[property].set(newValue);
                } else if (currentValue != null) {
                    jsonApply(currentValue, newValue as any, {
                        ...params,
                        path: propertyPath,
                        matcherPath: propertyMatcherPath,
                    });
                } else if (ctr == null) {
                    targetAny[property] = newValue;
                } else {
                    const obj = new ctr();
                    if (isProperties(obj)) {
                        targetAny[property] = obj.set(newValue as object);
                    } else {
                        targetAny[property] = jsonApply(obj, newValue, {
                            ...params,
                            path: propertyPath,
                            matcherPath: propertyMatcherPath,
                        });
                    }
                }
            } else if (isProperties(targetAny[property])) {
                targetAny[property].set(newValue);
            } else {
                targetAny[property] = newValue;
            }
        } catch (error: any) {
            Logger.warn(`unable to set [${propertyPath}] in [${targetClass?.name}]; nested error is: ${error.message}`);
        }
    }

    return target;
}

function keyMapper<T>(data: T[], key: string | number) {
    return data.map((dataObject: T | undefined) => dataObject?.[key as keyof T] as T);
}

type RestrictedClassification = 'array' | 'object' | 'primitive';
type Classification = RestrictedClassification | 'function' | 'class-instance';
/**
 * Classify the type of value to assist with handling for merge purposes.
 */
function classify(value: any): Classification | null {
    if (value == null) {
        return null;
    }
    if (isHtmlElement(value) || isDate(value)) {
        return 'primitive';
    }
    if (isArray(value)) {
        return 'array';
    }
    if (isObject(value)) {
        return isPlainObject(value) ? 'object' : CLASS_INSTANCE_TYPE;
    }
    if (isFunction(value)) {
        return 'function';
    }
    return 'primitive';
}
