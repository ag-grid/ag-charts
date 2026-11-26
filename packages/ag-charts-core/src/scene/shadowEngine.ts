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
import { type ShadowSlot, dilatesShadow, getShadowSpread, shadowPass } from './shadowPass';
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

/** How many frames in a row that need at most a quarter of a canvas's pixels it keeps its size for. A larger frame restarts the count. */
export const SHADOW_SHRINK_AFTER = 30;

/** How many casts of one user keep their shadows between redraws. Further casts of it blur every time. */
const MAX_CACHED_CASTS = 4;

/**
 * The most pixels that the kept shadows of a scene hold between them: about 32 MB (8.39M), which holds the shadows of a 1600 x 900
 * chart at 2x. The kept parts of overlay glows are given the same room, beside it.
 */
const MAX_CACHED_AREA = MAX_MASK_AREA / 2;

/**
 * The most pixels that the kept parts of overlay glows hold between them: about 32 MB, or two parts of a 2800 x 1200 layer (3.4M each).
 * They are counted apart from the kept shadows, as a hover keeps the parts that it does not change, beside the cast it blits.
 */
const MAX_CACHED_PART_AREA = MAX_MASK_AREA / 2;

/** The pixels that a kept shadow may reach past what the blur's Gaussian covers, for the rounding of its edge. */
const CACHED_EXTENT_MARGIN = 2;
/** The most casters a key has for its blur to be clipped to their extent, which is measured caster by caster. */
const MAX_BOUNDED_CASTERS = 16;

/** The resolution of a mask that was not scaled down. */
const FULL_RESOLUTION = Object.freeze({ x: 1, y: 1 });

type Ctx = RenderContext['ctx'];

export type { ShadowClip, ShadowFrame, ShadowRegion } from './shadowCollector';

export type ShadowCaster = Shape;

/**
 * How far a cast reaches: `run` ends it where adjacent casters stop sharing shadow and clip, `layer` also at a `zIndex`, and
 * `root` gathers the casters of every group below a shadow root, each with a {@link ShadowFrame}.
 */
export type ShadowScope = 'run' | 'layer' | 'root';

/** What every key has: the casters that share their shadow options and clip, and so one mask and one blur. */
interface ShadowKeyBase {
    /** Which of its casters' two slots the key casts. A caster that casts both is in a key of each. */
    readonly slot: ShadowSlot;
    /** The shadow options of its casters. A glow with no `fill` keeps none: each caster's silhouette has its own colour. */
    readonly shadow: NormalisedDropShadowOptions;
    readonly casters: ShadowCaster[];
    /** For a key that a cast split from another by strength, see {@link splitByStrength}: that key, and every key split from it. */
    readonly split?: { readonly from: ShadowKey; readonly parts: readonly ShadowKey[] };
    /** The series of the casters of a glow key whose glows are cut by its own shapes, see {@link ownCuts}. */
    readonly owner?: object;
    /** The keys of the shapes, such as labels and error bars, that cut their footprint out of this glow alone. */
    ownCuts?: readonly ShadowKey[];
    /** Whether the casters are the highlight copies of hovered items, see {@link cutsSeeThrough}. */
    readonly hovered?: boolean;
}

/** The key of a group's own casters, which are clipped by `clip`, in the coordinates of the group. */
export interface LocalShadowKey extends ShadowKeyBase {
    readonly clip: ShadowClip | undefined;
    readonly frames?: undefined;
    readonly clips?: undefined;
}

/** The key of the casters that a shadow root gathers from many groups, each in a {@link ShadowFrame}. */
export interface RootShadowKey extends ShadowKeyBase {
    readonly clip?: undefined;
    /** The frame of each caster, in the order of {@link casters}. */
    readonly frames: ShadowFrame[];
    /** All that clips every caster, in device pixels: the clips of its frames, and of a path. */
    readonly clips: readonly ShadowRegion[];
}

export type ShadowKey = LocalShadowKey | RootShadowKey;

/** Whether a hovered glow key with no `gap` has a see-through caster, whose footprint is cut out of the glow like at rest. */
function cutsSeeThrough({ hovered, slot, shadow, casters }: ShadowKey): boolean {
    if (hovered !== true || slot !== 'glow' || shadow.gap != null) return false;

    for (let i = 0; i < casters.length; i++) {
        if (casters[i].paintsSeeThrough()) return true;
    }
    return false;
}

/** The options that a node casts in a slot through a shadow root, which a cutout may, or undefined if it casts none. */
export function getRootShadow(node: Node, slot: ShadowSlot = 'shadow'): NormalisedDropShadowOptions | undefined {
    return node instanceof Shape ? node.getBatchShadow(slot) : undefined;
}

/** The glow of an item that casts none but is cut out of the glow overlay, as the in-place copy of a hovered item is. */
export const CUT_ONLY_GLOW: NormalisedDropShadowOptions = {
    enabled: true,
    xOffset: 0,
    yOffset: 0,
    blur: 0,
    glow: true,
    cutOnly: true,
};

/** The marker of a shape that cuts its footprint out of the glows of its own series alone, see {@link ShadowKey.ownCuts}. */
export const OWN_CUT_GLOW: NormalisedDropShadowOptions = { ...CUT_ONLY_GLOW, ownCut: true };

/** Whether a node cuts its footprint out of the glow overlay of a shadow root, see {@link CUT_ONLY_GLOW}. */
export function castsCutOnly(node: Node): boolean {
    return node instanceof Shape && node.cutsGlowOverlay();
}

