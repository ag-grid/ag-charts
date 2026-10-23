import { isFiniteNumber } from '../data/typeGuards';
import { getOffscreenCanvas } from '../dom/globalsProxy';
import type { NormalisedDropShadowOptions } from '../options/normalised/normalisedCommonOptions';
import type { Node, RenderContext } from './node';
import { type Ctx, type Polygon, ShadowCollector, type ShadowFrame } from './shadowCollector';
import {
    MAX_MASK_PAD,
    SHADOW_BLUR_REACH,
    type ShadowCaster,
    UNIFORM_STRENGTH_TOLERANCE,
    acquireShadowScratch,
    fitMask,
    getBatchedShadow,
    getShadowClip,
    hasEnabledShadow,
    sameShadow,
    scaleColourAlpha,
} from './shadowCompositor';
import { getHighlightShadowPlacement, shadowPass } from './shadowPass';
import { Shape } from './shape/shape';

/** What the shared pass needs of the groups it draws the shadows of. {@link Group} implements it. */
export interface SharedShadowGroup extends Node {
    readonly shadowEpoch: number;
    getShadowCasterCount(): number;
    children(): Iterable<Node>;
    gatherShadowChildren(collector: ShadowCollector<SharedShadowGroup>): void;
}

type Frame = ShadowFrame<SharedShadowGroup>;

/**
 * Shared shadow pass (spike).
 *
 * A group that is a shadow root draws the shadows of every shared-shadow group below it before any of them draws, so that
 * all of the shadows sit beneath all of the items, whichever series they belong to. See {@link renderSharedShadows}.
 */

interface Entry {
    readonly shape: ShadowCaster;
    readonly frame: Frame;
}

/** The casters that share their shadow options and clips, and so one mask and one blur. */
interface ShadowKey {
    readonly shadow: NormalisedDropShadowOptions;
    readonly clips: readonly Polygon[];
    readonly entries: Entry[];
}

interface RootCanvas {
    readonly canvas: OffscreenCanvas;
    readonly context: OffscreenCanvasRenderingContext2D;
}

interface RootState {
    base: RootCanvas | undefined;
    /** What the base canvas was drawn from. A hover that changes none of it re-blurs only the highlight key. */
    baseSignature: readonly number[] | undefined;
    knockout: RootCanvas | undefined;
}

const states = new WeakMap<SharedShadowGroup, RootState>();

function getState(root: SharedShadowGroup): RootState {
    let state = states.get(root);
    if (state == null) {
        state = { base: undefined, baseSignature: undefined, knockout: undefined };
        states.set(root, state);
    }
    return state;
}

function freeCanvas(canvas: RootCanvas | undefined) {
    if (canvas == null) return;
    canvas.canvas.width = 0;
    canvas.canvas.height = 0;
}

/** Frees the canvases of a shadow root. */
export function releaseSharedShadows(root: SharedShadowGroup) {
    const state = states.get(root);
    if (state == null) return;

    freeCanvas(state.base);
    freeCanvas(state.knockout);
    states.delete(root);
}

function ensureCanvas(current: RootCanvas | undefined, width: number, height: number): RootCanvas | undefined {
    if (current?.canvas.width === width && current.canvas.height === height) {
        current.context.setTransform(1, 0, 0, 1, 0, 0);
        current.context.clearRect(0, 0, width, height);
        return current;
    }

    freeCanvas(current);
    const OffscreenCanvasCtor = getOffscreenCanvas();
    const canvas = new OffscreenCanvasCtor(width, height);
    const context = canvas.getContext('2d');
    if (context == null) {
        canvas.width = 0;
        canvas.height = 0;
        return;
    }
    return { canvas, context };
}

function sameClips(a: readonly Polygon[], b: readonly Polygon[]) {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    return a.every((polygon, i) => polygon.length === b[i].length && polygon.every((v, j) => v === b[i][j]));
}

