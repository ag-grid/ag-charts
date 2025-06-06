import { AdjacencyListGraph, type PlainObject, Vertex, isObject, isObjectLike, isPlainObject } from 'ag-charts-core';

import { chartTypes } from '../chart/factory/chartTypes';
import { seriesRegistry } from '../chart/factory/seriesRegistry';
import type { ChartTheme } from '../chart/themes/chartTheme';
import { deepClone } from '../util/json';
import { simpleMemorize } from '../util/memo';
import { pick, without } from '../util/object';
import { paletteType } from './coreModulesTypes';
import { getOperation, operations } from './optionsGraphOperations';
import {
    AUTO_ENABLE_EDGE,
    AUTO_ENABLE_VALUE_EDGE,
    DEFAULTS_EDGE,
    DEPENDENCY_EDGE,
    OPERATION_EDGE,
    OPERATION_VALUE_EDGE,
    OVERRIDES_EDGE,
    type OptionsGraphInterface,
    PATH_ARRAY_EDGE,
    PATH_EDGE,
    RESOLVED_TO_BRANCH,
    USER_OPTIONS_EDGE,
    getPathSafe,
    isKey,
    setPathSafe,
} from './optionsGraphUtils';

export const createOptionsGraph = simpleMemorize(createOptionsGraphFn);
export function createOptionsGraphFn(theme: ChartTheme, options: PlainObject) {
    return new OptionsGraph(
        theme.config,
        options,
        theme.params,
        theme.palette,
        theme.overrides,
        theme.getTemplateParameters()
    );
}

/**
 * The OptionsGraph combines the theme config, params, palette, overrides and user options into a graph which can then
 * be resolved down into an object.
 */
export class OptionsGraph extends AdjacencyListGraph<unknown, string> implements OptionsGraphInterface {
    // The priority order in which to resolve options values.
    private static readonly EDGE_PRIORITY = [USER_OPTIONS_EDGE, OVERRIDES_EDGE, DEFAULTS_EDGE];

    // These keys must be stored as shallow objects in the graph and not manipulated.
    private static readonly SHALLOW_KEYS = new Set(['context', 'data']);

    // These keys must be excluded when building the graph, they are instead resolved separately since they are objects
    // that must be applied to arrays.
    private static readonly COMPLEX_KEYS = ['annotations', 'axes', 'series'];

    private static readonly ANNOTATIONS_OPTIONS_KEYS = [
        'axesButtons',
        'data',
        'enabled',
        'optionsToolbar',
        'snap',
        'toolbar',
        'xKey',
        'volumeKey',
    ];

    public readonly palette: PlainObject;

    private readonly config: PlainObject;
    private readonly overrides: PlainObject | undefined;
    private readonly internalParams: Map<any, any>;

    // The initial vertices for different branches of the graph that are resolved separately.
    private readonly root: Vertex<unknown>;
    private readonly params: Vertex<unknown>;
    private readonly annotations: Vertex<unknown>;

    // Store the resolved objects generated from the graph.
    private resolved: PlainObject | undefined;
    private resolvedParams: PlainObject = {};
    private resolvedAnnotations: PlainObject = {};

    // The current value referenced by operations that use `$1`.
    // eslint-disable-next-line @typescript-eslint/prefer-readonly
    private value$1: PlainObject = {};

    private readonly cachedPathVertices = new Map();

