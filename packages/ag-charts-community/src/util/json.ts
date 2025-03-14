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
import type { AgGradientFill } from 'ag-charts-types';

import { Color } from './color';
import { SKIP_JS_BUILTINS, getPath, mergeDefaults, without } from './object';
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
 * @param source JSON object to walk and onto which to apply the resolved values.
 * @param params An object of parameters to use with the `$ref` operation.
 * @param skip (optional) A set of keys to skip processing
 * @param context (optional) A JSON object that is used as the context for operations, e.g. `$path`
 *
 * @returns An object of modified paths.
 */
export function jsonResolveOperations<T extends object, P extends object>(
    source: T,
    params: P,
    skip?: Set<string>,
    context?: T
) {
    return jsonResolveInner(source, params, context ?? source, { matches: new Map() }, skip);
}

type OperationMeta = {
    matches: Map<string, any>;
    referencedParams?: Set<string>;
};

const operationResolvedUndefined = Symbol('operation-resolved-undefined');

function jsonResolveInner<T extends object, P extends object>(
    json: any,
    params: P,
    source: T,
    meta: OperationMeta,
    skip?: Set<string>,
    path: string[] = [],
    modifiedPaths: Record<string, any> = {}
) {
    if (isArray(json)) {
        jsonResolveVisitor(json, params, source, meta, path, modifiedPaths);
        let index = 0;
        for (const node of json) {
            jsonResolveInner(node, params, source, meta, skip, [...path, `${index}`], modifiedPaths);
            index++;
        }
    } else if (isPlainObject(json)) {
        jsonResolveVisitor(json, params, source, meta, path, modifiedPaths);
        for (const key of Object.keys(json)) {
            if (skip?.has(key)) {
                continue;
            }
            const node = json[key as keyof T];
            jsonResolveInner(node, params, source, meta, skip, [...path, key], modifiedPaths);
        }
    }

    return modifiedPaths;
}

function jsonResolveVisitor<T extends object, P extends object>(
    node: any,
    params: P,
    source: T,
    meta: OperationMeta,
    path: string[],
    modifiedPaths: Record<string, any>
) {
    if (isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            node[i] = jsonResolveVisitorValue(node[i], params, source, meta, [...path, `${i}`], modifiedPaths);
            if (node[i] === operationResolvedUndefined) {
                node[i] = undefined;
            }
        }
    } else {
        for (const name of Object.keys(node)) {
            node[name] = jsonResolveVisitorValue(node[name], params, source, meta, [...path, name], modifiedPaths);
            if (node[name] === operationResolvedUndefined) {
                delete node[name];
            }
        }
    }
}

function jsonResolveVisitorValue<T extends object, P extends object>(
    value: unknown,
    params: P,
    source: T,
    meta: OperationMeta,
    path: string[],
    modifiedPaths: Record<string, any>
) {
    const operation = getOperation(value);
    if (!operation) return value;
    modifiedPaths[path.join('.')] = value;

    const resolved = resolveOperation(operation.operation, operation.values, params, source, path, meta);
    if (resolved === undefined) return operationResolvedUndefined;
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
    Switch = '$switch',
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
    Value = '$value',
    Find = '$find',
    Omit = '$omit',
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
}

type Operation =
    | LocationOperation
    | LogicOperation
    | NumericOperation
    | TransformOperation
    | FontOperation
    | ColorOperation;

function getOperation(value: unknown) {
    if (!isPlainObject(value)) return;
    const [operation] = Object.keys(value) as Array<Operation>;
    if (!isKey(operation, operations)) return;
    return { operation, values: value[operation] };
}

function resolveOperation<T extends object, P extends object>(
    operation: Operation,
    value: string | Array<unknown>,
    params: P,
    source: T,
    path: string[],
    meta: OperationMeta
): any {
    meta.referencedParams ??= new Set();

    const resolveBranchFirst: Array<Operation> = [TransformOperation.Find, TransformOperation.Map];
    if (isArray(value) && !resolveBranchFirst.includes(operation)) {
        value = value.map((v) => {
            const nestedOperation = getOperation(v);
            if (!nestedOperation) return v;
            return resolveOperation(nestedOperation.operation, nestedOperation.values, params, source, path, meta);
        });
    }

    const fn = operations[operation];
    return fn(value, path, params, source, meta);
}

