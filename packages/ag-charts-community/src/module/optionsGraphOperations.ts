import {
    Logger,
    type PlainObject,
    circularSliceArray,
    isArray,
    isNumber,
    isObjectLike,
    isPlainObject,
    isString,
} from 'ag-charts-core';

import { chartTypes } from '../chart/factory/chartTypes';
import { isGradientFill, isImageFill, isPatternFill } from '../scene/util/fill';
import { Color } from '../util/color';
import { deepClone } from '../util/json';
import { without } from '../util/object';
import {
    DEFAULTS_EDGE,
    DEPENDENCY_EDGE,
    OVERRIDES_EDGE,
    type OptionsGraphInterface,
    PATH_EDGE,
    RESOLVED_TO_BRANCH,
    UNRESOLVABLE_PATH,
    USER_OPTIONS_EDGE,
    type VertexInterface,
    getPathLastIndex,
    getPathLastIndexIndex,
    getPathSafe,
    isKey,
    isRatio,
    resolvePath,
} from './optionsGraphUtils';

type Operation =
    | ColorOperation
    | FontOperation
    | LocationOperation
    | LogicOperation
    | NumericOperation
    | TransformOperation;

type OperationFns =
    | {
          dependencies?: OperationDependenciesFactory;
          resolve: OperationResolver;
      }
    | OperationResolver;

type OperationDependenciesFactory = (
    graph: OptionsGraphInterface,
    vertex: VertexInterface,
    values: Set<VertexInterface>
) => void;

type OperationResolver = (
    graph: OptionsGraphInterface,
    vertex: VertexInterface,
    values: Set<VertexInterface>
) => unknown;

export function getOperation(value: unknown) {
    if (!isPlainObject(value)) return;
    const [operation] = Object.keys(value) as Array<Operation>;
    if (!isKey(operation, operations)) return;
    return {
        operation,
        values: Array.isArray(value[operation]) ? value[operation] : [value[operation]],
    };
}

// --- CHART ---

enum ChartOperation {
    IsCartesianChart = '$isCartesianChart',
    IsPolarChart = '$isPolarChart',
    IsStandaloneChart = '$isStandaloneChart',
}

const chartOperations: Record<ChartOperation, OperationFns> = {
    $isCartesianChart: isCartesianChartOperation,
    $isPolarChart: isPolarChartOperation,
    $isStandaloneChart: isStandaloneChartOperation,
};

function isCartesianChartOperation(graph: OptionsGraphInterface) {
    const seriesType = graph.getResolvedPath(['series', '0', 'type']);
    if (typeof seriesType !== 'string') return false;
    return chartTypes.isCartesian(seriesType);
}

function isPolarChartOperation(graph: OptionsGraphInterface) {
    const seriesType = graph.getResolvedPath(['series', '0', 'type']);
    if (typeof seriesType !== 'string') return false;
    return chartTypes.isPolar(seriesType);
}

function isStandaloneChartOperation(graph: OptionsGraphInterface) {
    const seriesType = graph.getResolvedPath(['series', '0', 'type']);
    if (typeof seriesType !== 'string') return false;
    return chartTypes.isStandalone(seriesType);
}

// --- COLOR ---

enum ColorOperation {
    ForegroundBackgroundMix = '$foregroundBackgroundMix',
    ForegroundBackgroundAccentMix = '$foregroundBackgroundAccentMix',
    Interpolate = '$interpolate',
    IsGradient = '$isGradient',
    IsImage = '$isImage',
    IsPattern = '$isPattern',
    Mix = '$mix',
}

const colorOperations: Record<ColorOperation, OperationFns> = {
    $foregroundBackgroundMix: foregroundBackgroundMixOperation,
    $foregroundBackgroundAccentMix: foregroundBackgroundAccentMixOperation,
    $interpolate: interpolateOperation,
    $isGradient: isGradientOperation,
    $isImage: isImageOperation,
    $isPattern: isPatternOperation,
    $mix: mixOperation,
};

