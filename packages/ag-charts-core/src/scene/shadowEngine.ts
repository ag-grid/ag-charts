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
 * Shadow engine.
 *
 * A shadow that every shape casts for itself is one Gaussian blur per shape, which dominates the frame time of a large
 * series. The engine instead casts the shadows of a set of shapes that share their shadow options and clips, a key, with one
 * blur:
 *
 * 1. Every caster draws its silhouette, with its real paint, into a scratch canvas the size of the layer. With a `spread`
 *    its silhouette is drawn solid, and as strong as its fill, as it is for a shape that casts for itself.
 * 2. That mask is blurred once, as it is blitted beneath where the casters are about to draw. It is blitted from
 *    off-canvas, shifted back by the shadow offset, so that only its shadow lands on the layer.
 *
 * The caller then draws the casters without a shadow, with {@link renderShadowless}. All the shadows of a cast therefore sit
 * beneath all of its items, so a later item's shadow no longer lands on an earlier item.
 *
 * A cast is all or nothing. It checks that every key can be cast before it draws any of them, and returns false, having
 * drawn nothing, if one can't, so that the caller can have the shapes cast for themselves without any shadow drawn twice.
 *
 * Casting the same shadows from the same shapes again, as a redraw that changed none of them does, blits the shadows that
 * the first redraw kept instead of blurring them again. See {@link ShadowCache}.
 */

/** How far a canvas shadow reaches past its source, in blurs: its Gaussian has a deviation of half the blur. */
const SHADOW_BLUR_REACH = 1.5;

/** How far two casters' strengths may differ for a key to cast them as one. */
const UNIFORM_STRENGTH_TOLERANCE = 1 / 512;

/** The most that the mask extends past the layer on one side, in device pixels. Items further off the layer cast nothing. */
const MAX_MASK_PAD = 4096;

/** The most pixels that the mask has: a canvas larger than this is more than iOS Safari can allocate (4096 x 4096). */
const MAX_MASK_AREA = 4096 * 4096;

/** How many casts of one user keep their shadows between redraws. Further casts of it blur every time. */
const MAX_CACHED_CASTS = 4;

type Ctx = RenderContext['ctx'];

export type ShadowCaster = Shape & { __fillShadow: NormalisedDropShadowOptions };

/**
 * How far a cast reaches. Casters are cast together where they are adjacent and share their shadow options and clip.
 *
 * - `run`: a cast ends only where the next node doesn't cast, or casts another shadow or to another clip.
 * - `layer`: a cast also ends at a change of `zIndex`, so that the shadow of an upper layer still lands on the lower one,
 *   as the depths of a treemap do.
 */
export type ShadowScope = 'run' | 'layer';

/** The corners, in the coordinates of the group, of the rectangle that a path clips its drawing and its shadow to. */
export type ShadowClip = readonly number[];

/** The casters that share their shadow options and clip, and so one mask and one blur. */
export interface ShadowKey {
    readonly shadow: NormalisedDropShadowOptions;
    readonly clip: ShadowClip | undefined;
    readonly casters: ShadowCaster[];
}

/** The shadow options that a node casts through the engine, or undefined if it casts none. */
export function getBatchedShadow(node: Node): NormalisedDropShadowOptions | undefined {
    if (!(node instanceof Shape)) return;
    const shadow = node.__fillShadow;
    // A cutout erases the layer beneath it, and so also what the engine's shadow put there. It casts for itself.
    return shadow?.enabled === true && node.__drawingMode !== 'cutout' ? shadow : undefined;
}

