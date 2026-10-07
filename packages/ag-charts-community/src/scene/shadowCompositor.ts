import { getOffscreenCanvas, isFiniteNumber } from 'ag-charts-core';
import type { NormalisedDropShadowOptions } from 'ag-charts-core';

import type { Node, RenderContext } from './node';
import { shadowPass } from './shadowPass';
import { Shape } from './shape/shape';

/**
 * Layer shadow compositor.
 *
 * A shadow that every shape casts for itself is one Gaussian blur per shape, which dominates the frame time of a large
 * series. The compositor instead draws each run of consecutive children that share their shadow options as a batch:
 *
 * 1. Every caster draws its silhouette, with its real paint, into a scratch canvas the size of the layer.
 * 2. That mask is blurred once, as it is blitted beneath the batch. It is blitted from off-canvas, shifted back by the
 *    shadow offset, so that only its shadow lands on the layer.
 * 3. The casters draw as usual, without a shadow.
 *
 * All the shadows of a batch therefore sit beneath all of its items, so a later item's shadow no longer lands on an
 * earlier item. Runs end at a node that casts no batched shadow, at a `cutout` node and at a change of shadow options.
 */

type ShadowCaster = Shape & { __fillShadow: NormalisedDropShadowOptions };

/** The shadow options that a node casts through a batch, or undefined if it casts none. */
export function getBatchedShadow(node: Node): NormalisedDropShadowOptions | undefined {
    if (!(node instanceof Shape)) return;
    const shadow = node.__fillShadow;
    // A cutout erases the layer beneath it, and so also what the batch's shadow put there. It casts for itself.
    return shadow?.enabled === true && node.__drawingMode !== 'cutout' ? shadow : undefined;
}

function sameShadow(a: NormalisedDropShadowOptions, b: NormalisedDropShadowOptions) {
    return (
        a === b ||
        (a.color === b.color &&
            a.xOffset === b.xOffset &&
            a.yOffset === b.yOffset &&
            a.blur === b.blur &&
            (a.spread ?? 0) === (b.spread ?? 0))
    );
}

interface ShadowScratch {
    readonly canvas: OffscreenCanvas;
    readonly context: OffscreenCanvasRenderingContext2D;
}

interface ScratchPool {
    readonly users: Set<object>;
    scratch: ShadowScratch | undefined;
}

/** The scratch canvases of scenes, so that the groups of one chart share one. Groups outside a scene share another. */
const pools = new WeakMap<object, ScratchPool>();
const DETACHED = {};

function getPool(scene: object | undefined): ScratchPool {
    const key = scene ?? DETACHED;
    let pool = pools.get(key);
    if (pool == null) {
        pool = { users: new Set(), scratch: undefined };
        pools.set(key, pool);
    }
    return pool;
}

function freeScratch(pool: ScratchPool) {
    const { scratch } = pool;
    if (scratch == null) return;

    // Workaround memory allocation quirks in iOS Safari, as for the layer canvases.
    scratch.canvas.width = 0;
    scratch.canvas.height = 0;
    pool.scratch = undefined;
}

/**
 * The scratch canvas that the shadow batches of a scene's groups draw their masks into, one per scene. Render passes run
 * one after another, so they share it. It only grows, because layers differ in size, and each pass clears the part it
 * uses. `user` is the group, which keeps the canvas alive until it calls {@link releaseShadowScratch}.
 */
function acquireShadowScratch(scene: object | undefined, user: object, width: number, height: number): ShadowScratch {
    const pool = getPool(scene);
    pool.users.add(user);

    let { scratch } = pool;
    if (scratch == null || scratch.canvas.width < width || scratch.canvas.height < height) {
        const largest = scratch?.canvas;
        freeScratch(pool);
        const OffscreenCanvasCtor = getOffscreenCanvas();
        const canvas = new OffscreenCanvasCtor(
            Math.max(width, largest?.width ?? 0),
            Math.max(height, largest?.height ?? 0)
        );
        scratch = { canvas, context: canvas.getContext('2d')! };
        pool.scratch = scratch;
    }
    return scratch;
}

/** Stops a group using the scene's scratch canvas, which is freed once no group does. */
export function releaseShadowScratch(scene: object | undefined, user: object) {
    const pool = pools.get(scene ?? DETACHED);
    if (pool == null || !pool.users.delete(user) || pool.users.size > 0) return;

    freeScratch(pool);
}