function foregroundBackgroundMixOperation(
    graph: OptionsGraphInterface,
    vertex: VertexInterface,
    values: Set<VertexInterface>
) {
    const [backgroundRatioVertex] = values;
    const backgroundRatio = graph.resolveVertexValue(vertex, backgroundRatioVertex);
    const foregroundColor = graph.getParamValue('foregroundColor');
    const backgroundColor = graph.getParamValue('backgroundColor');

    if (typeof foregroundColor === 'string' && typeof backgroundColor === 'string' && isRatio(backgroundRatio)) {
        return Color.mix(
            Color.fromString(foregroundColor),
            Color.fromString(backgroundColor),
            backgroundRatio
        ).toString();
    }
    // Logger.warnOnce(
    //     `\`$foregroundBackgroundMix\` json operation failed on [${String(background)}}}] at [${path.join('.')}], expecting a number between 0 and 1.`
    // );
}

function foregroundBackgroundAccentMixOperation(
    graph: OptionsGraphInterface,
    vertex: VertexInterface,
    values: Set<VertexInterface>
) {
    const [backgroundRatioVertex, accentRatioVertex] = values;
    const backgroundRatio = graph.resolveVertexValue(vertex, backgroundRatioVertex);
    const accentRatio = graph.resolveVertexValue(vertex, accentRatioVertex);
    const foregroundColor = graph.getParamValue('foregroundColor');
    const backgroundColor = graph.getParamValue('backgroundColor');
    const accentColor = graph.getParamValue('accentColor');

    if (
        typeof foregroundColor === 'string' &&
        typeof backgroundColor === 'string' &&
        typeof accentColor === 'string' &&
        isRatio(backgroundRatio) &&
        isRatio(accentRatio)
    ) {
        return Color.mix(
            Color.mix(Color.fromString(foregroundColor), Color.fromString(backgroundColor), backgroundRatio),
            Color.fromString(accentColor),
            accentRatio
        ).toString();
    }
    // Logger.warnOnce(
    //     `\`$foregroundBackgroundAccentMix\` json operation failed on [${String(background)}, ${String(accent)}}] at [${path.join('.')}], expecting two numbers between 0 and 1.`
    // );
}

function interpolateOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [colorsVertex, countVertex] = values;
    const colors = graph.resolveVertexValue(vertex, colorsVertex);
    const count = graph.resolveVertexValue(vertex, countVertex);

    if (!isArray(colors) || !isNumber(count)) return;

    return Color.interpolate(
        (colors as string[]).map((color) => Color.fromString(color)),
        count
    ).map((color: any) => color.toString());
}

function isGradientOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.resolveVertexValue(vertex, valueVertex);
    return isGradientFill(value);
}

function isImageOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.resolveVertexValue(vertex, valueVertex);
    return isImageFill(value);
}

function isPatternOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.resolveVertexValue(vertex, valueVertex);
    return isPatternFill(value);
}

function mixOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [colorAVertex, colorBVertex, ratioVertex] = values;
    const colorA = graph.resolveVertexValue(vertex, colorAVertex);
    const colorB = graph.resolveVertexValue(vertex, colorBVertex);
    const ratio = graph.resolveVertexValue(vertex, ratioVertex);

    const pathArray = graph.getPathArray(vertex);
    const warningPrefix = `\`$mix\` json operation failed on [${String(colorA)}, ${String(colorB)}, ${String(ratio)}] at [${pathArray.join('.')}], expecting`;
    const warningMessage = `${warningPrefix} two colors and a number between 0 and 1.`;

    if (typeof colorB !== 'string' || !isRatio(ratio)) {
        Logger.warnOnce(warningMessage);
        return;
    }

    if (typeof colorA === 'string') {
        try {
            return Color.mix(Color.fromString(colorA), Color.fromString(colorB), ratio).toString();
        } catch {
            Logger.warnOnce(warningMessage);
            return;
        }
    }

    if (!isGradientFill(colorA)) {
        Logger.warnOnce(warningMessage);
        return;
    }

    let colorStops = colorA.colorStops;
    try {
        colorStops = colorStops?.map((value) => {
            let color;
            if (typeof value.color === 'string') {
                color = Color.mix(Color.fromString(value.color), Color.fromString(colorB), ratio).toString();
            }
            return { ...value, color };
        });
    } catch {
        Logger.warnOnce(`${warningPrefix} a gradient, a color and a number between 0 and 1.`);
        return;
    }

    return { ...colorA, colorStops };
}

