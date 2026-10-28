import { arraysEqual } from '../data/arrays';
import { isFiniteNumber } from '../data/typeGuards';
import type {
    NormalisedDropShadowOptions,
    ResolvedDropShadowOptions,
} from '../options/normalised/normalisedCommonOptions';
import { type SpreadCanvas, allocateCanvas, disposeCanvas, releaseSpreadCanvas } from './canvas/spreadCanvas';
import type { MatrixFrame } from './matrix';
import type { Node, RenderContext } from './node';
import type { ShadowClip, ShadowFrame, ShadowRegion } from './shadowCollector';
import { getShadowColour, scaleColourAlpha } from './shadowColour';
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

export type { ShadowClip, ShadowFrame, ShadowRegion } from './shadowCollector';

export type ShadowCaster = Shape & { __fillShadow: NormalisedDropShadowOptions };

/**
 * How far a cast reaches: `run` ends it where adjacent casters stop sharing shadow and clip, `layer` also at a `zIndex`, and
 * `root` gathers the casters of every group below a shadow root, each with a {@link ShadowFrame}.
 */
export type ShadowScope = 'run' | 'layer' | 'root';

/** The casters that share their shadow options and clip, and so one mask and one blur. */
export interface ShadowKey {
    /** The shadow options of its casters. A glow with no `fill` keeps none: each caster's silhouette has its own colour. */
    readonly shadow: NormalisedDropShadowOptions;
    /** The clip of a local key, in the coordinates of the group. A `root` key has {@link clips} instead. */
    readonly clip: ShadowClip | undefined;
    readonly casters: ShadowCaster[];
    /** The frame of each caster, in the order of {@link casters}, for a `root` key. */
    readonly frames?: ShadowFrame[];
    /** All that clips every caster of a `root` key, in device pixels: the clips of its frames, and of a path. */
    readonly clips?: readonly ShadowRegion[];
}

/** The shadow options that a node casts through a shadow root, which a cutout may, or undefined if it casts none. */
export function getRootShadow(node: Node): NormalisedDropShadowOptions | undefined {
    return node instanceof Shape ? node.getBatchShadow() : undefined;
}

/** The shadow options that a node casts through the engine, or undefined if it casts none. */
export function getBatchedShadow(node: Node): NormalisedDropShadowOptions | undefined {
    // A cutout erases the layer beneath it, and so also what the engine's shadow put there. It casts for itself.
    return node instanceof Shape && node.__drawingMode === 'cutout' ? undefined : getRootShadow(node);
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
    return a.length === b.length && a.every((value, i) => value === b[i]);
}

function sameRegions(a: readonly ShadowRegion[] | undefined, b: readonly ShadowRegion[] | undefined) {
    if (a === b) return true;
    return a != null && b != null && arraysEqual(a, b);
}

function sameLayer(a: Node, b: Node) {
    const aIndex = a.__zIndex;
    const bIndex = b.__zIndex;
    return aIndex === bIndex || compareZIndex(aIndex, bIndex) === 0;
}

function sameShadow(a: NormalisedDropShadowOptions, b: NormalisedDropShadowOptions) {
    return (
        a === b ||
        (a.fill === b.fill &&
            (a.fillOpacity ?? 1) === (b.fillOpacity ?? 1) &&
            a.xOffset === b.xOffset &&
            a.yOffset === b.yOffset &&
            a.blur === b.blur &&
            (a.spread ?? 0) === (b.spread ?? 0))
    );
}

