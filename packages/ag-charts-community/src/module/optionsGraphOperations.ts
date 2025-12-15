import {
    Color,
    Debug,
    Logger,
    ModuleRegistry,
    type PlainObject,
    circularSliceArray,
    isArray,
    isGradientFill,
    isImageFill,
    isNumber,
    isObjectLike,
    isPatternFill,
    isPlainObject,
    isString,
    without,
} from 'ag-charts-core';

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
    getPathSafe,
    isRatio,
    resolvePath,
} from './optionsGraphUtils';

export type Operation =
    | CacheOperation
    | ChartOperation
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
    values: Array<VertexInterface>
) => void;

type OperationResolver = (
    graph: OptionsGraphInterface,
    vertex: VertexInterface,
    values: Array<VertexInterface>
) => unknown;

export function getOperation(value: unknown, keys?: Array<string>) {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) return;

    keys ??= Object.keys(value);
    if (keys.length === 0) return;

    const operation = keys[0] as Operation;
    if (!operationTypes.has(operation)) return;
    return {
        operation,
        values: Array.isArray((value as PlainObject)[operation])
            ? (value as PlainObject)[operation]
            : [(value as PlainObject)[operation]],
    };
}

function getOperationTargetVertex(graph: OptionsGraphInterface, vertex: VertexInterface, valueVertex: VertexInterface) {
    const operation = getOperation(graph.getVertexValue(valueVertex));

    switch (operation?.operation) {
        case LocationOperation.Path: {
            const [relativePath] = operation.values;
            const pathArray = graph.getPathArray(vertex);
            const path = resolvePath(pathArray, relativePath);
            if (path === UNRESOLVABLE_PATH) return;
            return graph.findVertexAtPath(path);
        }

        case TransformOperation.Value:
            return vertex;
    }
}

// --- CACHE ---

enum CacheOperation {
    CacheMax = '$cacheMax',
}

const cacheOperations: Record<CacheOperation, OperationFns> = {
    $cacheMax: cacheMaxOperation,
};

function cacheMaxOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [valueVertex] = values;

    const pathArray = graph.getPathArray(vertex);
    const cached = graph.getCachedValue(pathArray, CacheOperation.CacheMax);

    const value = graph.resolveVertexValue(vertex, valueVertex);
    if (typeof value !== 'number') return cached;

    if (typeof cached !== 'number') {
        graph.setCachedValue(pathArray, CacheOperation.CacheMax, value);
        return value;
    }

    const maxValue = Math.max(cached, value);
    graph.setCachedValue(pathArray, CacheOperation.CacheMax, maxValue);

    return maxValue;
}

// --- CHART ---

enum ChartOperation {
    HasSeriesType = '$hasSeriesType',
    IsChartType = '$isChartType',
    IsSeriesType = '$isSeriesType',
}

const chartOperations: Record<ChartOperation, OperationFns> = {
    $hasSeriesType: { dependencies: seriesTypeDependencyFactory, resolve: hasSeriesTypeOperation },
    $isChartType: { dependencies: seriesTypeDependencyFactory, resolve: isChartTypeOperation },
    $isSeriesType: { dependencies: seriesTypeDependencyFactory, resolve: isSeriesTypeOperation },
};

function seriesTypeDependencyFactory(
    graph: OptionsGraphInterface,
    vertex: VertexInterface,
    _values: Array<VertexInterface>
) {
    const dependencyVertex = graph.findVertexAtPath(['series', '0', 'type']);
    if (dependencyVertex) {
        graph.addEdge(vertex, dependencyVertex, DEPENDENCY_EDGE);
    }
}

function hasSeriesTypeOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.resolveVertexValue(vertex, valueVertex);
    const series = graph.getResolvedPath(['series']);
    if (!Array.isArray(series)) return false;
    for (const s of series) {
        if (s.type === value) return true;
    }
    return false;
}

function isSeriesTypeOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.resolveVertexValue(vertex, valueVertex);
    const seriesType = graph.getResolvedPath(['series', '0', 'type']);
    return seriesType === value;
}

function isChartTypeOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.resolveVertexValue(vertex, valueVertex);
    const seriesType = graph.getResolvedPath(['series', '0', 'type']);
    if (typeof seriesType !== 'string') return false;

    const seriesModule = ModuleRegistry.getSeriesModule(seriesType);
    if (seriesModule == null) return false;

    switch (value) {
        case 'cartesian':
            return seriesModule.chartType === 'cartesian';
        case 'polar':
            return seriesModule.chartType === 'polar';
        case 'standalone':
            return seriesModule.chartType === 'standalone';
    }

    return false;
}

// --- COLOR ---

enum ColorOperation {
    ForegroundBackgroundMix = '$foregroundBackgroundMix',
    ForegroundOpacity = '$foregroundOpacity',
    Interpolate = '$interpolate',
    IsGradient = '$isGradient',
    IsImage = '$isImage',
    IsPattern = '$isPattern',
    Mix = '$mix',
}

const colorOperations: Record<ColorOperation, OperationFns> = {
    $foregroundBackgroundMix: foregroundBackgroundMixOperation,
    $foregroundOpacity: foregroundOpacityOperation,
    $interpolate: interpolateOperation,
    $isGradient: isGradientOperation,
    $isImage: isImageOperation,
    $isPattern: isPatternOperation,
    $mix: mixOperation,
};

function foregroundBackgroundMixOperation(
    graph: OptionsGraphInterface,
    vertex: VertexInterface,
    values: Array<VertexInterface>
) {
    const [foregroundRatioVertex] = values;
    const foregroundRatio = graph.resolveVertexValue(vertex, foregroundRatioVertex);
    const foregroundColor = graph.getParamValue('foregroundColor');
    const backgroundColor = graph.getParamValue('backgroundColor');

    if (typeof foregroundColor === 'string' && typeof backgroundColor === 'string' && isRatio(foregroundRatio)) {
        return Color.mix(
            Color.fromString(foregroundColor),
            Color.fromString(backgroundColor),
            1 - foregroundRatio
        ).toString();
    }

    Debug.inDevelopmentMode(() =>
        Logger.warnOnce(
            `\`$foregroundBackgroundMix\` json operation failed on [${String(foregroundRatio)}}}] at [${graph.getPathArray(vertex).join('.')}], expecting a number between 0 and 1.`
        )
    );
}

function foregroundOpacityOperation(
    graph: OptionsGraphInterface,
    vertex: VertexInterface,
    values: Array<VertexInterface>
) {
    const [opacityVertex] = values;
    const opacity = graph.resolveVertexValue(vertex, opacityVertex);
    const foregroundColor = graph.getParamValue('foregroundColor');

    if (typeof foregroundColor === 'string' && isRatio(opacity)) {
        const color = Color.fromString(foregroundColor);
        return new Color(color.r, color.g, color.b, opacity).toString();
    }

    Debug.inDevelopmentMode(() =>
        Logger.warnOnce(
            `\`$foregroundOpacity\` json operation failed on [${String(opacity)}}}] at [${graph.getPathArray(vertex).join('.')}], expecting a number between 0 and 1.`
        )
    );
}

function interpolateOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [colorsVertex, countVertex] = values;
    const colors = graph.resolveVertexValue(vertex, colorsVertex);
    const count = graph.resolveVertexValue(vertex, countVertex);

    if (!isArray(colors) || !isNumber(count)) return;

    return Color.interpolate(
        (colors as string[]).map((color) => Color.fromString(color)),
        count
    ).map((color: any) => color.toString());
}

function isGradientOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.resolveVertexValue(vertex, valueVertex);
    return isGradientFill(value);
}

function isImageOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.resolveVertexValue(vertex, valueVertex);
    return isImageFill(value);
}

function isPatternOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.resolveVertexValue(vertex, valueVertex);
    return isPatternFill(value);
}

function mixOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [colorAVertex, colorBVertex, ratioVertex] = values;
    const colorA = graph.resolveVertexValue(vertex, colorAVertex);
    const colorB = graph.resolveVertexValue(vertex, colorBVertex);
    const ratio = graph.resolveVertexValue(vertex, ratioVertex);

    const pathArray = graph.getPathArray(vertex);
    const warningPrefix = `\`$mix\` json operation failed on [${String(colorA)}, ${String(colorB)}, ${String(ratio)}] at [${pathArray.join('.')}], expecting`;
    const warningMessage = `${warningPrefix} two colors and a number between 0 and 1.`;

    if (typeof colorB !== 'string' || !isRatio(ratio)) {
        Debug.inDevelopmentMode(() => Logger.warnOnce(warningMessage));
        return;
    }

    if (typeof colorA === 'string') {
        try {
            return Color.mix(Color.fromString(colorA), Color.fromString(colorB), ratio).toString();
        } catch {
            Debug.inDevelopmentMode(() => Logger.warnOnce(warningMessage));
            return;
        }
    }

    if (!isGradientFill(colorA)) {
        Debug.inDevelopmentMode(() => Logger.warnOnce(warningMessage));
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
        Debug.inDevelopmentMode(() =>
            Logger.warnOnce(`${warningPrefix} a gradient, a color and a number between 0 and 1.`)
        );
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

function remOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.getVertexValue(valueVertex);
    const fontSize = graph.getParamValue('fontSize');

    if (typeof fontSize === 'number' && typeof value === 'number') {
        return Math.round(value * fontSize);
    }

    Debug.inDevelopmentMode(() =>
        Logger.warnOnce(
            `\`$rem\` json operation failed on [${String(value)}] at [${graph.getPathArray(vertex).join('.')}], expecting a number.`
        )
    );
}

// --- LOGIC ---

enum LogicOperation {
    And = '$and',
    Eq = '$eq',
    GreaterThan = '$greaterThan',
    If = '$if',
    LessThan = '$lessThan',
    Not = '$not',
    Or = '$or',
    Switch = '$switch',
}

const logicOperations: Record<LogicOperation, OperationFns> = {
    $and: andOperation,
    $eq: eqOperation,
    $greaterThan: greaterThanOperation,
    $if: ifOperation,
    $lessThan: lessThanOperation,
    $not: notOperation,
    $or: orOperation,
    $switch: switchOperation,
};

function andOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    for (const valueVertex of values) {
        const value = graph.resolveVertexValue(vertex, valueVertex);
        if (!value) return false;
    }
    return true;
}

function eqOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
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

function greaterThanOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [value, compare] = values;
    return (graph.resolveVertexValue(vertex, value) as number) > (graph.resolveVertexValue(vertex, compare) as number);
}

function ifOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [conditionVertex, thenVertex, elseVertex] = values;

    const condition = graph.resolveVertexValue(vertex, conditionVertex);
    const valueVertex = condition ? thenVertex : elseVertex;

    // Attach neighbours from the chosen conditional branch onto the vertex
    const neighbours = graph.neighboursWithEdgeValue(valueVertex, PATH_EDGE);
    if (neighbours) {
        for (const neighbour of neighbours) {
            graph.addEdge(vertex, neighbour, PATH_EDGE);
        }
    }

    return graph.resolveVertexValue(vertex, valueVertex);
}

function lessThanOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [value, compare] = values;
    return (graph.resolveVertexValue(vertex, value) as number) < (graph.resolveVertexValue(vertex, compare) as number);
}

function notOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [valueVertex] = values;
    if (!valueVertex) return;
    return !graph.resolveVertexValue(vertex, valueVertex);
}

function orOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    for (const valueVertex of values) {
        const value = graph.resolveVertexValue(vertex, valueVertex);
        if (value) return true;
    }
    return false;
}

function switchOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [conditionValueVertex, defaultValueVertex, ...caseVertices] = values;
    const conditionValue = graph.resolveVertexValue(vertex, conditionValueVertex);

    for (const caseVertex of caseVertices) {
        const caseValue = graph.getVertexValue(caseVertex);
        if (!Array.isArray(caseValue)) continue;
        const [caseConditionValue, caseResultValue] = caseValue;
        if (
            conditionValue === caseConditionValue ||
            (Array.isArray(caseConditionValue) && caseConditionValue.includes(conditionValue))
        ) {
            return caseResultValue;
        }
    }

    return graph.resolveVertexValue(vertex, defaultValueVertex);
}

// --- LOCATION ---

enum LocationOperation {
    IsUserOption = '$isUserOption',
    MapPalette = '$mapPalette',
    Palette = '$palette',
    Path = '$path',
    PathString = '$pathString',
    Ref = '$ref',
}

