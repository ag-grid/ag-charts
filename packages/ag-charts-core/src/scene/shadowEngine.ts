import { isFiniteNumber } from '../data/typeGuards';
import { Color } from '../format/color';
import type { NormalisedDropShadowOptions } from '../options/normalised/normalisedCommonOptions';
import { type SpreadCanvas, allocateCanvas, disposeCanvas, releaseSpreadCanvas } from './canvas/spreadCanvas';
import type { Node, RenderContext } from './node';
import { shadowPass } from './shadowPass';
import { Path } from './shape/path';
import { Shape, type SilhouetteBounds } from './shape/shape';
import type { TranslatableType } from './transformable';
import { compareZIndex } from './zIndex';

/** How far a canvas shadow reaches past its source, in blurs: its Gaussian has a deviation of half the blur. */
const SHADOW_BLUR_REACH = 1.5;

/** How far a shadow's blur, in device pixels, reaches past its source, with a `spread` that widens the source by more. */
function getBlurReach(blur: number, spread: number = 0) {
    return Math.ceil(blur * SHADOW_BLUR_REACH + Math.max(0, spread));
}

/** How far two casters' strengths may differ for a key to cast them as one. */
const UNIFORM_STRENGTH_TOLERANCE = 1 / 512;

/** The most that the mask extends past the layer on one side, in device pixels. Items further off the layer cast nothing. */
const MAX_MASK_PAD = 4096;

/** The most pixels that the mask has: a canvas larger than this is more than iOS Safari can allocate (4096 x 4096). */
const MAX_MASK_AREA = 4096 * 4096;

/** How many casts of one user keep their shadows between redraws. Further casts of it blur every time. */
const MAX_CACHED_CASTS = 4;

/** The most pixels that the kept shadows of a scene hold between them: about 16 MB, or one 1200 x 800 layer at 2x (3.84M). */
const MAX_CACHED_AREA = MAX_MASK_AREA / 4;

/** The pixels that a kept shadow may reach past what the blur's Gaussian covers, for the rounding of its edge. */
const CACHED_EXTENT_MARGIN = 2;

/** The resolution of a mask that was not scaled down. */
const FULL_RESOLUTION = Object.freeze({ x: 1, y: 1 });

type Ctx = RenderContext['ctx'];

export type ShadowCaster = Shape & { __fillShadow: NormalisedDropShadowOptions };

/** How far a cast reaches: `run` ends it where adjacent casters stop sharing shadow and clip, `layer` also at a `zIndex`. */
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

interface ScratchPool {
    readonly users: Set<object>;
    scratch: SpreadCanvas | undefined;
    /** The pixels of the canvases that the scene's caches hold. */
    cachedArea: number;
}

/** The scratch canvases of scenes, so that the groups of one chart share one. Groups outside a scene share another. */
const pools = new WeakMap<object, ScratchPool>();
const DETACHED = {};

function getPool(scene: object | undefined): ScratchPool {
    const key = scene ?? DETACHED;
    let pool = pools.get(key);
    if (pool == null) {
        pool = { users: new Set(), scratch: undefined, cachedArea: 0 };
        pools.set(key, pool);
    }
    return pool;
}

function freeScratch(pool: ScratchPool) {
    const { scratch } = pool;
    if (scratch == null) return;

    releaseSpreadCanvas(scratch.context);
    disposeCanvas(scratch.canvas);
    pool.scratch = undefined;
}

/** The scene's one scratch canvas for masks, shared because render passes run one after another. It only grows. */
function acquireShadowScratch(
    scene: object | undefined,
    user: object,
    width: number,
    height: number
): SpreadCanvas | undefined {
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
        scratch = allocateCanvas(canvasWidth, canvasHeight);
        pool.scratch = scratch;
    }
    return scratch;
}

