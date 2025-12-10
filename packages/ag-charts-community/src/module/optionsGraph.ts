import {
    AdjacencyListGraph,
    Debug,
    ModuleRegistry,
    type PlainObject,
    type Vertex,
    isObject,
    isObjectLike,
    pick,
    simpleMemorize,
    without,
} from 'ag-charts-core';

import type { ChartTheme } from '../chart/themes/chartTheme';
import { type PaletteType, paletteType } from './coreModulesTypes';
import { type Operation, getOperation, isOperation, operations } from './optionsGraphOperations';
import {
    AUTO_ENABLE_EDGE,
    AUTO_ENABLE_VALUE_EDGE,
    CHILDREN_SOURCE_EDGE,
    DEFAULTS_EDGE,
    DEPENDENCY_EDGE,
    OPERATION_EDGE,
    OPERATION_VALUE_EDGE,
    OVERRIDES_EDGE,
    type OptionsGraphInterface,
    PATH_ARRAY_EDGE,
    PATH_EDGE,
    PRUNE_EDGE,
    RESOLVED_TO_BRANCH,
    USER_OPTIONS_EDGE,
    USER_PARTIAL_OPTIONS_EDGE,
    getPathSafe,
    hasPathSafe,
    setPathSafe,
} from './optionsGraphUtils';

const debug = Debug.create('opts', 'options-graph');

export const createOptionsGraph = simpleMemorize(createOptionsGraphFn);
export function createOptionsGraphFn(theme: ChartTheme, options: PlainObject) {
    return debug.group(
        'OptionsGraph.constructor()',
        () =>
            new OptionsGraph(
                theme.config,
                options,
                theme.params,
                theme.palette,
                theme.overrides,
                theme.getTemplateParameters()
            )
    );
}

/**
 * The OptionsGraph combines the theme config, params, palette, overrides and user options into a graph which can then
 * be resolved down into an object.
 */
export class OptionsGraph extends AdjacencyListGraph<unknown, string> implements OptionsGraphInterface {
    // The default priority order in which to resolve options values.
    private static readonly EDGE_PRIORITY = [USER_OPTIONS_EDGE, OVERRIDES_EDGE, DEFAULTS_EDGE];

    private static readonly GRAFT_EDGE = DEFAULTS_EDGE;

    // These keys must be stored as shallow objects in the graph and not manipulated.
    private static readonly SHALLOW_KEYS = new Set(['context', 'data', 'topology']);

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

    // If any of these keys are present in the resolved object then calling `clearSafe()` will not clear the graph.
    private static readonly UNSAFE_CLEAR_KEYS = new Set(['itemStyler', 'styler']);

    // A cache of values that persists between chart updates, use sparingly.
    private static readonly valueCache = new Map();

    public static clearValueCache() {
        OptionsGraph.valueCache.clear();
    }

    public readonly paletteType: PaletteType;

    // The current priority order in which to resolve options values.
    private edgePriority = [...OptionsGraph.EDGE_PRIORITY];

    // The edge value to use when grafting new branches onto the graph from operations.
    private graftEdge = OptionsGraph.GRAFT_EDGE;

    // The initial vertices for different branches of the graph that are resolved separately.
    private root?: Vertex<unknown>;
    private params?: Vertex<unknown>;
    private annotations?: Vertex<unknown>;

    // Store the resolved objects generated from the graph.
    private resolved: PlainObject | undefined;
    private resolvedParams: PlainObject = {};
    private resolvedAnnotations: PlainObject = {};

    // The current value referenced by operations that use `$1`.
    private readonly value$1: Map<string, unknown> = new Map();

    private readonly cachedPathVertices: Map<string, Vertex<unknown>> = new Map();

    private hasUnsafeClearKeys = false;

    private userPartialOptions?: PlainObject;
    private rollbackVertices: Array<Vertex<unknown, unknown>> = [];
    private rollbackEdgesFrom: Array<Vertex<unknown, unknown>> = [];
    private rollbackEdgesTo: Array<Vertex<unknown, unknown>> = [];
    private rollbackEdgesValue: Array<string> = [];
    private isRollingBack = false;