    constructor(
        config: PlainObject = {},
        userOptions: PlainObject = {},
        params: PlainObject = {},
        palette: PlainObject = {},
        overrides: PlainObject = {},
        internalParams: Map<any, any> = new Map()
    ) {
        super();

        this.cachedNeighboursEdge = PATH_EDGE;
        this.processedEdge = OPERATION_EDGE;

        this.root = this.addVertex('root');
        this.params = this.addVertex('params');
        this.annotations = this.addVertex('annotations');

        this.config = config;
        this.overrides = overrides;
        this.internalParams = internalParams;

        // TODO: Remove `deepClone()` which is just used to workaround the freezing.
        this.palette = deepClone(palette);
        this.palette.type = isObject(userOptions?.theme) ? paletteType(userOptions.theme?.palette) : 'inbuilt';

        // Extract the primary series type, bypassing the graph so we have it ready immediately.
        const DEFAULT_SERIES_TYPE = 'line';
        const seriesType = userOptions.series?.[0]?.type ?? DEFAULT_SERIES_TYPE;

        // Apply the default axes of the primary series type if none are provided by the user.
        const defaultAxes = seriesRegistry.cloneDefaultAxes(seriesType);
        if (userOptions.axes == null && defaultAxes) {
            userOptions.axes = defaultAxes.axes;
        }

        // Build the initial user options, defaults, common and series overrides graphs on the root.
        this.buildGraphFromObject(this.root, USER_OPTIONS_EDGE, without(userOptions, ['theme']));
        this.buildGraphFromObject(this.root, DEFAULTS_EDGE, without(config[seriesType], OptionsGraph.COMPLEX_KEYS));

        const commonOverrides = overrides ? without(overrides.common, OptionsGraph.COMPLEX_KEYS) : {};
        if (Object.keys(commonOverrides).length > 0) {
            this.buildGraphFromObject(
                this.root,
                OVERRIDES_EDGE,
                chartTypes.isCartesian(seriesType) ? commonOverrides : without(commonOverrides, ['zoom', 'navigator'])
            );
        }

        const seriesOverrides = overrides ? without(overrides[seriesType], OptionsGraph.COMPLEX_KEYS) : {};
        if (Object.keys(seriesOverrides).length > 0) {
            this.buildGraphFromObject(this.root, OVERRIDES_EDGE, seriesOverrides);
        }

        // Build the theme parameters graph.
        this.buildGraphFromObject(this.params, DEFAULTS_EDGE, params);

        // Build the axes and series defaults onto the `axes` and `series` keys. While these values are arrays, we can
        // apply this to each item in the array with the `$applyTheme` operator. This extracts the config from the
        // object by type and merges it with the user options.
        const axesVertex = this.findNeighbourWithValue(this.root, 'axes', PATH_EDGE);
        const seriesVertex = this.findNeighbourWithValue(this.root, 'series', PATH_EDGE);
        if (axesVertex) {
            this.buildGraphFromObject(axesVertex, DEFAULTS_EDGE, {
                $applyTheme: [
                    ['/$seriesType/axes/$axisType/$position', '/$seriesType/axes/$axisType'],
                    {
                        seriesType: { $path: ['/series/0/type', 'line'] },
                        axisType: { $path: ['./type', 'category'] },
                        position: { $path: ['./position'] },
                    },
                    ['top', 'right', 'bottom', 'left'],
                ],
            });
        }
        if (seriesVertex) {
            this.buildGraphFromObject(seriesVertex, DEFAULTS_EDGE, {
                $applyTheme: ['/$seriesType/series', { seriesType: { $path: ['./type', 'line'] } }],
            });
        }

        // Build the annotations graphs by splitting the annotation types and options.
        const annotationsTypeConfig = without(
            config[seriesType]?.annotations ?? {},
            OptionsGraph.ANNOTATIONS_OPTIONS_KEYS
        );
        if (Object.keys(annotationsTypeConfig).length > 0) {
            this.buildGraphFromObject(this.annotations, DEFAULTS_EDGE, annotationsTypeConfig);
        }

        const annotationsTypeOverrides = without(
            overrides?.common?.annotations ?? {},
            OptionsGraph.ANNOTATIONS_OPTIONS_KEYS
        );
        if (Object.keys(annotationsTypeOverrides).length > 0) {
            this.buildGraphFromObject(this.annotations, OVERRIDES_EDGE, annotationsTypeOverrides);
        }

        const annotationsConfig = pick(config[seriesType]?.annotations ?? {}, OptionsGraph.ANNOTATIONS_OPTIONS_KEYS);
        if (Object.keys(annotationsConfig).length > 0) {
            this.buildGraphFromObject(this.root, DEFAULTS_EDGE, { annotations: annotationsConfig });
        }

        const annotationsOverrides = pick(overrides?.common?.annotations ?? {}, OptionsGraph.ANNOTATIONS_OPTIONS_KEYS);
        if (Object.keys(annotationsOverrides).length > 0) {
            this.buildGraphFromObject(this.root, OVERRIDES_EDGE, { annotations: annotationsOverrides });
        }

        // Once the full "static" version of the graph has been built, then graft on the dependencies. This ensures all
        // the dependents have been established and so the edges can be built in a single pass.
        this.buildDependencyGraph();
    }