// --- FONT ---

enum FontOperation {
    Rem = '$rem',
}

const fontOperations: Record<FontOperation, OperationFns> = {
    $rem: remOperation,
};

function remOperation(graph: OptionsGraphInterface, _vertex: VertexInterface, values: Set<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.getVertexValue(valueVertex);
    const fontSize = graph.getParamValue('fontSize');

    if (typeof fontSize === 'number' && typeof value === 'number') {
        return Math.round(value * fontSize);
    }
    // Logger.warnOnce(`\`$rem\` json operation failed on [${String(a)}] at [${path.join('.')}], expecting a number.`);
}

// --- LOGIC ---

enum LogicOperation {
    And = '$and',
    Eq = '$eq',
    GreaterThan = '$greaterThan',
    If = '$if',
    Not = '$not',
    Or = '$or',
    // Switch = '$switch',
}

const logicOperations: Record<LogicOperation, OperationFns> = {
    $and: andOperation,
    $eq: eqOperation,
    $greaterThan: greaterThanOperation,
    $if: ifOperation,
    $not: notOperation,
    $or: orOperation,
};

function andOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    for (const valueVertex of values) {
        const value = graph.resolveVertexValue(vertex, valueVertex);
        if (!value) return false;
    }
    return true;
}

function eqOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    let compare;
    let first = true;
    for (const valueVertex of values) {
        const value = graph.resolveVertexValue(vertex, valueVertex);
        if (first) {
            compare = value;
            first = false;
        } else if (value !== compare) {
            return false;
        }
    }
    return true;
}

function greaterThanOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [value, compare] = values;
    return (graph.resolveVertexValue(vertex, value) as number) > (graph.resolveVertexValue(vertex, compare) as number);
}

function ifOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [conditionVertex, thenVertex, elseVertex] = values;

    const condition = graph.resolveVertexValue(vertex, conditionVertex);
    const valueVertex = condition ? thenVertex : elseVertex;

    // Attach neighbours from the chosen conditional branch onto the vertex
    for (const neighbour of graph.neighboursWithEdgeValue(valueVertex, PATH_EDGE)) {
        graph.addEdge(vertex, neighbour, PATH_EDGE);
    }

    return graph.resolveVertexValue(vertex, valueVertex);
}

function notOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    for (const valueVertex of values) {
        return !graph.resolveVertexValue(vertex, valueVertex);
    }
}

function orOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    for (const valueVertex of values) {
        const value = graph.resolveVertexValue(vertex, valueVertex);
        if (value) return true;
    }
    return false;
}

// --- LOCATION ---

enum LocationOperation {
    Palette = '$palette',
    Path = '$path',
    PathString = '$pathString',
    Ref = '$ref',
}

const locationOperations: Record<LocationOperation, OperationFns> = {
    $palette: paletteOperation,
    $path: {
        dependencies: pathOperationDependenciesFactory,
        resolve: pathOperation,
    },
    $pathString: {
        dependencies: pathOperationDependenciesFactory,
        resolve: pathStringOperation,
    },
    $ref: refOperation,
};

const PALETTE_INDEX_KEYS = new Set(['fill', 'fillFallback', 'stroke', 'gradient', 'range2']);

function paletteOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [keyVertex] = values;
    const key = graph.resolveVertexValue(vertex, keyVertex);

    if (!isString(key)) return;

    if (PALETTE_INDEX_KEYS.has(key)) {
        const pathArray = graph.getPathArray(vertex);
        let index = getPathLastIndex(pathArray);

        const ignoreIndexSeries = new Set(['map-shape-background', 'map-line-background']);
        let ignoreIndexOffset = 0;
        for (let i = 0; i < index; i++) {
            const siblingSeriesType = graph.getResolvedPath(['series', `${i}`, 'type']) as string;
            if (ignoreIndexSeries.has(siblingSeriesType)) {
                ignoreIndexOffset++;
            }
        }
        index -= ignoreIndexOffset;

        if (isNaN(index)) return;

        switch (key) {
            case 'fill':
                return circularSliceArray(graph.palette.fills, 1, index)[0];
            case 'fillFallback':
                return circularSliceArray(graph.palette.fillsFallback, 1, index)[0];
            case 'stroke':
                return circularSliceArray(graph.palette.strokes, 1, index)[0];
            case 'gradient':
                return circularSliceArray(graph.palette.sequentialColors, 1, index)[0];
            case 'range2':
                return circularSliceArray(graph.palette.fills, 2, index);
        }

        return;
    }

    if (key === 'gradients') {
        return graph.palette.sequentialColors; // TODO: `gradients` as a $ref to sequentialColors within palette
    }

    // TODO: what is mutating the palette? see integratedChartsCrossFiltering.test.ts
    return deepClone(getPathSafe(graph.palette, key.split('.')));
}

function pathOperationDependenciesFactory(
    graph: OptionsGraphInterface,
    vertex: VertexInterface,
    values: Set<VertexInterface>
) {
    const [relativePathVertex] = values;

    // TODO: skip if custom branch?

    const relativePath = graph.getVertexValue(relativePathVertex);
    if (isString(relativePath)) {
        const pathArray = graph.getPathArray(vertex);
        const path = resolvePath(pathArray, relativePath);
        if (path === UNRESOLVABLE_PATH) {
            // throw new Error(`Unresolvable path [${relativePath}] at [${pathArray}]`);
            return;
        }

        const dependencyVertex = graph.findVertexAtPath(path);
        if (dependencyVertex) {
            graph.addEdge(vertex, dependencyVertex, DEPENDENCY_EDGE);
        }
    }
}

function pathOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const hasDefaultValue = values.size > 1;
    const hasCustomBranch = values.size > 2;

    const [relativePathVertex, defaultValueVertex, customBranchVertex] = values;

    const relativePath = graph.resolveVertexValue(vertex, relativePathVertex);
    const customBranch = hasCustomBranch ? graph.resolveVertexValue(vertex, customBranchVertex) : null;

    if (!isString(relativePath)) {
        throw new Error(`\`$path\` json operation failed on [${String(relativePath)}], expecting a string.`);
    }

    const pathArray = graph.getPathArray(vertex);
    const path = resolvePath(pathArray, relativePath);
    if (path === UNRESOLVABLE_PATH) {
        // throw new Error(`Unresolvable path [${relativePath}] at [${pathArray.join('.')}]`);
        return;
    }
    const resolved = customBranch ? getPathSafe(customBranch, path) : graph.getResolvedPath(path);

    if (resolved != null) {
        return resolved;
    }

    if (hasDefaultValue) {
        return graph.resolveVertexValue(vertex, defaultValueVertex);
    }

    // throw new Error(`dependency not found`);
}

function pathStringOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [relativePathVertex, variablesVertex] = values;
    const relativePath = graph.resolveVertexValue(vertex, relativePathVertex);

    if (!isString(relativePath)) {
        throw new Error(`\`$path\` json operation failed on [${String(relativePath)}], expecting a string.`);
    }

    let variables;
    if (variablesVertex) {
        variables = graph.graftAndResolveOrphan(vertex, variablesVertex) as PlainObject;
    }

    const pathArray = graph.getPathArray(vertex);
    const path = resolvePath(pathArray, relativePath, variables);
    if (path === UNRESOLVABLE_PATH) {
        throw new Error(`Unresolvable path [${relativePath}] at [${pathArray.join('.')}]`);
    }

    return path;
}

