import { arraysEqual } from '../data/arrays';
import type { NormalisedDropShadowOptions } from '../options/normalised/normalisedCommonOptions';
import type { Node, RenderContext } from './node';
import { type CollectedFrame, type ShadowFrame, transformCorners } from './shadowCollector';
import {
    CUT_ONLY_GLOW,
    type ShadowCaster,
    type ShadowClip,
    type ShadowKey,
    castShadows,
    castsCutOnly,
    endShadowCasts,
    getBatchedShadow,
    getRootShadow,
    getShadowClip,
    joinsShadowKey,
    releaseShadowScratch,
} from './shadowEngine';
import type { ShadowSlot } from './shadowPass';

/** What a shadow root needs of the groups that cast through it. {@link Group} implements it. */
interface ShadowSource extends Node {
    children(): Iterable<Node>;
}

/** What the root casts for a group: its shadows and glows, with whether its cutouts are covered, or `'glow'` for its glows only. */
export type ShadowCover = boolean | 'glow';

/** The keys of the root's last cast, and the frames they were built from, to tell whether they are still the keys. */
interface RootMemo {
    readonly frames: readonly CollectedFrame[];
    readonly keys: readonly ShadowKey[];
    readonly cover: ReadonlyMap<object, ShadowCover>;
}

const memos = new WeakMap<object, RootMemo>();

/** Whether the frames are the memo's with no group marked dirty since, so its keys are still theirs. */
function matchesMemo(memo: RootMemo, frames: readonly CollectedFrame[]): boolean {
    if (memo.frames.length !== frames.length) return false;
    for (let i = 0; i < frames.length; i++) {
        const a = memo.frames[i];
        const b = frames[i];
        if (a.source !== b.source || a.version !== b.version || a.alpha !== b.alpha || a.layered !== b.layered)
            return false;
        if (!arraysEqual(a.matrix, b.matrix) || !arraysEqual(a.clips, b.clips)) return false;
    }
    return true;
}

/** Groups the casters of one slot into keys by their shadow options and clips, in the order of their first caster. */
class SlotKeys {
    readonly keys: ShadowKey[] = [];
    private last: ShadowKey | undefined;
    private lastFrame: ShadowFrame | undefined;

    constructor(private readonly slot: ShadowSlot) {}

    add(
        caster: ShadowCaster,
        shadow: NormalisedDropShadowOptions,
        frame: ShadowFrame,
        pathClip: ShadowClip | undefined
    ) {
        const clips = pathClip == null ? frame.clips : [...frame.clips, [transformCorners(frame.matrix, pathClip)]];
        let key = this.last;
        // The casters of a group follow one another, and rarely differ in shadow or clip.
        if (key == null || frame !== this.lastFrame || pathClip != null || key.shadow !== shadow) {
            key = this.keys.find((k) => joinsShadowKey(k, caster, shadow, undefined, 'root', clips));
            if (key == null) {
                key = { slot: this.slot, shadow, clip: undefined, casters: [], frames: [], clips };
                this.keys.push(key);
            }
        }
        this.last = pathClip == null ? key : undefined;
        this.lastFrame = frame;
        key.casters.push(caster);
        key.frames?.push(frame);
    }
}

/** The glows with their `gap` set, so that a glow of an overlay is cut by the footprint of its casters, as one with a gap is. */
const footprintCuts = new WeakMap<NormalisedDropShadowOptions, NormalisedDropShadowOptions>();

function withFootprintCut(glow: NormalisedDropShadowOptions): NormalisedDropShadowOptions {
    if (glow.gap != null) return glow;

    let cut = footprintCuts.get(glow);
    if (cut == null) {
        cut = { ...glow, gap: 0, overlay: true };
        footprintCuts.set(glow, cut);
    }
    return cut;
}

/**
 * The keys of the frames' casters: those of every shadow, or, for the overlay, those of every glow. A glow of the overlay is
 * cut by the footprint of its casters, see {@link withFootprintCut}.
 */