/** The shadows that a cast of a user kept, kept only once the cast repeats so that an animating layer pays nothing. */
interface ShadowCache {
    /** Everything the cast read, overwritten in place by the next cast as it compares itself with it. */
    readonly signature: (number | string)[];
    cursor: number;
    changed: boolean;
    /** The canvas, which covers only what the shadows reach, and is counted against the pool's budget while it is held. */
    kept: SpreadCanvas | undefined;
    /** Where the top left of the canvas is on the layer, in device pixels. */
    x: number;
    y: number;
    pool: ScratchPool | undefined;
    /** Whether the canvas holds the shadows that the signature describes. */
    valid: boolean;
    /** The pixels the scene's kept shadows held when this cast was refused room, until its signature changes. */
    declinedAt: number | undefined;
}

const caches = new WeakMap<object, ShadowCache[]>();

function freeCanvas(cache: ShadowCache) {
    cache.valid = false;
    const { kept, pool } = cache;
    if (kept == null) return;

    if (pool != null) pool.cachedArea -= kept.canvas.width * kept.canvas.height;
    disposeCanvas(kept.canvas);
    cache.kept = undefined;
    cache.pool = undefined;
}

function freeCache(cache: ShadowCache) {
    freeCanvas(cache);
    cache.declinedAt = undefined;
    cache.signature.length = 0;
}

function getCache(user: object, cast: number): ShadowCache | undefined {
    if (cast >= MAX_CACHED_CASTS) return;

    let userCaches = caches.get(user);
    if (userCaches == null) {
        userCaches = [];
        caches.set(user, userCaches);
    }
    let cache = userCaches[cast];
    if (cache == null) {
        cache = {
            signature: [],
            cursor: 0,
            changed: false,
            kept: undefined,
            x: 0,
            y: 0,
            pool: undefined,
            valid: false,
            declinedAt: undefined,
        };
        userCaches[cast] = cache;
    }
    return cache;
}

function putSignature(cache: ShadowCache, value: number | string) {
    const { signature, cursor } = cache;
    if (signature[cursor] !== value) {
        signature[cursor] = value;
        cache.changed = true;
    }
    cache.cursor = cursor + 1;
}

/** Overwrites the signature with what the cast reads, and returns whether it held that already. */
function matchSignature(
    cache: ShadowCache,
    keys: readonly ShadowKey[],
    renderCtx: RenderContext,
    transform: DOMMatrix,
    width: number,
    height: number
) {
    cache.cursor = 0;
    cache.changed = false;
    putSignature(cache, width);
    putSignature(cache, height);
    putSignature(cache, renderCtx.devicePixelRatio);
    putSignature(cache, renderCtx.direction);
    putSignature(cache, renderCtx.ctx.globalAlpha);
    putSignature(cache, transform.a);
    putSignature(cache, transform.b);
    putSignature(cache, transform.c);
    putSignature(cache, transform.d);
    putSignature(cache, transform.e);
    putSignature(cache, transform.f);
    for (const { shadow, clip, casters } of keys) {
        putSignature(cache, shadow.color);
        putSignature(cache, shadow.xOffset);
        putSignature(cache, shadow.yOffset);
        putSignature(cache, shadow.blur);
        putSignature(cache, shadow.spread ?? 0);
        putSignature(cache, clip?.length ?? -1);
        if (clip != null) {
            for (const corner of clip) putSignature(cache, corner);
        }
        putSignature(cache, casters.length);
        for (const caster of casters) {
            putSignature(cache, caster.serialNumber);
            putSignature(cache, caster.revision);
        }
    }

    if (cache.signature.length !== cache.cursor) {
        cache.signature.length = cache.cursor;
        cache.changed = true;
    }
    return !cache.changed;
}

interface Extent {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

const silhouette: SilhouetteBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

/**
 * The part of the layer that the shadows of the keys can land on, in device pixels, or the whole layer if a caster's
 * silhouette can't be bounded. It is measured as the mask is cleared, so a kept cast holds every pixel a direct one draws.
 */
function getShadowExtent(
    keys: readonly ShadowKey[],
    transform: DOMMatrix,
    devicePixelRatio: number,
    width: number,
    height: number
): Extent {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const { shadow, casters } of keys) {
        const spread = shadow.spread ?? 0;
        const offsetX = shadow.xOffset * devicePixelRatio;
        const offsetY = shadow.yOffset * devicePixelRatio;
        const blurReach = getBlurReach(shadow.blur * devicePixelRatio) + CACHED_EXTENT_MARGIN;
        for (const caster of casters) {
            if (!caster.getShadowSilhouetteBounds(transform, spread, silhouette)) return { x: 0, y: 0, width, height };

            minX = Math.min(minX, silhouette.minX + offsetX - blurReach);
            maxX = Math.max(maxX, silhouette.maxX + offsetX + blurReach);
            minY = Math.min(minY, silhouette.minY + offsetY - blurReach);
            maxY = Math.max(maxY, silhouette.maxY + offsetY + blurReach);
        }
    }
    if (!(isFiniteNumber(minX) && isFiniteNumber(minY) && isFiniteNumber(maxX) && isFiniteNumber(maxY))) {
        return { x: 0, y: 0, width, height };
    }