/** The options that a node casts in a slot through the engine, or undefined if it casts none. */
export function getBatchedShadow(node: Node, slot: ShadowSlot = 'shadow'): NormalisedDropShadowOptions | undefined {
    // A cutout erases the layer beneath it, and so also what the engine's shadow or glow put there. It casts both for itself.
    return node instanceof Shape && node.__drawingMode === 'cutout' ? undefined : getRootShadow(node, slot);
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

/** How the footprint of an item is erased from a glow. */
const ERASE: GlobalCompositeOperation = 'destination-out';

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

/** Whether `next` is in the layer of `first`, which is any layer unless the shadows are cast by layer. */
export function inLayerOf(first: Node, next: Node, scope: ShadowScope): boolean {
    return scope !== 'layer' || sameLayer(first, next);
}

function sameShadow(a: NormalisedDropShadowOptions, b: NormalisedDropShadowOptions) {
    return (
        a === b ||
        (a.fill === b.fill &&
            (a.fillOpacity ?? 1) === (b.fillOpacity ?? 1) &&
            a.xOffset === b.xOffset &&
            a.yOffset === b.yOffset &&
            a.blur === b.blur &&
            (a.spread ?? 0) === (b.spread ?? 0) &&
            // An unset gap casts like a shadow, and a gap of 0 cuts the footprint out, so the two are not the same.
            a.gap === b.gap &&
            a.overlay === b.overlay &&
            a.selfCut === b.selfCut)
    );
}

/** Names the shadow options that {@link sameShadow} compares, so that keys of one shadow are found without comparing each. */
export function shadowKeyId({
    fill,
    fillOpacity,
    xOffset,
    yOffset,
    blur,
    spread,
    gap,
    overlay,
    selfCut,
}: NormalisedDropShadowOptions): string {
    return `${fill}|${fillOpacity ?? 1}|${xOffset}|${yOffset}|${blur}|${spread ?? 0}|${gap}|${overlay}|${selfCut}`;
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
    /** The canvas that a glow with a `gap` is blurred onto and cut out of, once a cast needs it. */
    gapCanvas: SpreadCanvas | undefined;
    /** The canvas that the glow of an overlay key with a `gap` of its own is cut on, before it merges with the others. */
    cutCanvas: SpreadCanvas | undefined;
    /** The canvas that a glow part is blurred onto when none is kept for it. */
    partCanvas: SpreadCanvas | undefined;
    /** The pixels of the canvases that the scene's caches hold. */
    cachedArea: number;
    /** The pixels of the canvases that the scene's kept glow parts hold, see {@link GlowPart}. */
    partArea: number;
    /** The signatures that the plans of a glow cast sign into, by index, reused by the next cast. Freed with the scene's scratch. */
    partTargets: SignatureTarget[];
    /** The frames of the scene that have started, which the pool counts shrinking in. A pool outside a scene has none. */
    frame: number;
    uses: Record<PoolCanvas, CanvasUse>;
}

/** What the casts of recent frames asked of a canvas. */
interface CanvasUse {
    /** The frame that the peak is of. */
    frame: number;
    /** The widest and tallest cast of that frame. */
    peakWidth: number;
    peakHeight: number;
    /** The frames in a row that peaked at no more than a quarter of the canvas, and the widest and tallest of them. */
    smallFrames: number;
    runWidth: number;
    runHeight: number;
}

type PoolCanvas = 'scratch' | 'gapCanvas' | 'cutCanvas' | 'partCanvas';

/** The scratch canvases of scenes, so that the groups of one chart share one. Groups outside a scene share another. */
const pools = new WeakMap<object, ScratchPool>();
const DETACHED = {};

function getPool(scene: object | undefined): ScratchPool {
    const key = scene ?? DETACHED;
    let pool = pools.get(key);
    if (pool == null) {
        pool = {
            users: new Set(),
            scratch: undefined,
            gapCanvas: undefined,
            cutCanvas: undefined,
            partCanvas: undefined,
            cachedArea: 0,
            partArea: 0,
            partTargets: [],
            frame: 0,
            uses: { scratch: newUse(), gapCanvas: newUse(), cutCanvas: newUse(), partCanvas: newUse() },
        };
        pools.set(key, pool);
    }
    return pool;
}

function freeScratch(pool: ScratchPool) {
    const { scratch, gapCanvas, cutCanvas, partCanvas } = pool;
    pool.uses = { scratch: newUse(), gapCanvas: newUse(), cutCanvas: newUse(), partCanvas: newUse() };
    pool.partTargets = [];
    if (gapCanvas != null) {
        disposeCanvas(gapCanvas.canvas);
        pool.gapCanvas = undefined;
    }
    if (cutCanvas != null) {
        disposeCanvas(cutCanvas.canvas);
        pool.cutCanvas = undefined;
    }
    if (partCanvas != null) {
        disposeCanvas(partCanvas.canvas);
        pool.partCanvas = undefined;
    }
    if (scratch == null) return;

    releaseSpreadCanvas(scratch.context);
    disposeCanvas(scratch.canvas);
    pool.scratch = undefined;
}

/** The scene's canvas that a glow's `gap` is cut out of, which holds one key's glow at a time. */
function acquireGapCanvas(scene: object | undefined, width: number, height: number): SpreadCanvas | undefined {
    return acquireGrowingCanvas(getPool(scene), 'gapCanvas', width, height);
}

/** The scene's canvas that an overlay key's glow is cut on by its own `gap`, before it merges with the rest. */
function acquireOwnCutCanvas(scene: object | undefined, width: number, height: number): SpreadCanvas | undefined {
    return acquireGrowingCanvas(getPool(scene), 'cutCanvas', width, height);
}

function acquirePartCanvas(scene: object | undefined, width: number, height: number): SpreadCanvas | undefined {
    return acquireGrowingCanvas(getPool(scene), 'partCanvas', width, height);
}

function newUse(): CanvasUse {
    return { frame: 0, peakWidth: 0, peakHeight: 0, smallFrames: 0, runWidth: 0, runHeight: 0 };
}

/** Adds a request to the peak of its frame, including the one that allocated or grew the canvas. */
function notePeak(use: CanvasUse, frame: number, width: number, height: number) {
    if (use.frame !== frame) {
        use.frame = frame;
        use.peakWidth = use.peakHeight = 0;
    }
    use.peakWidth = Math.max(use.peakWidth, width);
    use.peakHeight = Math.max(use.peakHeight, height);
}

/** Starts a frame of a scene, so that its canvases shrink for what its frames ask of them, not for how many casts they make. */
export function startShadowFrame(scene: object) {
    const pool = pools.get(scene);
    if (pool != null) pool.frame++;
}

/** The size to reallocate a canvas at for a cast, or undefined to keep it. */
function resizeFor(
    pool: ScratchPool,
    field: PoolCanvas,
    canvas: OffscreenCanvas | undefined,
    width: number,
    height: number
): { width: number; height: number } | undefined {
    const use = pool.uses[field];
    if (canvas == null) {
        notePeak(use, pool.frame, width, height);
        return { width, height };
    }
    if (canvas.width < width || canvas.height < height) {
        use.smallFrames = 0;
        use.runWidth = use.runHeight = 0;
        notePeak(use, pool.frame, width, height);
        const canvasWidth = Math.max(width, canvas.width);
        const canvasHeight = Math.max(height, canvas.height);
        return canvasWidth * canvasHeight > MAX_MASK_AREA
            ? { width, height }
            : { width: canvasWidth, height: canvasHeight };
    }

    let size: { width: number; height: number } | undefined;
    if (use.frame !== pool.frame) {
        if (use.peakWidth * use.peakHeight * 4 <= canvas.width * canvas.height) {
            use.smallFrames++;
            use.runWidth = Math.max(use.runWidth, use.peakWidth);
            use.runHeight = Math.max(use.runHeight, use.peakHeight);
        } else {
            use.smallFrames = 0;
            use.runWidth = use.runHeight = 0;
        }

        if (use.smallFrames >= SHADOW_SHRINK_AFTER) {
            size = { width: Math.max(use.runWidth, width), height: Math.max(use.runHeight, height) };
            use.smallFrames = 0;
            use.runWidth = use.runHeight = 0;
            if (size.width * size.height * 4 > canvas.width * canvas.height) size = undefined;
        }
    }
    notePeak(use, pool.frame, width, height);
    return size;
}

function acquireGrowingCanvas(
    pool: ScratchPool,
    field: 'gapCanvas' | 'cutCanvas' | 'partCanvas',
    width: number,
    height: number
): SpreadCanvas | undefined {
    let canvas = pool[field];
    const size = resizeFor(pool, field, canvas?.canvas, width, height);
    if (size != null) {
        if (canvas != null) disposeCanvas(canvas.canvas);
        canvas = allocateCanvas(size.width, size.height);
        pool[field] = canvas;
    }
    return canvas;
}

/** The scene's one scratch canvas for masks, shared because render passes run one after another. */
function acquireShadowScratch(
    scene: object | undefined,
    user: object,
    width: number,
    height: number
): SpreadCanvas | undefined {
    const pool = getPool(scene);
    pool.users.add(user);

    let { scratch } = pool;
    const size = resizeFor(pool, 'scratch', scratch?.canvas, width, height);
    if (size != null) {
        const grows = scratch == null || scratch.canvas.width < width || scratch.canvas.height < height;
        if (grows) {
            // Growing replaces every canvas of the pool. Shrinking leaves the others, which settle their own frames.
            // The scratch keeps the peak of this frame, which this request is part of, or the frame could count as small.
            const { scratch: use } = pool.uses;
            freeScratch(pool);
            pool.uses.scratch = use;
        } else if (scratch != null) {
            releaseSpreadCanvas(scratch.context);
            disposeCanvas(scratch.canvas);
        }
        scratch = allocateCanvas(size.width, size.height);
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
    /** The glows of the parts of an overlay's keys that the cast kept, which outlast the cast's signature changing. */
    readonly parts: GlowPart[];
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
    freeKept(cache);
    freeParts(cache.parts, 0);
}

/** Frees what a cast of the cache holds but its parts, which a cast too large to keep still has. */
function freeKept(cache: ShadowCache) {
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
            parts: [],
        };
        userCaches[cast] = cache;
    }
    return cache;
}

/** What {@link putSignature} writes to: the signature of a cast, or of a part of one. */
interface SignatureTarget {
    signature: (number | string)[];
    cursor: number;
    changed: boolean;
}

function putSignature(cache: SignatureTarget, value: number | string) {
    const { signature, cursor } = cache;
    if (signature[cursor] !== value) {
        signature[cursor] = value;
        cache.changed = true;
    }
    cache.cursor = cursor + 1;
}

