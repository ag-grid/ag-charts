import { arraysEqual } from '../data/arrays';
import type { NormalisedDropShadowOptions } from '../options/normalised/normalisedCommonOptions';
import type { Node, RenderContext } from './node';
import { type CollectedFrame, type ShadowFrame, transformCorners } from './shadowCollector';
import {
    type ShadowCaster,
    type ShadowClip,
    type ShadowKey,
    castShadows,
    endShadowCasts,
    getBatchedShadow,
    getRootShadow,
    getShadowClip,
    joinsShadowKey,
    releaseShadowScratch,
} from './shadowEngine';

/** What a shadow root needs of the groups that cast through it. {@link Group} implements it. */
interface ShadowSource extends Node {
    children(): Iterable<Node>;
}

/** The keys of the root's last cast, and the frames they were built from, to tell whether they are still the keys. */
interface RootMemo {
    readonly frames: readonly CollectedFrame[];
    readonly keys: readonly ShadowKey[];
    readonly cover: ReadonlyMap<object, boolean>;
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

/** Groups the casters of frames into keys by their shadow options and clips, in the order of their first caster. */
class RootKeys {
    readonly keys: ShadowKey[] = [];
    private last: ShadowKey | undefined;
    private lastFrame: ShadowFrame | undefined;

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
                key = { shadow, clip: undefined, casters: [], frames: [], clips };
                this.keys.push(key);
            }
        }
        this.last = pathClip == null ? key : undefined;
        this.lastFrame = frame;
        key.casters.push(caster);
        key.frames?.push(frame);
    }
}

function buildKeys(frames: readonly CollectedFrame[]) {
    const keys = new RootKeys();
    for (const frame of frames) {
        for (const child of (frame.source as ShadowSource).children()) {
            if (!child.visible) continue;

            // A cutout erases only its own layer, so in one it leaves the shadow of the root whole.
            const shadow = frame.layered ? getRootShadow(child) : getBatchedShadow(child);
            if (shadow != null) keys.add(child as ShadowCaster, shadow, frame, getShadowClip(child));
        }
    }
    return keys.keys;
}

/** The cover of a cast of nothing, which is shared, as no frame has a group to put in one. */
const NO_COVER: ReadonlyMap<object, boolean> = new Map();

/** Frees what the root of `user` holds: the scratch canvas and cached shadows of its casts, and the keys of the last. */
export function releaseShadowRoot(scene: object | undefined, user: object) {
    memos.delete(user);
    releaseShadowScratch(scene, user);
}

/**
 * Casts the shadows of the frames onto `renderCtx.ctx`, beneath what the root draws next. Returns the groups whose casters
 * now draw without a shadow, each with whether that includes its cutouts, or undefined if the cast failed, having drawn
 * nothing, which leaves every group to cast its own. A failure is one of planning, as the cast of a root is not undone
 * if a caster fails to draw.
 */
export function castRootShadows(
    frames: readonly CollectedFrame[],
    scene: object | undefined,
    user: object,
    renderCtx: RenderContext
): ReadonlyMap<object, boolean> | undefined {
    const memo = memos.get(user);
    const unchanged = memo != null && matchesMemo(memo, frames);
    const keys = unchanged ? memo.keys : buildKeys(frames);
    if (keys.length === 0) {
        // Nothing casts, so the root gives up the scratch canvas and the shadows that its casts kept.
        releaseShadowRoot(scene, user);
        return NO_COVER;
    }

    if (!castShadows({ scene, user, keys, index: 0, unchanged }, renderCtx)) {
        memos.delete(user);
        return;
    }

    endShadowCasts(user, 1);
    if (unchanged) return memo.cover;

    const cover = new Map(frames.map((frame) => [frame.source, frame.layered]));
    memos.set(user, { frames, keys, cover });
    return cover;
}