    constructor(
        private readonly config: PlainObject = {},
        private readonly userOptions: PlainObject = {},
        params: PlainObject | undefined = undefined,
        public readonly palette: PlainObject = {},
        private readonly overrides: PlainObject | undefined = undefined,
        private readonly internalParams: Map<unknown, unknown> = new Map()
    ) {
        super(PATH_EDGE, OPERATION_EDGE, new Set([USER_PARTIAL_OPTIONS_EDGE, USER_OPTIONS_EDGE]));

        this.root = this.addVertex('root');
        this.params = this.addVertex('params');
        this.annotations = this.addVertex('annotations');

        this.paletteType = isObject(userOptions?.theme) ? paletteType(userOptions.theme?.palette) : 'inbuilt';

        // Extract the primary series type, bypassing the graph so we have it ready immediately.
        const seriesType = userOptions.series?.[0]?.type ?? 'line';

        // Build the initial user options, defaults, common and series overrides graphs on the root.
        debug('build user');
        this.buildGraphFromObject(this.root, USER_OPTIONS_EDGE, without(userOptions, ['theme']));
        debug('build defaults');
        this.buildGraphFromObject(this.root, DEFAULTS_EDGE, without(config[seriesType], OptionsGraph.COMPLEX_KEYS));

        // Build series overrides before common overrides as series take priority
        const seriesOverrides = overrides ? without(overrides[seriesType], OptionsGraph.COMPLEX_KEYS) : {};
        if (Object.keys(seriesOverrides).length > 0) {
            debug('build series overrides');
            this.buildGraphFromObject(this.root, OVERRIDES_EDGE, seriesOverrides);
        }

        const commonOverrides = overrides ? without(overrides.common, OptionsGraph.COMPLEX_KEYS) : {};
        if (Object.keys(commonOverrides).length > 0) {
            debug('build common overrides');
            this.buildGraphFromObject(
                this.root,
                OVERRIDES_EDGE,
                ModuleRegistry.getSeriesModule(seriesType)?.chartType === 'cartesian'
                    ? commonOverrides
                    : without(commonOverrides, ['zoom', 'navigator'])
            );
        }

        // Build the theme parameters graph.
        if (params) {
            debug('build params');
            this.buildGraphFromObject(this.params, DEFAULTS_EDGE, params);
        }

        // Build the axes and series defaults onto the `axes` and `series` keys. While these values are arrays, we can
        // apply this to each item in the array with the `$applyTheme` operator. This extracts the config from the
        // object by type and merges it with the user options.
        const axesVertex = this.findNeighbourWithValue(this.root, 'axes', PATH_EDGE);
        const seriesVertex = this.findNeighbourWithValue(this.root, 'series', PATH_EDGE);
        if (axesVertex) {
            debug('build axes');
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
            debug('build series');
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
            debug('build annotations type config');
            this.buildGraphFromObject(this.annotations, DEFAULTS_EDGE, annotationsTypeConfig);
        }

        const annotationsTypeOverrides = without(
            overrides?.common?.annotations ?? {},
            OptionsGraph.ANNOTATIONS_OPTIONS_KEYS
        );
        if (Object.keys(annotationsTypeOverrides).length > 0) {
            debug('build annotations type overrides');
            this.buildGraphFromObject(this.annotations, OVERRIDES_EDGE, annotationsTypeOverrides);
        }

        const annotationsConfig = pick(config[seriesType]?.annotations ?? {}, OptionsGraph.ANNOTATIONS_OPTIONS_KEYS);
        if (Object.keys(annotationsConfig).length > 0) {
            debug('build annotations config');
            this.buildGraphFromObject(this.root, DEFAULTS_EDGE, { annotations: annotationsConfig });
        }

        const annotationsOverrides = pick(overrides?.common?.annotations ?? {}, OptionsGraph.ANNOTATIONS_OPTIONS_KEYS);
        if (Object.keys(annotationsOverrides).length > 0) {
            debug('build annotations overrides');
            this.buildGraphFromObject(this.root, OVERRIDES_EDGE, { annotations: annotationsOverrides });
        }

        // Once the full "static" version of the graph has been built, then graft on the dependencies. This ensures all
        // the dependents have been established and so the edges can be built in a single pass.
        this.buildDependencyGraph();
    }

    override clear() {
        debug.group('OptionsGraph.clear()', () => {
            super.clear();
            this.cachedPathVertices.clear();
            this.root = undefined;
            this.params = undefined;
            this.annotations = undefined;
            debug('cleared');
        });
    }

    clearSafe() {
        if (this.hasUnsafeClearKeys) return;
        this.clear();
    }

    resolve() {
        return debug.group('OptionsGraph.resolve()', () => {
            this.resolved = {};
            this.resolvedParams = {};
            this.resolvedAnnotations = {};

            debug('resolve params');
            this.resolveVertex(this.params!, this.resolvedParams);
            debug('resolve annotations');
            this.resolveVertex(this.annotations!, this.resolvedAnnotations);

            debug('resolve root');
            this.resolveVertex(this.root!);
            debug('resolved root', this.resolved);

            debug('vertex count', this.getVertexCount());
            debug('edge count', this.getEdgeCount());

            return this.resolved;
        });
    }

    resolveParams() {
        return this.resolvedParams;
    }

    resolveAnnotationThemes() {
        return this.resolvedAnnotations;
    }

    override addVertex(value: unknown): Vertex<unknown, unknown> {
        const vertex = super.addVertex(value);
        if (this.isRollingBack) {
            this.rollbackVertices.push(vertex);
        }
        return vertex;
    }

    override addEdge(from: Vertex<unknown, unknown>, to: Vertex<unknown, unknown>, edge: string): void {
        const hasEdge = (this.neighboursWithEdgeValue(from, edge)?.indexOf(to) ?? -1) !== -1;
        if (this.isRollingBack && !hasEdge) {
            this.rollbackEdgesFrom.push(from);
            this.rollbackEdgesTo.push(to);
            this.rollbackEdgesValue.push(edge);
        }
        super.addEdge(from, to, edge);
    }

