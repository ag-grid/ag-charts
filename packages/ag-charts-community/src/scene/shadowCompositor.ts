import { getOffscreenCanvas, isFiniteNumber } from 'ag-charts-core';
import type { NormalisedDropShadowOptions } from 'ag-charts-core';

import type { Node, RenderContext } from './node';
import { shadowPass } from './shadowPass';
import { Path } from './shape/path';
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
 * earlier item. Runs end at a node that casts no batched shadow, at a `cutout` node and at a change of shadow options or of the clip of a path.
 */

/** How far a canvas shadow reaches past its source, in blurs: its Gaussian has a deviation of half the blur. */
const SHADOW_BLUR_REACH = 1.5;

/** The most that the mask extends past the layer on one side, in device pixels. Items further off the layer cast nothing. */
const MAX_MASK_PAD = 4096;

type ShadowCaster = Shape & { __fillShadow: NormalisedDropShadowOptions };

/** The shadow options that a node casts through a batch, or undefined if it casts none. */
export function getBatchedShadow(node: Node): NormalisedDropShadowOptions | undefined {
    if (!(node instanceof Shape)) return;
    const shadow = node.__fillShadow;
    // A cutout erases the layer beneath it, and so also what the batch's shadow put there. It casts for itself.
    return shadow?.enabled === true && node.__drawingMode !== 'cutout' ? shadow : undefined;
}

/** The rectangle, in the coordinates of the group, that a path clips its drawing and its shadow to. */
interface ShadowClip {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

function getShadowClip(node: Node): ShadowClip | undefined {
    return node instanceof Path ? node.getShadowClip() : undefined;
}

function sameClip(a: ShadowClip | undefined, b: ShadowClip | undefined) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
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
        // Read the size first, because freeing the canvas resizes it to 0 x 0.
        const largestWidth = scratch?.canvas.width ?? 0;
        const largestHeight = scratch?.canvas.height ?? 0;
        freeScratch(pool);
        const OffscreenCanvasCtor = getOffscreenCanvas();
        const canvas = new OffscreenCanvasCtor(Math.max(width, largestWidth), Math.max(height, largestHeight));
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

/** Draws a batch of casters that share `shadow`. Returns false, drawing nothing, if the layer or the shadow is unusable. */
function renderBatch(
    scene: object | undefined,
    user: object,
    casters: readonly ShadowCaster[],
    shadow: NormalisedDropShadowOptions,
    clip: ShadowClip | undefined,
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

    // An item that overhangs the layer still casts its shadow onto it, so the mask extends past the layer by as far as a
    // shadow can reach back. That is never more than MAX_MASK_PAD, past which nothing is drawn, so the mask stays small.
    const reach = Math.ceil(blur * SHADOW_BLUR_REACH + Math.max(0, shadow.spread ?? 0) * devicePixelRatio);
    const padLeft = Math.min(Math.ceil(Math.max(0, offsetX)) + reach, MAX_MASK_PAD);
    const padRight = Math.min(Math.ceil(Math.max(0, -offsetX)) + reach, MAX_MASK_PAD);
    const padTop = Math.min(Math.ceil(Math.max(0, offsetY)) + reach, MAX_MASK_PAD);
    const padBottom = Math.min(Math.ceil(Math.max(0, -offsetY)) + reach, MAX_MASK_PAD);

    const maskWidth = width + padLeft + padRight;
    const maskHeight = height + padTop + padBottom;
    const { canvas, context: scratch } = acquireShadowScratch(scene, user, maskWidth, maskHeight);

    scratch.save();
    try {
        scratch.setTransform(1, 0, 0, 1, 0, 0);
        scratch.clearRect(0, 0, maskWidth, maskHeight);
        const { a, b, c, d, e, f } = ctx.getTransform();
        scratch.setTransform(a, b, c, d, e + padLeft, f + padTop);
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
    const distance = maskWidth;
    ctx.save();
    try {
        // A path clips its shadow as well as its silhouette, so the shadow is clipped to what the path was drawn into.
        if (clip != null) {
            ctx.beginPath();
            ctx.rect(clip.x, clip.y, clip.width, clip.height);
            ctx.clip();
        }
        ctx.resetTransform();
        ctx.globalAlpha = 1;
        ctx.shadowColor = shadow.color;
        ctx.shadowOffsetX = offsetX + distance;
        ctx.shadowOffsetY = offsetY;
        ctx.shadowBlur = blur;
        ctx.drawImage(canvas, 0, 0, maskWidth, maskHeight, -padLeft - distance, -padTop, maskWidth, maskHeight);
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
    let runClip: ShadowClip | undefined;

    const flush = () => {
        if (run.length > 0 && runShadow != null && renderBatch(scene, user, run, runShadow, runClip, renderCtx)) {
            batches++;
        } else {
            // The batch can't be drawn, so the casters cast for themselves.
            for (const caster of run) caster.isolatedRender(renderCtx);
        }
        run = [];
        runShadow = undefined;
        runClip = undefined;
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
        const clip = shadow == null ? undefined : getShadowClip(child);
        if (shadow != null && (runShadow == null || (sameShadow(runShadow, shadow) && sameClip(runClip, clip)))) {
            if (runShadow == null) {
                runShadow = shadow;
                runClip = clip;
            }
            run.push(child as ShadowCaster);
            continue;
        }

        flush();
        if (shadow == null) {
            child.isolatedRender(renderCtx);
        } else {
            runShadow = shadow;
            runClip = clip;
            run.push(child as ShadowCaster);
        }
    }
    flush();

    return batches;
}
