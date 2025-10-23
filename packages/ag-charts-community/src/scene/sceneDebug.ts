/* eslint-disable no-restricted-properties */
import { Debug, Logger, TextMeasurer, getWindow, isString, toArray } from 'ag-charts-core';

import { BBox } from './bbox';
import { Group } from './group';
import type { LayersManager } from './layersManager';
import { type Node, type RenderContext } from './node';
import { Transformable } from './transformable';

export enum DebugSelectors {
    SCENE = 'scene',
    SCENE_STATS = 'scene:stats',
    SCENE_STATS_VERBOSE = 'scene:stats:verbose',
    SCENE_DIRTY_TREE = 'scene:dirtyTree',
    SCENE_TEXT = 'scene:text',
}

type BuildTree = { name?: string; node?: any; dirty?: boolean };

interface TimingStats {
    min: number;
    max: number;
    sum: number;
    count: number;
}

class StatsAccumulator {
    private readonly stats: Map<string, TimingStats> = new Map();
    private intervalId?: NodeJS.Timeout;
    private lastLogTime: number = Date.now();
    private readonly LOG_INTERVAL_MS = 10000; // Log every 10 seconds

    constructor() {
        this.startPeriodicLogging();
    }

    private startPeriodicLogging(): void {
        if (!Debug.check(DebugSelectors.SCENE_STATS, DebugSelectors.SCENE_STATS_VERBOSE)) {
            return;
        }

        // Clear any existing interval
        this.stopPeriodicLogging();

        this.intervalId = setInterval(() => {
            this.logAccumulatedStats();
        }, this.LOG_INTERVAL_MS);
    }