/** Groups the casters of the frames by shadow options and clips, in the order of their first caster. */
function buildKeys(frames: readonly Frame[], shadowOf: (shape: Shape) => NormalisedDropShadowOptions | undefined) {
    const keys: ShadowKey[] = [];
    for (const frame of frames) {
        for (const child of frame.group.children()) {
            if (!child.visible || !(child instanceof Shape)) continue;

            const shadow = shadowOf(child);
            if (shadow == null) continue;

            const pathClip = getShadowClip(child);
            const clips = pathClip == null ? frame.clips : [...frame.clips, toDevice(frame.matrix, pathClip)];
            let key = keys.find((k) => sameShadow(k.shadow, shadow) && sameClips(k.clips, clips));
            if (key == null) {
                key = { shadow, clips, entries: [] };
                keys.push(key);
            }
            key.entries.push({ shape: child as ShadowCaster, frame });
        }
    }
    return keys;
}

function toDevice(matrix: readonly number[], corners: readonly number[]): number[] {
    const [a, b, c, d, e, f] = matrix;
    const polygon: number[] = [];
    for (let i = 0; i < corners.length; i += 2) {
        polygon.push(a * corners[i] + c * corners[i + 1] + e, b * corners[i] + d * corners[i + 1] + f);
    }
    return polygon;
}

/** Whether the casters draw their silhouettes at one strength, and which, or undefined if they differ. */
function getUniformStrength(entries: readonly Entry[]): number | undefined {
    let uniform = 0;
    for (const { shape, frame } of entries) {
        const base = shape.getSpreadMaskStrength();
        if (base == null) return;
        const strength = base * frame.alpha;
        if (strength <= 0) continue;
        if (uniform === 0) {
            uniform = strength;
        } else if (Math.abs(strength - uniform) > UNIFORM_STRENGTH_TOLERANCE) {
            return;
        }
    }
    return uniform;
}

function applyClips(ctx: Ctx, clips: readonly Polygon[]) {
    for (const clip of clips) {
        ctx.beginPath();
        for (let i = 0; i < clip.length; i += 2) {
            if (i === 0) {
                ctx.moveTo(clip[i], clip[i + 1]);
            } else {
                ctx.lineTo(clip[i], clip[i + 1]);
            }
        }
        ctx.closePath();
        ctx.clip();
    }
}

/**
 * Casts one key's shadow onto `target`: its casters' silhouettes are drawn into the scene's scratch canvas, and that mask is
 * blurred once as it is blitted. Mirrors the batch in `shadowCompositor.ts`, with a transform and opacity for each caster.
 * Returns false, having drawn nothing, if the shadow can't be cast.
 */