    /**
     * Resolve partial options against the existing graph at a given path without overriding the existing user values.
     * Returns an object with only those keys that were also present within `partialOptions`.
     */
    resolvePartial(
        path: Array<string>,
        partialOptions?: PlainObject,
        resolveOptions?: {
            permissivePath?: boolean;
            pick?: boolean;
            proxyPaths?: Record<string, Array<string>>;
        }
    ) {
        if (!partialOptions) return;

        // If the graph has been cleared, do not attempt to resolve. This will occur when no `styler` options are provided.
        if (!this.root) return;

        const { permissivePath, proxyPaths } = resolveOptions ?? {};

        const partialKeys = Object.keys(partialOptions);

        if (debug.check()) {
            // eslint-disable-next-line no-console
            console.groupCollapsed(`OptionsGraph.resolvePartial() - ${path.join('.')} [${partialKeys}]`);
        }

        if (partialKeys.length === 0) return {};

        const parentVertex = this.findVertexAtPath(path);
        if (!parentVertex) {
            if (permissivePath) {
                return undefined;
            } else {
                throw new Error(`Could not find vertex in OptionsGraph at path [${path.join('.')}].`);
            }
        }
        const pathArrayVertex = this.findNeighbour(parentVertex, PATH_ARRAY_EDGE);

        this.userPartialOptions = {};
        setPathSafe(this.userPartialOptions, path, partialOptions);

        // Copy the given paths into the correct option structure to be built into the graph.
        if (proxyPaths) {
            for (const proxyFrom of Object.keys(proxyPaths)) {
                const proxyTo = proxyPaths[proxyFrom];
                const proxyValue = getPathSafe(partialOptions, [proxyFrom]);
                if (proxyValue != null) {
                    setPathSafe(partialOptions, proxyTo, proxyValue);
                    setPathSafe(this.userPartialOptions, [...path, ...proxyTo], proxyValue);
                    delete partialOptions[proxyFrom];
                    delete this.userPartialOptions[proxyFrom];
                }
            }
        }

        // Default to grafting new values onto the 'userPartial' edge, however some operations force this onto other
        // edges so as to not override any user partial vertices.
        this.graftEdge = USER_PARTIAL_OPTIONS_EDGE;

        // Temporarily use the 'userPartial' edge in-place of 'user' when building and resolving this partial graph.
        this.edgePriority = [USER_PARTIAL_OPTIONS_EDGE, ...OptionsGraph.EDGE_PRIORITY];

        this.snapshot();

        this.buildGraphFromObject(parentVertex, USER_PARTIAL_OPTIONS_EDGE, partialOptions, pathArrayVertex);

        // Refresh all the pending processing edges within the given partial options.
        for (const key of partialKeys) {
            const childVertex = proxyPaths?.[key]
                ? this.findVertexAtPath([...path, ...proxyPaths[key]])
                : this.findNeighbourWithValue(parentVertex, key, PATH_EDGE);

            if (childVertex) {
                this.refreshPendingProcessingEdges(childVertex);
            }
        }

        this.buildDependencyGraph();

        const resolved = {};
        this.resolveVertex(parentVertex, resolved);

        this.rollback();

        this.graftEdge = OptionsGraph.GRAFT_EDGE;
        this.edgePriority = OptionsGraph.EDGE_PRIORITY;
        this.userPartialOptions = undefined;

        // Copy the resolved values from the correct option structure back into the given paths.
        if (proxyPaths) {
            for (const proxyFrom of Object.keys(proxyPaths)) {
                const proxyTo = proxyPaths[proxyFrom];
                const proxyValue = getPathSafe(resolved, [...path, ...proxyTo]);
                setPathSafe(resolved, [...path, proxyFrom], proxyValue);
            }
        }

        const pathed = getPathSafe(resolved, path) as PlainObject;

        // Only pick the keys that have been requested to prevent overwriting other values with the graph.
        const shouldPick: boolean = resolveOptions?.pick ?? true;
        const partial = shouldPick ? pick(getPathSafe(resolved, path) as PlainObject, partialKeys) : pathed;

        debug('vertex count', this.getVertexCount());
        debug('edge count', this.getEdgeCount());
        debug('resolved partial', partial);

        if (debug.check()) {
            // eslint-disable-next-line no-console
            console.groupEnd();
        }

        return partial;
    }

    findVertexAtPath(path: Array<string>) {
        const key = path.join('.');
        if (this.cachedPathVertices.has(key)) {
            return this.cachedPathVertices.get(key);
        }
        const vertex = this.findVertexAlongEdge(this.root!, path, PATH_EDGE);
        if (!vertex) return;
        this.cachedPathVertices.set(key, vertex);
        return vertex;
    }

    hasUserOption(path: Array<string>) {
        const hasUserOptionSimple = hasPathSafe(this.userOptions, path);
        if (hasUserOptionSimple) return true;

        // In some cases we expand the user options edge of the graph with additional values. These will not appear in
        // the original object and must be found in the graph.
        const pathVertex = this.findVertexAtPath(path);
        if (pathVertex) {
            if (this.findNeighbour(pathVertex, USER_OPTIONS_EDGE) != null) return true;
            if (this.findNeighbour(pathVertex, USER_PARTIAL_OPTIONS_EDGE) != null) return true;
            const childrenSource = this.findNeighbourValue(pathVertex, CHILDREN_SOURCE_EDGE);
            return childrenSource === USER_OPTIONS_EDGE || childrenSource === USER_PARTIAL_OPTIONS_EDGE;
        }

        return false;
    }

    /**
     * Get the value from the user options at the given path. This method is dangerous since it does not resolve
     * through the graph, however is useful for operations that operate on their own path where attempting to
     * resolve would cause an infinite loop.
     */
    dangerouslyGetUserOption(path: Array<string>) {
        if (this.userPartialOptions) {
            const value = getPathSafe(this.userPartialOptions, path);
            if (value != null) return value;
        }

        return getPathSafe(this.userOptions, path);
    }

    hasThemeOverride(path: Array<string>) {
        if (this.overrides == null) return false;

        if (path[0] === 'axes' && path.length > 1) {
            const axisType = this.getResolvedPath(['axes', path[1], 'type']) as string;
            if (hasPathSafe(this.overrides, ['common', 'axes', axisType, ...path.slice(2)])) {
                return true;
            }

            const seriesType = this.getResolvedPath(['series', '0', 'type']) as string;
            return hasPathSafe(this.overrides, [seriesType, 'axes', axisType, ...path.slice(2)]);
        }

        if (path[0] === 'series' && path.length > 1) {
            const seriesType = this.getResolvedPath(['series', path[1], 'type']) as string;
            return hasPathSafe(this.overrides, [seriesType, 'series', ...path.slice(2)]);
        }

        return hasPathSafe(this.overrides, path);
    }