    public stopPeriodicLogging(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    public recordTiming(category: string, duration: number): void {
        const existing = this.stats.get(category);

        if (existing) {
            existing.min = Math.min(existing.min, duration);
            existing.max = Math.max(existing.max, duration);
            existing.sum += duration;
            existing.count += 1;
        } else {
            this.stats.set(category, {
                min: duration,
                max: duration,
                sum: duration,
                count: 1,
            });
        }
    }

    public recordTimings(durations: Record<string, number>): void {
        for (const [category, duration] of Object.entries(durations)) {
            if (category !== 'start' && typeof duration === 'number') {
                this.recordTiming(category, duration);
            }
        }
    }

    private logAccumulatedStats(): void {
        if (this.stats.size === 0) return;

        const timeSinceLastLog = (Date.now() - this.lastLogTime) / 1000;

        // Create a sorted array of categories for consistent ordering
        const categories = Array.from(this.stats.keys()).sort((a, b) => {
            // Put total time first, then alphabetical
            if (a === '⏱️') return -1;
            if (b === '⏱️') return 1;
            return a.localeCompare(b);
        });

        const parts: string[] = [];
        for (const category of categories) {
            const stats = this.stats.get(category)!;
            const avg = stats.sum / stats.count;

            // Format: category[min/avg/max]ms
            parts.push(`${category}[${stats.min.toFixed(1)}/${avg.toFixed(1)}/${stats.max.toFixed(1)}]ms`);
        }

        // Log as single line with count and duration info
        const totalStats = this.stats.get('⏱️');
        const count = totalStats?.count ?? 0;
        Logger.log(`📊 Stats (${timeSinceLastLog.toFixed(0)}s, ${count} renders): ${parts.join(' ')}`);

        // Reset stats for next period
        this.stats.clear();
        this.lastLogTime = Date.now();
    }

    public destroy(): void {
        this.stopPeriodicLogging();
        this.stats.clear();
    }
}

// Global accumulator instance - shared across all charts
let globalStatsAccumulator: StatsAccumulator | undefined;
let statsAccumulatorConsumers = 0;

function getStatsAccumulator() {
    globalStatsAccumulator ??= new StatsAccumulator();

    return globalStatsAccumulator;
}

export function registerDebugStatsConsumer() {
    statsAccumulatorConsumers++;

    let released = false;

    return () => {
        if (released || statsAccumulatorConsumers === 0) return;

        released = true;
        statsAccumulatorConsumers--;

        if (statsAccumulatorConsumers === 0) {
            cleanupDebugStats();
        }
    };
}

function formatBytes(value: number) {
    for (const unit of ['B', 'KB', 'MB', 'GB']) {
        if (value < 1536) {
            return `${value.toFixed(1)}${unit}`;
        }
        value /= 1024;
    }

    return `${value.toFixed(1)}TB}`;
}

function memoryUsage() {
    if (!('memory' in performance)) return;
    const { totalJSHeapSize, usedJSHeapSize, jsHeapSizeLimit } = performance.memory as any;
    const result = [];
    for (const amount of [usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit]) {
        if (typeof amount !== 'number') continue;
        result.push(formatBytes(amount));
    }
    return `Heap ${result.join(' / ')}`;
}

export function debugStats(
    layersManager: LayersManager,
    debugSplitTimes: Record<string, number>,
    ctx: CanvasRenderingContext2D,
    renderCtxStats: RenderContext['stats'],
    extraDebugStats = {},
    seriesRect = BBox.zero
) {
    if (!Debug.check(DebugSelectors.SCENE_STATS, DebugSelectors.SCENE_STATS_VERBOSE)) return;

    // Initialize global accumulator if needed
    const {
        layersRendered = 0,
        layersSkipped = 0,
        nodesRendered = 0,
        nodesSkipped = 0,
        opsPerformed = 0,
        opsSkipped = 0,
    } = renderCtxStats ?? {};

    const end = performance.now();
    const { start, ...durations } = debugSplitTimes;

    // Calculate total time if not already present
    const totalTime = end - start;

    // Record all timing splits in the accumulator
    const statsAccumulator = getStatsAccumulator();

    statsAccumulator.recordTimings(durations);
    statsAccumulator.recordTiming('⏱️', totalTime);

    const splits = Object.entries(durations)
        .map(([n, t]) => time(n, t))
        .filter((v) => v != null)
        .join(' + ');
    const extras = Object.entries(extraDebugStats)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(' ; ');

    const detailedStats = Debug.check(DebugSelectors.SCENE_STATS_VERBOSE);
    const memUsage = detailedStats ? memoryUsage() : null;
    const stats = [
        `${time('⏱️', start, end)} (${splits})`,
        `${extras}`,
        `Layers: ${detailedStats ? pct(layersRendered, layersSkipped) : layersManager.size}`,
        detailedStats ? `Nodes: ${pct(nodesRendered, nodesSkipped)}` : null,
        detailedStats ? `Ops: ${pct(opsPerformed, opsSkipped)}` : null,
        memUsage,
    ].filter(isString);
    const measurer = new TextMeasurer(ctx);
    const statsSize = new Map(stats.map((t) => [t, measurer.measureText(t)]));
    const width = Math.max(...Array.from(statsSize.values(), (s) => s.width));
    const height = accumulate(statsSize.values(), (s) => s.height);

    const x = 2 + seriesRect.x;
    ctx.save();
    try {
        ctx.fillStyle = 'white';
        ctx.fillRect(x, 0, width, height);

        ctx.fillStyle = 'black';
        let y = 0;
        for (const [stat, size] of statsSize.entries()) {
            y += size.height;
            ctx.fillText(stat, x, y);
        }
    } catch (e) {
        Logger.warnOnce('Error during debug stats rendering', e);
    } finally {
        ctx.restore();
    }
}

export function prepareSceneNodeHighlight(ctx: RenderContext) {
    const config: string[] = toArray(getWindow('agChartsSceneDebug'));
    const result: RenderContext['debugNodeSearch'] = [];
    for (const name of config) {
        if (name === 'layout') {
            // eslint-disable-next-line sonarjs/slow-regex
            result.push('seriesRoot', 'legend', 'root', /.*Axis-\d+-axis.*/);
        } else {
            result.push(name);
        }
    }
    ctx.debugNodeSearch = result;
}

export function debugSceneNodeHighlight(ctx: CanvasRenderingContext2D, debugNodes: Record<string, Node>) {
    ctx.save();

    try {
        for (const [name, node] of Object.entries(debugNodes)) {
            const bbox = Transformable.toCanvas(node);

            if (!bbox) {
                Logger.log(`Scene.render() - no bbox for debugged node [${name}].`);
                continue;
            }

            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

            ctx.fillStyle = 'red';
            ctx.strokeStyle = 'white';
            ctx.font = '16px sans-serif';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.lineWidth = 2;
            ctx.strokeText(name, bbox.x, bbox.y, bbox.width);
            ctx.fillText(name, bbox.x, bbox.y, bbox.width);
        }
    } catch (e) {
        Logger.warnOnce('Error during debug rendering', e);
    } finally {
        ctx.restore();
    }
}

export const skippedProperties = new Set<string>();
const allowedProperties = new Set([
    'gradient',
    // '_datum',
    'zIndex',
    'clipRect',
    'cachedBBox',
    'childNodeCounts',
    'path',
    '__zIndex',
    'name',
    '__scalingCenterX',
    '__scalingCenterY',
    '__rotationCenterX',
    '__rotationCenterY',
    '_previousDatum',
    '__fill',
    '__lineDash',
    'borderPath',
    'borderClipPath',
    '_clipPath',
]);

function nodeProps(node: Node) {
    const { ...allProps } = node as any;
    for (const prop of Object.keys(allProps)) {
        if (allowedProperties.has(prop)) continue;
        if (typeof allProps[prop] === 'number') continue;
        if (typeof allProps[prop] === 'string') continue;
        if (typeof allProps[prop] === 'boolean') continue;
        skippedProperties.add(prop);
        delete allProps[prop];
    }
    return allProps;
}

export function buildTree(node: Node, mode: 'json' | 'console'): BuildTree {
    if (!Debug.check(true, DebugSelectors.SCENE)) {
        return {};
    }

    let order = 0;
    return {
        node: mode === 'json' ? nodeProps(node) : node,
        name: node.name ?? node.id,
        dirty: node instanceof Group ? node.dirty : undefined,
        ...Array.from(node instanceof Group ? node.children() : [], (c) => buildTree(c, mode)).reduce<
            Record<string, object>
        >((result, childTree) => {
            let { name: treeNodeName } = childTree;
            const {
                node: { visible, opacity, zIndex, translationX, translationY, rotation, scalingX, scalingY },
                node: childNode,
            } = childTree;
            if (!visible || opacity <= 0) {
                treeNodeName = `(${treeNodeName})`;
            }
            if (Group.is(childNode) && childNode.renderToOffscreenCanvas) {
                treeNodeName = `*${treeNodeName}*`;
            }
            const zIndexString = Array.isArray(zIndex) ? `(${zIndex.join(', ')})` : zIndex;
            const key = [
                `${(order++).toString().padStart(3, '0')}|`,
                `${treeNodeName ?? '<unknown>'}`,
                `z: ${zIndexString}`,
                translationX && `x: ${translationX}`,
                translationY && `y: ${translationY}`,
                rotation && `r: ${rotation}`,
                scalingX != null && scalingX !== 1 && `sx: ${scalingX}`,
                scalingY != null && scalingY !== 1 && `sy: ${scalingY}`,
            ]
                .filter((v) => !!v)
                .join(' ');

            let selectedKey = key;
            let index = 1;
            while (result[selectedKey] != null && index < 100) {
                selectedKey = `${key} (${index++})`;
            }
            result[selectedKey] = childTree;
            return result;
        }, {}),
    };
}

export function buildDirtyTree(node: Node): {
    dirtyTree: { name?: string; node?: any; dirty?: boolean };
    paths: string[];
} {
    const nodeDirty = node instanceof Group ? node.dirty : undefined;
    if (!nodeDirty) {
        return { dirtyTree: {}, paths: [] };
    }

    const childrenDirtyTree = Array.from(node instanceof Group ? node.children() : [], (c) => buildDirtyTree(c)).filter(
        (c) => c.paths.length > 0
    );
    const name = Group.is(node) ? node.name ?? node.id : node.id;
    const paths = childrenDirtyTree.length
        ? childrenDirtyTree.flatMap((c) => c.paths).map((p) => `${name}.${p}`)
        : [name];

    return {
        dirtyTree: {
            name,
            node,
            dirty: nodeDirty,
            ...childrenDirtyTree
                .map((c) => c.dirtyTree)
                .filter((t) => t.dirty != null)
                .reduce<Record<string, object>>((result, childTree) => {
                    result[childTree.name ?? '<unknown>'] = childTree;
                    return result;
                }, {}),
        },
        paths,
    };
}

function pct(rendered: number, skipped: number) {
    const total = rendered + skipped;
    return `${rendered} / ${total} (${Math.round((100 * rendered) / total)}%)`;
}

function time(name: string, start: number, end?: number) {
    const duration = end == null ? start : end - start;
    return `${name}: ${Math.round(duration * 100) / 100}ms`;
}

function accumulate<T>(iterator: Iterable<T>, mapper: (item: T) => number) {
    let sum = 0;
    for (const item of iterator) {
        sum += mapper(item);
    }
    return sum;
}

export function cleanupDebugStats(force: boolean = false) {
    if (!globalStatsAccumulator) {
        if (force) {
            statsAccumulatorConsumers = 0;
        }
        return;
    }

    if (!force && statsAccumulatorConsumers > 0) {
        return;
    }

    globalStatsAccumulator.destroy();
    globalStatsAccumulator = undefined;

    if (force) {
        statsAccumulatorConsumers = 0;
    }
}

/** @internal */
export function getDebugStatsStateForTesting() {
    return {
        active: globalStatsAccumulator != null,
        consumers: statsAccumulatorConsumers,
    };
}
