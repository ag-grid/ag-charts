import { toArray } from '../util/array';
import { Debug } from '../util/debug';
import { getWindow } from '../util/dom';
import { Logger } from '../util/logger';
import { SimpleTextMeasurer } from '../util/textMeasurer';
import { isString } from '../util/type-guards';
import { BBox } from './bbox';
import { Group } from './group';
import type { LayersManager } from './layersManager';
import { type Node, type RenderContext } from './node';
import { SpriteRenderer } from './spriteRenderer';
import { Transformable } from './transformable';

export enum DebugSelectors {
    SCENE = 'scene',
    SCENE_STATS = 'scene:stats',
    SCENE_STATS_VERBOSE = 'scene:stats:verbose',
    SCENE_DIRTY_TREE = 'scene:dirtyTree',
}

type BuildTree = { name?: string; node?: any; dirty?: boolean };

export function debugStats(
    layersManager: LayersManager,
    debugSplitTimes: Record<string, number>,
    ctx: CanvasRenderingContext2D,
    renderCtxStats: RenderContext['stats'],
    extraDebugStats = {},
    seriesRect = BBox.zero
) {
    if (!Debug.check(DebugSelectors.SCENE_STATS, DebugSelectors.SCENE_STATS_VERBOSE)) return;

    const { layersRendered = 0, layersSkipped = 0, nodesRendered = 0, nodesSkipped = 0 } = renderCtxStats ?? {};

    const end = performance.now();
    const { start, ...durations } = debugSplitTimes;

    const splits = Object.entries(durations)
        .map(([n, t]) => {
            return time(n, t);
        })
        .filter((v) => v != null)
        .join(' + ');
    const extras = Object.entries(extraDebugStats)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' ; ');

    const detailedStats = Debug.check(DebugSelectors.SCENE_STATS_VERBOSE);
    const stats = [
        `${time('⏱️', start, end)} (${splits})`,
        `${extras}`,
        `Layers: ${detailedStats ? pct(layersRendered, layersSkipped) : layersManager.size}; Sprites: ${SpriteRenderer.offscreenCanvasCount}`,
        detailedStats ? `Nodes: ${pct(nodesRendered, nodesSkipped)}` : null,
    ].filter(isString);
    const measurer = new SimpleTextMeasurer((t) => ctx.measureText(t));
    const statsSize = new Map(stats.map((t) => [t, measurer.measureLines(t)]));
    const width = Math.max(...Array.from(statsSize.values(), (s) => s.width));
    const height = accumulate(statsSize.values(), (s) => s.height);

    const x = 2 + seriesRect.x;
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.fillRect(x, 0, width, height);

    ctx.fillStyle = 'black';
    let y = 0;
    for (const [stat, size] of statsSize.entries()) {
        y += size.height;
        ctx.fillText(stat, x, y);
    }
    ctx.restore();
}

export function prepareSceneNodeHighlight(ctx: RenderContext) {
    const config: string[] = toArray(getWindow('agChartsSceneDebug'));
    const result: RenderContext['debugNodeSearch'] = [];
    for (const name of config) {
        if (name === 'layout') {
            result.push('seriesRoot', 'legend', 'root', /.*Axis-\d+-axis.*/);
        } else {
            result.push(name);
        }
    }
    ctx.debugNodeSearch = result;
}

export function debugSceneNodeHighlight(ctx: CanvasRenderingContext2D, debugNodes: Record<string, Node>) {
    ctx.save();

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

    ctx.restore();
}

export function buildTree(node: Node): BuildTree {
    if (!Debug.check(true, DebugSelectors.SCENE)) {
        return {};
    }

    let order = 0;
    return {
        node,
        name: node.name ?? node.id,
        dirty: node.dirty,
        ...Array.from(node.children(), (c) => buildTree(c)).reduce<Record<string, {}>>((result, childTree) => {
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
    if (!node.dirty) {
        return { dirtyTree: {}, paths: [] };
    }

    const childrenDirtyTree = Array.from(node.children(), (c) => buildDirtyTree(c)).filter((c) => c.paths.length > 0);
    const name = Group.is(node) ? node.name ?? node.id : node.id;
    const paths = childrenDirtyTree.length
        ? childrenDirtyTree.flatMap((c) => c.paths).map((p) => `${name}.${p}`)
        : [name];

    return {
        dirtyTree: {
            name,
            node,
            dirty: node.dirty,
            ...childrenDirtyTree
                .map((c) => c.dirtyTree)
                .filter((t) => t.dirty != null)
                .reduce<Record<string, {}>>((result, childTree) => {
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
    const duration = end != null ? end - start : start;
    return `${name}: ${Math.round(duration * 100) / 100}ms`;
}

function accumulate<T>(iterator: Iterable<T>, mapper: (item: T) => number) {
    let sum = 0;
    for (const item of iterator) {
        sum += mapper(item);
    }
    return sum;
}