    override clear() {
        super.clear();
        this.cachedPathVertices.clear();
    }

    resolve() {
        this.resolved = {};
        this.resolvedParams = {};
        this.resolvedAnnotations = {};

        this.resolveVertex(this.params, this.resolvedParams);
        this.resolveVertex(this.annotations, this.resolvedAnnotations);

        this.resolveVertex(this.root);

        return this.resolved;
    }

    resolveParams() {
        return this.resolvedParams;
    }

    resolveAnnotationThemes() {
        return this.resolvedAnnotations;
    }

    findVertexAtPath(path: Array<string>) {
        const key = path.join('.');
        if (this.cachedPathVertices.has(key)) {
            return this.cachedPathVertices.get(key);
        }
        const vertex = this.findVertexAlongEdge(this.root, path, PATH_EDGE);
        this.cachedPathVertices.set(key, vertex);
        return vertex;
    }

    getParamValue(path: string) {
        if (this.resolvedParams[path] != null) {
            return this.resolvedParams[path];
        }

        const paramVertex = this.findVertexAlongEdge(this.params, [path], PATH_EDGE);
        if (!paramVertex) return;

        const defaultValueVertex = this.findNeighbour(paramVertex, DEFAULTS_EDGE);
        if (!defaultValueVertex) return;

        const resolved = this.resolveVertexValue(paramVertex, defaultValueVertex);
        this.resolvedParams[path] = resolved;

        return resolved;
    }

    getPathArray(vertex: Vertex<unknown>): Array<string> {
        return (this.findNeighbourValue(vertex, PATH_ARRAY_EDGE) as Array<string> | undefined) ?? [];
    }

    getResolvedPath(path: Array<string>) {
        return getPathSafe(this.resolved!, path);
    }

    resolveVertexValue(vertex: Vertex<unknown>, valueVertex: Vertex<unknown>) {
        this.resolveVertexDependencies(valueVertex);

        const operation = this.findNeighbourValue(valueVertex, OPERATION_EDGE);
        if (operation && isKey(operation, operations)) {
            const operationValues = this.neighboursWithEdgeValue(valueVertex, OPERATION_VALUE_EDGE);
            const operator = operations[operation];
            const operatorFn = typeof operator === 'function' ? operator : operator.resolve;
            const resolved = operatorFn?.(this, vertex, operationValues);
            return resolved === RESOLVED_TO_BRANCH ? undefined : resolved;
        }

        let value: any = this.getVertexValue(valueVertex);

        if (Array.isArray(value)) {
            const object = {};
            this.resolveVertexChildren(valueVertex, object);
            value = getPathSafe(object, this.getPathArray(vertex));
        }

        return this.resolveValueOrSymbol(value);
    }

    // Resolve the value currently referenced by `$1`
    resolveValue$1(pathArray: Array<string>) {
        return getPathSafe(this.value$1, pathArray);
    }

    // Graft a branch of the theme config onto the target vertex.
    graftConfig(target: Vertex<unknown>, configPathArray: Array<string>, ignorePaths: Set<string>) {
        const targetConfigObject = getPathSafe(this.config, configPathArray);
        const targetPathArrayVertex = this.findNeighbour(target, PATH_ARRAY_EDGE);

        if (isPlainObject(targetConfigObject)) {
            this.buildGraphFromObject(
                target,
                DEFAULTS_EDGE,
                targetConfigObject,
                targetPathArrayVertex,
                undefined,
                ignorePaths
            );
        }

        if (this.overrides) {
            const targetOverridesObject = getPathSafe(this.overrides, configPathArray);
            if (isPlainObject(targetOverridesObject)) {
                this.buildGraphFromObject(
                    target,
                    OVERRIDES_EDGE,
                    targetOverridesObject,
                    targetPathArrayVertex,
                    undefined,
                    ignorePaths
                );
            }

            const commonOverridesObject = getPathSafe(this.overrides, ['common', ...configPathArray.slice(1)]);
            if (isPlainObject(commonOverridesObject)) {
                this.buildGraphFromObject(
                    target,
                    OVERRIDES_EDGE,
                    commonOverridesObject,
                    targetPathArrayVertex,
                    undefined,
                    ignorePaths
                );
            }
        }

        this.buildDependencyGraph();
    }