function isKey<T extends object>(key: unknown, obj: T): key is keyof T & string {
    return isString(key) && (isObject(obj) || isArray(obj)) && key in obj;
}

function isRatio(value: unknown): value is number {
    return isNumber(value) && value >= 0 && value <= 1;
}

// Duplicates `isGradientFill()` from `../scene/util/fill` due to dependency violations
function isGradientFill(fill: any): fill is AgGradientFill {
    return (
        fill !== null &&
        isObject(fill) &&
        (fill.type == 'gradient' || fill.type === 'radial-gradient' || fill.type === 'conic-gradient')
    );
}

function resolvePath(root: string[], path: string) {
    const relativePathParts = path.split('/');
    let resolvedPath = [...root];
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
            const index = root.findLast((v) => !isNaN(Number(v)));
            if (index != null) resolvedPath.push(index);
        } else if (part === '$prevIndex') {
            const index = root.findLast((v) => !isNaN(Number(v)));
            if (index != null) resolvedPath.push(`${Number(index) - 1}`);
        } else if (part.length !== 0) {
            resolvedPath.push(part);
        }

        prevPartWasTwoDots = part === '..';
    }

    return resolvedPath;
}

type OperationFn<T extends object = object, P extends object = object> = (
    value: string | Array<unknown>,
    path: string[],
    params: P,
    source: T,
    meta: OperationMeta
) => any;

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
    $switch: () => {
        // TODO
    },
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
    $omit: omit,
    $value: valueOperation,
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
};

const operations: Record<Operation, OperationFn<any, any>> = {
    ...locationOperations,
    ...logicOperations,
    ...numericOperations,
    ...transformOperations,
    ...fontOperations,
    ...colorOperations,
};

function ref<T extends object, P extends object>(
    value: string | Array<unknown>,
    path: string[],
    params: P,
    source: T,
    meta: OperationMeta
) {
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

    if (meta.referencedParams?.has(operation.values)) {
        Logger.warnOnce(
            `\`$ref\` json operation failed on [${String(value)}] at [${path.join('.')}], circular reference detected with [${[...meta.referencedParams].join(', ')}].`
        );
        return;
    }

    meta.referencedParams?.add(operation.values);
    return ref(operation.values, path, params, source, meta);
}