    const x = Math.min(width - 1, Math.max(0, Math.floor(minX)));
    const y = Math.min(height - 1, Math.max(0, Math.floor(minY)));
    return {
        x,
        y,
        width: Math.max(1, Math.min(width, Math.ceil(maxX)) - x),
        height: Math.max(1, Math.min(height, Math.ceil(maxY)) - y),
    };
}

/** The cache's canvas for an extent of the layer, or undefined if the scene's kept shadows would hold too many pixels. */
function acquireCacheCanvas(cache: ShadowCache, scene: object | undefined, extent: Extent) {
    const { x, y, width, height } = extent;
    if (cache.kept?.canvas.width !== width || cache.kept.canvas.height !== height) {
        freeCanvas(cache);

        const pool = getPool(scene);
        const area = width * height;
        const kept = pool.cachedArea + area > MAX_CACHED_AREA ? undefined : allocateCanvas(width, height);
        if (kept == null) {
            cache.declinedAt = pool.cachedArea;
            return;
        }

        cache.kept = kept;
        cache.pool = pool;
        pool.cachedArea += area;
    }
    cache.declinedAt = undefined;
    cache.x = x;
    cache.y = y;
    return cache.kept;
}

/** Whether the cast was refused room and the scene's kept shadows have not shrunk since, so asking again would fail. */
function isDeclined(cache: ShadowCache, scene: object | undefined) {
    return cache.declinedAt != null && getPool(scene).cachedArea >= cache.declinedAt;
}

/** Whether a cast can keep its shadows: the layer and what the scene's other casts hold leave it room for some. */
function mayKeep(cache: ShadowCache, scene: object | undefined, layerArea: number) {
    return layerArea <= MAX_MASK_AREA && (cache.kept != null || getPool(scene).cachedArea < MAX_CACHED_AREA);
}

/** Frees the shadows kept by the casts of a user past the `used` that it made this frame. */
export function endShadowCasts(user: object, used: number) {
    const userCaches = caches.get(user);
    if (userCaches == null) return;

    for (let i = used; i < userCaches.length; i++) freeCache(userCaches[i]);
}

/** Stops a group using the scene's scratch canvas, freed once no group does, and frees what its casts kept. */
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

    for (const user of pool.users) endShadowCasts(user, 0);
    pool.users.clear();
    freeScratch(pool);
}

function renderPass(
    casters: readonly Node[],
    renderCtx: RenderContext,
    state: 'mask' | 'suppress',
    opaque: boolean = false,
    resolution: { x: number; y: number } = FULL_RESOLUTION
): boolean {
    let rendered = true;
    const previousState = shadowPass.state;
    const previousOpaque = shadowPass.opaque;
    const previousResolution = shadowPass.resolution;
    shadowPass.state = state;
    shadowPass.opaque = opaque;
    shadowPass.resolution = resolution;
    try {
        for (const caster of casters) {
            rendered = caster.isolatedRender(renderCtx) && rendered;
        }
    } finally {
        shadowPass.state = previousState;
        shadowPass.opaque = previousOpaque;
        shadowPass.resolution = previousResolution;
    }
    return rendered;
}

/** Draws the casters as usual, without the shadows that {@link castShadows} cast beneath them. */
export function renderShadowless(casters: readonly Node[], renderCtx: RenderContext) {
    renderPass(casters, renderCtx, 'suppress');
}