    // Graft a given object onto the target vertex.
    graftObject(target: Vertex<unknown>, object: PlainObject, overridesPathArrays?: Array<Array<string> | undefined>) {
        const pathArrayVertex = this.findNeighbour(target, PATH_ARRAY_EDGE);
        this.buildGraphFromObject(target, DEFAULTS_EDGE, object, pathArrayVertex);

        if (this.overrides && overridesPathArrays) {
            for (const overridePathArray of overridesPathArrays) {
                if (overridePathArray == null) continue;
                const overrides = getPathSafe(this.overrides, overridePathArray);
                if (overrides) {
                    this.buildGraphFromObject(target, OVERRIDES_EDGE, overrides, pathArrayVertex);
                }
            }
        }

        this.buildDependencyGraph();
    }

    // Graft a given operation and value onto `path` child of the target vertex.
    graftValue(target: Vertex<unknown>, path: string, operation: unknown, value: unknown) {
        const pathArray = [...this.getPathArray(target), path];

        // Set the value referenced by `$1`
        setPathSafe(this.value$1, pathArray, value);

        const pathVertex = this.findVertexAtPath(pathArray) ?? this.addVertex(path);

        // TODO: use the correct edgeValue?
        this.buildGraphFromValue(target, pathVertex, DEFAULTS_EDGE, pathArray, operation);

        this.buildDependencyGraph();
    }

    // Resolve a branch as if it were a child of the context vertex, but without attaching it to the resolved root.
    graftAndResolveOrphan(context: Vertex<unknown>, branch: Vertex<unknown>) {
        const orphan: PlainObject = {};

        const orphanVertex = this.addVertex(orphan);

        const contextPathArray = this.getPathArray(context);
        this.graftAndResolveChildren(context, branch, orphanVertex, contextPathArray, []);

        this.resolveVertex(orphanVertex, orphan);

        return getPathSafe(orphan, contextPathArray);
    }

    private buildGraphFromObject(
        parentVertex: Vertex<unknown>,
        edgeValue: string,
        object: PlainObject,
        pathArrayVertex?: Vertex<unknown>,
        shallowPaths: Set<string> = OptionsGraph.SHALLOW_KEYS,
        ignorePaths?: Set<string>
    ) {
        const operation = getOperation(object);
        if (operation) {
            const valueVertex = this.addVertex(object);
            this.addEdge(parentVertex, valueVertex, edgeValue);
            this.addEdge(valueVertex, this.addVertex(operation.operation), OPERATION_EDGE);
            for (const operationValue of operation.values) {
                this.buildGraphFromOperationValue(valueVertex, operationValue, edgeValue, pathArrayVertex);
            }
            return;
        }

        // Add a shallow empty value vertex to the parent if this object is empty
        if (Object.keys(object).length === 0) {
            this.addEdge(parentVertex, this.addVertex(Array.isArray(object) ? [] : {}), edgeValue);
            this.buildGraphAutoEnable(parentVertex, edgeValue, object, undefined);
            return;
        }

        const pathVertices = this.getVertexChildrenByKey(parentVertex);
        const pathArray = pathArrayVertex ? (this.getVertexValue(pathArrayVertex) as Array<string>) : [];
        let enabledVertex: Vertex<unknown> | undefined;

        for (const key of Object.keys(object)) {
            if (ignorePaths?.has(key)) continue;

            const childPathVertex = pathVertices.get(key) ?? this.addVertex(key);
            const childPathArray = [...pathArray, key];

            if (shallowPaths?.has(key)) {
                this.buildShallowGraphFromValue(parentVertex, childPathVertex, edgeValue, childPathArray, object[key]);
            } else {
                this.buildGraphFromValue(
                    parentVertex,
                    childPathVertex,
                    edgeValue,
                    childPathArray,
                    object[key],
                    shallowPaths
                );
            }

            if (key === 'enabled') {
                enabledVertex = childPathVertex;
            }
        }

        this.buildGraphAutoEnable(parentVertex, edgeValue, object, enabledVertex);
    }

