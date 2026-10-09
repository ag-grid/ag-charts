import { isFiniteNumber } from '../data/typeGuards';
import { getOffscreenCanvas } from '../dom/globalsProxy';
import { Color } from '../format/color';
import type { NormalisedDropShadowOptions } from '../options/normalised/normalisedCommonOptions';
import { releaseSpreadCanvas } from './canvas/spreadCanvas';
import type { Node, RenderContext } from './node';
import { shadowPass } from './shadowPass';
import { Path } from './shape/path';
import { Shape } from './shape/shape';
import type { TranslatableType } from './transformable';
import { compareZIndex } from './zIndex';

/**
 * Layer shadow compositor.
 *
 * A shadow that every shape casts for itself is one Gaussian blur per shape, which dominates the frame time of a large
 * series. The compositor instead draws each run of consecutive children that share their shadow options as a batch:
 *
 * 1. Every caster draws its silhouette, with its real paint, into a scratch canvas the size of the layer. With a `spread`
 *    its silhouette is drawn solid, and as strong as its fill, as it is for a shape that casts for itself.
 * 2. That mask is blurred once, as it is blitted beneath the batch. It is blitted from off-canvas, shifted back by the
 *    shadow offset, so that only its shadow lands on the layer.
 * 3. The casters draw as usual, without a shadow.
 *
 * All the shadows of a batch therefore sit beneath all of its items, so a later item's shadow no longer lands on an
 * earlier item. Runs end at a node that casts no batched shadow, at a `cutout` node, and at a change of shadow options,
 * of the clip of a path and, in a group that batches by layer, of `zIndex`. A series gives its items a `zIndex` where one
 * layer paints over another, like the depths of a treemap, so the shadow of an upper layer still lands on the lower one.
 */

/** How far a canvas shadow reaches past its source, in blurs: its Gaussian has a deviation of half the blur. */
const SHADOW_BLUR_REACH = 1.5;

/** How far two casters' strengths may differ for the batch to cast them as one. */
const UNIFORM_STRENGTH_TOLERANCE = 1 / 512;

/** The most that the mask extends past the layer on one side, in device pixels. Items further off the layer cast nothing. */
const MAX_MASK_PAD = 4096;

/** The most pixels that the mask has: a canvas larger than this is more than iOS Safari can allocate (4096 x 4096). */
const MAX_MASK_AREA = 4096 * 4096;

type ShadowCaster = Shape & { __fillShadow: NormalisedDropShadowOptions };

/** The shadow options that a node casts through a batch, or undefined if it casts none. */
export function getBatchedShadow(node: Node): NormalisedDropShadowOptions | undefined {
    if (!(node instanceof Shape)) return;
    const shadow = node.__fillShadow;
    // A cutout erases the layer beneath it, and so also what the batch's shadow put there. It casts for itself.
    return shadow?.enabled === true && node.__drawingMode !== 'cutout' ? shadow : undefined;
}

/** The corners, in the coordinates of the group, of the rectangle that a path clips its drawing and its shadow to. */
type ShadowClip = readonly number[];

function getShadowClip(node: Node): ShadowClip | undefined {
    if (!(node instanceof Path)) return;

    const rect = node.getShadowClip();
    if (rect == null) return;

    // A path with a transform of its own clips in its own coordinates, which are not those of the group.
    const toParent = (node as Partial<Pick<TranslatableType<Node>, 'toParentPoint'>>).toParentPoint;
    const { x, y, width, height } = rect;
    const corners: number[] = [];
    for (const [cx, cy] of [
        [x, y],
        [x + width, y],
        [x + width, y + height],
        [x, y + height],
    ]) {
        const point = toParent == null ? { x: cx, y: cy } : toParent.call(node, cx, cy);
        corners.push(point.x, point.y);
    }
    return corners;
}

function sameClip(a: ShadowClip | undefined, b: ShadowClip | undefined) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    return a.every((value, i) => value === b[i]);
}