function castKey(
    scene: object | undefined,
    user: object,
    key: ShadowKey,
    target: Ctx,
    width: number,
    height: number,
    renderCtx: RenderContext
): boolean {
    const { devicePixelRatio } = renderCtx;
    const { shadow, entries, clips } = key;
    const spread = shadow.spread ?? 0;
    const strength = spread > 0 ? getUniformStrength(entries) : undefined;
    if (strength === 0) return true;

    const blur = shadow.blur * devicePixelRatio;
    const offsetX = shadow.xOffset * devicePixelRatio;
    const offsetY = shadow.yOffset * devicePixelRatio;
    if (!(width > 0 && height > 0 && isFiniteNumber(blur) && isFiniteNumber(offsetX) && isFiniteNumber(offsetY))) {
        return false;
    }

    const reach = Math.ceil(blur * SHADOW_BLUR_REACH + Math.max(0, spread) * devicePixelRatio);
    const padLeft = Math.min(Math.ceil(Math.max(0, offsetX)) + reach, MAX_MASK_PAD);
    const padRight = Math.min(Math.ceil(Math.max(0, -offsetX)) + reach, MAX_MASK_PAD);
    const padTop = Math.min(Math.ceil(Math.max(0, offsetY)) + reach, MAX_MASK_PAD);
    const padBottom = Math.min(Math.ceil(Math.max(0, -offsetY)) + reach, MAX_MASK_PAD);

    const maskWidth = width + padLeft + padRight;
    const maskHeight = height + padTop + padBottom;
    const resolution = fitMask(maskWidth, maskHeight);
    const canvasWidth = Math.max(1, Math.floor(maskWidth * resolution));
    const canvasHeight = Math.max(1, Math.floor(maskHeight * resolution));
    const scaleX = canvasWidth / maskWidth;
    const scaleY = canvasHeight / maskHeight;
    const acquired = acquireShadowScratch(scene, user, canvasWidth, canvasHeight);
    if (acquired == null) return false;
    const { canvas, context: scratch } = acquired;

    let shadowColour = shadow.color;
    let opaque = false;
    if (strength != null && strength < 1) {
        const scaled = scaleColourAlpha(shadow.color, strength);
        if (scaled != null) {
            shadowColour = scaled;
            opaque = true;
        }
    }

    const previousState = shadowPass.state;
    const previousOpaque = shadowPass.opaque;
    const previousResolution = shadowPass.resolution;
    shadowPass.state = 'mask';
    shadowPass.opaque = opaque;
    shadowPass.resolution = { x: scaleX, y: scaleY };
    scratch.save();
    try {
        scratch.setTransform(1, 0, 0, 1, 0, 0);
        scratch.clearRect(0, 0, canvasWidth, canvasHeight);
        scratch.direction = renderCtx.ctx.direction;

        const maskCtx: RenderContext = {
            ...renderCtx,
            ctx: scratch,
            stats: undefined,
            debugNodeSearch: undefined,
            currentFont: undefined,
        };
        let frame: Frame | undefined;
        for (const entry of entries) {
            if (entry.frame !== frame) {
                frame = entry.frame;
                const [a, b, c, d, e, f] = frame.matrix;
                scratch.setTransform(
                    a * scaleX,
                    b * scaleY,
                    c * scaleX,
                    d * scaleY,
                    (e + padLeft) * scaleX,
                    (f + padTop) * scaleY
                );
            }
            // The group opacity is multiplied into the mask, because the shadow no longer goes through the group's layer.
            scratch.globalAlpha = opaque ? 1 : frame.alpha;
            entry.shape.isolatedRender(maskCtx);
        }
    } finally {
        scratch.restore();
        shadowPass.state = previousState;
        shadowPass.opaque = previousOpaque;
        shadowPass.resolution = previousResolution;
    }

    const distance = maskWidth;
    target.save();
    try {
        target.resetTransform();
        applyClips(target, clips);
        target.globalAlpha = 1;
        target.shadowColor = shadowColour;
        target.shadowOffsetX = offsetX + distance;
        target.shadowOffsetY = offsetY;
        target.shadowBlur = blur;
        target.drawImage(canvas, 0, 0, canvasWidth, canvasHeight, -padLeft - distance, -padTop, maskWidth, maskHeight);
    } finally {
        target.restore();
    }
    return true;
}

function signatureOf(frames: readonly Frame[], width: number, height: number, ratio: number): number[] {
    const signature: number[] = [width, height, ratio];
    for (const { group, matrix, alpha, clips } of frames) {
        signature.push(group.serialNumber, group.shadowEpoch, alpha, ...matrix, clips.length);
        for (const clip of clips) signature.push(...clip);
    }
    return signature;
}

function sameSignature(a: readonly number[] | undefined, b: readonly number[]) {
    return a?.length === b.length && a.every((v, i) => v === b[i]);
}