    private buildGraphAutoEnable(
        parentVertex: Vertex<unknown>,
        edgeValue: string,
        object: PlainObject,
        enabledVertex: Vertex<unknown> | undefined
    ) {
        // TODO: should overrides be handle better here? what about the enabledVertex?
        if (edgeValue === DEFAULTS_EDGE && !enabledVertex) return;
        if (edgeValue === USER_OPTIONS_EDGE && enabledVertex) return;
        if (edgeValue !== DEFAULTS_EDGE && edgeValue !== USER_OPTIONS_EDGE && edgeValue !== OVERRIDES_EDGE) return;

        let autoEnableVertex = this.findNeighbour(parentVertex, AUTO_ENABLE_EDGE);
        if (!autoEnableVertex) {
            autoEnableVertex = this.addVertex(AUTO_ENABLE_EDGE);
            this.addEdge(parentVertex, autoEnableVertex, AUTO_ENABLE_EDGE);
        }
        if (enabledVertex) {
            this.addEdge(enabledVertex, autoEnableVertex, AUTO_ENABLE_VALUE_EDGE);
        }

        const { enabled, _enabledFromTheme } = object;
        this.addEdge(
            autoEnableVertex,
            this.addVertex({ enabled, _enabledFromTheme, keys: Object.keys(object).length }),
            edgeValue
        );
    }

    private getVertexChildrenByKey(vertex: Vertex<unknown>) {
        const pathNeighbours = this.neighboursWithEdgeValue(vertex, PATH_EDGE);
        const pathVertices = new Map();
        for (const neighbour of pathNeighbours) {
            pathVertices.set(this.getVertexValue(neighbour), neighbour);
        }
        return pathVertices;
    }

    private buildGraphFromValue(
        parentVertex: Vertex<unknown>,
        pathVertex: Vertex<unknown>,
        edgeValue: string,
        pathArray: Array<string>,
        value: unknown,
        shallowPaths?: Set<string>
    ) {
        this.addEdge(parentVertex, pathVertex, PATH_EDGE);

        let pathArrayVertex = this.findNeighbour(pathVertex, PATH_ARRAY_EDGE);
        if (!pathArrayVertex) {
            pathArrayVertex = this.addVertex(pathArray);
            this.addEdge(pathVertex, pathArrayVertex, PATH_ARRAY_EDGE);
        }

        const operation = getOperation(value);
        if (operation) {
            const valueVertex = this.addVertex(value);
            this.addEdge(pathVertex, valueVertex, edgeValue);
            this.addEdge(valueVertex, pathArrayVertex, PATH_ARRAY_EDGE);
            this.addEdge(valueVertex, this.addVertex(operation.operation), OPERATION_EDGE);
            for (const operationValue of operation.values) {
                this.buildGraphFromOperationValue(valueVertex, operationValue, edgeValue, pathArrayVertex);
            }
        } else if (isObjectLike(value)) {
            this.buildGraphFromObject(pathVertex, edgeValue, value, pathArrayVertex, shallowPaths);
        } else {
            const valueVertex = this.addVertex(value);
            this.addEdge(pathVertex, valueVertex, edgeValue);
        }
    }

    private buildShallowGraphFromValue(
        parentVertex: Vertex<unknown>,
        pathVertex: Vertex<unknown>,
        edgeValue: string,
        pathArray: Array<string>,
        value: unknown
    ) {
        this.addEdge(parentVertex, pathVertex, PATH_EDGE);

        let pathArrayVertex = this.findNeighbour(pathVertex, PATH_ARRAY_EDGE);
        if (!pathArrayVertex) {
            pathArrayVertex = this.addVertex(pathArray);
            this.addEdge(pathVertex, pathArrayVertex, PATH_ARRAY_EDGE);
        }

        const valueVertex = this.addVertex(value);
        this.addEdge(pathVertex, valueVertex, edgeValue);
    }

