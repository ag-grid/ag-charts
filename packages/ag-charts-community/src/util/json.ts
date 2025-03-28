import {
    Logger,
    circularSliceArray,
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
import type { AgGradientColor, AgPatternColor } from 'ag-charts-types';

import { Color } from './color';
import { SKIP_JS_BUILTINS, getPath, partialAssign, without } from './object';
import { isProperties } from './properties';

type StringSet = { has(value: string): boolean };
export type CloneOptions = { shallow?: StringSet; assign?: StringSet };

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
+ * @param shallow object keys to only shallow compare during diff
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
        return source.map((item) => deepClone(item, opts)) as T;
    }
    if (isPlainObject(source)) {
        return clonePlainObject(source, opts) as T;
    }
    if (source instanceof Map) {
        return new Map(deepClone(Array.from(source))) as T;
    }
    return shallowClone(source);
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
    for (const property of Object.keys(source)) {
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

            if (targetType === CLASS_INSTANCE_TYPE && !(property in target || property === 'context')) {
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
            } else if (newValueType === 'object' && property !== 'context') {
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
 * @param source[] JSON objects to walk in parallel and resolve in priority from first to last.
 * @param params An object of parameters to use with the `$ref` operation.
 * @param skip (optional) A set of keys to skip processing
 *
 * @returns The resolved object.
 */
export function jsonResolveOperations<S extends object = object, P extends object = object>(
    sources: Array<object>,
    params: P = {} as P,
    skip?: Set<string>
) {
    const resolved = {} as S;
    const meta: OperationMeta = { root: resolved, params, path: [], skip, extendPath: true, sources };

    for (const source of sources) {
        const resolvedSource = jsonResolveSource(source, meta);
        if (!isObject(resolvedSource)) continue;
        for (const key of Object.keys(resolvedSource)) {
            jsonResolveSourceWithTarget(resolved, resolvedSource, { ...meta, key, path: [key] });
        }
    }

    return resolved;
}

type OperationMeta = {
    path: string[];
    params: PlainObject;
    root: PlainObject;
    skip?: Set<string>;
    delay?: Set<string>;
    extendPath?: boolean;
    key?: string;
    matchIndex?: number;
    matches?: Array<unknown>;
    target?: any;
    sources: Array<object>;
    referencedParams?: Set<string>;
};

/**
 * Resolve the `source` object if it is an operation, with deferred resolution for operation values.
 */
function jsonResolveSource(source: unknown, meta: OperationMeta) {
    const operation = getOperation(source);
    if (!operation) return source;

    const innerTarget: PlainObject = {};
    jsonResolveSourceWithTarget(innerTarget, operation, {
        ...meta,
        key: 'values',
        extendPath: false,
    });
    return resolveOperation(operation.operation, innerTarget.values, meta);
}

/**
 * Merge the key `meta.key` on `target` with the value on `source, first processing any operations with deferred
 * resolution.
 */
function jsonResolveSourceWithTarget(target: PlainObject, source: PlainObject, meta: OperationMeta) {
    const { delay, key, skip } = meta;

    if (key == null || skip?.has(key)) return;

    const operation = getOperation(source[key]);

    if (operation && (target[key] == null || parallelOperations.has(operation.operation))) {
        if (operation.operation === TransformOperation.Unresolved) {
            target[key] = { [operation.operation]: operation.values };
            return;
        }

        if (delay?.has(key)) {
            delay.delete(key);
            target[key] = { [operation.operation]: operation.values };
            return;
        }

        const targetValue = target[key];
        const resolverFn = () => {
            // Defer resolving the operation's values until they are accessed
            const innerTarget: PlainObject = {};
            jsonResolveSourceWithTarget(innerTarget, operation, {
                ...meta,
                key: 'values',

                // Do not resolve these values the first time they are accessed, i.e. leave their resolution for
                // the operator to handle
                delay: delayFirstValueOperations.has(operation.operation) ? new Set(['0']) : undefined,

                // Do not extend the path since this is an array of operation values
                extendPath: false,

                // The `$apply` operator updates `$value: '$target'`
                target: operation.operation === TransformOperation.Apply ? targetValue : meta.target,
            });

            return resolveOperation(operation.operation, innerTarget.values, meta);
        };

        // Defer resolving this operator until it is accessed
        const resolver = createResolver(target, key, resolverFn);
        Object.defineProperty(target, key, { get: resolver, configurable: true, enumerable: true });
    } else if (isPlainObject(source[key])) {
        if (isPlainObject(target[key])) {
            target[key] = jsonResolveObjects([target[key], source[key]], meta);
        } else {
            target[key] ??= jsonResolveObjects([source[key]], meta);
        }
    } else if (isArray(source[key])) {
        if (isArray(target[key])) {
            target[key] = jsonResolveArrays([target[key], source[key]], meta);
        } else {
            target[key] ??= jsonResolveArrays([source[key]], meta);
        }
    } else {
        target[key] ??= source[key];
    }
}

function createResolver(object: PlainObject, key: string | number, fn: () => any) {
    return () => {
        let value = fn();

        // Remove operations that resolve to undefined to avoid polluting object
        if (value === undefined) {
            delete object[key];
            return;
        }

        Object.defineProperty(object, key, { value, configurable: true, enumerable: true });
        return value;
    };
}

function jsonResolveObjects(sources: Array<unknown>, meta: OperationMeta) {
    const resolved: PlainObject = {};

    for (const source of sources) {
        const resolvedSource = jsonResolveSource(source, meta);
        if (!isObject(resolvedSource)) continue;
        for (const key of Object.keys(resolvedSource)) {
            jsonResolveSourceWithTarget(resolved, resolvedSource, {
                ...meta,
                extendPath: true,
                key,
                path: [...meta.path, key],
            });
        }
    }

    return resolved;
}

function jsonResolveArrays(sources: Array<unknown>, meta: OperationMeta) {
    const resolved: Array<unknown> = [];

    for (const source of sources) {
        if (!isArray(source)) continue;
        for (let index = 0; index < source.length; index++) {
            const path = meta.extendPath ? [...meta.path, `${index}`] : meta.path;
            jsonResolveSourceWithTarget(resolved, source, {
                ...meta,
                extendPath: true,
                key: `${index}`,
                path: path,
            });
        }
    }

    return resolved;
}

enum LocationOperation {
    Ref = '$ref',
    Path = '$path',
    Palette = '$palette',
}

enum LogicOperation {
    If = '$if',
    Eq = '$eq',
    Not = '$not',
    Or = '$or',
    And = '$and',
    IsOperation = '$isOperation',
}

enum NumericOperation {
    IsEven = '$isEven',
    Mul = '$mul',
    Round = '$round',
}

enum TransformOperation {
    Map = '$map',
    Merge = '$merge',
    Apply = '$apply',
    Value = '$value',
    Find = '$find',
    Pick = '$pick',
    Omit = '$omit',
    Clone = '$clone',
    Unresolved = '$unresolved',
    Resolved = '$resolved',
}

enum FontOperation {
    Rem = '$rem',
}

enum ColorOperation {
    Mix = '$mix',
    ForegroundBackgroundMix = '$foregroundBackgroundMix',
    ForegroundBackgroundAccentMix = '$foregroundBackgroundAccentMix',
    Interpolate = '$interpolate',
    IsGradient = '$isGradient',
    IsPattern = '$isPattern',
}

type Operation =
    | LocationOperation
    | LogicOperation
    | NumericOperation
    | TransformOperation
    | FontOperation
    | ColorOperation;

const parallelOperations: Set<Operation> = new Set([TransformOperation.Apply]);
const delayFirstValueOperations: Set<Operation> = new Set([TransformOperation.Find, TransformOperation.Map]);

function getOperation(value: unknown) {
    if (!isPlainObject(value)) return;
    const [operation] = Object.keys(value) as Array<Operation>;
    if (!operationKeys.has(operation)) return;
    return { operation, values: value[operation] };
}

function resolveOperation(operation: Operation, value: string | Array<unknown>, meta: OperationMeta): any {
    meta.referencedParams ??= new Set();
    const fn = operations[operation];
    return fn(value, meta);
}

function isKey<T extends object>(key: unknown, obj: T): key is keyof T & string {
    // return isString(key) && (isObject(obj) || isArray(obj)) && key in obj;
    return typeof key === 'string' && obj !== null && (typeof obj === 'object' || Array.isArray(obj)) && key in obj;
}

function isRatio(value: unknown): value is number {
    return isNumber(value) && value >= 0 && value <= 1;
}

// Duplicates `isGradientFill()` from `../scene/util/fill` due to dependency violations
function isGradientFill(fill: any): fill is AgGradientColor {
    return isObject(fill) && fill.type == 'gradient';
}

// Duplicates `isPatternFill()` from `../scene/util/fill` due to dependency violations
function isPatternFill(fill: any): fill is AgPatternColor {
    return fill !== null && isObject(fill) && fill.type == 'pattern';
}

function resolvePath(currentPath: string[], path: string, index?: string, variables?: PlainObject) {
    const relativePathParts = path.split('/');
    let resolvedPath = [...currentPath];
    if (path.startsWith('/')) {
        resolvedPath = [];
        relativePathParts.shift();
    }

    let prevPartWasTwoDots = false;
    for (const part of relativePathParts) {
        if (part === '..') {
            resolvedPath.pop();
            if (!prevPartWasTwoDots) resolvedPath.pop();
        } else if (part === '.') {
            resolvedPath.pop();
        } else if (part === '$index') {
            if (index != null) resolvedPath.push(index);
        } else if (part === '$prevIndex') {
            if (index != null) resolvedPath.push(`${Number(index) - 1}`);
        } else if (part.startsWith('$')) {
            resolvedPath.push(variables?.[part.slice(1)]);
        } else if (part.length !== 0) {
            resolvedPath.push(part);
        }

        prevPartWasTwoDots = part === '..';
    }

    return resolvedPath;
}

type OperationFn = (value: string | Array<unknown>, meta: OperationMeta) => any;

const locationOperations: Record<LocationOperation, OperationFn> = {
    $ref: ref,
    $path: pathOperation,
    $palette: palette,
};

const logicOperations: Record<LogicOperation, OperationFn> = {
    $if: ([condition, thenValue, elseValue]) => (condition ? thenValue : elseValue),
    $eq: ([a, b]) => a === b,
    $not: ([a]) => !a,
    $or: (values) => isArray(values) && values.some(Boolean),
    $and: (values) => isArray(values) && values.every(Boolean),
    $isOperation: isOperationOperator,
};

const numericOperations: Record<NumericOperation, OperationFn> = {
    $isEven: isEven,
    $mul: mul,
    $round: round,
};

const transformOperations: Record<TransformOperation, OperationFn> = {
    $map: map,
    $find: find,
    $merge: merge,
    $apply: apply,
    $pick: pick,
    $omit: omit,
    $value: valueOperation,
    $clone: clone,
    $unresolved: ([value]) => {
        return { $unresolved: [value] };
    },
    $resolved: ([value], meta) => {
        if (!isPlainObject(value) || !('$unresolved' in value)) return;

        const target = {};
        for (const key of Object.keys(value.$unresolved[0])) {
            jsonResolveSourceWithTarget(target, value.$unresolved[0], { ...meta, key });
        }

        return target;
    },
};

const fontOperations: Record<FontOperation, OperationFn> = {
    $rem: rem,
};

const colorOperations: Record<ColorOperation, OperationFn> = {
    $mix: mix,
    $foregroundBackgroundMix: foregroundBackgroundMix,
    $foregroundBackgroundAccentMix: foregroundBackgroundAccentMix,
    $interpolate: interpolate,
    $isGradient: ([value]: string | Array<unknown>) => isGradientFill(value),
    $isPattern: ([value]: string | Array<unknown>) => isPatternFill(value),
};

const operations: Record<Operation, OperationFn> = {
    ...locationOperations,
    ...logicOperations,
    ...numericOperations,
    ...transformOperations,
    ...fontOperations,
    ...colorOperations,
};
const operationKeys = new Set(Object.keys(operations));

function ref(value: string | Array<unknown>, meta: OperationMeta) {
    const { path, params, referencedParams } = meta;

    if (!isKey(value, params)) {
        Logger.warnOnce(
            `\`$ref\` json operation failed on [${String(value)}] at [${path.join('.')}], expecting one of [${Object.keys(params).join(', ')}].`
        );
        return;
    }

    const operation = getOperation(params[value]);
    if (operation?.operation !== LocationOperation.Ref) {
        return params[value];
    }

    if (referencedParams?.has(operation.values)) {
        Logger.warnOnce(
            `\`$ref\` json operation failed on [${String(value)}] at [${path.join('.')}], circular reference detected with [${[...referencedParams].join(', ')}].`
        );
        return;
    }

    meta.referencedParams?.add(operation.values);
    return ref(operation.values, meta);
}

function palette(value: string | Array<unknown>, { key, matchIndex, path, params, root }: OperationMeta) {
    if (!isString(value)) return;

    const p = params.__palette;

    const indexPaletteParams = ['fill', 'fillFallback', 'stroke', 'gradient', 'range2'];
    if (indexPaletteParams.includes(value)) {
        const indexIndex = path.findLastIndex((v) => !isNaN(Number(v)));
        let index = Number(path[indexIndex]);

        if (isNaN(index)) {
            if (matchIndex != null) {
                index = matchIndex;
            } else if (key != null) {
                index = Number(key);
            } else {
                return;
            }
        } else {
            const seriesPath = path.slice(0, indexIndex);
            const ignoreIndexSeries = ['map-shape-background', 'map-line-background'];
            const ignoreIndexOffset = (getPath(root, seriesPath) ?? [])
                .slice(0, index)
                .filter((s: any) => ignoreIndexSeries.includes(s.type)).length;
            index -= ignoreIndexOffset;
        }

        switch (value) {
            case 'fill':
                return circularSliceArray(p.fills, 1, index)[0];
            case 'fillFallback':
                return circularSliceArray(p.fillsFallback, 1, index)[0];
            case 'stroke':
                return circularSliceArray(p.strokes, 1, index)[0];
            case 'gradient':
                return circularSliceArray(p.sequentialColors, 1, index)[0];
            case 'range2':
                return circularSliceArray(p.fills, 2, index);
        }

        return;
    }

    if (value === 'gradients') {
        return p.sequentialColors; // TODO: `gradients` as a $ref to sequentialColors within palette
    }

    return getPath(p, value);
}

function pathOperation(value: string | Array<unknown>, { path, root, key }: OperationMeta) {
    let hasDefaultValue = false;
    let defaultValue;
    let usingCustomBranch = false;
    let branch = root;
    let variables;

    if (isArray(value)) {
        hasDefaultValue = true;
        defaultValue = value[1];
        usingCustomBranch = value.length >= 3;
        branch = usingCustomBranch ? (value[2] as PlainObject) : branch;
        variables = isPlainObject(value[3]) ? value[3] : undefined;
        value = value[0] as string;
    } else if (!isString(value)) {
        Logger.warnOnce(
            `\`$path\` json operation failed on [${String(value)}] at [${path.join('.')}], expecting a string.`
        );
        return;
    }

    // Apply the relative path to the current path
    const resolvedPath = resolvePath(usingCustomBranch ? [] : path, value, key, variables);

    // const isCircular =
    //     !usingCustomBranch &&
    //     path.length > 0 &&
    //     path.every((part, index) => part === resolvedPath[index] || index >= resolvedPath.length);
    // if (isCircular) {
    //     Logger.warnOnce(
    //         `\`$path\` json operation failed on [${String(value)}] at [${path.join('.')}] resolved to [${resolvedPath.join('.')}], path is circular.`
    //     );
    //     return;
    // }

    let resolvedValue: any = branch;
    for (const part of resolvedPath) {
        if (!isKey(part, resolvedValue)) {
            if (!hasDefaultValue) {
                Logger.warnOnce(
                    `\`$path\` json operation failed on [${String(value)}] at [${path.join('.')}] resolved to [${resolvedPath.join('.')}], could not find path in object.`
                );
                return;
            } else {
                return defaultValue;
            }
        }
        resolvedValue = resolvedValue[part];
    }

    return Object.isFrozen(resolvedValue) ? deepClone(resolvedValue) : resolvedValue;
}

function isOperationOperator(value: string | Array<unknown>, { path, sources }: OperationMeta) {
    const resolvedPath = isString(value) ? resolvePath(path, value) : path;
    // Iterate sources in reverse since a later non-operation value will overwrite an earlier operation
    for (let i = sources.length - 1; i >= 0; i--) {
        const source = sources[i];
        const branch = resolvedPath.length === 0 ? source : getPath(source, resolvedPath);
        if (branch == null) continue;
        return getOperation(branch) != null;
    }
    return false;
}

function isEven([a]: string | Array<unknown>, { path }: OperationMeta) {
    if (typeof a === 'number') return a % 2 === 0;
    Logger.warnOnce(`\`$isEven\` json operation failed on [${String(a)}] at [${path.join('.')}], expecting a number.`);
}

function mul([a, b]: string | Array<unknown>, { path }: OperationMeta) {
    if (typeof a === 'number' && typeof b === 'number') return a * b;
    Logger.warnOnce(
        `\`$mul\` json operation failed on [${String(a)}] and [${String(b)}] at [${path.join('.')}], expecting two numbers.`
    );
}

function round([a]: string | Array<unknown>, { path }: OperationMeta) {
    if (typeof a === 'number') return Math.round(a);
    Logger.warnOnce(`\`$round\` json operation failed on [${String(a)}] at [${path.join('.')}], expecting a number.`);
}

function map([mapOperation, mapValues]: string | Array<unknown>, meta: OperationMeta) {
    if (!isArray(mapValues)) {
        return [];
    }

    const mappedOperation = getOperation(mapOperation);
    if (!mappedOperation) {
        return mapValues.map(() => mapOperation);
    }

    const target: any[] = [];
    const source = mapValues.map(() => ({ [mappedOperation.operation]: deepClone(mappedOperation.values) }));

    for (let index = 0; index < mapValues.length; index++) {
        jsonResolveSourceWithTarget(target, source, {
            ...meta,
            key: `${index}`,
            matchIndex: index,
            matches: mapValues,
        });
    }

    return target;
}

function find([findCondition, findValues]: string | Array<unknown>, meta: OperationMeta) {
    if (!isArray(findValues)) {
        return;
    }

    const conditionOperation = getOperation(findCondition);
    if (!conditionOperation) {
        return findCondition ? findValues[0] : undefined;
    }

    const target: any[] = [];

    // Do not access `findValues` directly to avoid resolving values and creating circular references
    const source = Array.from({ length: findValues.length }, () => ({
        [conditionOperation.operation]: deepClone(conditionOperation.values),
    }));

    const indexIndex = meta.path.findLastIndex((v) => !isNaN(Number(v)));
    for (let index = 0; index < findValues.length; index++) {
        const path = [...meta.path];
        path[indexIndex] = `${index}`;
        jsonResolveSourceWithTarget(target, source, {
            ...meta,
            path,
            key: `${index}`,
            matchIndex: index,
            matches: findValues,
        });
    }

    return findValues[target.findIndex((value) => value)];
}

function merge(values: string | Array<unknown>, meta: OperationMeta) {
    if (!isArray(values)) return;
    return jsonResolveObjects(values, meta);
}

function apply(values: string | Array<unknown>) {
    if (!isArray(values)) return;
    return values[0];
}

function pick([keys, object]: string | Array<unknown>) {
    if (!isArray(keys) || !isPlainObject(object)) return;
    return partialAssign<PlainObject>(keys as string[], {}, object);
}

function omit([keys, object]: string | Array<unknown>) {
    if (!isArray(keys) || !isPlainObject(object)) return;
    return without(object, keys as string[]);
}

function clone([value]: string | Array<unknown>) {
    if (isPlainObject(value)) return deepClone(value);
    return value;
}

function valueOperation(value: string | Array<unknown>, { path, key, matchIndex, matches, target }: OperationMeta) {
    if (value === '$path') {
        return path.join('.');
    }

    if (value === '$target') {
        return target;
    }

    if (value === '$index') {
        return Number(key);
    }

    if (value === '$1') {
        if (matchIndex == null) return;
        return matches?.[matchIndex];
    }
}

function rem([a]: string | Array<unknown>, { path, params }: OperationMeta) {
    const fontSize = 'fontSize';
    if (isKey(fontSize, params) && typeof params[fontSize] === 'number' && typeof a === 'number') {
        return Math.round(a * params[fontSize]);
    }
    Logger.warnOnce(`\`$rem\` json operation failed on [${String(a)}] at [${path.join('.')}], expecting a number.`);
}

function mix([a, b, c]: string | Array<unknown>, { path }: OperationMeta) {
    const warningPrefix = `\`$mix\` json operation failed on [${String(a)}, ${String(b)}, ${String(c)}] at [${path.join('.')}], expecting`;
    const warningMessage = `${warningPrefix} two colors and a number between 0 and 1.`;

    if (typeof b !== 'string' || !isRatio(c)) {
        Logger.warnOnce(warningMessage);
        return;
    }

    if (typeof a === 'string') {
        try {
            return Color.mix(Color.fromString(a), Color.fromString(b), c).toString();
        } catch {
            Logger.warnOnce(warningMessage);
            return;
        }
    }

    if (!isGradientFill(a)) {
        Logger.warnOnce(warningMessage);
        return;
    }

    let colorStops = a.colorStops;
    try {
        colorStops = colorStops?.map((value) => {
            let color;
            if (typeof value.color === 'string') {
                color = Color.mix(Color.fromString(value.color), Color.fromString(b), c).toString();
            }
            return { ...value, color };
        });
    } catch {
        Logger.warnOnce(`${warningPrefix} a gradient, a color and a number between 0 and 1.`);
        return;
    }

    return { ...a, colorStops };
}

function foregroundBackgroundMix([background]: string | Array<unknown>, { path, params }: OperationMeta) {
    const foregroundColor = 'foregroundColor';
    const backgroundColor = 'backgroundColor';
    if (
        isKey(foregroundColor, params) &&
        isKey(backgroundColor, params) &&
        typeof params[foregroundColor] === 'string' &&
        typeof params[backgroundColor] === 'string' &&
        isRatio(background)
    ) {
        return Color.mix(
            Color.fromString(params[foregroundColor]),
            Color.fromString(params[backgroundColor]),
            background
        ).toString();
    }
    Logger.warnOnce(
        `\`$foregroundBackgroundMix\` json operation failed on [${String(background)}}}] at [${path.join('.')}], expecting a number between 0 and 1.`
    );
}

function foregroundBackgroundAccentMix([background, accent]: string | Array<unknown>, { path, params }: OperationMeta) {
    const foregroundColor = 'foregroundColor';
    const backgroundColor = 'backgroundColor';
    const accentColor = 'accentColor';
    if (
        isKey(foregroundColor, params) &&
        isKey(backgroundColor, params) &&
        isKey(accentColor, params) &&
        typeof params[foregroundColor] === 'string' &&
        typeof params[backgroundColor] === 'string' &&
        typeof params[accentColor] === 'string' &&
        isRatio(background) &&
        isRatio(accent)
    ) {
        return Color.mix(
            Color.mix(Color.fromString(params[foregroundColor]), Color.fromString(params[backgroundColor]), background),
            Color.fromString(params[accentColor]),
            accent
        ).toString();
    }
    Logger.warnOnce(
        `\`$foregroundBackgroundAccentMix\` json operation failed on [${String(background)}, ${String(accent)}}] at [${path.join('.')}], expecting two numbers between 0 and 1.`
    );
}

function interpolate([colors, count]: string | Array<unknown>) {
    if (!isArray(colors) || !isNumber(count)) return;
    return Color.interpolate(
        (colors as string[]).map((color) => Color.fromString(color)),
        count
    ).map((color: any) => color.toString());
}