/** Erases the fills of the items of the frames from `ctx`, which is of the same size and space as the layer. */
function knockOutItems(ctx: Ctx, frames: readonly Frame[], renderCtx: RenderContext) {
    const previousState = shadowPass.state;
    shadowPass.state = 'knockout';
    const knockoutCtx: RenderContext = {
        ...renderCtx,
        ctx,
        stats: undefined,
        debugNodeSearch: undefined,
        currentFont: undefined,
    };
    try {
        for (const frame of frames) {
            ctx.save();
            try {
                ctx.resetTransform();
                applyClips(ctx, frame.clips);
                const [a, b, c, d, e, f] = frame.matrix;
                ctx.setTransform(a, b, c, d, e, f);
                ctx.globalAlpha = 1;
                for (const child of frame.group.children()) {
                    if (child.visible && child instanceof Shape) child.isolatedRender(knockoutCtx);
                }
            } finally {
                ctx.restore();
            }
        }
    } finally {
        shadowPass.state = previousState;
    }
}

/**
 * Draws the shadows of every shared-shadow group below `root`, beneath where the root's children are about to draw.
 *
 * 1. {@link ShadowCollector} walks the groups in z-order without rendering them, so no dirty flag is cleared.
 * 2. The base shadows, one mask and one blur per distinct key, are drawn into a cached canvas and blitted. The cache is
 *    kept until the groups, their transforms or their opacity change, so that a hover does not re-blur them.
 * 3. The highlight shadow, if the placement is beneath, is blurred on its own key and blitted over the base. With a
 *    knockout it is first erased from where the other items are drawn.
 *
 * Returns the groups whose casters now draw without a shadow, or undefined if the root can't draw them, which leaves
 * every group to batch its own shadows.
 */
export function renderSharedShadows(
    root: SharedShadowGroup,
    scene: object | undefined,
    renderCtx: RenderContext
): ReadonlySet<SharedShadowGroup> | undefined {
    const { ctx, devicePixelRatio } = renderCtx;
    const width = Math.ceil(ctx.canvas.width);
    const height = Math.ceil(ctx.canvas.height);
    if (!(width > 0 && height > 0)) return;

    const collector = new ShadowCollector<SharedShadowGroup>(ctx, ctx.globalAlpha);
    root.gatherShadowChildren(collector);
    const { frames } = collector;
    if (frames.length === 0) return new Set();

    const baseFrames = frames.filter((frame) => !frame.highlight);
    const highlightFrames = frames.filter((frame) => frame.highlight);
    const casting = baseFrames.filter((frame) => frame.group.getShadowCasterCount() > 0);
    const state = getState(root);

    if (casting.length > 0) {
        const signature = signatureOf(casting, width, height, devicePixelRatio);
        if (state.base == null || !sameSignature(state.baseSignature, signature)) {
            state.baseSignature = undefined;
            state.base = ensureCanvas(state.base, width, height);
            if (state.base == null) return;

            for (const key of buildKeys(casting, getBatchedShadow)) {
                if (!castKey(scene, root, key, state.base.context, width, height, renderCtx)) return;
            }
            state.baseSignature = signature;
        }

        ctx.save();
        try {
            ctx.resetTransform();
            ctx.globalAlpha = 1;
            ctx.drawImage(state.base.canvas, 0, 0);
        } finally {
            ctx.restore();
        }
    }

    const highlightKeys = buildKeys(highlightFrames, (shape) =>
        hasEnabledShadow(shape) ? shape.__fillShadow : undefined
    );
    const knockout = getHighlightShadowPlacement() === 'beneath-knockout';
    for (const key of highlightKeys) {
        if (!knockout) {
            if (!castKey(scene, root, key, ctx, width, height, renderCtx)) return;
            continue;
        }

        state.knockout = ensureCanvas(state.knockout, width, height);
        if (state.knockout == null) return;
        const { canvas, context } = state.knockout;
        if (!castKey(scene, root, key, context, width, height, renderCtx)) return;
        knockOutItems(context, baseFrames, renderCtx);
        ctx.save();
        try {
            ctx.resetTransform();
            ctx.globalAlpha = 1;
            ctx.drawImage(canvas, 0, 0);
        } finally {
            ctx.restore();
        }
    }

    return new Set(frames.map((frame) => frame.group));
}