function buildKeys(frames: readonly CollectedFrame[], glows: boolean) {
    const keys = new SlotKeys(glows ? 'glow' : 'shadow');
    let cuts: SlotKeys | undefined;
    for (const frame of frames) {
        // The root casts only the glows of a group that batches its shadows itself.
        if (!glows && frame.glowsOnly) continue;

        for (const child of (frame.source as ShadowSource).children()) {
            if (!child.visible) continue;

            // A cutout erases only its own layer, so in one it leaves the shadow of the root whole.
            const shadowOf = frame.layered ? getRootShadow : getBatchedShadow;
            const cast = glows ? shadowOf(child, 'glow') : shadowOf(child);
            if (cast == null) {
                if (glows && castsCutOnly(child)) {
                    cuts ??= new SlotKeys('glow');
                    cuts.add(child as ShadowCaster, CUT_ONLY_GLOW, frame, getShadowClip(child));
                }
                continue;
            }

            // Asked once, as it allocates for a clipped caster.
            keys.add(child as ShadowCaster, glows ? withFootprintCut(cast) : cast, frame, getShadowClip(child));
        }
    }
    return cuts == null ? keys.keys : [...keys.keys, ...cuts.keys];
}

/** The cover of a cast of nothing, which is shared, as no frame has a group to put in one. */
const NO_COVER: ReadonlyMap<object, boolean> = new Map();

/** Frees what the root of `user` holds: the scratch canvas and cached shadows of its casts, and the keys of the last. */
export function releaseShadowRoot(scene: object | undefined, user: object) {
    memos.delete(user);
    releaseShadowScratch(scene, user);
}

/**
 * Casts the shadows of the frames beneath what the root draws next. Returns the groups whose casters now draw without a
 * shadow or glow, with whether that includes cutouts, or undefined if the cast failed (in planning), leaving every group to
 * cast its own. With `glows`, the groups are covered even if no shadow is cast, as the overlay casts their glows.
 */
export function castRootShadows(
    frames: readonly CollectedFrame[],
    scene: object | undefined,
    user: object,
    renderCtx: RenderContext,
    glows: boolean = false
): ReadonlyMap<object, ShadowCover> | undefined {
    const memo = memos.get(user);
    const unchanged = memo != null && matchesMemo(memo, frames);
    const keys = unchanged ? memo.keys : buildKeys(frames, false);
    if (keys.length === 0 && !glows) {
        // Nothing casts, so the root gives up the scratch canvas and the shadows that its casts kept.
        releaseShadowRoot(scene, user);
        return NO_COVER;
    }

    if (keys.length > 0) {
        if (!castShadows({ scene, user, keys, index: 0, unchanged }, renderCtx)) {
            memos.delete(user);
            return;
        }
        endShadowCasts(user, 1);
    } else {
        releaseShadowScratch(scene, user);
    }
    if (unchanged) return memo.cover;

    const cover = new Map<object, ShadowCover>(
        frames.map((frame) => [frame.source, frame.glowsOnly ? 'glow' : frame.layered])
    );
    memos.set(user, { frames, keys, cover });
    return cover;
}

/** Casts one overlay of the glows of the frames' casters onto `renderCtx.ctx`. Returns false, having drawn nothing, if it can't. */
export function castGlowOverlay(
    frames: readonly CollectedFrame[],
    scene: object | undefined,
    user: object,
    renderCtx: RenderContext
): boolean {
    const memo = memos.get(user);
    const unchanged = memo != null && matchesMemo(memo, frames);
    const keys = unchanged ? memo.keys : buildKeys(frames, true);
    if (keys.length === 0) {
        releaseShadowRoot(scene, user);
        return true;
    }

    if (!castShadows({ scene, user, keys, index: 0, unchanged, overlay: true }, renderCtx)) {
        memos.delete(user);
        return false;
    }

    endShadowCasts(user, 1);
    if (!unchanged) memos.set(user, { frames, keys, cover: NO_COVER });
    return true;
}