const locationOperations: Record<LocationOperation, OperationFns> = {
    $isUserOption: isUserOptionOperation,
    $palette: paletteOperation,
    $mapPalette: mapPaletteOperation,
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

function isUserOptionOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [relativePathVertices, thenVertex, elseVertex] = values;

    const children = graph.neighboursWithEdgeValue(relativePathVertices, PATH_EDGE);
    if (children) {
        for (const child of children) {
            const relativePathVertex = graph.findNeighbour(child, DEFAULTS_EDGE);
            if (relativePathVertex && isUserOptionCheck(graph, vertex, relativePathVertex)) {
                return graph.resolveVertexValue(vertex, thenVertex);
            }
        }
    } else if (isUserOptionCheck(graph, vertex, relativePathVertices)) {
        return graph.resolveVertexValue(vertex, thenVertex);
    }

    return graph.resolveVertexValue(vertex, elseVertex);
}

function isUserOptionCheck(graph: OptionsGraphInterface, vertex: VertexInterface, relativePathVertex: VertexInterface) {
    const relativePath = graph.resolveVertexValue(vertex, relativePathVertex);
    if (!isString(relativePath)) {
        throw new Error(`\`$isUserOption\` json operation failed on [${String(relativePath)}], expecting a string.`);
    }

    const pathArray = graph.getPathArray(vertex);
    const path = resolvePath(pathArray, relativePath);
    if (path === UNRESOLVABLE_PATH) return false;

    return graph.hasUserOption(path);
}

const PALETTE_INDEX_KEYS = new Set(['fill', 'fillFallback', 'stroke', 'gradient', 'range2']);

function paletteOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [keyVertex] = values;
    const key = graph.resolveVertexValue(vertex, keyVertex);

    if (!isString(key)) return;

    if (PALETTE_INDEX_KEYS.has(key)) {
        const pathArray = graph.getPathArray(vertex);
        const index = getPathLastIndex(pathArray);

        if (Number.isNaN(index)) return;

        switch (key) {
            case 'fill':
                // TODO: % index?
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

    if (key === 'type') {
        return graph.paletteType;
    }

    const value = getPathSafe(graph.palette, key.split('.'));

    // TODO: what is mutating the palette? see integratedChartsCrossFiltering.test.ts
    if (Array.isArray(value)) return [...value];
    if (typeof value === 'object') return { ...value };
    return value;
}

function mapPaletteOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [keyVertex] = values;
    const key = graph.resolveVertexValue(vertex, keyVertex);

    if (!isString(key)) return;
    if (PALETTE_INDEX_KEYS.has(key)) {
        const pathArray = graph.getPathArray(vertex);
        let index = getPathLastIndex(pathArray);

        let ignoreIndexOffset = 0;
        const path = ['series', '0', 'type'];
        for (let i = 0; i < index; i++) {
            path[1] = `${i}`;
            const siblingSeriesType = graph.getResolvedPath(path) as string;
            if ('map-shape-background' === siblingSeriesType || 'map-line-background' === siblingSeriesType) {
                ignoreIndexOffset++;
            }
        }
        index -= ignoreIndexOffset;

        if (Number.isNaN(index)) return;

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

    if (key === 'type') {
        return graph.paletteType;
    }

    const value = getPathSafe(graph.palette, key.split('.'));

    // TODO: what is mutating the palette? see integratedChartsCrossFiltering.test.ts
    if (Array.isArray(value)) return [...value];
    if (typeof value === 'object') return { ...value };
    return value;
}

function pathOperationDependenciesFactory(
    graph: OptionsGraphInterface,
    vertex: VertexInterface,
    values: Array<VertexInterface>
) {
    const [relativePathVertex] = values;

    // TODO: skip if custom branch?

    const relativePath = graph.getVertexValue(relativePathVertex);
    if (isString(relativePath)) {
        const pathArray = graph.getPathArray(vertex);
        const path = resolvePath(pathArray, relativePath);
        if (path === UNRESOLVABLE_PATH) {
            return;
        }

        const dependencyVertex = graph.findVertexAtPath(path);
        if (dependencyVertex) {
            graph.addEdge(vertex, dependencyVertex, DEPENDENCY_EDGE);
        }
    }
}

function pathOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const hasDefaultValue = values.length > 1;
    const hasCustomBranch = values.length > 2;

    const [relativePathVertex, defaultValueVertex, customBranchVertex] = values;

    const relativePath = graph.resolveVertexValue(vertex, relativePathVertex);
    const customBranch = hasCustomBranch ? graph.resolveVertexValue(vertex, customBranchVertex) : null;

    if (!isString(relativePath)) {
        throw new Error(`\`$path\` json operation failed on [${String(relativePath)}], expecting a string.`);
    }

    const pathArray = graph.getPathArray(vertex);
    const path = resolvePath(pathArray, relativePath);
    if (path === UNRESOLVABLE_PATH) {
        return;
    }
    const resolved = customBranch ? getPathSafe(customBranch, path) : graph.getResolvedPath(path);

    if (resolved != null) {
        return resolved;
    }

    if (hasDefaultValue) {
        return graph.resolveVertexValue(vertex, defaultValueVertex);
    }
}

function pathStringOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
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

function refOperation(graph: OptionsGraphInterface, _vertex: VertexInterface, values: Array<VertexInterface>) {
    const [value] = values;
    const paramKey = graph.getVertexValue(value) as string;
    return graph.getParamValue(paramKey);
}

// --- TRANSFORM ---

enum TransformOperation {
    Apply = '$apply',
    ApplyCycle = '$applyCycle',
    ApplySwitch = '$applySwitch',
    ApplyTheme = '$applyTheme',
    FindFirstSiblingNotOperation = '$findFirstSiblingNotOperation',
    Map = '$map',
    Merge = '$merge',
    Omit = '$omit',
    Size = '$size',
    Shallow = '$shallow',
    ShallowSimple = '$shallowSimple',
    Value = '$value',
}

const transformOperations: Record<TransformOperation, OperationFns> = {
    $apply: applyOperation,
    $applyCycle: applyCycleOperation,
    $applySwitch: applySwitchOperation,
    $applyTheme: applyThemeOperation,
    $findFirstSiblingNotOperation: findFirstSiblingNotOperationOperation,
    $map: mapOperation,
    $merge: mergeOperation,
    $omit: omitOperation,
    $size: sizeOperation,
    $shallow: shallowOperation,
    $shallowSimple: shallowSimpleOperation,
    $value: valueOperation,
};

function applyOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [objectVertex, defaultValueVertex, overridesPathVertex1, overridesPathVertex2] = values;

    const object = graph.getVertexValue(objectVertex);
    if (!isPlainObject(object)) return;

    const defaultValue = defaultValueVertex ? graph.getVertexValue(defaultValueVertex) : undefined;
    const children = graph.neighboursWithEdgeValue(vertex, PATH_EDGE);

    const hasChildren = children && children.length > 0;

    if (!hasChildren && defaultValue == null) {
        return RESOLVED_TO_BRANCH;
    }

    const overridesPath1 = overridesPathVertex1
        ? (graph.resolveVertexValue(vertex, overridesPathVertex1) as Array<string>)
        : undefined;
    const overridesPath2 = overridesPathVertex2
        ? (graph.resolveVertexValue(vertex, overridesPathVertex2) as Array<string>)
        : undefined;

    if (!hasChildren && defaultValue != null) {
        if (getOperation(defaultValue)) {
            const resolvedDefaultValue = graph.resolveVertexValue(vertex, defaultValueVertex);
            if (isPlainObject(resolvedDefaultValue)) {
                graph.graftObject(vertex, resolvedDefaultValue, [overridesPath1, overridesPath2]);
            }
        } else {
            graph.graftObject(vertex, defaultValue, [overridesPath1, overridesPath2]);
        }
    }

    if (!hasChildren) return RESOLVED_TO_BRANCH;

    for (const child of children) {
        const childNeighbours = graph.neighboursWithEdgeValue(child, PATH_EDGE);
        if (!childNeighbours || childNeighbours.length === 0) {
            // Add a stub if we are applying to a child object with no keys, e.g. `gridLine: { styles: [{}] }`
            const stubVertex = graph.addVertex({});
            graph.addEdge(child, stubVertex, DEFAULTS_EDGE);
        } else {
            graph.graftObject(child, object, [overridesPath1, overridesPath2]);
        }
    }

    return RESOLVED_TO_BRANCH;
}

function applyCycleOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [sizeVertex, defaultValuesVertex, operationVertex] = values;

    const size = graph.resolveVertexValue(vertex, sizeVertex);
    if (typeof size !== 'number') return;

    const pathArray = graph.getPathArray(vertex);
    const userOption = graph.dangerouslyGetUserOption(pathArray);
    const hasThemeOverride = graph.hasThemeOverride(pathArray);
    const graftEdge = userOption == null ? undefined : USER_OPTIONS_EDGE;

    const cycledValues = userOption ?? graph.resolveVertexValue(vertex, defaultValuesVertex);
    if (!Array.isArray(cycledValues)) return;

    const operation = operationVertex ? graph.getVertexValue(operationVertex) : undefined;

    for (let index = 0; index < size; index++) {
        const value = cycledValues[index % cycledValues.length];
        if (value == null) continue;
        if (userOption || !hasThemeOverride) {
            graph.graftValue(vertex, `${index}`, value, undefined, graftEdge);
        }
        if (operation) {
            graph.graftValue(vertex, `${index}`, operation, value, graftEdge);
        }
    }

    return RESOLVED_TO_BRANCH;
}

function applySwitchOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [conditionValueVertex, defaultValueVertex, ...caseVertices] = values;
    const conditionValue = graph.resolveVertexValue(vertex, conditionValueVertex);

    for (const caseVertex of caseVertices) {
        const caseValue = graph.getVertexValue(caseVertex);
        if (!Array.isArray(caseValue)) continue;
        const [caseConditionValue, caseResultValue] = caseValue;
        if (
            conditionValue === caseConditionValue ||
            (Array.isArray(caseConditionValue) && caseConditionValue.includes(conditionValue))
        ) {
            graph.graftObject(vertex, caseResultValue, [], DEFAULTS_EDGE);
            return RESOLVED_TO_BRANCH;
        }
    }

    return graph.resolveVertexValue(vertex, defaultValueVertex);
}

function applyThemeOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [fromPathVertex, variablesVertex, ignorePathsVertex] = values;

    let fromPaths = graph.getVertexValue(fromPathVertex);
    if (typeof fromPaths === 'string') {
        fromPaths = [fromPaths];
    }
    if (!Array.isArray(fromPaths)) return;

    const children = graph.neighboursWithEdgeValue(vertex, PATH_EDGE);
    const ignorePathsValue = ignorePathsVertex ? graph.getVertexValue(ignorePathsVertex) : [];
    const ignorePaths = Array.isArray(ignorePathsValue) ? new Set(ignorePathsValue) : new Set();

    if (!children) return RESOLVED_TO_BRANCH;

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

function findFirstSiblingNotOperationOperation(
    graph: OptionsGraphInterface,
    vertex: VertexInterface,
    values: Array<VertexInterface>
) {
    const [defaultValueVertex] = values;

    const pathArray = graph.getPathArray(vertex);

    const parentPathArray = resolvePath(pathArray, '..');
    if (parentPathArray === UNRESOLVABLE_PATH) return;

    const parentVertex = graph.findVertexAtPath(parentPathArray);
    if (!parentVertex) {
        return graph.resolveVertexValue(vertex, defaultValueVertex);
    }

    const siblings = graph.neighboursWithEdgeValue(parentVertex, PATH_EDGE);

    if (siblings) {
        for (let index = 0; index < siblings.length; index++) {
            const siblingPathArray = graph.getPathArray(siblings[index]);
            if (siblingPathArray[parentPathArray.length] === pathArray[parentPathArray.length]) continue;

            const siblingChildPathArray = siblingPathArray.concat(pathArray.slice(parentPathArray.length + 1));
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
    }

    return graph.resolveVertexValue(vertex, defaultValueVertex);
}

function mapOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [mapOperationVertex, mapValuesVertex] = values;

    const mapOperationValue = graph.getVertexValue(mapOperationVertex);
    const mapValues = graph.resolveVertexValue(vertex, mapValuesVertex);
    if (!Array.isArray(mapValues)) return;

    // Only graft the map values if there are not already any children in the array. This prevents mixing a user array
    // on top of the existing default array created by the $map operation. All $map arrays are in effect shallow.
    const neighbours = graph.neighboursWithEdgeValue(vertex, PATH_EDGE);
    if (neighbours && neighbours.length > 0) {
        return;
    }

    let index = 0;
    for (const value of mapValues) {
        graph.graftValue(vertex, `${index}`, mapOperationValue, value);
        index++;
    }

    return RESOLVED_TO_BRANCH;
}

function mergeOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    for (const valueVertex of values) {
        const value = graph.resolveVertexValue(vertex, valueVertex);
        if (!isPlainObject(value)) continue;
        graph.graftObject(vertex, value);
    }

    return RESOLVED_TO_BRANCH;
}

function omitOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [keysVertex, objectVertex] = values;

    let keys = graph.getVertexValue(keysVertex);
    if (!Array.isArray(keys)) {
        const targetVertex = getOperationTargetVertex(graph, vertex, objectVertex);
        if (!targetVertex) return;
        keys = graph.resolveVertexValue(targetVertex, keysVertex);
    }
    const object = graph.resolveVertexValue(vertex, objectVertex);
    if (!Array.isArray(keys) || !isPlainObject(object)) return;

    return without(object, keys);
}

function sizeOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.resolveVertexValue(vertex, valueVertex);
    if (!isObjectLike(value)) return 0;
    if ('length' in value) return value.length;
    return Object.keys(value).length;
}

// TODO: combine $shallow and $shallowSimple into a single operation
function shallowSimpleOperation(
    graph: OptionsGraphInterface,
    _vertex: VertexInterface,
    values: Array<VertexInterface>
) {
    const shallowValues = [];
    for (const valueVertex of values) {
        shallowValues.push(graph.getVertexValue(valueVertex));
    }
    return shallowValues;
}

function shallowOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const pathArray = graph.getPathArray(vertex);
    const hasUserOption = graph.hasUserOption(pathArray);

    // If the user has not provided an option and there is only one item in the default value then assume it is an
    // operation and resolve it.
    if (!hasUserOption && values.length === 1) {
        return graph.resolveVertexValue(vertex, values[0]);
    }

    const shallowValues = [];
    for (const valueVertex of values) {
        shallowValues.push(graph.getVertexValue(valueVertex));
    }

    // If the user has provided an option, do not resolve the values and just return the shallow copy.
    if (hasUserOption) {
        graph.prune(vertex, [OVERRIDES_EDGE, DEFAULTS_EDGE]);
        return RESOLVED_TO_BRANCH;
    }

    // Otherwise graft the shallow copy onto the graph and resolve the default array.
    graph.graftObject(vertex, shallowValues);
    return RESOLVED_TO_BRANCH;
}

function valueOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.getVertexValue(valueVertex);
    const pathArray = graph.getPathArray(vertex);

    if (value === '$index') {
        return getPathLastIndex(pathArray);
    }

    if (value === '$parentIndex') {
        return getPathLastIndex(pathArray, 1);
    }

    if (value === '$1') {
        return graph.resolveValue$1(pathArray);
    }
}

// --- NUMERIC ---

enum NumericOperation {
    IsEven = '$isEven',
}

const numericOperations: Record<NumericOperation, OperationFns> = {
    $isEven: isEvenOperation,
};

function isEvenOperation(graph: OptionsGraphInterface, vertex: VertexInterface, values: Array<VertexInterface>) {
    const [valueVertex] = values;
    const value = graph.resolveVertexValue(vertex, valueVertex);
    if (Number.isNaN(Number(value))) return false;
    return Number(value) % 2 === 0;
}

export const operations: Record<Operation, OperationFns> = {
    ...cacheOperations,
    ...chartOperations,
    ...colorOperations,
    ...fontOperations,
    ...locationOperations,
    ...logicOperations,
    ...numericOperations,
    ...transformOperations,
};

const operationTypes = new Set(Object.keys(operations));

export function isOperation(value: unknown): value is Operation {
    return operationTypes.has(value as Operation);
}