/** Whether `next`, which casts `shadow` to `clip`, joins the casters of `key`. A `root` key is clipped by `clips` instead. */
export function joinsShadowKey(
    key: ShadowKey,
    next: Node,
    shadow: NormalisedDropShadowOptions,
    clip: ShadowClip | undefined,
    scope: ShadowScope,
    clips?: readonly ShadowRegion[]
) {
    if (!sameShadow(key.shadow, shadow)) return false;
    if (scope === 'root') return sameRegions(key.clips, clips);
    return sameClip(key.clip, clip) && (scope !== 'layer' || sameLayer(key.casters[0], next));
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
    height: number,
    unchanged: boolean
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
    if (unchanged && cache.signature.length > cache.cursor) return !cache.changed;

    for (const { shadow, clip, clips, casters, frames } of keys) {
        putSignature(cache, shadow.fill ?? '');
        putSignature(cache, shadow.fillOpacity ?? 1);
        putSignature(cache, shadow.xOffset);
        putSignature(cache, shadow.yOffset);
        putSignature(cache, shadow.blur);
        putSignature(cache, shadow.spread ?? 0);
        putSignature(cache, clip?.length ?? -1);
        if (clip != null) {
            for (const corner of clip) putSignature(cache, corner);
        }
        if (clips != null) {
            putSignature(cache, clips.length);
            for (const region of clips) {
                putSignature(cache, region.length);
                for (const contour of region) {
                    putSignature(cache, contour.length);
                    for (const corner of contour) putSignature(cache, corner);
                }
            }
        }
        putSignature(cache, casters.length);
        let frame: ShadowFrame | undefined;
        for (let i = 0; i < casters.length; i++) {
            const caster = casters[i];
            putSignature(cache, caster.serialNumber);
            putSignature(cache, caster.revision);
            // The casters of a frame follow one another.
            const next = frames?.[i];
            if (next != null && next !== frame) {
                frame = next;
                putSignature(cache, next.alpha);
                for (const element of next.matrix) putSignature(cache, element);
            }
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
    const layer = { x: 0, y: 0, width, height };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const { shadow, casters, frames } of keys) {
        const spread = shadow.spread ?? 0;
        const offsetX = shadow.xOffset * devicePixelRatio;
        const offsetY = shadow.yOffset * devicePixelRatio;
        const blurReach = getBlurReach(shadow.blur * devicePixelRatio) + CACHED_EXTENT_MARGIN;
        // A `root` key has a matrix for each frame, and a local key has the one transform.
        let frame: ShadowFrame | undefined;
        let frameTransform: MatrixFrame = transform;
        for (let i = 0; i < casters.length; i++) {
            const caster = casters[i];
            const next = frames?.[i];
            if (next != null && next !== frame) {
                frame = next;
                const [a, b, c, d, e, f] = next.matrix;
                frameTransform = { a, b, c, d, e, f };
            }
            if (!caster.getShadowSilhouetteBounds(frameTransform, spread, silhouette)) return layer;

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
    tinted: boolean = false,
    resolution: { x: number; y: number } = FULL_RESOLUTION,
    before?: (index: number) => void
): boolean {
    let rendered = true;
    const previousState = shadowPass.state;
    const previousOpaque = shadowPass.opaque;
    const previousTinted = shadowPass.tinted;
    const previousResolution = shadowPass.resolution;
    shadowPass.state = state;
    shadowPass.opaque = opaque;
    shadowPass.tinted = tinted;
    shadowPass.resolution = resolution;
    try {
        for (let i = 0; i < casters.length; i++) {
            before?.(i);
            rendered = casters[i].isolatedRender(renderCtx) && rendered;
        }
    } finally {
        shadowPass.state = previousState;
        shadowPass.opaque = previousOpaque;
        shadowPass.tinted = previousTinted;
        shadowPass.resolution = previousResolution;
    }
    return rendered;
}

/** Draws the casters as usual, without the shadows that {@link castShadows} cast beneath them. */
export function renderShadowless(casters: readonly Node[], renderCtx: RenderContext) {
    renderPass(casters, renderCtx, 'suppress');
}

/** The strength all casters of a key cast at (0 if none), or undefined if they differ or one draws another way. */
function getUniformSpreadStrength({ casters, frames }: ShadowKey): number | undefined {
    let uniform = 0;
    for (let i = 0; i < casters.length; i++) {
        const base = casters[i].getSpreadMaskStrength();
        if (base == null) return;
        const strength = base * (frames?.[i].alpha ?? 1);
        if (strength <= 0) continue;
        if (uniform === 0) {
            uniform = strength;
        } else if (Math.abs(strength - uniform) > UNIFORM_STRENGTH_TOLERANCE) {
            return;
        }
    }
    return uniform;
}

/** How a key casts its shadow: where its mask goes, and how it is blurred. */
interface MaskPlan {
    readonly key: ShadowKey;
    readonly blur: number;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly padLeft: number;
    readonly padTop: number;
    readonly maskWidth: number;
    readonly maskHeight: number;
    readonly colour: string;
    readonly opaque: boolean;
    /** Whether the mask holds silhouettes in the colours that they cast in, to blur once, rather than in one colour. */
    readonly tinted: boolean;
    /** The alpha that a tinted mask is cast at: the `fillOpacity`, and the strength of casters that cast one together. */
    readonly alpha: number;
}

/** A {@link MaskPlan} with the canvas that its mask is drawn on, which is the mask at the resolution of the cast. */
interface KeyPlan extends MaskPlan {
    readonly canvasWidth: number;
    readonly canvasHeight: number;
    readonly scaleX: number;
    readonly scaleY: number;
}

/** Plans a key, or returns 'empty' if its casters all cast nothing, or 'unusable' if the layer or the shadow is. */
function planKey(
    key: ShadowKey,
    renderCtx: RenderContext,
    width: number,
    height: number
): MaskPlan | 'empty' | 'unusable' {
    const { ctx, devicePixelRatio } = renderCtx;
    const { shadow } = key;

    // A root key merges the casters of many series, whose overlaps would otherwise add up, with or without a spread.
    const spread = shadow.spread ?? 0;
    const strength = spread > 0 || key.frames != null ? getUniformSpreadStrength(key) : undefined;
    // A key whose casters all cast nothing, such as one fading in from zero opacity, has no mask or blur to draw.
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

    const maskWidth = width + padLeft + padRight;
    const maskHeight = height + padTop + padBottom;

    // Casters at one translucent strength are drawn solid, with the shadow cast at that strength. A `root` key's frames hold the layer alpha.
    const layerAlpha = key.frames == null ? ctx.globalAlpha : 1;
    const tinted = shadow.fill == null;
    let colour = tinted ? '' : getShadowColour(shadow as ResolvedDropShadowOptions);
    let alpha = tinted ? (shadow.fillOpacity ?? 1) : 1;
    let opaque = false;
    if (strength != null && strength * layerAlpha < 1) {
        const scaled = tinted ? colour : scaleColourAlpha(colour, strength * layerAlpha);
        if (scaled != null) {
            colour = scaled;
            alpha *= strength * layerAlpha;
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
        colour,
        opaque,
        tinted,
        alpha,
    };
}

/** Clips `target` to what is inside every region, which are in device pixels. */
function clipToRegions(target: RenderContext['ctx'], regions: readonly ShadowRegion[]) {
    for (const region of regions) {
        target.beginPath();
        for (const contour of region) {
            for (let i = 0; i < contour.length; i += 2) {
                if (i === 0) {
                    target.moveTo(contour[i], contour[i + 1]);
                } else {
                    target.lineTo(contour[i], contour[i + 1]);
                }
            }
            target.closePath();
        }
        target.clip('evenodd');
    }
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
    const { scaleX, scaleY, colour, opaque, tinted, alpha } = plan;
    const { canvas, context } = scratch;

    context.save();
    try {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        const place = ([a, b, c, d, e, f]: readonly number[]) =>
            context.setTransform(
                a * scaleX,
                b * scaleY,
                c * scaleX,
                d * scaleY,
                (e + padLeft) * scaleX,
                (f + padTop) * scaleY
            );
        const { frames } = key;
        let placed: ShadowFrame | undefined;
        const before =
            frames == null
                ? undefined
                : (i: number) => {
                      const frame = frames[i];
                      if (frame === placed) return;
                      placed = frame;
                      place(frame.matrix);
                      // A group that is fully transparent casts nothing, whatever the key draws solid.
                      context.globalAlpha = opaque && frame.alpha > 0 ? 1 : frame.alpha;
                  };
        if (frames == null) {
            const { a, b, c, d, e, f } = transform;
            place([a, b, c, d, e, f]);
            context.globalAlpha = opaque ? 1 : ctx.globalAlpha;
        }
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
            tinted,
            { x: scaleX, y: scaleY },
            before
        );
    } finally {
        context.restore();
    }

    // The mask is drawn this far to the left, so that none of it is on the layer. The shadow offset brings its shadow back.
    const distance = maskWidth;
    target.save();
    try {
        // A path clips its shadow as well as its silhouette, so the shadow is clipped to what the path was drawn into.
        const { clip, clips } = key;
        if (clips != null) {
            target.setTransform(1, 0, 0, 1, -originX, -originY);
            clipToRegions(target, clips);
        } else if (clip != null) {
            target.setTransform(
                transform.a,
                transform.b,
                transform.c,
                transform.d,
                transform.e - originX,
                transform.f - originY
            );
            target.beginPath();
            target.moveTo(clip[0], clip[1]);
            for (let i = 2; i < clip.length; i += 2) target.lineTo(clip[i], clip[i + 1]);
            target.closePath();
            target.clip();
        }
        target.resetTransform();
        target.translate(-originX, -originY);
        if (tinted) {
            // The mask holds each silhouette in its own colour, which a shadow can't take, so the canvas blurs the mask itself.
            target.globalAlpha = alpha;
            target.filter = blur > 0 ? `blur(${blur / 2}px)` : 'none';
            target.drawImage(
                canvas,
                0,
                0,
                canvasWidth,
                canvasHeight,
                offsetX - padLeft,
                offsetY - padTop,
                maskWidth,
                maskHeight
            );
        } else {
            target.globalAlpha = 1;
            target.shadowColor = colour;
            target.shadowOffsetX = offsetX + distance;
            target.shadowOffsetY = offsetY;
            target.shadowBlur = blur;
            target.drawImage(
                canvas,
                0,
                0,
                canvasWidth,
                canvasHeight,
                -padLeft - distance,
                -padTop,
                maskWidth,
                maskHeight
            );
        }
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
    /** Whether the keys are those of the last cast of this index, unchanged, so the cast need not read every caster. */
    readonly unchanged?: boolean;
}

/** Casts the shadows of the keys now. Returns false, having drawn nothing, if they can't be cast, so casters cast their own. */
export function castShadows({ scene, user, keys, index, unchanged }: ShadowCast, renderCtx: RenderContext): boolean {
    const { ctx } = renderCtx;
    const width = Math.ceil(ctx.canvas.width);
    const height = Math.ceil(ctx.canvas.height);
    const transform = ctx.getTransform();

    let cache = getCache(user, index);
    if (cache != null && !mayKeep(cache, scene, width * height)) {
        freeCache(cache);
        cache = undefined;
    }
    const repeated =
        cache != null && matchSignature(cache, keys, renderCtx, transform, width, height, unchanged === true);
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
    const masks: MaskPlan[] = [];
    let maskWidth = 0;
    let maskHeight = 0;
    for (const key of keys) {
        const plan = planKey(key, renderCtx, width, height);
        if (plan === 'unusable') return false;
        if (plan === 'empty') continue;

        masks.push(plan);
        maskWidth = Math.max(maskWidth, plan.maskWidth);
        maskHeight = Math.max(maskHeight, plan.maskHeight);
    }
    if (masks.length === 0) return true;

    // The masks share a scratch canvas as wide as the widest and as tall as the tallest, so they share a resolution that fits it.
    const resolution = fitMask(maskWidth, maskHeight);
    const scratchWidth = Math.max(1, Math.floor(maskWidth * resolution));
    const scratchHeight = Math.max(1, Math.floor(maskHeight * resolution));
    const plans = masks.map((mask): KeyPlan => {
        const canvasWidth = Math.max(1, Math.floor(mask.maskWidth * resolution));
        const canvasHeight = Math.max(1, Math.floor(mask.maskHeight * resolution));
        return {
            ...mask,
            canvasWidth,
            canvasHeight,
            scaleX: canvasWidth / mask.maskWidth,
            scaleY: canvasHeight / mask.maskHeight,
        };
    });
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
