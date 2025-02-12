import {
    Logger,
    isArray,
    isDate,
    isFunction,
    isHtmlElement,
    isNumber,
    isObject,
    isPlainObject,
    isRegExp,
    isString,
} from 'ag-charts-core';
import type { DeepPartial, PlainObject } from 'ag-charts-core';

import { Color } from './color';
import { SKIP_JS_BUILTINS } from './object';
import { isProperties } from './properties';

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
export function jsonDiff<T>(source: T, target: T, skip?: (keyof T)[]): Partial<T> | null {
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
 * Compares all properties of source against target's properties of the same name.
 *
 * @param source object to read properties from
 * @param target object to compare property values with
 *
 * @returns true if all properties in source have identical values in target
 */
export function jsonPropertyCompare<T>(source: Partial<T>, target: T) {
    for (const key in source) {
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
export function deepClone<T>(source: T, shallow?: Set<string>): T {
    if (isArray(source)) {
        return source.map((item) => deepClone(item, shallow)) as T;
    }
    if (isPlainObject(source)) {
        return clonePlainObject(source, shallow) as T;
    }
    if (source instanceof Map) {
        return new Map(deepClone(Array.from(source))) as T;
    }
    return shallowClone(source);
}

function clonePlainObject(source: PlainObject, shallow?: Set<string>) {
    const target: PlainObject = {};
    for (const key in source) {
        target[key] = shallow?.has(key) ? shallowClone(source[key]) : deepClone(source[key], shallow);
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
        for (const key in json) {
            if (skip?.has(key)) {
                continue;
            }
            const value = json[key as keyof T] as T;
            acc = jsonWalk(value, visit, skip, (parallelJson as any)?.[key], ctx, acc);
        }
    }

    return acc!;
}

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
 * @param params.constructedArrays map stores arrays which items should be initialised using a class constructor
 */
export function jsonApply<Target extends object, Source extends DeepPartial<Target>>(
    target: Target,
    source?: Source,
    params: {
        path?: string;
        matcherPath?: string;
        skip?: string[];
    } = {}
): Target {
    const { path, matcherPath = path?.replace(/(\[[0-9+]+])/i, '[]'), skip = [] } = params;

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
        if (SKIP_JS_BUILTINS.has(property)) continue;

        const propertyMatcherPath = `${matcherPath ? matcherPath + '.' : ''}${property}`;
        if (skip.includes(propertyMatcherPath)) continue;

        const newValue = (source as any)[property];
        const propertyPath = `${path ? path + '.' : ''}${property}`;
        const targetClass = targetAny.constructor;
        const currentValue = targetAny[property];
        try {
            const currentValueType = classify(currentValue);
            const newValueType = classify(newValue);

            if (targetType === CLASS_INSTANCE_TYPE && !(property in target)) {
                if (newValue === undefined) continue;

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

            if (isProperties(currentValue)) {
                targetAny[property].set(newValue);
            } else if (newValueType === 'object') {
                if (currentValue == null) {
                    Logger.warn(`unable to set [${propertyPath}] in ${targetClass?.name} - property is unknown`);
                    continue;
                }
                jsonApply(currentValue, newValue, {
                    ...params,
                    path: propertyPath,
                    matcherPath: propertyMatcherPath,
                });
            } else {
                targetAny[property] = newValue;
            }
        } catch (error: any) {
            Logger.warn(`unable to set [${propertyPath}] in [${targetClass?.name}]; nested error is: ${error.message}`);
        }
    }

    return target;
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

/**
 * Resolve logical operations within a json object.
 *
 * @param source JSON object to walk and onto which to apply the resolved values.
 * @param params An object of parameters to use with the `ref` operation.
 *
 * @returns An object of modified paths.
 */
export function jsonResolveOperations<T, P>(source: T, params: P, skip?: Set<string>) {
    return jsonResolveInner(source, params, source, skip);
}

function jsonResolveInner<T, P>(
    json: T,
    params: P,
    source: T,
    skip?: Set<string>,
    path: string[] = [],
    modifiedPaths: Record<string, any> = {}
) {
    if (isArray(json)) {
        jsonResolveVisitor(json, params, source, path, modifiedPaths);
        let index = 0;
        for (const node of json) {
            jsonResolveInner(node, params, source, skip, [...path, `${index}`], modifiedPaths);
            index++;
        }
    } else if (isPlainObject(json)) {
        jsonResolveVisitor(json, params, source, path, modifiedPaths);
        for (const key in json) {
            if (skip?.has(key)) {
                continue;
            }
            const value = json[key as keyof T] as T;
            jsonResolveInner(value, params, source, skip, [...path, key], modifiedPaths);
        }
    }

    return modifiedPaths;
}

function jsonResolveVisitor<T, P>(node: any, params: P, source: T, path: string[], modifiedPaths: Record<string, any>) {
    if (isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            node[i] = jsonResolveVisitorValue(node[i], params, source, [...path, `${i}`], modifiedPaths);
        }
    } else {
        for (const name in node) {
            const value = node[name];
            node[name] = jsonResolveVisitorValue(value, params, source, [...path, name], modifiedPaths);
        }
    }
}

function jsonResolveVisitorValue<T, P>(
    value: unknown,
    params: P,
    source: T,
    path: string[],
    modifiedPaths: Record<string, any>
) {
    const { operation, values } = getOperation(value);
    if (!operation) return value;
    modifiedPaths[path.join('.')] = value;

    return resolveOperation(operation, values, params, source, path, new Set());
}

enum Operation {
    Ref = '$ref',
    Path = '$path',
    If = '$if',
    Eq = '$eq',
    Not = '$not',
    Or = '$or',
    And = '$and',
    Mul = '$mul',
    Round = '$round',
    Rem = '$rem',
    Mix = '$mix',
    ForegroundBackgroundMix = '$foregroundBackgroundMix',
    ForegroundBackgroundAccentMix = '$foregroundBackgroundAccentMix',
}
const operationKeys = new Set(Object.values(Operation));
type OperationFn<T, P> = (
    value: string | Array<unknown>,
    params: P,
    source: T,
    path: string[],
    referencedParams?: Set<keyof P>
) => any;

function getOperation(value: unknown) {
    if (!isPlainObject(value)) return {};
    const [operation, ...otherKeys] = Object.keys(value) as Array<Operation>;
    if (otherKeys.length !== 0 || !operationKeys.has(operation)) return {};
    return { operation, values: value[operation] };
}

function resolveOperation<T, P>(
    operation: Operation,
    value: string | Array<unknown>,
    params: P,
    source: T,
    path: string[],
    referencedParams?: Set<keyof P>
): any {
    if (isArray(value)) {
        value = value.map((v) => {
            const { operation: nestedOperation, values } = getOperation(v);
            if (!nestedOperation) return v;
            return resolveOperation(nestedOperation, values, params, source, path, referencedParams);
        });
    }

    return operations[operation](value, params, source, path, referencedParams);
}

function isRatio(value: unknown): value is number {
    return isNumber(value) && value >= 0 && value <= 1;
}

const operations: Record<Operation, OperationFn<any, any>> = {
    $ref: (key, params, source, path, referencedParams) => {
        if (isString(key) && key in params) {
            const { operation, values } = getOperation(params[key]);
            if (operation !== Operation.Ref) {
                return params[key];
            }

            if (referencedParams?.has(values)) {
                Logger.warnOnce(
                    `\`$ref\` json operation failed on [${String(key)}] at [${path.join('.')}], circular reference detected with [${[...referencedParams].join(', ')}].`
                );
                return;
            }

            referencedParams?.add(values);
            return operations.$ref(values, params, source, path, referencedParams);
        }
        Logger.warnOnce(
            `\`$ref\` json operation failed on [${String(key)}] at [${path.join('.')}], expecting one of [${Object.keys(params).join(', ')}].`
        );
    },
    $path: (relativePath, _params, source, currentPath) => {
        if (!isString(relativePath)) {
            Logger.warnOnce(
                `\`$path\` json operation failed on [${String(relativePath)}] at [${currentPath.join('.')}], expecting a string.`
            );
            return;
        }

        // Apply the relative path to the current path
        const relativePathParts = relativePath.split('/');
        const resolvedPath = [...currentPath];
        for (const part of relativePathParts) {
            if (part === '..') {
                resolvedPath.pop();
                resolvedPath.pop();
            } else if (part === '.') {
                resolvedPath.pop();
            } else {
                resolvedPath.push(part);
            }
        }

        let resolvedValue = source;
        for (const part of resolvedPath) {
            if (!(part in resolvedValue)) {
                Logger.warnOnce(
                    `\`$path\` json operation failed on [${String(relativePath)}] at [${currentPath.join('.')}], could not find path in object.`
                );
                return;
            }
            resolvedValue = resolvedValue[part];
        }

        return resolvedValue;
    },
    $if: ([condition, thenValue, elseValue]) => (condition ? thenValue : elseValue),
    $eq: ([a, b]) => a === b,
    $not: ([a, b]) => a !== b,
    $or: ([a, b]) => a || b,
    $and: ([a, b]) => a && b,
    $mul: ([a, b], _params, _source, path) => {
        if (typeof a === 'number' && typeof b === 'number') return a * b;
        Logger.warnOnce(
            `\`$mul\` json operation failed on [${String(a)}] and [${String(b)}] at [${path.join('.')}], expecting two numbers.`
        );
    },
    $round: ([a], _params, _source, path) => {
        if (typeof a === 'number') return Math.round(a);
        Logger.warnOnce(
            `\`$round\` json operation failed on [${String(a)}] at [${path.join('.')}], expecting a number.`
        );
    },
    $rem: ([a], params) => {
        if (typeof a === 'number') return Math.round(a * params.fontSize);
    },
    $mix: ([a, b, c], _params, _source, path) => {
        if (typeof a === 'string' && typeof b === 'string' && isRatio(c)) {
            try {
                return Color.mix(Color.fromString(a), Color.fromString(b), c).toString();
            } catch {
                // Discard and log below
            }
        }
        Logger.warnOnce(
            `\`$mix\` json operation failed on [${String(a)}, ${String(b)}, ${String(c)}] at [${path.join('.')}], expecting two colors and a number between 0 and 1.`
        );
    },
    $foregroundBackgroundMix: ([a], params, _source, path) => {
        if (isRatio(a)) {
            return Color.mix(
                Color.fromString(params.foregroundColor),
                Color.fromString(params.backgroundColor),
                a
            ).toString();
        }
        Logger.warnOnce(
            `\`$foregroundBackgroundMix\` json operation failed on [${String(a)}}}] at [${path.join('.')}], expecting a number between 0 and 1.`
        );
    },
    $foregroundBackgroundAccentMix: ([background, accent], params, _source, path) => {
        if (isRatio(background) && isRatio(accent)) {
            return Color.mix(
                Color.mix(
                    Color.fromString(params.foregroundColor),
                    Color.fromString(params.backgroundColor),
                    background
                ),
                Color.fromString(params.accentColor),
                accent
            ).toString();
        }
        Logger.warnOnce(
            `\`$foregroundBackgroundAccentMix\` json operation failed on [${String(background)}, ${String(accent)}}] at [${path.join('.')}], expecting two numbers between 0 and 1.`
        );
    },
};