/** Frees the scene's scratch canvas, whoever uses it. */
export function destroyShadowScratch(scene: object) {
    const pool = pools.get(scene);
    if (pool == null) return;

    pool.users.clear();
    freeScratch(pool);
}

function renderPass(children: readonly Node[], renderCtx: RenderContext, state: 'mask' | 'suppress') {
    const previous = shadowPass.state;
    shadowPass.state = state;
    try {
        for (const child of children) {
            child.isolatedRender(renderCtx);
        }
    } finally {
        shadowPass.state = previous;
    }
}

/** Draws a batch of at least two casters that share `shadow`. Returns false, drawing nothing, if it can't batch. */
function renderBatch(
    scene: object | undefined,
    user: object,
    casters: readonly ShadowCaster[],
    shadow: NormalisedDropShadowOptions,
    renderCtx: RenderContext
): boolean {
    const { ctx, devicePixelRatio } = renderCtx;
    const width = Math.ceil(ctx.canvas.width);
    const height = Math.ceil(ctx.canvas.height);
    const blur = shadow.blur * devicePixelRatio;
    const offsetX = shadow.xOffset * devicePixelRatio;
    const offsetY = shadow.yOffset * devicePixelRatio;
    if (!(width > 0 && height > 0 && isFiniteNumber(blur) && isFiniteNumber(offsetX) && isFiniteNumber(offsetY))) {
        return false;
    }

    const { canvas, context: scratch } = acquireShadowScratch(scene, user, width, height);

    scratch.save();
    try {
        scratch.setTransform(1, 0, 0, 1, 0, 0);
        scratch.clearRect(0, 0, width, height);
        scratch.setTransform(ctx.getTransform());
        scratch.globalAlpha = ctx.globalAlpha;
        scratch.direction = ctx.direction;

        // The casters draw their silhouettes again below, so the mask pass must not count them, or debug them, twice.
        renderPass(
            casters,
            { ...renderCtx, ctx: scratch, stats: undefined, debugNodeSearch: undefined, currentFont: undefined },
            'mask'
        );
    } finally {
        scratch.restore();
    }

    // The mask is drawn this far to the left, so that none of it is on the layer. The shadow offset brings its shadow back.
    const distance = width;
    ctx.save();
    try {
        ctx.resetTransform();
        ctx.globalAlpha = 1;
        ctx.shadowColor = shadow.color;
        ctx.shadowOffsetX = offsetX + distance;
        ctx.shadowOffsetY = offsetY;
        ctx.shadowBlur = blur;
        ctx.drawImage(canvas, 0, 0, width, height, -distance, 0, width, height);
    } finally {
        ctx.restore();
    }

    renderPass(casters, renderCtx, 'suppress');
    return true;
}

/**
 * Renders the children of a group, drawing each run of children that share a shadow as a batch with one blur.
 * Returns the number of batches drawn.
 */
export function renderChildrenWithShadowBatches(
    children: Iterable<Node>,
    scene: object | undefined,
    user: object,
    renderCtx: RenderContext
): number {
    const { stats } = renderCtx;
    let batches = 0;
    let run: ShadowCaster[] = [];
    let runShadow: NormalisedDropShadowOptions | undefined;

    const flush = () => {
        if (run.length > 1 && runShadow != null && renderBatch(scene, user, run, runShadow, renderCtx)) {
            batches++;
        } else {
            // A lone caster has nothing to share a blur with, and casts for itself.
            for (const caster of run) caster.isolatedRender(renderCtx);
        }
        run = [];
        runShadow = undefined;
    };

    for (const child of children) {
        // Skip invisible children, which don't end a run.
        if (!child.visible) {
            if (stats) {
                stats.nodesSkipped += child.childNodeCounts.nonGroups + child.childNodeCounts.groups;
                stats.opsSkipped += child.childNodeCounts.complexity;
            }
            continue;
        }

        const shadow = getBatchedShadow(child);
        if (shadow != null && (runShadow == null || sameShadow(runShadow, shadow))) {
            runShadow ??= shadow;
            run.push(child as ShadowCaster);
            continue;
        }

        flush();
        if (shadow == null) {
            child.isolatedRender(renderCtx);
        } else {
            runShadow = shadow;
            run.push(child as ShadowCaster);
        }
    }
    flush();

    return batches;
}