export function getShadowClip(node: Node): ShadowClip | undefined {
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

/** Whether `next`, which casts `shadow` to `clip`, is cast with the casters of `key` rather than starting another key. */
export function joinsShadowKey(
    key: ShadowKey,
    next: Node,
    shadow: NormalisedDropShadowOptions,
    clip: ShadowClip | undefined,
    scope: ShadowScope
) {
    return (
        sameShadow(key.shadow, shadow) &&
        sameClip(key.clip, clip) &&
        (scope !== 'layer' || sameLayer(key.casters[0], next))
    );
}

/** The resolution that keeps a mask canvas within {@link MAX_MASK_AREA}. A shadow is blurred anyway, so it loses little. */
function fitMask(maskWidth: number, maskHeight: number): number {
    return Math.min(1, Math.sqrt(MAX_MASK_AREA / (maskWidth * maskHeight)));
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
 * The scratch canvas that the casts of a scene's groups draw their masks into, one per scene. Render passes run one after
 * another, so they share it. It only grows, because layers differ in size, and each pass clears the part it uses. `user` is
 * the group, which keeps the canvas alive until it calls {@link releaseShadowScratch}.
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

/**
 * The shadows that a cast kept the last time it cast them, to blit again if it casts the same ones. There is one for each
 * cast of a user, in the order that the user makes them.
 *
 * It keeps them only once a cast repeats, so that a layer that animates, and so changes every frame, pays nothing for it.
 */
interface ShadowCache {
    /** What the last cast cast its shadows from, which the next cast overwrites as it compares itself with it. */
    readonly signature: (number | string)[];
    canvas: OffscreenCanvas | undefined;
    context: OffscreenCanvasRenderingContext2D | undefined;
    /** Whether the canvas holds the shadows that the signature describes. */
    valid: boolean;
}

const caches = new WeakMap<object, ShadowCache[]>();

function freeCache(cache: ShadowCache) {
    cache.valid = false;
    if (cache.canvas == null) return;

    cache.canvas.width = 0;
    cache.canvas.height = 0;
    cache.canvas = undefined;
    cache.context = undefined;
}

function getCache(user: object, cast: number): ShadowCache | undefined {
    if (cast >= MAX_CACHED_CASTS) return;

    let userCaches = caches.get(user);
    if (userCaches == null) {
        userCaches = [];
        caches.set(user, userCaches);
    }
    return (userCaches[cast] ??= { signature: [], canvas: undefined, context: undefined, valid: false });
}

/**
 * Overwrites the cache's signature with what a cast would cast, and returns whether that is what it held already. The
 * signature is the shadow options and clips, the casters and the changes marked on them, and where and how they draw: the
 * layer's size and pixel ratio, and the transform and opacity of the group. Nothing else changes what the shadows look like.
 */
function matchSignature(
    cache: ShadowCache,
    keys: readonly ShadowKey[],
    renderCtx: RenderContext,
    width: number,
    height: number
) {
    const { ctx, devicePixelRatio } = renderCtx;
    const { signature } = cache;
    let length = 0;
    let same = true;
    const write = (value: number | string) => {
        if (signature[length] !== value) {
            signature[length] = value;
            same = false;
        }
        length++;
    };

    const { a, b, c, d, e, f } = ctx.getTransform();
    write(width);
    write(height);
    write(devicePixelRatio);
    write(ctx.globalAlpha);
    write(a);
    write(b);
    write(c);
    write(d);
    write(e);
    write(f);
    for (const { shadow, clip, casters } of keys) {
        write(shadow.color);
        write(shadow.xOffset);
        write(shadow.yOffset);
        write(shadow.blur);
        write(shadow.spread ?? 0);
        write(clip?.length ?? -1);
        if (clip != null) clip.forEach(write);
        write(casters.length);
        for (const caster of casters) {
            write(caster.serialNumber);
            write(caster.revision);
        }
    }

    if (signature.length !== length) {
        signature.length = length;
        same = false;
    }
    return same;
}

/** The cache's canvas, cleared and the size of the layer, or undefined if the browser can't allocate one. */
function acquireCacheCanvas(cache: ShadowCache, width: number, height: number) {
    if (cache.canvas == null) {
        const OffscreenCanvasCtor = getOffscreenCanvas();
        const canvas = new OffscreenCanvasCtor(width, height);
        const context = canvas.getContext('2d');
        if (context == null) {
            canvas.width = 0;
            canvas.height = 0;
            return;
        }
        cache.canvas = canvas;
        cache.context = context;
    }
    return cache.canvas != null && cache.context != null ? { canvas: cache.canvas, context: cache.context } : undefined;
}

/** Frees the shadows that the casts of a user kept past its last cast of the frame, which were its `used` casts. */
export function endShadowCasts(user: object, used: number) {
    const userCaches = caches.get(user);
    if (userCaches == null) return;

    for (let i = used; i < userCaches.length; i++) freeCache(userCaches[i]);
}

/** Stops a group using the scene's scratch canvas, which is freed once no group does, and frees what its casts kept. */
export function releaseShadowScratch(scene: object | undefined, user: object) {
    endShadowCasts(user, 0);

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
    casters: readonly Node[],
    renderCtx: RenderContext,
    state: 'mask' | 'suppress',
    opaque: boolean = false,
    resolution: { x: number; y: number } = { x: 1, y: 1 }
) {
    const previousState = shadowPass.state;
    const previousOpaque = shadowPass.opaque;
    const previousResolution = shadowPass.resolution;
    shadowPass.state = state;
    shadowPass.opaque = opaque;
    shadowPass.resolution = resolution;
    try {
        for (const caster of casters) {
            caster.isolatedRender(renderCtx);
        }
    } finally {
        shadowPass.state = previousState;
        shadowPass.opaque = previousOpaque;
        shadowPass.resolution = previousResolution;
    }
}

/** Draws the casters as usual, without the shadows that {@link castShadows} cast beneath them. */
export function renderShadowless(casters: readonly Node[], renderCtx: RenderContext) {
    renderPass(casters, renderCtx, 'suppress');
}

/**
 * The strength that every caster of a `spread` key casts at, 0 if none of them casts, or undefined if they differ or one
 * draws its silhouette another way. The key then draws the silhouettes solid and casts its one shadow at that strength,
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

/** How a key casts its shadow: where its mask goes, and how it is blurred. */
interface KeyPlan {
    readonly key: ShadowKey;
    readonly blur: number;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly padLeft: number;
    readonly padTop: number;
    readonly maskWidth: number;
    readonly maskHeight: number;
    readonly canvasWidth: number;
    readonly canvasHeight: number;
    readonly scaleX: number;
    readonly scaleY: number;
    readonly colour: string;
    readonly opaque: boolean;
}

/** Plans a key, or returns 'empty' if its casters all cast nothing, or 'unusable' if the layer or the shadow is. */
function planKey(
    key: ShadowKey,
    renderCtx: RenderContext,
    width: number,
    height: number
): KeyPlan | 'empty' | 'unusable' {
    const { ctx, devicePixelRatio } = renderCtx;
    const { shadow, casters } = key;

    // A key whose casters all cast nothing, such as one fading in from zero opacity, has no mask or blur to draw.
    const spread = shadow.spread ?? 0;
    const strength = spread > 0 ? getUniformSpreadStrength(casters) : undefined;
    if (strength === 0) return 'empty';

    const blur = shadow.blur * devicePixelRatio;
    const offsetX = shadow.xOffset * devicePixelRatio;
    const offsetY = shadow.yOffset * devicePixelRatio;
    if (!(width > 0 && height > 0 && isFiniteNumber(blur) && isFiniteNumber(offsetX) && isFiniteNumber(offsetY))) {
        return 'unusable';
    }

    // An item that overhangs the layer still casts its shadow onto it, so the mask extends past the layer by as far as a
    // shadow can reach back. That is never more than MAX_MASK_PAD, past which nothing is drawn, so the mask stays small.
    const reach = Math.ceil(blur * SHADOW_BLUR_REACH + Math.max(0, spread) * devicePixelRatio);
    const padLeft = Math.min(Math.ceil(Math.max(0, offsetX)) + reach, MAX_MASK_PAD);
    const padRight = Math.min(Math.ceil(Math.max(0, -offsetX)) + reach, MAX_MASK_PAD);
    const padTop = Math.min(Math.ceil(Math.max(0, offsetY)) + reach, MAX_MASK_PAD);
    const padBottom = Math.min(Math.ceil(Math.max(0, -offsetY)) + reach, MAX_MASK_PAD);

    // A canvas of more pixels than a browser can allocate would give no context, so a mask that is too large is drawn at a
    // lower resolution, which is blitted back up to its size.
    const maskWidth = width + padLeft + padRight;
    const maskHeight = height + padTop + padBottom;
    const resolution = fitMask(maskWidth, maskHeight);
    const canvasWidth = Math.max(1, Math.floor(maskWidth * resolution));
    const canvasHeight = Math.max(1, Math.floor(maskHeight * resolution));

    // A key of casters at one translucent strength draws them solid, and casts the shadow at that strength.
    let colour = shadow.color;
    let opaque = false;
    if (strength != null && strength * ctx.globalAlpha < 1) {
        const scaled = scaleColourAlpha(shadow.color, strength * ctx.globalAlpha);
        if (scaled != null) {
            colour = scaled;
            opaque = true;
        }
    }

    return {
        key,
        blur,
        offsetX,
        offsetY,
        padLeft,
        padTop,
        maskWidth,
        maskHeight,
        canvasWidth,
        canvasHeight,
        scaleX: canvasWidth / maskWidth,
        scaleY: canvasHeight / maskHeight,
        colour,
        opaque,
    };
}

/**
 * Casts a planned key onto `target`: its casters draw their silhouettes into `scratch`, and that mask is blurred once as
 * it is blitted. `transform` is the transform of the group, which a clip of the key is in, if `target` doesn't have it.
 */
function castPlan(
    plan: KeyPlan,
    scratch: ShadowScratch,
    target: Ctx,
    transform: DOMMatrix | undefined,
    renderCtx: RenderContext
) {
    const { ctx } = renderCtx;
    const { key, blur, offsetX, offsetY, padLeft, padTop, maskWidth, maskHeight, canvasWidth, canvasHeight } = plan;
    const { scaleX, scaleY, colour, opaque } = plan;
    const { canvas, context } = scratch;

    context.save();
    try {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        const { a, b, c, d, e, f } = ctx.getTransform();
        context.setTransform(
            a * scaleX,
            b * scaleY,
            c * scaleX,
            d * scaleY,
            (e + padLeft) * scaleX,
            (f + padTop) * scaleY
        );
        context.globalAlpha = opaque ? 1 : ctx.globalAlpha;
        context.direction = ctx.direction;

        // The casters draw their silhouettes again, so the mask pass must not count them, or debug them, twice.
        renderPass(
            key.casters,
            {
                ...renderCtx,
                ctx: context,
                stats: undefined,
                debugNodeSearch: undefined,
                currentFont: undefined,
                dirtyRegion: undefined,
            },
            'mask',
            opaque,
            { x: scaleX, y: scaleY }
        );
    } finally {
        context.restore();
    }

    // The mask is drawn this far to the left, so that none of it is on the layer. The shadow offset brings its shadow back.
    const distance = maskWidth;
    target.save();
    try {
        if (transform != null) target.setTransform(transform);
        // A path clips its shadow as well as its silhouette, so the shadow is clipped to what the path was drawn into.
        const { clip } = key;
        if (clip != null) {
            target.beginPath();
            target.moveTo(clip[0], clip[1]);
            for (let i = 2; i < clip.length; i += 2) target.lineTo(clip[i], clip[i + 1]);
            target.closePath();
            target.clip();
        }
        target.resetTransform();
        target.globalAlpha = 1;
        target.shadowColor = colour;
        target.shadowOffsetX = offsetX + distance;
        target.shadowOffsetY = offsetY;
        target.shadowBlur = blur;
        target.drawImage(canvas, 0, 0, canvasWidth, canvasHeight, -padLeft - distance, -padTop, maskWidth, maskHeight);
    } finally {
        target.restore();
    }
}

function blitCache(ctx: Ctx, canvas: OffscreenCanvas) {
    ctx.save();
    try {
        ctx.resetTransform();
        ctx.globalAlpha = 1;
        ctx.drawImage(canvas, 0, 0);
    } finally {
        ctx.restore();
    }
}

export interface ShadowCast {
    readonly scene: object | undefined;
    /** The group that casts, which keeps the scene's scratch canvas, and what its casts keep, until it releases them. */
    readonly user: object;
    /** The keys whose shadows to cast, in the order of their first caster. */
    readonly keys: readonly ShadowKey[];
    /** Which of the user's casts of this frame this is, counting from 0, to match it with what the last frame cast. */
    readonly index: number;
}

/**
 * Casts the shadows of the keys onto `renderCtx.ctx`, now. Returns false, having drawn nothing, if the layer or a shadow is
 * unusable, or the browser can't allocate the scratch canvas, in which case the casters cast for themselves.
 */
export function castShadows({ scene, user, keys, index }: ShadowCast, renderCtx: RenderContext): boolean {
    const { ctx } = renderCtx;
    const width = Math.ceil(ctx.canvas.width);
    const height = Math.ceil(ctx.canvas.height);

    const cache = getCache(user, index);
    const repeated = cache != null && matchSignature(cache, keys, renderCtx, width, height);
    if (cache?.valid === true && repeated && cache.canvas != null) {
        blitCache(ctx, cache.canvas);
        return true;
    }
    if (cache != null && !repeated) freeCache(cache);

    // Every key is planned before any is drawn, so that a cast that can't be made is not half made.
    const plans: KeyPlan[] = [];
    for (const key of keys) {
        const plan = planKey(key, renderCtx, width, height);
        if (plan === 'unusable') return false;
        if (plan !== 'empty') plans.push(plan);
    }
    if (plans.length === 0) return true;

    let scratchWidth = 0;
    let scratchHeight = 0;
    for (const { canvasWidth, canvasHeight } of plans) {
        scratchWidth = Math.max(scratchWidth, canvasWidth);
        scratchHeight = Math.max(scratchHeight, canvasHeight);
    }
    if (scratchWidth * scratchHeight > MAX_MASK_AREA) return false;
    const scratch = acquireShadowScratch(scene, user, scratchWidth, scratchHeight);
    if (scratch == null) return false;

    const kept = cache != null && repeated ? acquireCacheCanvas(cache, width, height) : undefined;
    if (cache != null && kept != null) {
        kept.context.clearRect(0, 0, width, height);
        const transform = ctx.getTransform();
        for (const plan of plans) castPlan(plan, scratch, kept.context, transform, renderCtx);
        cache.valid = true;
        blitCache(ctx, kept.canvas);
    } else {
        for (const plan of plans) castPlan(plan, scratch, ctx, undefined, renderCtx);
    }
    return true;
}