    private buildGraphFromOperationValue(
        valueVertex: Vertex<unknown>,
        operationValue: unknown,
        edgeValue: string,
        pathArrayVertex: Vertex<unknown> = this.addVertex([])
    ) {
        // TODO: check for circular from a 'root' vertex given from the 'buildGraphFromValue()' fn

        const operationValueVertex = this.addVertex(operationValue);
        this.addEdge(valueVertex, pathArrayVertex, PATH_ARRAY_EDGE);
        this.addEdge(valueVertex, operationValueVertex, OPERATION_VALUE_EDGE);

        const innerOperation = getOperation(operationValue);
        if (innerOperation) {
            this.addEdge(operationValueVertex, this.addVertex(innerOperation.operation), OPERATION_EDGE);
            for (const innerOperationValue of innerOperation.values) {
                this.buildGraphFromOperationValue(
                    operationValueVertex,
                    innerOperationValue,
                    edgeValue,
                    pathArrayVertex
                );
            }
        } else if (isObjectLike(operationValue)) {
            this.buildGraphFromObject(operationValueVertex, edgeValue, operationValue, pathArrayVertex);
        }
    }

    private buildDependencyGraph() {
        for (const [valueVertex, operationKeyVertex] of this.pendingProcessingEdges) {
            const operation = this.getVertexValue(operationKeyVertex);
            if (!isKey(operation, operations)) continue;

            const operationValues = this.neighboursWithEdgeValue(valueVertex, OPERATION_VALUE_EDGE);
            const operator = operations[operation];
            const dependenciesFn = typeof operator === 'function' ? undefined : operator.dependencies;
            dependenciesFn?.(this, valueVertex, operationValues);
        }

        this.pendingProcessingEdges.clear();
    }

    private resolveVertex(vertex: Vertex<unknown>, object: PlainObject = this.resolved!) {
        const pathArray = this.getPathArray(vertex);

        this.resolveVertexInEdgePriority(vertex, object, pathArray);
        this.resolveVertexAutoEnable(vertex, object, pathArray);
        this.resolveVertexChildren(vertex, object);
    }

    private resolveVertexInEdgePriority(vertex: Vertex<unknown>, object: PlainObject, pathArray: Array<string>) {
        const children = this.neighboursWithEdgeValue(vertex, PATH_EDGE);
        const [highestPriority] = OptionsGraph.EDGE_PRIORITY;

        for (const edgeValue of OptionsGraph.EDGE_PRIORITY) {
            const valueVertex = this.findNeighbour(vertex, edgeValue);
            if (valueVertex == null) continue;

            const value = this.resolveVertexValueInternal(vertex, valueVertex);

            // Only allow setting values to `undefined` from the highest priority edge
            if (value == null && edgeValue !== highestPriority) continue;

            // Avoid setting an array value when the vertex has children with specific array index values and this is
            // not the highest priority edge
            if (children.size > 0 && Array.isArray(value) && edgeValue !== highestPriority) continue;

            if (pathArray.length === 0) {
                if (value == null) continue;
                this.resolved = value;
            } else {
                // TODO: breaks toBe of context values
                // Clone object values to prevent nodes from affecting other nodes
                // const safeValue = isPlainObject(value) ? deepClone(value) : value;
                setPathSafe(object, pathArray, value);
            }
            break;
        }
    }

    private resolveVertexValueInternal(vertex: Vertex<unknown>, valueVertex: Vertex<unknown>) {
        this.resolveVertexDependencies(valueVertex);

        const operation = this.findNeighbourValue(valueVertex, OPERATION_EDGE);
        if (operation && isKey(operation, operations)) {
            const operationValues = this.neighboursWithEdgeValue(valueVertex, OPERATION_VALUE_EDGE);
            const operator = operations[operation];
            const operatorFn = typeof operator === 'function' ? operator : operator.resolve;
            const resolved = operatorFn?.(this, vertex, operationValues);
            return resolved === RESOLVED_TO_BRANCH ? undefined : resolved;
        }

        return this.resolveValueOrSymbol(this.getVertexValue(valueVertex));
    }