/** Writes what a cast of the key reads of it: its shadow and clips, and each caster's revision and frame. */
function signKey(cache: SignatureTarget, { slot, shadow, clip, clips, casters, frames, hovered }: ShadowKey) {
    putSignature(cache, slot);
    putSignature(cache, shadow.fill ?? '');
    putSignature(cache, shadow.fillOpacity ?? 1);
    putSignature(cache, shadow.xOffset);
    putSignature(cache, shadow.yOffset);
    putSignature(cache, shadow.blur);
    putSignature(cache, shadow.spread ?? 0);
    putSignature(cache, shadow.gap ?? -1);
    putSignature(cache, shadow.selfCut === true ? 1 : 0);
    putSignature(cache, hovered === true ? 1 : 0);
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

    for (const key of keys) signKey(cache, key);

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
 * Writes into `out` the union of the silhouettes that the casters of a key cast shadows from, in device pixels on the layer,
 * before the shadow's offset and blur. Returns false if a caster's silhouette can't be bounded.
 */
function measureSilhouettes(key: ShadowKey, transform: DOMMatrix, out: SilhouetteBounds): boolean {
    const { slot, shadow, casters, frames } = key;
    const spread = getShadowSpread(shadow);
    out.minX = out.minY = Infinity;
    out.maxX = out.maxY = -Infinity;
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
        if (!caster.getShadowSilhouetteBounds(frameTransform, spread, silhouette, slot)) return false;

        out.minX = Math.min(out.minX, silhouette.minX);
        out.maxX = Math.max(out.maxX, silhouette.maxX);
        out.minY = Math.min(out.minY, silhouette.minY);
        out.maxY = Math.max(out.maxY, silhouette.maxY);
    }
    return true;
}

/** The silhouettes of the keys that a cast has measured, or false for a key whose silhouettes can't be bounded. */
type MeasuredKeys = Map<ShadowKey, SilhouetteBounds | false>;

/** The silhouettes of a key, measured once for a cast however many of its parts use them. Undefined if they can't be bounded. */
function getSilhouettes(key: ShadowKey, transform: DOMMatrix, measured: MeasuredKeys): SilhouetteBounds | undefined {
    let bounds = measured.get(key);
    if (bounds == null) {
        const out = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        bounds = measureSilhouettes(key, transform, out) && out;
        measured.set(key, bounds);
    }
    return bounds === false ? undefined : bounds;
}

/**
 * The part of the layer that the shadows of the keys can land on, in device pixels, or the whole layer if a caster's
 * silhouette can't be bounded. It is measured as the mask is cleared, so a kept cast holds every pixel a direct one draws.
 * If `keyExtents` is given, each key with a `gap` has its own extent set on it, so that its casters are not measured again.
 */
function getShadowExtent(
    keys: readonly ShadowKey[],
    transform: DOMMatrix,
    devicePixelRatio: number,
    width: number,
    height: number,
    measured: MeasuredKeys,
    keyExtents?: Map<ShadowKey, Extent>
): Extent {
    const layer = { x: 0, y: 0, width, height };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const key of keys) {
        const { shadow } = key;
        const offsetX = shadow.xOffset * devicePixelRatio;
        const offsetY = shadow.yOffset * devicePixelRatio;
        const blurReach = getBlurReach(shadow.blur * devicePixelRatio) + CACHED_EXTENT_MARGIN;
        const measuresKey = keyExtents != null && shadow.gap != null;
        const keySilhouettes = getSilhouettes(key, transform, measured);
        if (keySilhouettes == null) {
            // The extent of the keys is the layer, so a key with a gap is cut on the layer too.
            if (keyExtents != null) {
                for (const other of keys) if (other.shadow.gap != null) keyExtents.set(other, layer);
            }
            return layer;
        }

        const keyMinX = keySilhouettes.minX + offsetX - blurReach;
        const keyMaxX = keySilhouettes.maxX + offsetX + blurReach;
        const keyMinY = keySilhouettes.minY + offsetY - blurReach;
        const keyMaxY = keySilhouettes.maxY + offsetY + blurReach;
        if (measuresKey) {
            keyExtents.set(key, clampExtent(keyMinX, keyMinY, keyMaxX, keyMaxY, width, height));
        }
        minX = Math.min(minX, keyMinX);
        maxX = Math.max(maxX, keyMaxX);
        minY = Math.min(minY, keyMinY);
        maxY = Math.max(maxY, keyMaxY);
    }
    return clampExtent(minX, minY, maxX, maxY, width, height);
}

function clampExtent(minX: number, minY: number, maxX: number, maxY: number, width: number, height: number): Extent {
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
    slot: ShadowSlot = 'shadow',
    opaque: boolean = false,
    tinted: boolean = false,
    resolution: { x: number; y: number } = FULL_RESOLUTION,
    before?: (index: number) => void,
    erase?: number,
    erasePainted: boolean = false,
    eraseOp: GlobalCompositeOperation = ERASE,
    eraseSeeThroughOnly: boolean = false
): boolean {
    let rendered = true;
    const previousErase = shadowPass.erase;
    const previousErasePainted = shadowPass.erasePainted;
    const previousEraseSeeThroughOnly = shadowPass.eraseSeeThroughOnly;
    const previousEraseOp = shadowPass.eraseOp;
    const previousState = shadowPass.state;
    const previousSlot = shadowPass.slot;
    const previousOpaque = shadowPass.opaque;
    const previousTinted = shadowPass.tinted;
    const previousResolution = shadowPass.resolution;
    shadowPass.state = state;
    shadowPass.slot = slot;
    shadowPass.opaque = opaque;
    shadowPass.tinted = tinted;
    shadowPass.resolution = resolution;
    shadowPass.erase = erase;
    shadowPass.erasePainted = erasePainted;
    shadowPass.eraseSeeThroughOnly = eraseSeeThroughOnly;
    shadowPass.eraseOp = eraseOp;
    try {
        for (let i = 0; i < casters.length; i++) {
            before?.(i);
            rendered = casters[i].isolatedRender(renderCtx) && rendered;
        }
    } finally {
        shadowPass.state = previousState;
        shadowPass.slot = previousSlot;
        shadowPass.opaque = previousOpaque;
        shadowPass.tinted = previousTinted;
        shadowPass.resolution = previousResolution;
        shadowPass.erase = previousErase;
        shadowPass.erasePainted = previousErasePainted;
        shadowPass.eraseSeeThroughOnly = previousEraseSeeThroughOnly;
        shadowPass.eraseOp = previousEraseOp;
    }
    return rendered;
}

/** Draws the casters as usual, without the shadows that {@link castShadows} cast beneath them. */
export function renderShadowless(casters: readonly Node[], renderCtx: RenderContext) {
    renderPass(casters, renderCtx, 'suppress');
}

