import { Logger, circularSliceArray, isArray, isNumber, isObject, isPlainObject, isString } from 'ag-charts-core';
import type { AgGradientColor, AgPatternColor } from 'ag-charts-types';

import { Color } from './color';
import { deepClone } from './json';
import { getPath, mergeDefaults, without } from './object';

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
            if (getOperation(node)) {
                json[key] = jsonResolveVisitorValue(node, params, source, meta, [...path, key], modifiedPaths);
            } else {
                jsonResolveInner(node, params, source, meta, skip, [...path, key], modifiedPaths);
            }
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
        let hasOperation = false;
        for (const name of Object.keys(node)) {
            node[name] = jsonResolveVisitorValue(node[name], params, source, meta, [...path, name], modifiedPaths);
            hasOperation ||= isKey(name, operations);
            if (node[name] === operationResolvedUndefined) {
                delete node[name];
            }
        }

        // Purge excess unused operations to prevent leaks. These occur when the default operation object is merged an
        // object at the option key.
        if (hasOperation && Object.keys(node).length > 1) {
            for (const key of Object.keys(node)) {
                if (isKey(key, operations)) {
                    delete node[key];
                }
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
    IsPattern = '$isPattern',
    IsImage = '$isImage',
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
function isGradientFill(fill: any): fill is AgGradientColor {
    return isObject(fill) && fill.type == 'gradient';
}

// Duplicates `isPatternFill()` from `../scene/util/fill` due to dependency violations
function isPatternFill(fill: any): fill is AgPatternColor {
    return fill !== null && isObject(fill) && fill.type == 'pattern';
}

// Duplicates `isImageFill()` from `../scene/util/fill` due to dependency violations
function isImageFill(fill: any): fill is AgPatternColor {
    return fill !== null && isObject(fill) && fill.type == 'image';
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
    $isPattern: ([value]: string | Array<unknown>) => isPatternFill(value),
    $isImage: ([value]: string | Array<unknown>) => isImageFill(value),
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

    const indexPaletteParams = ['fill', 'fillFallback', 'stroke', 'gradient', 'range2'];
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
