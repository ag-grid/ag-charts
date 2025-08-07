import { type PlainObject, isNumber, isObjectLike } from 'ag-charts-core';

export interface VertexInterface {}

export interface OptionsGraphInterface {
    readonly palette: PlainObject;

    addEdge(from: VertexInterface, to: VertexInterface, edge?: string): void;
    addVertex(value: unknown): VertexInterface;
    dangerouslyGetUserOption(path: Array<string>): unknown;
    findNeighbour(vertex: VertexInterface, edge: string): unknown;
    findNeighbourValue(vertex: VertexInterface, edge: string): unknown;
    findNeighbourWithValue(vertex: VertexInterface, value: unknown, edge?: string): VertexInterface | undefined;
    findVertexAtPath(path: Array<string>): VertexInterface | undefined;
    getCachedValue(path: Array<string>, key: string): unknown;
    getResolvedPath(path: Array<string>): unknown;
    getParamValue(path: string): unknown;
    getPathArray(vertex: VertexInterface): Array<string>;
    getVertexValue(vertex: VertexInterface): unknown;
    graftAndResolveOrphan(context: VertexInterface, branch: VertexInterface): unknown;
    graftConfig(target: VertexInterface, configPathArray: Array<string>, ignorePaths: Set<string>): void;
    graftObject(
        target: VertexInterface,
        object: PlainObject,
        overridesPathArrays?: Array<Array<string> | undefined>
    ): void;
    graftValue(target: VertexInterface, path: string, ontoObject: unknown, value: unknown, edgeValue?: string): void;
    hasThemeOverride(path: Array<string>): boolean;
    hasUserOption(path: Array<string>): boolean;
    neighboursWithEdgeValue(vertex: VertexInterface, edge: string): Array<VertexInterface> | undefined;
    removeEdges(vertex: VertexInterface, edge: string): void;
    resolveValue$1(path: Array<string>): unknown;
    resolveVertexValue(vertex: VertexInterface, valueVertex: VertexInterface): unknown;
    setCachedValue(path: Array<string>, key: string, value: unknown): void;
}

// The edge that connects two options keys, e.g. `parent` to `child` in the object `{ parent: { child: 'some value' } }`.
export const PATH_EDGE = 'path';

// The edge that connects an option key to its accumulated path string array.
export const PATH_ARRAY_EDGE = 'pathArray';

// The edges that connect an option key to its potential values from different sources.
export const DEFAULTS_EDGE = 'default';
export const OVERRIDES_EDGE = 'override';
export const USER_OPTIONS_EDGE = 'user';
export const USER_PARTIAL_OPTIONS_EDGE = 'userPartial';

// The edge that connects an option key, whose value is an operation, to its operation.
export const OPERATION_EDGE = 'operation';
export const OPERATION_VALUE_EDGE = 'operationValue';

// The edge that connects an option key, whose value is an operation, to all other option keys which are shallow
// dependencies of the operation, e.g. `{ $path: './other' }` will have a single dependency on its sibling. If
// the value at `other` is also an operation, then original vertex will _not_ be connected to the deep
// dependencies of `other`.
export const DEPENDENCY_EDGE = 'dependency';

// The edges that connect a branch to a potential auto-enable value.
export const AUTO_ENABLE_EDGE = 'autoEnable';
export const AUTO_ENABLE_VALUE_EDGE = 'autoEnableValue';

export function isRatio(value: unknown): value is number {
    return isNumber(value) && value >= 0 && value <= 1;
}

export function hasPathSafe(object: PlainObject, path: string[]) {
    let result = object;
    for (const part of path) {
        // Since this is called so often on large multi series charts, inline the check for `isKey`
        const isPartKey =
            typeof part === 'string' &&
            result != null &&
            (typeof result === 'object' || Array.isArray(result)) &&
            part in result;
        if (!isPartKey) return false;
        result = result[part as any];
    }
    return true;
}

export function getPathSafe(object: PlainObject, path: string[]) {
    let result = object;
    for (const part of path) {
        // Since this is called so often on large multi series charts, inline the check for `isKey`
        const isPartKey =
            typeof part === 'string' &&
            result != null &&
            (typeof result === 'object' || Array.isArray(result)) &&
            part in result;
        if (!isPartKey) return;
        result = result[part as any];
    }
    return result as unknown;
}

export function setPathSafe(object: PlainObject, path: (string | number)[], value: unknown) {
    const pathLength = path.length;
    if (pathLength === 0) return;

    let result = object;
    const lastIndex = pathLength - 1;
    const lastPart = path[lastIndex];

    for (let i = 0; i < lastIndex; i++) {
        const part = path[i];
        const nextPart = path[i + 1];
        let currentValue = result[part];

        if (currentValue == null || !isObjectLike(currentValue)) {
            // TODO: this is not the best fix, this happens when a default value is a string and the user value is an object
            currentValue = isNaN(Number(nextPart)) ? {} : [];
            result[part] = currentValue;
        }

        result = currentValue;
    }

    result[lastPart] = value;
}

const DIGITS_ONLY_REGEX = /^\d+$/;
export function getPathLastIndexIndex(pathArray: Array<string>) {
    // Manual loop from end is faster than findLastIndex + Number conversion
    for (let i = pathArray.length - 1; i >= 0; i--) {
        const part = pathArray[i];
        // Regex test for digits-only is faster than Number() + isNaN()
        if (DIGITS_ONLY_REGEX.test(part)) {
            return i;
        }
    }
    return -1;
}

export function getPathLastIndex(pathArray: Array<string>) {
    const indexIndex = getPathLastIndexIndex(pathArray);
    return Number(pathArray[indexIndex]);
}

export function resolvePath(currentPath: string[], path: string, variables?: PlainObject) {
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
            const index = getPathLastIndex(currentPath);
            if (isNaN(index)) return UNRESOLVABLE_PATH;
            resolvedPath.push(`${index}`);
        } else if (part === '$prevIndex') {
            const index = getPathLastIndex(currentPath);
            if (isNaN(index) || Number(index) <= 0) return UNRESOLVABLE_PATH;
            resolvedPath.push(`${Number(index) - 1}`);
        } else if (part.startsWith('$')) {
            const variable = variables?.[part.slice(1)];
            if (variable == null) return UNRESOLVABLE_PATH;
            resolvedPath.push(variable);
        } else if (part.length !== 0) {
            resolvedPath.push(part);
        }

        prevPartWasTwoDots = part === '..';
    }

    return resolvedPath;
}

export const UNRESOLVABLE_PATH = Symbol('unresolvable-path');
export const RESOLVED_TO_BRANCH = Symbol('resolved-to-branch');