/** The strength all casters of a `spread` key cast at (0 if none), or undefined if they differ or one draws another way. */
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
    const reach = getBlurReach(blur, spread * devicePixelRatio);
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

/** Casts a planned key onto `target`, whose top left is `origin` on the layer. Returns whether every caster drew. */
function castPlan(
    plan: KeyPlan,
    scratch: SpreadCanvas,
    target: Ctx,
    transform: DOMMatrix,
    renderCtx: RenderContext,
    originX: number,
    originY: number
): boolean {
    const { ctx } = renderCtx;
    let rendered: boolean;
    const { key, blur, offsetX, offsetY, padLeft, padTop, maskWidth, maskHeight, canvasWidth, canvasHeight } = plan;
    const { scaleX, scaleY, colour, opaque } = plan;
    const { canvas, context } = scratch;

    context.save();
    try {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        const { a, b, c, d, e, f } = transform;
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

        // The casters draw again afterwards, so the mask pass must not count them, or debug them, twice.
        rendered = renderPass(
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
        target.setTransform(
            transform.a,
            transform.b,
            transform.c,
            transform.d,
            transform.e - originX,
            transform.f - originY
        );
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
        target.translate(-originX, -originY);
        target.globalAlpha = 1;
        target.shadowColor = colour;
        target.shadowOffsetX = offsetX + distance;
        target.shadowOffsetY = offsetY;
        target.shadowBlur = blur;
        target.drawImage(canvas, 0, 0, canvasWidth, canvasHeight, -padLeft - distance, -padTop, maskWidth, maskHeight);
    } finally {
        target.restore();
    }
    return rendered;
}

function blitCache(ctx: Ctx, { kept, x, y }: ShadowCache) {
    if (kept == null) return;

    ctx.save();
    try {
        ctx.resetTransform();
        ctx.globalAlpha = 1;
        ctx.drawImage(kept.canvas, x, y);
    } finally {
        ctx.restore();
    }
}

export interface ShadowCast {
    readonly scene: object | undefined;
    /** The group that casts, which holds the scratch canvas and its kept shadows until it releases them. */
    readonly user: object;
    /** The keys whose shadows to cast, in the order of their first caster. */
    readonly keys: readonly ShadowKey[];
    /** Which of the user's casts of this frame this is, to match it with the same cast of the last frame. */
    readonly index: number;
}

/** Casts the shadows of the keys now. Returns false, having drawn nothing, if they can't be cast, so casters cast their own. */
export function castShadows({ scene, user, keys, index }: ShadowCast, renderCtx: RenderContext): boolean {
    const { ctx } = renderCtx;
    const width = Math.ceil(ctx.canvas.width);
    const height = Math.ceil(ctx.canvas.height);
    const transform = ctx.getTransform();

    let cache = getCache(user, index);
    if (cache != null && !mayKeep(cache, scene, width * height)) {
        freeCache(cache);
        cache = undefined;
    }
    const repeated = cache != null && matchSignature(cache, keys, renderCtx, transform, width, height);
    if (cache?.valid === true && repeated && cache.kept != null) {
        blitCache(ctx, cache);
        return true;
    }
    // A cast that has stopped matching holds nothing, so that an animating layer keeps no canvas.
    if (cache != null && !repeated) {
        freeCanvas(cache);
        cache.declinedAt = undefined;
    }

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

    let kept: SpreadCanvas | undefined;
    if (cache != null && repeated && !isDeclined(cache, scene)) {
        const extent = getShadowExtent(keys, transform, renderCtx.devicePixelRatio, width, height);
        kept = acquireCacheCanvas(cache, scene, extent);
    }
    if (cache != null && kept != null) {
        kept.context.clearRect(0, 0, kept.canvas.width, kept.canvas.height);
        let rendered = true;
        for (const plan of plans) {
            rendered = castPlan(plan, scratch, kept.context, transform, renderCtx, cache.x, cache.y) && rendered;
        }
        // A caster that failed to draw is drawn again by the next cast, rather than left out of the shadows for good.
        cache.valid = rendered;
        blitCache(ctx, cache);
    } else {
        for (const plan of plans) castPlan(plan, scratch, ctx, transform, renderCtx, 0, 0);
    }
    return true;
}