/** The strength all casters of a key cast at (0 if none), or undefined if they differ or one draws another way. */
function getUniformSpreadStrength({ slot, casters, frames }: ShadowKey): number | undefined {
    let uniform = 0;
    for (let i = 0; i < casters.length; i++) {
        const base = casters[i].getSpreadMaskStrength(slot);
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

/** The most keys that {@link splitByStrength} makes of one: past that, a key keeps its casters together, at no one strength. */
const MAX_STRENGTH_SPLIT = 4;
/** The fewest casters that {@link splitByStrength} splits a key of: a mask at no one strength costs a canvas draw per caster. */
const MIN_STRENGTH_SPLIT_CASTERS = 512;

interface StrengthPart {
    readonly key: ShadowKey;
    /** The strength all casters of the key cast at, or undefined if they differ or one draws another way. */
    readonly strength: number | undefined;
}

/** Splits a key of an overlay into a key per strength, as a key at no one strength draws each silhouette on a canvas of its own. */
function splitByStrength(key: ShadowKey): StrengthPart[] {
    const whole = getUniformSpreadStrength(key);
    const { slot, casters, frames } = key;
    if (whole !== undefined || casters.length < MIN_STRENGTH_SPLIT_CASTERS) return [{ key, strength: whole }];

    const strengths: Array<number | undefined> = [];
    const members: number[][] = [];
    // Casters that cast nothing have no mask to draw, so they go with the first part, which keeps their footprints in a cut.
    const nothing: number[] = [];
    for (let i = 0; i < casters.length; i++) {
        const base = casters[i].getSpreadMaskStrength(slot);
        const strength = base == null ? undefined : base * (frames?.[i].alpha ?? 1);
        if (strength != null && strength <= 0) {
            nothing.push(i);
            continue;
        }

        let part = -1;
        for (let p = 0; p < strengths.length; p++) {
            const s = strengths[p];
            if (strength == null || s == null ? s === strength : Math.abs(s - strength) <= UNIFORM_STRENGTH_TOLERANCE) {
                part = p;
                break;
            }
        }
        if (part < 0) {
            if (strengths.length === MAX_STRENGTH_SPLIT) return [{ key, strength: undefined }];

            part = strengths.length;
            strengths.push(strength);
            members.push([]);
        }
        members[part].push(i);
    }
    if (members.length < 2) return [{ key, strength: undefined }];

    for (const i of nothing) members[0].push(i);
    const parts: ShadowKey[] = [];
    const split = { from: key, parts };
    for (const indices of members) {
        indices.sort((a, b) => a - b);
        const partCasters = indices.map((i) => casters[i]);
        parts.push(
            frames == null
                ? { ...key, casters: partCasters, split }
                : { ...key, casters: partCasters, frames: indices.map((i) => frames[i]), split }
        );
    }
    return parts.map((part, i) => ({ key: part, strength: strengths[i] }));
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
    /**
     * OPTIMIZATION: the part of the canvas that the key's silhouettes can be drawn on, at the resolution of the mask. Only it is
     * cleared and blurred, so the rest of the canvas holds the masks of earlier keys and is never read. Undefined for the whole canvas.
     */
    readonly extent: Extent | undefined;
    /** The glow part that holds the plan's glow, once the cast has matched its plans with the parts held. */
    part?: GlowPart;
    /** Whether the glow, which has no `gap`, is cut by the footprint of its see-through casters, see {@link cutsSeeThrough}. */
    readonly cutsSeeThrough: boolean;
}

/**
 * The part of a mask, in its pixels, that the silhouettes of the key's casters can be drawn on, or undefined if that is all of it
 * or they can't be bounded. They are a superset for the parts that a key was split into.
 */
function getMaskExtent(plan: MaskPlan, transform: DOMMatrix, measured: MeasuredKeys): Extent | undefined {
    // A shadow offset by part of a pixel is rounded by where its source rect is, so a part of the mask would not blur like the whole.
    if (!(Number.isInteger(plan.offsetX) && Number.isInteger(plan.offsetY))) return;

    const silhouettes = getSilhouettes(sourceOf(plan.key), transform, measured);
    if (silhouettes == null) return;

    const { minX, minY, maxX, maxY } = silhouettes;
    if (!(isFiniteNumber(minX) && isFiniteNumber(minY) && isFiniteNumber(maxX) && isFiniteNumber(maxY))) return;

    const { padLeft, padTop, maskWidth, maskHeight } = plan;
    // Casters that are off the mask draw nothing on it, which a mask of one pixel is as blank as.
    const x = Math.min(maskWidth - 1, Math.max(0, Math.floor(minX - CACHED_EXTENT_MARGIN + padLeft)));
    const y = Math.min(maskHeight - 1, Math.max(0, Math.floor(minY - CACHED_EXTENT_MARGIN + padTop)));
    const right = Math.min(maskWidth, Math.max(x + 1, Math.ceil(maxX + CACHED_EXTENT_MARGIN + padLeft)));
    const bottom = Math.min(maskHeight, Math.max(y + 1, Math.ceil(maxY + CACHED_EXTENT_MARGIN + padTop)));
    if (right - x === maskWidth && bottom - y === maskHeight) return;

    return { x, y, width: right - x, height: bottom - y };
}

/** Plans a key, or returns 'empty' if its casters all cast nothing, or 'unusable' if the layer or the shadow is. */
function planKey(
    key: ShadowKey,
    renderCtx: RenderContext,
    width: number,
    height: number,
    known?: StrengthPart
): MaskPlan | 'empty' | 'unusable' {
    const { ctx, devicePixelRatio } = renderCtx;
    const { shadow } = key;

    // A root key merges the casters of many series, whose overlaps would otherwise add up, with or without a spread.
    const spread = getShadowSpread(shadow);
    let strength: number | undefined;
    if (known != null) strength = known.strength;
    else if (dilatesShadow(shadow) || key.frames != null) strength = getUniformSpreadStrength(key);
    // A key whose casters all cast nothing, such as one fading in from zero opacity, has no mask or blur to draw.
    if (strength === 0) return 'empty';

    const blur = shadow.blur * devicePixelRatio;
    const offsetX = shadow.xOffset * devicePixelRatio;
    const offsetY = shadow.yOffset * devicePixelRatio;
    if (!(
        width > 0 &&
        height > 0 &&
        isFiniteNumber(blur) &&
        isFiniteNumber(offsetX) &&
        isFiniteNumber(offsetY) &&
        (shadow.gap == null || isFiniteNumber(shadow.gap))
    )) {
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

/** Draws the mask of a planned key into `scratch`, at the resolution of the cast. Returns whether every caster drew. */
function drawMask(plan: KeyPlan, scratch: SpreadCanvas, transform: DOMMatrix, renderCtx: RenderContext): boolean {
    const { ctx } = renderCtx;
    let rendered: boolean;
    const { key, padLeft, padTop, canvasWidth, canvasHeight, scaleX, scaleY, opaque, tinted, extent } = plan;
    const { context } = scratch;

    context.save();
    try {
        context.setTransform(1, 0, 0, 1, 0, 0);
        if (extent == null) context.clearRect(0, 0, canvasWidth, canvasHeight);
        else context.clearRect(extent.x, extent.y, extent.width, extent.height);
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
            key.slot,
            opaque,
            tinted,
            { x: scaleX, y: scaleY },
            before
        );
    } finally {
        context.restore();
    }
    return rendered;
}

/** Casts a planned key onto `target`, whose top left is `origin` on the layer. Returns whether every caster drew. */
function castPlan(
    plan: KeyPlan,
    scratch: SpreadCanvas,
    target: Ctx,
    transform: DOMMatrix,
    renderCtx: RenderContext,
    originX: number,
    originY: number,
    scene: object | undefined,
    keyExtent: Extent | undefined,
    measured: MeasuredKeys,
    bound?: Extent
): boolean {
    const { key } = plan;
    const { canvas } = scratch;
    let rendered = drawMask(plan, scratch, transform, renderCtx);

    const { gap } = key.shadow;
    if (gap != null || plan.cutsSeeThrough) {
        const region = getGapRegion(key, keyExtent, transform, renderCtx, target, originX, originY, measured);
        if (region == null) return rendered;

        // A glow that can't have a canvas to be cut on is cast without the cut, rather than not at all.
        const resolution = fitMask(region.width, region.height);
        const gapWidth = Math.max(1, Math.floor(region.width * resolution));
        const gapHeight = Math.max(1, Math.floor(region.height * resolution));
        const holes = acquireGapCanvas(scene, gapWidth, gapHeight);
        if (holes != null) {
            const { canvas: holeCanvas, context: erase } = holes;
            const holeScaleX = gapWidth / region.width;
            const holeScaleY = gapHeight / region.height;
            erase.setTransform(1, 0, 0, 1, 0, 0);
            erase.clearRect(0, 0, gapWidth, gapHeight);
            erase.save();
            try {
                blurMask(plan, canvas, erase, region.x, region.y, holeScaleX, holeScaleY);
            } finally {
                erase.restore();
            }
            const resolutionOfHole = { x: holeScaleX, y: holeScaleY };
            // An overlay, or a hovered key cut like one, is cut only where an item is painted, whereas a `gap` clears the whole footprint.
            const painted = key.shadow.overlay === true || plan.cutsSeeThrough;
            rendered =
                eraseFootprints(
                    key,
                    erase,
                    transform,
                    renderCtx,
                    region,
                    resolutionOfHole,
                    gap ?? 0,
                    painted,
                    ERASE,
                    false,
                    plan.cutsSeeThrough
                ) && rendered;
            // The target holds what the layer has drawn and the glows of other keys, so only the cut glow is drawn onto it.
            target.save();
            try {
                clipToKey(key, target, transform, originX, originY);
                target.resetTransform();
                target.globalAlpha = 1;
                target.drawImage(
                    holeCanvas,
                    0,
                    0,
                    gapWidth,
                    gapHeight,
                    region.x - originX,
                    region.y - originY,
                    region.width,
                    region.height
                );
            } finally {
                target.restore();
            }
            return rendered;
        }
    }

    target.save();
    try {
        if (bound != null) {
            target.resetTransform();
            target.beginPath();
            target.rect(bound.x - originX, bound.y - originY, bound.width, bound.height);
            target.clip();
        }
        clipToKey(key, target, transform, originX, originY);
        blurMask(plan, canvas, target, originX, originY);
    } finally {
        target.restore();
    }
    return rendered;
}

/** OPTIMIZATION: a blur costs the area it is clipped to, so a key of few casters, such as a hovered item's, is clipped to its extent. */
function getSmallKeyExtent(
    { key, cutsSeeThrough: cutsKey }: KeyPlan,
    transform: DOMMatrix,
    renderCtx: RenderContext,
    measured: MeasuredKeys
): Extent | undefined {
    // A key with a `gap`, or cut like one, is already cast on a canvas of its own extent.
    if (key.shadow.gap != null || cutsKey || key.casters.length > MAX_BOUNDED_CASTERS) return;

    const { canvas } = renderCtx.ctx;
    return getShadowExtent(
        [key],
        transform,
        renderCtx.devicePixelRatio,
        Math.ceil(canvas.width),
        Math.ceil(canvas.height),
        measured
    );
}

/** The blurred glow of a part of an overlay key, kept once two casts in a row sign it alike, so a hover draws it again. */
interface GlowPart {
    signature: (number | string)[];
    /** Counted against the pool's part budget while held. */
    kept: SpreadCanvas | undefined;
    pool: ScratchPool | undefined;
    /** Whether the canvas holds the glow that the signature describes. */
    valid: boolean;
    /** Whether the cast under way has drawn the part, as those it has not are freed once it ends. */
    used: boolean;
}

/** What the cast of a part reads that is not its key's. */
interface GlowPartContext {
    readonly transform: DOMMatrix;
    readonly renderCtx: RenderContext;
    /** What the glow of the part's key can reach on the merged canvas, and where its top left is on the layer. */
    reach: Extent;
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
    /** Whether the part is clipped to its key's clips as it is blurred, as a glow that is cut on a canvas of its own is not. */
    clipped: boolean;
}

function freePartCanvas(part: GlowPart) {
    part.valid = false;
    const { kept, pool } = part;
    if (kept == null) return;

    if (pool != null) pool.partArea -= kept.canvas.width * kept.canvas.height;
    disposeCanvas(kept.canvas);
    part.kept = undefined;
    part.pool = undefined;
}

/** Frees the parts after the first `keep`, or only those that the cast has not drawn. */
function freeParts(parts: GlowPart[], keep: number, unusedOnly: boolean = false) {
    let held = keep;
    for (let i = keep; i < parts.length; i++) {
        const part = parts[i];
        if (unusedOnly && part.used) {
            parts[held++] = part;
            continue;
        }
        freePartCanvas(part);
    }
    parts.length = held;
}

function markPartsUnused(parts: GlowPart[]) {
    for (const part of parts) part.used = false;
}

/** Whether the plan's glow is drawn as a part: that of a key of enough casters to cost more than a canvas. */
function isGlowPart(plan: KeyPlan) {
    return sourceOf(plan.key).casters.length >= MIN_STRENGTH_SPLIT_CASTERS;
}

/** Writes everything that decides the pixels of the plan's part. */
function signGlowPart(target: SignatureTarget, plan: KeyPlan, context: GlowPartContext) {
    target.cursor = 0;
    target.changed = false;
    const { transform, renderCtx, reach } = context;
    putSignature(target, renderCtx.devicePixelRatio);
    putSignature(target, renderCtx.direction);
    putSignature(target, renderCtx.ctx.globalAlpha);
    putSignature(target, transform.a);
    putSignature(target, transform.b);
    putSignature(target, transform.c);
    putSignature(target, transform.d);
    putSignature(target, transform.e);
    putSignature(target, transform.f);
    putSignature(target, context.left);
    putSignature(target, context.top);
    putSignature(target, reach.width);
    putSignature(target, reach.height);
    putSignature(target, context.scaleX);
    putSignature(target, context.scaleY);
    putSignature(target, context.clipped ? 1 : 0);
    putSignature(target, plan.blur);
    putSignature(target, plan.offsetX);
    putSignature(target, plan.offsetY);
    putSignature(target, plan.padLeft);
    putSignature(target, plan.padTop);
    putSignature(target, plan.maskWidth);
    putSignature(target, plan.maskHeight);
    putSignature(target, plan.canvasWidth);
    putSignature(target, plan.canvasHeight);
    putSignature(target, plan.scaleX);
    putSignature(target, plan.scaleY);
    putSignature(target, plan.colour);
    putSignature(target, plan.opaque ? 1 : 0);
    putSignature(target, plan.tinted ? 1 : 0);
    putSignature(target, plan.alpha);
    putSignature(target, plan.key.shadow.overlay === true ? 1 : 0);
    signKey(target, plan.key);
    target.signature.length = target.cursor;
}

/** Gives the plan the part that holds its glow, if one that no other plan has been given does. */
function matchGlowPart(
    parts: GlowPart[],
    targets: SignatureTarget[],
    plan: KeyPlan,
    index: number,
    context: GlowPartContext
) {
    const target = (targets[index] ??= { signature: [], cursor: 0, changed: false });
    signGlowPart(target, plan, context);
    for (const part of parts) {
        if (!part.used && arraysEqual(part.signature, target.signature)) {
            part.used = true;
            plan.part = part;
            return;
        }
    }
}

/** Gives a plan that matched no part one that no plan matched, to hold its signature. */
function claimGlowPart(parts: GlowPart[], targets: SignatureTarget[], plan: KeyPlan, index: number) {
    let part: GlowPart | undefined;
    for (const held of parts) {
        if (!held.used) {
            part = held;
            break;
        }
    }
    if (part == null) {
        part = { signature: [], kept: undefined, pool: undefined, valid: false, used: false };
        parts.push(part);
    }
    freePartCanvas(part);
    part.used = true;
    // The part takes the array that was just written, and the cast writes the next into the one that it held.
    const target = targets[index];
    [part.signature, target.signature] = [target.signature, part.signature];
    plan.part = part;
}

/** Gives a part a canvas, if the scene's kept parts leave it room. */
function keepGlowPart(part: GlowPart, scene: object | undefined, { width, height }: Extent) {
    const pool = getPool(scene);
    if (pool.partArea + width * height > MAX_CACHED_PART_AREA) return;

    const kept = allocateCanvas(width, height);
    if (kept == null) return;

    part.kept = kept;
    part.pool = pool;
    pool.partArea += width * height;
}

/** Draws what `canvas` holds onto the merged canvas at `reach`. */
function drawGlowPart(dest: Ctx, canvas: SpreadCanvas['canvas'], { x, y, width, height }: Extent) {
    dest.save();
    try {
        dest.setTransform(1, 0, 0, 1, 0, 0);
        dest.globalAlpha = 1;
        dest.drawImage(canvas, 0, 0, width, height, x, y, width, height);
    } finally {
        dest.restore();
    }
}

/** Casts the glows of an overlay's keys merged onto `target`, cut by every key's footprints. Returns whether every caster drew. */
function castOverlay(
    plans: readonly KeyPlan[],
    scratch: SpreadCanvas,
    target: Ctx,
    transform: DOMMatrix,
    renderCtx: RenderContext,
    originX: number,
    originY: number,
    scene: object | undefined,
    keys: readonly ShadowKey[],
    cuts: readonly ShadowKey[] | undefined,
    keysExtent: Extent | undefined,
    measuredExtents: ReadonlyMap<ShadowKey, Extent> | undefined,
    measuredKeys: MeasuredKeys,
    parts?: GlowPart[]
): boolean {
    const { canvas } = renderCtx.ctx;
    let extent = keysExtent;
    let keyExtents = measuredExtents;
    if (extent == null) {
        const measured = new Map<ShadowKey, Extent>();
        extent = getShadowExtent(
            keys,
            transform,
            renderCtx.devicePixelRatio,
            Math.ceil(canvas.width),
            Math.ceil(canvas.height),
            measuredKeys,
            measured
        );
        keyExtents = measured;
    }
    const region = getGapRegion(keys[0], extent, transform, renderCtx, target, originX, originY, measuredKeys);
    if (region == null) return true;

    const resolution = fitMask(region.width, region.height);
    const width = Math.max(1, Math.floor(region.width * resolution));
    const height = Math.max(1, Math.floor(region.height * resolution));
    const merged = acquireGapCanvas(scene, width, height);
    // Without a canvas to merge and cut them on, the glows would draw over the items, so they are dropped for the frame.
    if (merged == null) {
        renderCtx.logger.warnOnce('Unable to create a canvas for the glow overlay, so the glows are not drawn');
        return false;
    }

    let rendered = true;

    const { canvas: mergedCanvas, context: glows } = merged;
    const scaleX = width / region.width;
    const scaleY = height / region.height;
    const resolutionOfHole = { x: scaleX, y: scaleY };
    // Cuts the footprint of a key, where its items are painted, out of what `ctx` holds.
    const eraseKey = (key: ShadowKey, ctx: Ctx, op: GlobalCompositeOperation) =>
        eraseFootprints(key, ctx, transform, renderCtx, region, resolutionOfHole, 0, true, op, true);
    // Cuts the ring of a key's own `gap`, which no glow of the overlay enters, or else its footprint.
    const eraseRing = (key: ShadowKey, ctx: Ctx, op: GlobalCompositeOperation) => {
        const { gap, overlay } = key.shadow;
        return gap == null || overlay === true
            ? eraseKey(key, ctx, op)
            : eraseFootprints(key, ctx, transform, renderCtx, region, resolutionOfHole, gap, false, op, true);
    };
    glows.setTransform(1, 0, 0, 1, 0, 0);
    glows.clearRect(0, 0, width, height);

    let cut: SpreadCanvas | undefined;
    const sources = new Set<ShadowKey>();
    for (const { key } of plans) sources.add(sourceOf(key));
    const lone = sources.size === 1;
    // Without a canvas for its own cut, a glow is merged whole, and the cut of every footprint still clears the items.
    const ownOf = (source: ShadowKey): SpreadCanvas | undefined => {
        const { gap, overlay } = source.shadow;
        const hasGap = gap != null && overlay !== true;
        if (!(hasGap || source.ownCuts != null || source.shadow.selfCut === true)) return;
        if (lone && hasGap) return merged;

        cut ??= acquireOwnCutCanvas(scene, width, height);
        return cut;
    };
    // Every plan is matched before any claims a part, so a plan that changed doesn't take the part of one that didn't.
    const partContext: GlowPartContext = {
        transform,
        renderCtx,
        reach: region,
        left: 0,
        top: 0,
        scaleX,
        scaleY,
        clipped: false,
    };
    const targets = parts == null ? [] : getPool(scene).partTargets;
    for (let first = 0; parts != null && first < plans.length;) {
        const source = sourceOf(plans[first].key);
        let end = first + 1;
        while (end < plans.length && sourceOf(plans[end].key) === source) end++;
        const reach = getKeyRect(keyExtents?.get(source) ?? extent, region, scaleX, scaleY, width, height);
        if (reach != null && isGlowPart(plans[first])) {
            partContext.reach = reach;
            partContext.left = region.x + reach.x / scaleX;
            partContext.top = region.y + reach.y / scaleY;
            partContext.clipped = ownOf(source) == null;
            for (let i = first; i < end; i++) matchGlowPart(parts, targets, plans[i], i, partContext);
        }
        first = end;
    }
    // Whether every glow was cut by the footprint of its own casters, dilated by its `gap`, before it merged.
    let cutWhole = true;
    // The keys whose glow was cut by the footprint of their own casters before it merged: the cut after the merge doesn't erase
    // that footprint again, but the footprints in `cuts`, the hovered node's among them, still cut these glows.
    const selfCut = new Set<ShadowKey>();
    let directKey: ShadowKey | undefined;
    for (let first = 0; first < plans.length;) {
        // The parts that a key was split into by strength cast one glow, so they share a canvas, and one cut.
        const source = sourceOf(plans[first].key);
        let end = first + 1;
        while (end < plans.length && sourceOf(plans[end].key) === source) end++;

        // A glow with a `gap` of its own, or cut by its series' own labels and error bars, is cut before it merges; the rest once merged.
        const { gap, overlay } = source.shadow;
        const hasGap = gap != null && overlay !== true;
        const ownCuts = source.ownCuts;
        const cutsSelf = source.shadow.selfCut === true;
        const direct = lone && hasGap;
        const own = ownOf(source);
        const dest = own?.context ?? glows;
        const reach = getKeyRect(keyExtents?.get(source) ?? extent, region, scaleX, scaleY, width, height);
        const group = plans.slice(first, end);
        const start = first;
        first = end;
        if (reach == null) continue;

        cutWhole &&= own != null && hasGap;
        if (own != null) {
            own.context.setTransform(1, 0, 0, 1, 0, 0);
            own.context.clearRect(reach.x, reach.y, reach.width, reach.height);
        }
        for (let i = 0; i < group.length; i++) {
            const plan = group[i];
            const partIndex = start + i;
            // A part is always blurred onto a canvas of its own, so that drawing it from a kept canvas draws the same pixels.
            let part: GlowPart | undefined;
            let place: SpreadCanvas | undefined;
            const left = region.x + reach.x / scaleX;
            const top = region.y + reach.y / scaleY;
            if (isGlowPart(plan)) {
                if (parts != null) {
                    const matched = plan.part != null;
                    if (!matched) claimGlowPart(parts, targets, plan, partIndex);
                    part = plan.part;
                    if (part?.kept != null && part.valid) {
                        drawGlowPart(dest, part.kept.canvas, reach);
                        continue;
                    }
                    if (matched && part != null && part.kept == null) keepGlowPart(part, scene, reach);
                }
                place = part?.kept ?? acquirePartCanvas(scene, reach.width, reach.height);
            }

            const drew = drawMask(plan, scratch, transform, renderCtx);
            rendered = drew && rendered;
            if (place != null) {
                const { context } = place;
                context.setTransform(1, 0, 0, 1, 0, 0);
                context.clearRect(0, 0, reach.width, reach.height);
                context.save();
                try {
                    if (own == null) clipToKey(plan.key, context, transform, left, top, scaleX, scaleY);
                    blurMask(plan, scratch.canvas, context, left, top, scaleX, scaleY);
                } finally {
                    context.restore();
                }
                // A caster that failed to draw is drawn again by the next cast, rather than left out of the glow for good.
                if (part != null) part.valid = drew && part.kept === place;
                drawGlowPart(dest, place.canvas, reach);
                continue;
            }

            dest.save();
            try {
                dest.setTransform(1, 0, 0, 1, 0, 0);
                dest.beginPath();
                dest.rect(reach.x, reach.y, reach.width, reach.height);
                dest.clip();
                if (own == null) clipToKey(plan.key, dest, transform, region.x, region.y, scaleX, scaleY);
                blurMask(plan, scratch.canvas, dest, region.x, region.y, scaleX, scaleY);
            } finally {
                dest.restore();
            }
        }
        if (own == null) continue;

        if (cutsSelf) {
            for (const plan of group) selfCut.add(plan.key);
        }
        rendered =
            cutOut(own, reach, scratch, (ctx, op) => {
                let drew = true;
                if (cutsSelf) {
                    for (const plan of group) drew = eraseKey(plan.key, ctx, op) && drew;
                }
                if (hasGap) {
                    for (const plan of group) {
                        drew =
                            eraseFootprints(
                                plan.key,
                                ctx,
                                transform,
                                renderCtx,
                                region,
                                resolutionOfHole,
                                gap ?? 0,
                                false,
                                op
                            ) && drew;
                    }
                }
                for (const key of ownCuts ?? []) drew = eraseKey(key, ctx, op) && drew;
                return drew;
            }) && rendered;
        if (direct) {
            directKey = group[0].key;
            continue;
        }
        glows.save();
        try {
            clipToKey(group[0].key, glows, transform, region.x, region.y, scaleX, scaleY);
            glows.resetTransform();
            glows.globalAlpha = 1;
            glows.drawImage(
                own.canvas,
                reach.x,
                reach.y,
                reach.width,
                reach.height,
                reach.x,
                reach.y,
                reach.width,
                reach.height
            );
        } finally {
            glows.restore();
        }
    }

    // A lone glow cut whole by its own `gap` needs no further cut, nor one that every glow was cut by its own footprint alone.
    const mergedPlans = selfCut.size === 0 ? plans : plans.filter((plan) => !selfCut.has(plan.key));
    if (!(cutWhole && lone && cuts == null) && (mergedPlans.length > 0 || cuts != null))
        rendered =
            cutOut(merged, { x: 0, y: 0, width, height }, scratch, (ctx, op) => {
                let drew = true;
                for (const plan of mergedPlans) drew = eraseRing(plan.key, ctx, op) && drew;
                for (const key of cuts ?? []) drew = eraseRing(key, ctx, op) && drew;
                return drew;
            }) && rendered;

    target.save();
    try {
        if (directKey != null) clipToKey(directKey, target, transform, originX, originY);
        target.resetTransform();
        target.globalAlpha = 1;
        target.drawImage(
            mergedCanvas,
            0,
            0,
            width,
            height,
            region.x - originX,
            region.y - originY,
            region.width,
            region.height
        );
    } finally {
        target.restore();
    }
    return rendered;
}

/** The key that a part split off by strength came from, or the key itself. */
function sourceOf(key: ShadowKey): ShadowKey {
    return key.split?.from ?? key;
}

/** The part of the merged canvas, at the layer's resolution, that the glow of a key can reach, or undefined if none of it. */
function getKeyRect(
    extent: Extent,
    region: Extent,
    scaleX: number,
    scaleY: number,
    width: number,
    height: number
): Extent | undefined {
    const x = Math.max(0, Math.floor((extent.x - region.x) * scaleX));
    const y = Math.max(0, Math.floor((extent.y - region.y) * scaleY));
    const right = Math.min(width, Math.ceil((extent.x + extent.width - region.x) * scaleX));
    const bottom = Math.min(height, Math.ceil((extent.y + extent.height - region.y) * scaleY));
    return right > x && bottom > y ? { x, y, width: right - x, height: bottom - y } : undefined;
}

/** Cuts out of `from` what `draw` draws as solid, stamped on `scratch` first if that fits. Returns what `draw` returns. */
function cutOut(
    from: SpreadCanvas,
    rect: Extent,
    scratch: SpreadCanvas,
    draw: (ctx: Ctx, op: GlobalCompositeOperation) => boolean
): boolean {
    const { canvas: stamps, context: stamp } = scratch;
    const { x, y, width, height } = rect;
    if (x + width > stamps.width || y + height > stamps.height) return draw(from.context, ERASE);

    stamp.setTransform(1, 0, 0, 1, 0, 0);
    stamp.clearRect(x, y, width, height);
    const rendered = draw(stamp, 'source-over');
    const { context } = from;
    context.save();
    try {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalAlpha = 1;
        context.globalCompositeOperation = ERASE;
        context.drawImage(stamps, x, y, width, height, x, y, width, height);
    } finally {
        context.restore();
    }
    return rendered;
}

/** Clips `dest` to what the path that the key's casters were drawn into clips. */
function clipToKey(
    { clip, clips }: ShadowKey,
    dest: Ctx,
    transform: DOMMatrix,
    originX: number,
    originY: number,
    scaleX: number = 1,
    scaleY: number = 1
) {
    if (clips != null) {
        dest.setTransform(scaleX, 0, 0, scaleY, -originX * scaleX, -originY * scaleY);
        clipToRegions(dest, clips);
    } else if (clip != null) {
        dest.setTransform(
            transform.a * scaleX,
            transform.b * scaleY,
            transform.c * scaleX,
            transform.d * scaleY,
            (transform.e - originX) * scaleX,
            (transform.f - originY) * scaleY
        );
        dest.beginPath();
        dest.moveTo(clip[0], clip[1]);
        for (let i = 2; i < clip.length; i += 2) dest.lineTo(clip[i], clip[i + 1]);
        dest.closePath();
        dest.clip();
    }
}

/**
 * Blurs the mask of `plan`, drawn in `canvas`, onto `dest`, whose top left is (`left`, `top`) on the layer and which holds the
 * layer at `scaleX` by `scaleY` of its resolution.
 */
function blurMask(
    plan: KeyPlan,
    canvas: SpreadCanvas['canvas'],
    dest: Ctx,
    left: number,
    top: number,
    scaleX: number = 1,
    scaleY: number = 1
) {
    const {
        offsetX,
        offsetY,
        padLeft,
        padTop,
        maskWidth,
        maskHeight,
        canvasWidth,
        canvasHeight,
        colour,
        tinted,
        extent,
    } = plan;
    // The mask is at the resolution of the layer when it has an extent, so a source rect has the size of the rect it is drawn to.
    const sourceX = extent?.x ?? 0;
    const sourceY = extent?.y ?? 0;
    const sourceWidth = extent?.width ?? canvasWidth;
    const sourceHeight = extent?.height ?? canvasHeight;
    const drawnWidth = extent?.width ?? maskWidth;
    const drawnHeight = extent?.height ?? maskHeight;
    const blur = plan.blur * scaleX;
    dest.setTransform(scaleX, 0, 0, scaleY, -left * scaleX, -top * scaleY);
    if (tinted) {
        // The mask holds each silhouette in its own colour, which a shadow can't take, so the canvas blurs the mask itself.
        dest.globalAlpha = plan.alpha;
        dest.filter = blur > 0 ? `blur(${blur / 2}px)` : 'none';
        dest.drawImage(
            canvas,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            offsetX - padLeft + sourceX,
            offsetY - padTop + sourceY,
            drawnWidth,
            drawnHeight
        );
    } else {
        // The mask is drawn this far to the left, so that none of it is on the layer. The shadow offset brings its shadow back.
        const distance = maskWidth;
        dest.globalAlpha = 1;
        dest.shadowColor = colour;
        dest.shadowOffsetX = (offsetX + distance) * scaleX;
        dest.shadowOffsetY = offsetY * scaleY;
        dest.shadowBlur = blur;
        dest.drawImage(
            canvas,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            -padLeft - distance + sourceX,
            -padTop + sourceY,
            drawnWidth,
            drawnHeight
        );
    }
}

/**
 * The part of `target` that the glow of the key can land on, in layer pixels, or undefined if none of it does.
 * The extent of the key is measured here only if the cast has not measured it already.
 */
function getGapRegion(
    key: ShadowKey,
    keyExtent: Extent | undefined,
    transform: DOMMatrix,
    renderCtx: RenderContext,
    target: Ctx,
    originX: number,
    originY: number,
    measured: MeasuredKeys
): Extent | undefined {
    const { canvas } = renderCtx.ctx;
    const extent =
        keyExtent ??
        getShadowExtent(
            [key],
            transform,
            renderCtx.devicePixelRatio,
            Math.ceil(canvas.width),
            Math.ceil(canvas.height),
            measured
        );
    const x = Math.max(extent.x, originX);
    const y = Math.max(extent.y, originY);
    const right = Math.min(extent.x + extent.width, originX + target.canvas.width);
    const bottom = Math.min(extent.y + extent.height, originY + target.canvas.height);
    return right > x && bottom > y ? { x, y, width: right - x, height: bottom - y } : undefined;
}

/**
 * Erases the footprint of the casters of a key, dilated by `gap`, from `erase`, which has the glow of the key blurred onto it
 * and whose top left is `region` on the layer, at `resolution`. Returns whether every caster drew.
 */
function eraseFootprints(
    key: ShadowKey,
    erase: Ctx,
    transform: DOMMatrix,
    renderCtx: RenderContext,
    region: Extent,
    resolution: { x: number; y: number },
    gap: number,
    painted: boolean,
    op: GlobalCompositeOperation = ERASE,
    clipped: boolean = false,
    seeThroughOnly: boolean = false
): boolean {
    const { frames } = key;
    const place = ([a, b, c, d, e, f]: readonly number[]) =>
        erase.setTransform(
            a * resolution.x,
            b * resolution.y,
            c * resolution.x,
            d * resolution.y,
            (e - region.x) * resolution.x,
            (f - region.y) * resolution.y
        );
    let placed: ShadowFrame | undefined;
    erase.save();
    try {
        // An item is painted only where its clips let it, so only there does it cover the glows of the other keys.
        if (clipped) clipToKey(key, erase, transform, region.x, region.y, resolution.x, resolution.y);
        if (frames == null) {
            const { a, b, c, d, e, f } = transform;
            place([a, b, c, d, e, f]);
        }
        erase.globalCompositeOperation = op;
        erase.globalAlpha = renderCtx.ctx.globalAlpha > 0 ? 1 : 0;
        erase.direction = renderCtx.ctx.direction;

        return renderPass(
            key.casters,
            {
                ...renderCtx,
                ctx: erase,
                stats: undefined,
                debugNodeSearch: undefined,
                currentFont: undefined,
                dirtyRegion: undefined,
            },
            'mask',
            key.slot,
            false,
            false,
            resolution,
            frames == null
                ? undefined
                : (i: number) => {
                      const frame = frames[i];
                      if (frame === placed) return;
                      placed = frame;
                      place(frame.matrix);
                      // A group that is fully transparent casts nothing, so it has no footprint to cut out of the glow.
                      erase.globalAlpha = frame.alpha > 0 ? 1 : 0;
                  },
            gap,
            painted,
            op,
            seeThroughOnly
        );
    } finally {
        erase.restore();
    }
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
    /** Whether the keys are the glows of an overlay, in which the footprint of every key's casters is cut out of each glow. */
    readonly overlay?: boolean;
    readonly scene: object | undefined;
    /** The group that casts, which holds the scratch canvas and its kept shadows until it releases them. */
    readonly user: object;
    /** The keys whose shadows to cast, in the order to draw them. */
    readonly keys: readonly ShadowKey[];
    /** Which of the user's casts of this frame this is, to match it with the same cast of the last frame. */
    readonly index: number;
    /** Whether the keys are those of the last cast of this index, unchanged, so the cast need not read every caster. */
    readonly unchanged?: boolean;
}

/** Casts the shadows of the keys now. Returns false, having drawn nothing, if they can't be cast, so casters cast their own. */
export function castShadows(
    { scene, user, keys, index, unchanged, overlay }: ShadowCast,
    renderCtx: RenderContext
): boolean {
    const { ctx } = renderCtx;
    const width = Math.ceil(ctx.canvas.width);
    const height = Math.ceil(ctx.canvas.height);
    const transform = ctx.getTransform();

    let cache = getCache(user, index);
    // The parts of an overlay's glows are kept by a cast that can't keep its own shadows, and by one whose signature changes.
    const parts = overlay === true && width * height <= MAX_MASK_AREA ? cache?.parts : undefined;
    if (cache != null && !mayKeep(cache, scene, width * height)) {
        freeKept(cache);
        if (parts == null) freeParts(cache.parts, 0);
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

    // A key's silhouettes are measured once for the cast, whichever of its masks, extents and clips need them.
    const measured: MeasuredKeys = new Map();
    // Every key is planned before any is drawn, so that a cast that can't be made is not half made.
    const masks: MaskPlan[] = [];
    let maskWidth = 0;
    let maskHeight = 0;
    let gapped = false;
    // The footprints that the overlay cuts out without casting a glow of their own.
    let cuts: ShadowKey[] | undefined;
    for (const key of keys) {
        if (key.shadow.cutOnly === true) {
            if (key.shadow.ownCut !== true) {
                cuts ??= [];
                cuts.push(key);
            }
            continue;
        }

        gapped ||= key.shadow.gap != null;
        if (overlay === true) {
            for (const part of splitByStrength(key)) {
                const plan = planKey(part.key, renderCtx, width, height, part);
                if (plan === 'unusable') return false;
                if (plan !== 'empty') {
                    masks.push(plan);
                    maskWidth = Math.max(maskWidth, plan.maskWidth);
                    maskHeight = Math.max(maskHeight, plan.maskHeight);
                }
            }
            continue;
        }

        const plan = planKey(key, renderCtx, width, height);
        if (plan === 'unusable') return false;
        if (plan === 'empty') continue;

        masks.push(plan);
        maskWidth = Math.max(maskWidth, plan.maskWidth);
        maskHeight = Math.max(maskHeight, plan.maskHeight);
    }
    if (masks.length === 0) return true;
    const glowKeys = cuts == null ? keys : keys.filter((key) => key.shadow.cutOnly !== true);

    // The masks share a scratch canvas as wide as the widest and as tall as the tallest, so they share a resolution that fits it.
    const resolution = fitMask(maskWidth, maskHeight);
    const scratchWidth = Math.max(1, Math.floor(maskWidth * resolution));
    const scratchHeight = Math.max(1, Math.floor(maskHeight * resolution));
    const keptCast = cache != null && repeated && !isDeclined(cache, scene);
    // A mask that is scaled down is cleared whole, since a part of it would not be drawn to the pixels that the whole is. So is
    // that of a cast that was refused room, whose casters are large, so measuring them would only cost.
    const bounded = resolution === 1 && !(cache != null && isDeclined(cache, scene));
    const plans = masks.map((mask): KeyPlan => {
        const canvasWidth = Math.max(1, Math.floor(mask.maskWidth * resolution));
        const canvasHeight = Math.max(1, Math.floor(mask.maskHeight * resolution));
        return {
            ...mask,
            canvasWidth,
            canvasHeight,
            scaleX: canvasWidth / mask.maskWidth,
            scaleY: canvasHeight / mask.maskHeight,
            part: undefined,
            cutsSeeThrough: cutsSeeThrough(mask.key),
            // A key of many casters is measured only for a kept cast, which measures them all for its cache anyway. A direct cast
            // may be a frame that changes every caster, so measuring them would cost more than clearing the mask whole.
            extent:
                bounded && (keptCast || sourceOf(mask.key).casters.length <= MAX_BOUNDED_CASTERS)
                    ? getMaskExtent(mask, transform, measured)
                    : undefined,
        };
    });
    if (parts != null) markPartsUnused(parts);
    const scratch = acquireShadowScratch(scene, user, scratchWidth, scratchHeight);
    if (scratch == null) {
        // The groups have drawn without their glows by now, so the glows are lost for the frame.
        if (overlay === true)
            renderCtx.logger.warnOnce('Unable to create a canvas for the glow overlay, so the glows are not drawn');
        return false;
    }

    let kept: SpreadCanvas | undefined;
    let keyExtents: Map<ShadowKey, Extent> | undefined;
    let keysExtent: Extent | undefined;
    if (cache != null && keptCast) {
        keyExtents = gapped ? new Map() : undefined;
        keysExtent = getShadowExtent(
            glowKeys,
            transform,
            renderCtx.devicePixelRatio,
            width,
            height,
            measured,
            keyExtents
        );
        kept = acquireCacheCanvas(cache, scene, keysExtent);
    }
    if (cache != null && kept != null) {
        kept.context.clearRect(0, 0, kept.canvas.width, kept.canvas.height);
        let rendered = true;
        if (overlay === true) {
            rendered = castOverlay(
                plans,
                scratch,
                kept.context,
                transform,
                renderCtx,
                cache.x,
                cache.y,
                scene,
                glowKeys,
                cuts,
                keysExtent,
                keyExtents,
                measured,
                parts
            );
        } else {
            for (const plan of plans) {
                const keyExtent = keyExtents?.get(plan.key);
                rendered =
                    castPlan(
                        plan,
                        scratch,
                        kept.context,
                        transform,
                        renderCtx,
                        cache.x,
                        cache.y,
                        scene,
                        keyExtent,
                        measured
                    ) && rendered;
            }
        }
        // A caster that failed to draw is drawn again by the next cast, rather than left out of the shadows for good.
        cache.valid = rendered;
        blitCache(ctx, cache);
    } else if (overlay === true) {
        castOverlay(
            plans,
            scratch,
            ctx,
            transform,
            renderCtx,
            0,
            0,
            scene,
            glowKeys,
            cuts,
            undefined,
            undefined,
            measured,
            parts
        );
    } else {
        // A refused cast's extent is about the layer, so clipping to it would only cost a measure.
        const declined = cache != null && isDeclined(cache, scene);
        for (const plan of plans) {
            const bound = declined ? undefined : getSmallKeyExtent(plan, transform, renderCtx, measured);
            castPlan(plan, scratch, ctx, transform, renderCtx, 0, 0, scene, undefined, measured, bound);
        }
    }
    // The parts that this cast left undrawn are of casters that are no longer a part of the glows, so they are freed.
    if (parts != null) freeParts(parts, 0, true);
    return true;
}