function sameLayer(a: Node, b: Node) {
    const aIndex = a.__zIndex;
    const bIndex = b.__zIndex;
    return aIndex === bIndex || compareZIndex(aIndex, bIndex) === 0;
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

/** The share of the padding that keeps the mask within {@link MAX_MASK_AREA}, or undefined if the layer alone does not. */
function fitPadding(width: number, height: number, padX: number, padY: number): number | undefined {
    for (let scale = 1; scale >= 1 / 16; scale /= 2) {
        if ((width + padX * scale) * (height + padY * scale) <= MAX_MASK_AREA) return scale;
    }
    return width * height <= MAX_MASK_AREA ? 0 : undefined;
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
    releaseSpreadCanvas(scratch.context);
    scratch.canvas.width = 0;
    scratch.canvas.height = 0;
    pool.scratch = undefined;
}

/**
 * The scratch canvas that the shadow batches of a scene's groups draw their masks into, one per scene. Render passes run
 * one after another, so they share it. It only grows, because layers differ in size, and each pass clears the part it
 * uses. `user` is the group, which keeps the canvas alive until it calls {@link releaseShadowScratch}.
 */
function acquireShadowScratch(
    scene: object | undefined,
    user: object,
    width: number,
    height: number
): ShadowScratch | undefined {
    const pool = getPool(scene);
    pool.users.add(user);

    let { scratch } = pool;
    if (scratch == null || scratch.canvas.width < width || scratch.canvas.height < height) {
        // Read the size first, because freeing the canvas resizes it to 0 x 0.
        const largestWidth = scratch?.canvas.width ?? 0;
        const largestHeight = scratch?.canvas.height ?? 0;
        freeScratch(pool);

        // The canvas only grows, but not past what a canvas can be, whatever the sizes that it grew to.
        let canvasWidth = Math.max(width, largestWidth);
        let canvasHeight = Math.max(height, largestHeight);
        if (canvasWidth * canvasHeight > MAX_MASK_AREA) {
            canvasWidth = width;
            canvasHeight = height;
        }
        const OffscreenCanvasCtor = getOffscreenCanvas();
        const canvas = new OffscreenCanvasCtor(canvasWidth, canvasHeight);
        // A browser that can't allocate the canvas gives no context.
        const context = canvas.getContext('2d');
        if (context == null) {
            canvas.width = 0;
            canvas.height = 0;
            return;
        }
        scratch = { canvas, context };
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

function renderPass(
    children: readonly Node[],
    renderCtx: RenderContext,
    state: 'mask' | 'suppress',
    opaque: boolean = false
) {
    const previousState = shadowPass.state;
    const previousOpaque = shadowPass.opaque;
    shadowPass.state = state;
    shadowPass.opaque = opaque;
    try {
        for (const child of children) {
            child.isolatedRender(renderCtx);
        }
    } finally {
        shadowPass.state = previousState;
        shadowPass.opaque = previousOpaque;
    }
}

/**
 * The strength that every caster of a `spread` batch casts at, 0 if none of them casts, or undefined if they differ or one
 * draws its silhouette another way. The batch then draws the silhouettes solid and casts its one shadow at that strength,
 * which avoids a pass over the layer per translucent shape.
 */
function getUniformSpreadStrength(casters: readonly ShadowCaster[]): number | undefined {
    let uniform = 0;
    for (const caster of casters) {
        const strength = caster.getSpreadMaskStrength();
        if (strength == null) return;
        if (strength <= 0) continue;
        if (uniform === 0) {
            uniform = strength;
        } else if (Math.abs(strength - uniform) > UNIFORM_STRENGTH_TOLERANCE) {
            return;
        }
    }
    return uniform;
}

/** The colour with its alpha scaled, or undefined if it can't be read. */
function scaleColourAlpha(colour: string, scale: number): string | undefined {
    try {
        const { r, g, b, a } = Color.fromString(colour);
        return new Color(r, g, b, a * scale).toRgbaString();
    } catch {
        return;
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

    // A batch whose casters all cast nothing, such as one fading in from zero opacity, has no mask or blur to draw.
    const spread = shadow.spread ?? 0;
    const strength = spread > 0 ? getUniformSpreadStrength(casters) : undefined;
    if (strength === 0) {
        renderPass(casters, renderCtx, 'suppress');
        return true;
    }

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
    const reach = Math.ceil(blur * SHADOW_BLUR_REACH + Math.max(0, spread) * devicePixelRatio);
    const padLeft = Math.min(Math.ceil(Math.max(0, offsetX)) + reach, MAX_MASK_PAD);
    const padRight = Math.min(Math.ceil(Math.max(0, -offsetX)) + reach, MAX_MASK_PAD);
    const padTop = Math.min(Math.ceil(Math.max(0, offsetY)) + reach, MAX_MASK_PAD);
    const padBottom = Math.min(Math.ceil(Math.max(0, -offsetY)) + reach, MAX_MASK_PAD);

    // A canvas of more pixels than a browser can allocate would give no context, so the padding is cut down to fit, and the
    // items that it no longer reaches cast nothing. A layer that is too large by itself is left to its items.
    const padScale = fitPadding(width, height, padLeft + padRight, padTop + padBottom);
    if (padScale == null) return false;
    const padL = Math.floor(padLeft * padScale);
    const padT = Math.floor(padTop * padScale);
    const maskWidth = width + padL + Math.floor(padRight * padScale);
    const maskHeight = height + padT + Math.floor(padBottom * padScale);
    const acquired = acquireShadowScratch(scene, user, maskWidth, maskHeight);
    if (acquired == null) return false;
    const { canvas, context: scratch } = acquired;

    // A batch of casters at one translucent strength draws them solid, and casts the shadow at that strength.
    let shadowColour = shadow.color;
    let opaque = false;
    if (strength != null && strength * ctx.globalAlpha < 1) {
        const scaled = scaleColourAlpha(shadow.color, strength * ctx.globalAlpha);
        if (scaled != null) {
            shadowColour = scaled;
            opaque = true;
        }
    }

    scratch.save();
    try {
        scratch.setTransform(1, 0, 0, 1, 0, 0);
        scratch.clearRect(0, 0, maskWidth, maskHeight);
        const { a, b, c, d, e, f } = ctx.getTransform();
        scratch.setTransform(a, b, c, d, e + padL, f + padT);
        scratch.globalAlpha = opaque ? 1 : ctx.globalAlpha;
        scratch.direction = ctx.direction;

        // The casters draw their silhouettes again below, so the mask pass must not count them, or debug them, twice.
        renderPass(
            casters,
            { ...renderCtx, ctx: scratch, stats: undefined, debugNodeSearch: undefined, currentFont: undefined },
            'mask',
            opaque
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
            ctx.moveTo(clip[0], clip[1]);
            for (let i = 2; i < clip.length; i += 2) ctx.lineTo(clip[i], clip[i + 1]);
            ctx.closePath();
            ctx.clip();
        }
        ctx.resetTransform();
        ctx.globalAlpha = 1;
        ctx.shadowColor = shadowColour;
        ctx.shadowOffsetX = offsetX + distance;
        ctx.shadowOffsetY = offsetY;
        ctx.shadowBlur = blur;
        ctx.drawImage(canvas, 0, 0, maskWidth, maskHeight, -padL - distance, -padT, maskWidth, maskHeight);
    } finally {
        ctx.restore();
    }

    renderPass(casters, renderCtx, 'suppress');
    return true;
}

/**
 * Renders the children of a group, drawing each run of children that share a shadow as a batch with one blur.
 */
export function renderChildrenWithShadowBatches(
    children: Iterable<Node>,
    scene: object | undefined,
    user: object,
    renderCtx: RenderContext,
    splitByLayer: boolean = false
): void {
    const { stats } = renderCtx;
    let run: ShadowCaster[] = [];
    let runShadow: NormalisedDropShadowOptions | undefined;
    let runClip: ShadowClip | undefined;

    const flush = () => {
        if (run.length === 0) return;

        if (runShadow == null || !renderBatch(scene, user, run, runShadow, runClip, renderCtx)) {
            // The one exception to drawing every shadow through the mask: a layer too large for it, or no context to draw it
            // with, leaves the casters to cast for themselves. They size their shadow the way the mask does.
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
        const joinsRun =
            shadow != null &&
            runShadow != null &&
            sameShadow(runShadow, shadow) &&
            sameClip(runClip, clip) &&
            (!splitByLayer || sameLayer(run[0], child));
        // A child that casts no shadow, or one that does not continue the run, ends it.
        if (!joinsRun) flush();
        if (shadow == null) {
            child.isolatedRender(renderCtx);
            continue;
        }

        if (runShadow == null) {
            runShadow = shadow;
            runClip = clip;
        }
        run.push(child as ShadowCaster);
    }
    flush();
}