    private resolveVertexAutoEnable(vertex: Vertex<unknown>, object: PlainObject, pathArray: Array<string>) {
        const [autoEnableValueVertex] = this.neighboursWithEdgeValue(vertex, AUTO_ENABLE_VALUE_EDGE);
        if (!autoEnableValueVertex) return;

        const defaultsEnabled = this.findNeighbourValue(autoEnableValueVertex, DEFAULTS_EDGE) as PlainObject;
        const overridesEnabled = this.findNeighbourValue(autoEnableValueVertex, OVERRIDES_EDGE) as PlainObject;
        const userOptionsEnabled = this.findNeighbourValue(autoEnableValueVertex, USER_OPTIONS_EDGE) as
            | PlainObject
            | undefined;

        if (
            userOptionsEnabled &&
            userOptionsEnabled.enabled == null &&
            !defaultsEnabled?._enabledFromTheme &&
            !overridesEnabled?._enabledFromTheme
        ) {
            setPathSafe(object, pathArray, true);
        }
    }

    private resolveVertexChildren(vertex: Vertex<unknown>, object: PlainObject) {
        const children = this.neighboursWithEdgeValue(vertex, PATH_EDGE);
        for (const child of children) {
            const path = this.getVertexValue(child);

            // Do not resolve operations into objects that have multiple keys. This can happen when the theme config
            // defines a value as an operation, but the theme overrides defines the same value as some other object.
            if (children.size > 1 && isKey(path, operations)) continue;

            // Prevent `_enabledFromTheme` from being resolved into the final object.
            if (path === '_enabledFromTheme') continue;

            this.resolveVertex(child, object);
        }
    }

    private resolveVertexDependencies(vertex: Vertex<unknown>) {
        const dependencies = this.neighboursWithEdgeValue(vertex, DEPENDENCY_EDGE);
        for (const dependency of dependencies) {
            this.resolveVertex(dependency);
        }
    }

    private graftAndResolveChildren(
        contextBranch: Vertex<unknown>,
        remoteBranch: Vertex<unknown>,
        orphanBranch: Vertex<unknown>,
        contextPathArray: Array<string>,
        orphanPathArray: Array<string>
    ) {
        for (const remoteChild of this.neighboursWithEdgeValue(remoteBranch, PATH_EDGE)) {
            const remoteChildPath = this.getVertexValue(remoteChild) as string;

            const childContextPathArray = [...contextPathArray, remoteChildPath];
            const childOrphanPathArray = [...orphanPathArray, remoteChildPath];

            // TODO: Can this use this.buildGraphFromValue() instead?

            const orphanChildPathVertex = this.addVertex(remoteChildPath);
            const defaultValue = this.findNeighbourValue(remoteChild, DEFAULTS_EDGE);

            this.addEdge(orphanBranch, orphanChildPathVertex, PATH_EDGE);

            const orphanChildPathArrayVertex = this.addVertex(childContextPathArray);
            this.addEdge(orphanChildPathVertex, orphanChildPathArrayVertex, PATH_ARRAY_EDGE);

            if (isPlainObject(defaultValue)) {
                this.buildGraphFromObject(
                    orphanChildPathVertex,
                    DEFAULTS_EDGE,
                    defaultValue,
                    orphanChildPathArrayVertex
                );

                const orphanChildValueVertex = this.findNeighbour(orphanChildPathVertex, DEFAULTS_EDGE)!;
                this.addEdge(orphanChildValueVertex, this.addVertex(childContextPathArray), PATH_ARRAY_EDGE);

                // TODO: buildDependencyGraph()?
                const operation = this.findNeighbourValue(orphanChildValueVertex, OPERATION_EDGE);

                if (isKey(operation, operations)) {
                    const operationValues = this.neighboursWithEdgeValue(orphanChildValueVertex, OPERATION_VALUE_EDGE);
                    const operator = operations[operation];
                    const dependenciesFn = typeof operator === 'function' ? undefined : operator.dependencies;
                    dependenciesFn?.(this, orphanChildValueVertex, operationValues);
                }
            }

            this.graftAndResolveChildren(
                contextBranch,
                remoteChild,
                orphanChildPathVertex,
                childContextPathArray,
                childOrphanPathArray
            );
        }
    }

    private resolveValueOrSymbol(value: unknown) {
        return typeof value === 'symbol' && this.internalParams?.has(value) ? this.internalParams.get(value) : value;
    }
}