function palette(value: string | Array<unknown>, path: string[], params: any, source: any) {
    if (!isString(value)) return;

    const p = params.__palette;

    const indexPaletteParams = ['fill', 'stroke', 'gradient', 'range2'];
    if (indexPaletteParams.includes(value)) {
        const indexIndex = path.findLastIndex((v) => !isNaN(Number(v)));
        let index = Number(path[indexIndex]);
        if (isNaN(index)) return;

        const seriesPath = path.slice(0, indexIndex);
        const ignoreIndexSeries = ['map-shape-background', 'map-line-background'];
        const ignoreIndexOffset = getPath(source, seriesPath)
            .slice(0, index)
            .filter((s: any) => ignoreIndexSeries.includes(s.type)).length;
        index -= ignoreIndexOffset;

        switch (value) {
            case 'fill':
                return circularSliceArray(p.fills, 1, index)[0];
            case 'stroke':
                return circularSliceArray(p.strokes, 1, index)[0];
            case 'gradient':
                return p.sequentialColors[index];
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

function pathOperation<T extends object, P extends object>(
    value: string | Array<unknown>,
    path: string[],
    _params: P,
    source: T
) {
    let hasDefaultValue = false;
    let defaultValue;
    let usingCustomBranch = false;
    let branch = source;

    if (isArray(value)) {
        hasDefaultValue = true;
        defaultValue = value[1];
        usingCustomBranch = value.length === 3;
        branch = usingCustomBranch ? (value[2] as T) : branch;
        value = value[0] as string;
    } else if (!isString(value)) {
        Logger.warnOnce(
            `\`$path\` json operation failed on [${String(value)}] at [${path.join('.')}], expecting a string.`
        );
        return;
    }

    // Apply the relative path to the current path
    const resolvedPath = resolvePath(usingCustomBranch ? [] : path, value);

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

function isOperationOperator<T extends object, P extends object>(
    value: string | Array<unknown>,
    path: string[],
    _params: P,
    source: T
) {
    const resolvedPath = isString(value) ? resolvePath(path, value) : path;
    const branch = resolvedPath.length === 0 ? source : getPath(source, resolvedPath);
    return getOperation(branch) != null;
}

function isEven([a]: string | Array<unknown>, path: string[]) {
    if (typeof a === 'number') return a % 2 === 0;
    Logger.warnOnce(`\`$isEven\` json operation failed on [${String(a)}] at [${path.join('.')}], expecting a number.`);
}

function mul([a, b]: string | Array<unknown>, path: string[]) {
    if (typeof a === 'number' && typeof b === 'number') return a * b;
    Logger.warnOnce(
        `\`$mul\` json operation failed on [${String(a)}] and [${String(b)}] at [${path.join('.')}], expecting two numbers.`
    );
}

function round([a]: string | Array<unknown>, path: string[]) {
    if (typeof a === 'number') return Math.round(a);
    Logger.warnOnce(`\`$round\` json operation failed on [${String(a)}] at [${path.join('.')}], expecting a number.`);
}

function map<T extends object, P extends object>(
    [mapOperation, mapValues]: string | Array<unknown>,
    path: string[],
    params: P,
    source: T,
    meta: OperationMeta
) {
    const valuesOperation = getOperation(mapValues);
    if (valuesOperation) {
        mapValues = resolveOperation(valuesOperation.operation, valuesOperation.values, params, source, path, meta);
    }
    if (!isArray(mapValues)) return [];

    const mappedOperation = getOperation(mapOperation);
    if (!mappedOperation) return [];
    meta.matches.set(path.join('.'), mapValues);

    return mapValues.map(() => ({ [mappedOperation.operation]: mappedOperation.values }));
}

function find<T extends object, P extends object>(
    [findCondition, findValues]: string | Array<unknown>,
    path: string[],
    params: P,
    source: T,
    meta: OperationMeta
) {
    const valuesOperation = getOperation(findValues);
    if (valuesOperation) {
        findValues = resolveOperation(valuesOperation.operation, valuesOperation.values, params, source, path, meta);
    }
    if (!isArray(findValues)) return undefined;

    const conditionOperation = getOperation(findCondition);
    if (!conditionOperation) {
        return findCondition ? findValues[0] : undefined;
    }

    return findValues.find((value) =>
        resolveOperation(conditionOperation.operation, conditionOperation.values, params, value as object, [], meta)
    );
}

function merge(values: string | Array<unknown>) {
    if (!isArray(values)) return;
    for (const value of values) {
        if (!isPlainObject(value)) return;
    }
    return mergeDefaults(...(values as any));
}

function omit([keys, object]: string | Array<unknown>) {
    if (!isArray(keys) || !isPlainObject(object)) return;
    return without(object, keys as string[]);
}

function valueOperation(
    value: string | Array<unknown>,
    path: string[],
    _params: any,
    _source: any,
    meta: OperationMeta
) {
    if (value !== '$1' && value !== '$index') return value;

    const indexIndex = path.findLastIndex((v) => !isNaN(Number(v)));
    if (indexIndex === -1) return value;

    const index = Number(path[indexIndex]);
    if (value === '$index') return index;

    const key = path.slice(0, indexIndex).join('.');
    return meta.matches.get(key)?.at(index);
}

function rem<P extends object>([a]: string | Array<unknown>, path: string[], params: P) {
    const fontSize = 'fontSize';
    if (isKey(fontSize, params) && typeof params[fontSize] === 'number' && typeof a === 'number') {
        return Math.round(a * params[fontSize]);
    }
    Logger.warnOnce(`\`$rem\` json operation failed on [${String(a)}] at [${path.join('.')}], expecting a number.`);
}

function mix([a, b, c]: string | Array<unknown>, path: string[]) {
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

function foregroundBackgroundMix<P extends object>([background]: string | Array<unknown>, path: string[], params: P) {
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

function foregroundBackgroundAccentMix<P extends object>(
    [background, accent]: string | Array<unknown>,
    path: string[],
    params: P
) {
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