    getParamValue(path: string) {
        if (this.resolvedParams[path] != null) {
            return this.resolvedParams[path];
        }

        const paramVertex = this.findVertexAlongEdge(this.params!, [path], PATH_EDGE);
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

    getCachedValue(path: string[], key: string): unknown {
        const cacheKey = [...path, key].join('.');
        return OptionsGraph.valueCache.get(cacheKey);
    }

    setCachedValue(path: string[], key: string, value: unknown): void {
        const cacheKey = [...path, key].join('.');
        OptionsGraph.valueCache.set(cacheKey, value);
    }

    prune(vertex: Vertex<unknown>, edges: Array<string>) {
        this.addEdge(vertex, this.addVertex(edges), PRUNE_EDGE);
    }

    resolveVertexValue(vertex: Vertex<unknown>, valueVertex: Vertex<unknown>) {
        this.resolveVertexDependencies(valueVertex);

        const operation = this.findNeighbourValue(valueVertex, OPERATION_EDGE);
        if (operation && isOperation(operation)) {
            const operationValues = this.neighboursWithEdgeValue(valueVertex, OPERATION_VALUE_EDGE);
            const operator = operations[operation];
            const operatorFn = typeof operator === 'function' ? operator : operator.resolve;
            const resolved = operatorFn?.(this, vertex, operationValues ?? []);
            return resolved === RESOLVED_TO_BRANCH ? undefined : resolved;
        }

        let value = this.getVertexValue(valueVertex);

        if (Array.isArray(value)) {
            const object = {};
            this.resolveVertexChildren(valueVertex, object);
            value = getPathSafe(object, this.getPathArray(vertex));
        }

        return this.resolveValueOrSymbol(value);
    }

    /**
     * Resolve the value currently referenced by `$1` by the nearest self-or-ancestor that has a defined value.
     */
    resolveValue$1(pathArray: Array<string>) {
        for (let i = pathArray.length; i >= 0; i--) {
            const key = pathArray.slice(0, i).join('.');
            const resolvedValue = this.value$1.get(key);
            if (resolvedValue != undefined) {
                return resolvedValue;
            }
        }
    }

    /**
     * Graft a branch of the theme config onto the target vertex.
     */
    graftConfig(target: Vertex<unknown>, configPathArray: Array<string>, ignorePaths: Set<string>) {
        const targetConfigObject = getPathSafe(this.config, configPathArray);
        const targetPathArrayVertex = this.findNeighbour(target, PATH_ARRAY_EDGE);

        if (isObject(targetConfigObject)) {
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
            if (isObject(targetOverridesObject)) {
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
            if (isObject(commonOverridesObject)) {
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

    /**
     * Graft a given object onto the target vertex.
     */
    graftObject(
        target: Vertex<unknown>,
        object: PlainObject,
        overridesPathArrays?: Array<Array<string> | undefined>,
        edgeValue = this.graftEdge
    ) {
        const pathArrayVertex = this.findNeighbour(target, PATH_ARRAY_EDGE);
        this.buildGraphFromObject(target, edgeValue, object, pathArrayVertex);

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

    /**
     * Graft a given operation and value onto `path` child of the target vertex. The `ontoObject` value is built onto
     * the graph each time this function is called, at the given path, while `value` is used for value$1 where
     * `ontoObject` is an operation that invokes value$1.
     */
    graftValue(target: Vertex<unknown>, path: string, ontoObject: unknown, value: unknown, edgeValue = this.graftEdge) {
        const pathArray = [...this.getPathArray(target), path];

        this.value$1.set(pathArray.join('.'), value);

        const pathVertex = this.findVertexAtPath(pathArray) ?? this.addVertex(path);

        this.buildGraphFromValue(target, pathVertex, edgeValue, pathArray, ontoObject);
        this.buildDependencyGraph();
    }

    /**
     * Resolve a branch as if it were a child of the context vertex, but without attaching it to the resolved root.
     */
    graftAndResolveOrphan(context: Vertex<unknown>, branch: Vertex<unknown>) {
        const orphan: PlainObject = {};
        const orphanVertex = this.addVertex(orphan);
        const contextPathArray = this.getPathArray(context);

        this.graftAndResolveChildren(branch, orphanVertex, contextPathArray, []);
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
        const keys = Object.keys(object);
        const operation = getOperation(object, keys);
        if (operation) {
            const valueVertex = this.addVertex(object);
            this.addEdge(parentVertex, valueVertex, edgeValue);
            this.buildGraphFromOperation(valueVertex, edgeValue, operation, pathArrayVertex);
            return;
        }

        // Add a shallow empty value vertex to the parent if this object is empty
        if (keys.length === 0) {
            this.addEdge(parentVertex, this.addVertex(Array.isArray(object) ? [] : {}), edgeValue);
            this.buildGraphAutoEnable(parentVertex, edgeValue, object, undefined);
            return;
        }

        const pathVertices = this.getVertexChildrenByKey(parentVertex);
        const pathArray = pathArrayVertex ? (this.getVertexValue(pathArrayVertex) as Array<string>) : [];
        let enabledVertex: Vertex<unknown> | undefined;

        if (Array.isArray(object)) {
            this.addEdge(parentVertex, this.addVertex(edgeValue), CHILDREN_SOURCE_EDGE);
        }

        const childPathArray = [...pathArray];
        const pathArrayLength = pathArray.length;
        for (const key of keys) {
            if (ignorePaths?.has(key)) continue;

            const childPathVertex = pathVertices?.get(key) ?? this.addVertex(key);
            childPathArray[pathArrayLength] = key;

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
        if (
            edgeValue !== DEFAULTS_EDGE &&
            edgeValue !== USER_OPTIONS_EDGE &&
            edgeValue !== USER_PARTIAL_OPTIONS_EDGE &&
            edgeValue !== OVERRIDES_EDGE
        )
            return;

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
        if (!pathNeighbours) return;

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
            pathArrayVertex = this.addVertex([...pathArray]);
            this.addEdge(pathVertex, pathArrayVertex, PATH_ARRAY_EDGE);
        }

        const operation = getOperation(value);
        if (operation) {
            const valueVertex = this.addVertex(value);
            this.addEdge(pathVertex, valueVertex, edgeValue);
            this.addEdge(valueVertex, pathArrayVertex, PATH_ARRAY_EDGE);
            this.buildGraphFromOperation(valueVertex, edgeValue, operation, pathArrayVertex);
        } else if (isObjectLike(value)) {
            this.buildGraphFromObject(pathVertex, edgeValue, value, pathArrayVertex, shallowPaths);
        } else {
            const neighbour = this.findNeighbour(pathVertex, edgeValue);
            // TODO: this check shouldn't be needed, the duplication is caused by the $applyTheme operation somehow.
            // Some values can be duplicated for the same edge, e.g. positional axis overrides combined with
            // non-positional axis overrides. These are legitimate duplications, but should probably be handled
            // better than the current approach of last added has priority.
            if (neighbour && this.getVertexValue(neighbour) === value) {
                return;
            }
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
            pathArrayVertex = this.addVertex([...pathArray]);
            this.addEdge(pathVertex, pathArrayVertex, PATH_ARRAY_EDGE);
        }

        const valueVertex = this.addVertex(value);
        this.addEdge(pathVertex, valueVertex, edgeValue);
    }

    private buildGraphFromOperation(
        valueVertex: Vertex<unknown>,
        edgeValue: string,
        operation: { operation: Operation; values: Array<Vertex<unknown>> },
        pathArrayVertex?: Vertex<unknown>
    ) {
        const operationVertex = this.addVertex(operation.operation);
        this.addEdge(valueVertex, operationVertex, OPERATION_EDGE);
        for (const operationValue of operation.values) {
            this.buildGraphFromOperationValue(valueVertex, operationValue, edgeValue, pathArrayVertex);
        }
    }

    private readonly EMPTY_PATH_ARRAY_VERTEX = this.addVertex([]);

    private buildGraphFromOperationValue(
        valueVertex: Vertex<unknown>,
        operationValue: unknown,
        edgeValue: string,
        pathArrayVertex: Vertex<unknown> = this.EMPTY_PATH_ARRAY_VERTEX
    ) {
        // TODO: check for circular from a 'root' vertex given from the 'buildGraphFromValue()' fn

        const operationValueVertex = this.addVertex(operationValue);
        this.addEdge(valueVertex, pathArrayVertex, PATH_ARRAY_EDGE);
        this.addEdge(valueVertex, operationValueVertex, OPERATION_VALUE_EDGE);

        const innerOperation = getOperation(operationValue);
        if (innerOperation) {
            this.buildGraphFromOperation(operationValueVertex, edgeValue, innerOperation, pathArrayVertex);
        } else if (isObjectLike(operationValue)) {
            this.buildGraphFromObject(operationValueVertex, edgeValue, operationValue, pathArrayVertex);
        }
    }

    /**
     * Add dependency edges on operations that require other vertices to be resolved before the operation can be
     * resolved. Then clear the list of pending edges.
     */
    private buildDependencyGraph() {
        for (let i = 0; i < this.pendingProcessingEdgesFrom.length; i++) {
            const valueVertex = this.pendingProcessingEdgesFrom[i];
            const operationKeyVertex = this.pendingProcessingEdgesTo[i];
            const operation = this.getVertexValue(operationKeyVertex);
            if (!isOperation(operation)) continue;

            const operationValues = this.neighboursWithEdgeValue(valueVertex, OPERATION_VALUE_EDGE);
            const operator = operations[operation];
            const dependenciesFn = typeof operator === 'function' ? undefined : operator.dependencies;
            dependenciesFn?.(this, valueVertex, operationValues ?? []);
        }

        this.pendingProcessingEdgesFrom = [];
        this.pendingProcessingEdgesTo = [];
    }

    /**
     * Within the branch starting at the given vertex, reassign any value vertices and their operation key vertices to
     * the pending processing edges. These can then be built with `this.buildDependencyGraph()`.
     */
    private refreshPendingProcessingEdges(vertex: Vertex<unknown>) {
        const defaultValueVertex = this.findNeighbour(vertex, DEFAULTS_EDGE);
        const valueVertex = defaultValueVertex ?? vertex;
        const operationVertex = this.findNeighbour(valueVertex, OPERATION_EDGE);
        if (operationVertex) {
            this.pendingProcessingEdgesFrom.push(valueVertex);
            this.pendingProcessingEdgesTo.push(operationVertex);
            const neighbours = this.neighboursWithEdgeValue(valueVertex, OPERATION_VALUE_EDGE);
            if (neighbours) {
                for (const neighbour of neighbours) {
                    this.refreshPendingProcessingEdges(neighbour);
                }
            }
        }

        const neighbours = this.neighboursWithEdgeValue(vertex, PATH_EDGE);
        if (neighbours) {
            for (const neighbour of neighbours) {
                this.refreshPendingProcessingEdges(neighbour);
            }
        }
    }

    private resolveVertex(vertex: Vertex<unknown>, object: PlainObject = this.resolved!, prune?: unknown) {
        const pathArray = this.getPathArray(vertex);

        // TODO: is it resolving the same vertex multiple times, is that a bug, or should it just skip it if already resolved?
        // if (debug.check()) {
        //     if (pathArray.length > 0 && object === this.resolved && getPathSafe(object, pathArray) != null) {
        //         // eslint-disable-next-line no-console
        //         console.warn('duplicate resolve', pathArray.join('.'), getPathSafe(object, pathArray));
        //     }
        // }

        this.resolveVertexInEdgePriority(vertex, object, pathArray, prune);
        this.resolveVertexAutoEnable(vertex, object, pathArray);
        this.resolveVertexChildren(vertex, object, prune);
    }

    private resolveVertexInEdgePriority(
        vertex: Vertex<unknown>,
        object: PlainObject,
        pathArray: Array<string>,
        prune?: unknown
    ) {
        const children = this.neighboursWithEdgeValue(vertex, PATH_EDGE);
        const [highestPriority] = this.edgePriority;

        for (const edgeValue of this.edgePriority) {
            const valueVertex = this.findNeighbour(vertex, edgeValue);
            if (valueVertex == null) continue;

            const value = this.resolveVertexValueInternal(vertex, valueVertex);

            // Only allow setting values to `undefined` from the highest priority edge
            if (value == null && edgeValue !== highestPriority) continue;

            // Avoid setting a value when the vertex has children and this is not the highest priority edge
            if (children && children.length > 0 && edgeValue !== highestPriority) continue;

            // Do not resolve edges that have been pruned
            if (Array.isArray(prune) && prune.includes(edgeValue)) continue;

            this.hasUnsafeClearKeys ||= value != null && OptionsGraph.UNSAFE_CLEAR_KEYS.has(pathArray.at(-1)!);

            if (pathArray.length === 0) {
                if (value == null) continue;
                this.resolved = value;
            } else {
                // TODO: breaks toBe of context values
                // Clone object values to prevent nodes from affecting other nodes
                // const safeValue = isObject(value) ? deepClone(value) : value;
                setPathSafe(object, pathArray, value);
            }
            break;
        }
    }

    private resolveVertexValueInternal(vertex: Vertex<unknown>, valueVertex: Vertex<unknown>) {
        this.resolveVertexDependencies(valueVertex);

        const operation = this.findNeighbourValue(valueVertex, OPERATION_EDGE);
        if (operation && isOperation(operation)) {
            const operationValues = this.neighboursWithEdgeValue(valueVertex, OPERATION_VALUE_EDGE);
            const operator = operations[operation];
            const operatorFn = typeof operator === 'function' ? operator : operator.resolve;
            const resolved = operatorFn?.(this, vertex, operationValues ?? []);
            return resolved === RESOLVED_TO_BRANCH ? undefined : resolved;
        }

        return this.resolveValueOrSymbol(this.getVertexValue(valueVertex));
    }

    private resolveVertexAutoEnable(vertex: Vertex<unknown>, object: PlainObject, pathArray: Array<string>) {
        const autoEnableValueVertex = this.neighboursWithEdgeValue(vertex, AUTO_ENABLE_VALUE_EDGE)?.[0];
        if (!autoEnableValueVertex) return;

        const pathVertex = this.findVertexAtPath(pathArray);
        const defaultsEnabled = this.findNeighbourValue(autoEnableValueVertex, DEFAULTS_EDGE) as PlainObject;
        const overridesEnabled = this.findNeighbourValue(autoEnableValueVertex, OVERRIDES_EDGE) as PlainObject;
        const userOptionsEnabled = this.findNeighbourValue(autoEnableValueVertex, USER_OPTIONS_EDGE) as
            | PlainObject
            | undefined;

        // If `enabled` has been explicitly set in the user options then ignore the auto-enable value of userPartial.
        const hasUserOptionEnabled = pathVertex && this.findNeighbour(pathVertex, USER_OPTIONS_EDGE) != null;
        const userPartialOptionsEnabled = hasUserOptionEnabled
            ? undefined
            : (this.findNeighbourValue(autoEnableValueVertex, USER_PARTIAL_OPTIONS_EDGE) as PlainObject | undefined);

        const isUserEnabled: boolean =
            (userOptionsEnabled != null && userOptionsEnabled.enabled == null) ||
            (userPartialOptionsEnabled != null && userPartialOptionsEnabled.enabled == null);

        if (isUserEnabled && !defaultsEnabled?._enabledFromTheme && !overridesEnabled?._enabledFromTheme) {
            setPathSafe(object, pathArray, true);
        }
    }

    private resolveVertexChildren(vertex: Vertex<unknown>, object: PlainObject, prune?: unknown) {
        const children = this.neighboursWithEdgeValue(vertex, PATH_EDGE);
        if (!children) return;

        prune ??= this.findNeighbourValue(vertex, PRUNE_EDGE);

        for (const child of children) {
            const path = this.getVertexValue(child);

            // Do not resolve operations into objects that have multiple keys. This can happen when the theme config
            // defines a value as an operation, but the theme overrides defines the same value as some other object.
            if (children.length > 1 && isOperation(path)) continue;

            // Prevent `_enabledFromTheme` from being resolved into the final object.
            if (path === '_enabledFromTheme') continue;

            this.resolveVertex(child, object, prune);
        }
    }

    private resolveVertexDependencies(vertex: Vertex<unknown>) {
        const dependencies = this.neighboursWithEdgeValue(vertex, DEPENDENCY_EDGE);
        if (!dependencies) return;

        for (const dependency of dependencies) {
            // TODO: should it check here to not resolve if already resolved?
            this.resolveVertex(dependency);
        }
    }

    private graftAndResolveChildren(
        remoteBranch: Vertex<unknown>,
        orphanBranch: Vertex<unknown>,
        contextPathArray: Array<string>,
        orphanPathArray: Array<string>
    ) {
        const remoteChildren = this.neighboursWithEdgeValue(remoteBranch, PATH_EDGE);
        if (!remoteChildren) return;

        for (const remoteChild of remoteChildren) {
            const remoteChildPath = this.getVertexValue(remoteChild) as string;

            const childContextPathArray = [...contextPathArray, remoteChildPath];
            const childOrphanPathArray = [...orphanPathArray, remoteChildPath];

            // TODO: Can this use this.buildGraphFromValue() instead?

            const orphanChildPathVertex = this.addVertex(remoteChildPath);
            const defaultValue = this.findNeighbourValue(remoteChild, DEFAULTS_EDGE);

            this.addEdge(orphanBranch, orphanChildPathVertex, PATH_EDGE);

            const orphanChildPathArrayVertex = this.addVertex(childContextPathArray);
            this.addEdge(orphanChildPathVertex, orphanChildPathArrayVertex, PATH_ARRAY_EDGE);

            if (isObject(defaultValue)) {
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

                if (isOperation(operation)) {
                    const operationValues = this.neighboursWithEdgeValue(orphanChildValueVertex, OPERATION_VALUE_EDGE);
                    const operator = operations[operation];
                    const dependenciesFn = typeof operator === 'function' ? undefined : operator.dependencies;
                    dependenciesFn?.(this, orphanChildValueVertex, operationValues ?? []);
                }
            }

            this.graftAndResolveChildren(
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

    private snapshot() {
        debug(`snapshot`);
        this.isRollingBack = true;
    }

    private rollback() {
        debug(`rollback ${this.rollbackEdgesFrom.length} edges and ${this.rollbackVertices.length} vertices`);
        for (let i = 0; i < this.rollbackEdgesFrom.length; i++) {
            const from = this.rollbackEdgesFrom[i];
            const to = this.rollbackEdgesTo[i];
            const edgeValue = this.rollbackEdgesValue[i];
            this.removeEdge(from, to, edgeValue);
        }
        for (const vertex of this.rollbackVertices) {
            this.removeVertex(vertex);
        }
        this.cachedPathVertices.clear();
        this.rollbackVertices = [];
        this.rollbackEdgesFrom = [];
        this.rollbackEdgesTo = [];
        this.rollbackEdgesValue = [];
        this.isRollingBack = false;
    }

    private diagramKeys?: Map<string, string>;
    private diagramEdges?: Map<string, Set<string>>;
    /**
     * Console log a flowchart diagram of the graph at the given path.
     */
    diagram(pathArray: Array<string>, maxDepth: number = 2) {
        this.diagramKeys = new Map();
        this.diagramEdges = new Map();

        const vertex = this.findVertexAtPath(pathArray);
        const diagram: Array<string> = [
            '---',
            'config:',
            '  layout: elk',
            '  look: neo',
            '  theme: redux',
            '---',
            'flowchart TB',
        ];

        if (vertex) {
            this.diagramVertex(diagram, vertex as any, 1, maxDepth);
        }

        diagram.push('classDef UO fill: #e8f5e8, stroke: #4caf50');
        diagram.push('classDef DE fill: #e3f2fd, stroke: #2196f3');
        diagram.push('classDef DEP fill: #ffe0fd, stroke: #ff00f2');
        diagram.push('classDef OP fill: #fff3e0, stroke: #ff9800');
        diagram.push('classDef OPV fill: #fff3e0, stroke: #ff9800, stroke-width: 1px');
        diagram.push('classDef OV fill: #e8f5ee, stroke: #4caf87');

        // eslint-disable-next-line no-console
        console.log(diagram.join('\n'));
    }

    private diagramKey(path: string) {
        let diagramKey = this.diagramKeys!.get(path);
        if (!diagramKey) {
            diagramKey = `${this.diagramKeys!.size}`;
            this.diagramKeys!.set(path, diagramKey);
        }
        return diagramKey;
    }

    private diagramLabel(path: string, vertex: Vertex<unknown, string>, edge?: string) {
        let diagramKey = this.diagramKeys!.get(path);
        if (diagramKey) return diagramKey;

        diagramKey = this.diagramKey(path);

        const classNames: any = {
            [USER_OPTIONS_EDGE]: 'UO',
            [DEFAULTS_EDGE]: 'DE',
            [DEPENDENCY_EDGE]: 'DEP',
            [OPERATION_EDGE]: 'OP',
            [OPERATION_VALUE_EDGE]: 'OPV',
            [OVERRIDES_EDGE]: 'OV',
        };
        let className = edge ? classNames[edge] ?? undefined : undefined;
        className = className ? `:::${className}` : '';

        if (typeof vertex.value === 'symbol') {
            return `${diagramKey}[/"[symbol]"\\]${className}`;
        } else if (Array.isArray(vertex.value)) {
            return `${diagramKey}[/"[array]"\\]${className}`;
        } else if (typeof vertex.value === 'object') {
            return `${diagramKey}[/"[object]"\\]${className}`;
        } else if (edge === DEFAULTS_EDGE || edge === USER_OPTIONS_EDGE || edge === OVERRIDES_EDGE) {
            return `${diagramKey}("${vertex.value as any}")${className}`;
        } else {
            return `${diagramKey}["${vertex.value as any}"]${className}`;
        }
    }

    private diagramVertex(diagram: Array<string>, vertex: Vertex<unknown, string>, depth: number, maxDepth: number) {
        const pathArray = this.getPathArray(vertex);
        const path = pathArray.length > 0 ? pathArray.join('.') : 'root';

        this.diagramNeighbours(diagram, path, vertex, depth + 1, maxDepth);

        let diagramKey = this.diagramKeys!.get(path);
        if (!diagramKey) {
            diagramKey = this.diagramKey(path);
            diagram.push(`\t${diagramKey}["${vertex.value as any}"]`);
        }
    }

    private diagramNeighbours(
        diagram: Array<string>,
        path: string,
        vertex: Vertex<unknown, string>,
        depth: number,
        maxDepth: number
    ) {
        for (const neighbour of this.neighboursWithEdgeValue(vertex, PATH_EDGE) ?? []) {
            const neighbourPathArray = this.getPathArray(neighbour);
            const neighbourPath = neighbourPathArray.length > 0 ? neighbourPathArray.join('.') : 'root';

            if (depth < maxDepth) {
                this.diagramVertex(diagram, neighbour as any, depth + 1, maxDepth);
            }
            this.diagramChild(diagram, PATH_EDGE, path, vertex, neighbourPath, vertex);
        }

        const userValues = this.neighboursWithEdgeValue(vertex, USER_OPTIONS_EDGE) ?? [];
        let index = 0;
        for (const userValue of userValues) {
            this.diagramChild(
                diagram,
                USER_OPTIONS_EDGE,
                path,
                vertex,
                `${path}.${USER_OPTIONS_EDGE}.${index}`,
                userValue as any
            );
            index++;
        }

        const defaultValues = this.neighboursWithEdgeValue(vertex, DEFAULTS_EDGE) ?? [];
        index = 0;
        // for (const defaultValue of defaultValues) {
        const [defaultValue] = defaultValues;
        if (defaultValue) {
            this.diagramChildWithNeighbours(
                diagram,
                DEFAULTS_EDGE,
                path,
                vertex,
                `${path}.${DEFAULTS_EDGE}.${index}`,
                defaultValue as any,
                depth + 1,
                maxDepth
            );
            index++;
            // break; // TODO: there should only be 1 default per vertex
        }

        const operationVertices = this.neighboursWithEdgeValue(vertex, OPERATION_EDGE) ?? [];
        index = 0;
        // for (const operation of operationVertices) {
        const [operation] = operationVertices;
        if (operation) {
            this.diagramChildWithNeighbours(
                diagram,
                OPERATION_EDGE,
                path,
                vertex,
                `${path}.${OPERATION_EDGE}.${index}`,
                operation as any,
                depth + 1,
                maxDepth
            );
            index++;
            // break; // TODO: there should only be 1 operation per vertex
        }

        const operationValueVertices = this.neighboursWithEdgeValue(vertex, OPERATION_VALUE_EDGE) ?? [];
        index = 0;
        for (const operationValue of operationValueVertices) {
            this.diagramChildWithNeighbours(
                diagram,
                OPERATION_VALUE_EDGE,
                path,
                vertex,
                `${path}.${OPERATION_VALUE_EDGE}.${index}`,
                operationValue as any,
                depth + 1,
                maxDepth
            );
            index++;
        }

        const dependencyVertices = this.neighboursWithEdgeValue(vertex, DEPENDENCY_EDGE) ?? [];
        index = 0;
        for (const dependency of dependencyVertices) {
            this.diagramChildWithNeighbours(
                diagram,
                DEPENDENCY_EDGE,
                path,
                vertex,
                this.getPathArray(dependency).join('.'),
                dependency as any,
                depth + 1,
                maxDepth
            );
            index++;
        }
    }

    private diagramChild(
        diagram: Array<string>,
        edge: string,
        parentPath: string,
        parentVertex: Vertex<unknown, string>,
        childPath: string,
        childVertex: Vertex<unknown, string>
    ) {
        let edges = this.diagramEdges!.get(parentPath);
        if (edges?.has(childPath)) return;
        if (!edges) {
            edges = new Set();
            this.diagramEdges!.set(parentPath, edges);
        }
        edges.add(childPath);
        const edgeString = edge === PATH_EDGE ? '' : `|${edge}|`;
        diagram.push(
            `\t${this.diagramLabel(parentPath, parentVertex)} -->${edgeString} ${this.diagramLabel(childPath, childVertex, edge)}`
        );
    }

    private diagramChildWithNeighbours(
        diagram: Array<string>,
        edge: string,
        parentPath: string,
        parentVertex: Vertex<unknown, string>,
        childPath: string,
        childVertex: Vertex<unknown, string>,
        depth: number,
        maxDepth: number
    ) {
        this.diagramChild(diagram, edge, parentPath, parentVertex, childPath, childVertex);
        this.diagramNeighbours(diagram, childPath, childVertex as any, depth + 1, maxDepth);
    }
}