function refOperation(graph: OptionsGraphInterface, _vertex: VertexInterface, values: Set<VertexInterface>) {
    const [value] = values;
    const paramKey = graph.getVertexValue(value) as string;
    return graph.getParamValue(paramKey);
}

// --- TRANSFORM ---

enum TransformOperation {
    Apply = '$apply',
    ApplyTheme = '$applyTheme',
    Find = '$find',
    FindFirstSiblingNotOperation = '$findFirstSiblingNotOperation',
    Map = '$map',
    Merge = '$merge',
    Omit = '$omit',
    Size = '$size',
    Value = '$value',
}

const transformOperations: Record<TransformOperation, OperationFns> = {
    $apply: applyOperation,
    $applyTheme: applyThemeOperation,
    $find: findOperation,
    $findFirstSiblingNotOperation: findFirstSiblingNotOperationOperation,
    $map: mapOperation,
    $merge: mergeOperation,
    $omit: omitOperation,
    $size: sizeOperation,
    $value: valueOperation,
};

function applyOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [objectVertex, defaultValueVertex, overridesPathVertex1, overridesPathVertex2] = values;

    const object = graph.resolveVertexValue(vertex, objectVertex);
    if (!isPlainObject(object)) return;

    const defaultValue = defaultValueVertex ? graph.getVertexValue(defaultValueVertex) : undefined;
    const children = graph.neighboursWithEdgeValue(vertex, PATH_EDGE);
    const overridesPath1 = overridesPathVertex1
        ? (graph.resolveVertexValue(vertex, overridesPathVertex1) as Array<string>)
        : undefined;
    const overridesPath2 = overridesPathVertex2
        ? (graph.resolveVertexValue(vertex, overridesPathVertex2) as Array<string>)
        : undefined;

    if (children.size === 0 && defaultValue != null) {
        graph.graftObject(vertex, defaultValue, [overridesPath1, overridesPath2]);
    }

    for (const child of children) {
        if (graph.neighboursWithEdgeValue(child, PATH_EDGE).size === 0) {
            // Add a stub if we are applying to a child object with no keys, e.g. `gridLine: { styles: [{}] }`
            const stubVertex = graph.addVertex({});
            graph.addEdge(child, stubVertex, DEFAULTS_EDGE);
        } else {
            graph.graftObject(child, object, [overridesPath1, overridesPath2]);
        }
    }

    return RESOLVED_TO_BRANCH;
}

function applyThemeOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [fromPathVertex, variablesVertex, ignorePathsVertex] = values;

    let fromPaths = graph.getVertexValue(fromPathVertex);
    if (typeof fromPaths === 'string') {
        fromPaths = [fromPaths];
    }
    if (!Array.isArray(fromPaths)) return;

    const children = graph.neighboursWithEdgeValue(vertex, PATH_EDGE);
    const ignorePathsValue = ignorePathsVertex ? graph.getVertexValue(ignorePathsVertex) : [];
    const ignorePaths = Array.isArray(ignorePathsValue) ? new Set(ignorePathsValue) : new Set();

    for (const child of children) {
        const variables = graph.graftAndResolveOrphan(child, variablesVertex) as PlainObject;

        for (const fromPath of fromPaths) {
            const fromPathResolved = resolvePath([], fromPath, variables);
            if (fromPathResolved === UNRESOLVABLE_PATH) {
                continue;
            }

            graph.graftConfig(child, fromPathResolved, ignorePaths);
        }
    }

    return RESOLVED_TO_BRANCH;
}

function findOperation(_graph: OptionsGraphInterface, _vertex: VertexInterface, _values: Set<VertexInterface>) {
    throw new Error('Not yet implemented');
}

function findFirstSiblingNotOperationOperation(
    graph: OptionsGraphInterface,
    vertex: VertexInterface,
    values: Set<VertexInterface>
) {
    const [defaultValueVertex] = values;

    const pathArray = graph.getPathArray(vertex);
    const indexIndex = getPathLastIndexIndex(pathArray);
    if (indexIndex < 0) {
        return graph.resolveVertexValue(vertex, defaultValueVertex);
    }

    const parentPathArray = pathArray.slice(0, indexIndex);
    const parentVertex = graph.findVertexAtPath(parentPathArray);
    if (!parentVertex) {
        return graph.resolveVertexValue(vertex, defaultValueVertex);
    }

    const siblings = graph.neighboursWithEdgeValue(parentVertex, PATH_EDGE);

    for (let index = 0; index < siblings.size; index++) {
        if (`${index}` === pathArray[indexIndex]) continue;

        const siblingChildPathArray = parentPathArray.concat([`${index}`, ...pathArray.slice(indexIndex + 1)]);
        const siblingChildVertex = graph.findVertexAtPath(siblingChildPathArray);
        if (!siblingChildVertex) continue;

        const siblingChildUserOptionsValue = graph.findNeighbourValue(siblingChildVertex, USER_OPTIONS_EDGE);
        if (siblingChildUserOptionsValue != null) {
            return siblingChildUserOptionsValue;
        }

        const siblingChildOverridesValue = graph.findNeighbourValue(siblingChildVertex, OVERRIDES_EDGE);
        if (siblingChildOverridesValue != null) {
            return siblingChildOverridesValue;
        }
    }

    return graph.resolveVertexValue(vertex, defaultValueVertex);
}

function mapOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [mapOperationVertex, mapValuesVertex] = values;

    const mapOperationFn = graph.getVertexValue(mapOperationVertex);
    const mapValues = graph.resolveVertexValue(vertex, mapValuesVertex);

    if (!Array.isArray(mapValues)) return;
    if (!getOperation(mapOperationFn)) return mapValues.map(() => mapOperationFn);

    let index = 0;
    for (const value of mapValues) {
        graph.graftValue(vertex, `${index}`, mapOperationFn, value);
        index++;
    }

    return RESOLVED_TO_BRANCH;
}

function mergeOperation(_graph: OptionsGraphInterface, _vertex: VertexInterface, _values: Set<VertexInterface>) {
    throw new Error('Not yet implemented');
}

function omitOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [keysVertex, objectVertex] = values;
    const keys = graph.resolveVertexValue(vertex, keysVertex);
    const object = graph.resolveVertexValue(vertex, objectVertex);
    if (!Array.isArray(keys) || !isPlainObject(object)) return;

    return without(object, keys);
}

function sizeOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.resolveVertexValue(vertex, valueVertex);
    if (!isObjectLike(value)) return 0;
    return Object.keys(value).length;
}

function valueOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.getVertexValue(valueVertex);
    const pathArray = graph.getPathArray(vertex);

    if (value === '$index') {
        return getPathLastIndex(pathArray);
    }

    if (value === '$1') {
        return graph.resolveValue$1(pathArray);
    }
}

// --- NUMERIC ---

enum NumericOperation {
    IsEven = '$isEven',
    Mul = '$mul',
    Round = '$round',
}

const numericOperations: Record<NumericOperation, OperationFns> = {
    $isEven: isEvenOperation,
    $mul: mulOperation,
    $round: roundOperation,
};

function isEvenOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.resolveVertexValue(vertex, valueVertex);
    if (isNaN(Number(value))) return false;
    return Number(value) % 2 === 0;
}

function mulOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    let result: number | undefined;
    for (const valueVertex of values) {
        const value = graph.resolveVertexValue(vertex, valueVertex);
        if (result == null) {
            result = Number(value);
        } else {
            result *= Number(value);
        }
    }
    return result;
}

function roundOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Set<VertexInterface>) {
    for (const valueVertex of values) {
        return Math.round(Number(graph.resolveVertexValue(vertex, valueVertex)));
    }
}

export const operations: Record<Operation, OperationFns> = {
    ...chartOperations,
    ...colorOperations,
    ...fontOperations,
    ...locationOperations,
    ...logicOperations,
    ...numericOperations,
    ...transformOperations,
};
