import { arraysEqual } from '../data/arrays';
import type { NormalisedDropShadowOptions } from '../options/normalised/normalisedCommonOptions';
import type { Node, RenderContext } from './node';
import { type CollectedFrame, type ShadowFrame, type ShadowRegion, transformCorners } from './shadowCollector';
import {
    CUT_ONLY_GLOW,
    OWN_CUT_GLOW,
    type RootShadowKey,
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
    shadowKeyId,
} from './shadowEngine';
import type { ShadowSlot } from './shadowPass';
import { Shape } from './shape/shape';

/** What a shadow root needs of the groups that cast through it. {@link Group} implements it. */
interface ShadowSource extends Node {
    children(): Iterable<Node>;
}

/** What the root casts for a group: its shadows and glows, with whether its cutouts are covered, or `'glow'` for its glows only. */
export type ShadowCover = boolean | 'glow';

/** The keys of the root's last cast, and the frames they were built from, to tell whether they are still the keys. */
interface RootMemo {
    readonly frames: readonly CollectedFrame<ShadowSource>[];
    readonly keys: readonly ShadowKey[];
    /** The keys of the glows of the hovered item, cast above the overlay, see {@link CollectedFrame.hovered}. */
    readonly hoveredKeys?: readonly ShadowKey[];
    readonly cover: ReadonlyMap<ShadowSource, ShadowCover>;
}

const memos = new WeakMap<object, RootMemo>();

/** Whether the frames are the memo's with no group marked dirty since, so its keys are still theirs. */
function matchesMemo(memo: RootMemo, frames: readonly CollectedFrame<ShadowSource>[]): boolean {
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
    readonly keys: RootShadowKey[] = [];
    /** The keys of each shadow, so that a caster finds its key without comparing every key, as the colours of a scale have many. */
    private readonly byShadow = new Map<string, RootShadowKey[]>();
    private last: RootShadowKey | undefined;
    private lastFrame: ShadowFrame | undefined;

    constructor(private readonly slot: ShadowSlot) {}

    add(
        caster: ShadowCaster,
        shadow: NormalisedDropShadowOptions,
        frame: ShadowFrame,
        pathClip: ShadowClip | undefined,
        owner?: object
    ) {
        const clips = pathClip == null ? frame.clips : [...frame.clips, [transformCorners(frame.matrix, pathClip)]];
        let key = this.last;
        // A glow cut by the footprint of its own caster before it merges is cast by one key to a caster, so that cut is that caster's alone.
        const alone = shadow.selfCut === true;
        // The casters of a group follow one another, and rarely differ in shadow or clip.
        if (alone || key == null || frame !== this.lastFrame || pathClip != null || key.shadow !== shadow) {
            key = alone ? undefined : this.find(caster, shadow, clips, owner);
            if (key == null) {
                key = { slot: this.slot, shadow, casters: [], frames: [], clips, owner };
                this.keys.push(key);
                if (!alone) this.index(key);
            }
        }
        this.last = pathClip == null && !alone ? key : undefined;
        this.lastFrame = frame;
        key.casters.push(caster);
        key.frames.push(frame);
    }

    private find(
        caster: ShadowCaster,
        shadow: NormalisedDropShadowOptions,
        clips: readonly ShadowRegion[],
        owner: object | undefined
    ) {
        const candidates = this.byShadow.get(shadowKeyId(shadow));
        return candidates?.find(
            (k) => k.owner === owner && joinsShadowKey(k, caster, shadow, undefined, 'root', clips)
        );
    }

    private index(key: RootShadowKey) {
        const id = shadowKeyId(key.shadow);
        const candidates = this.byShadow.get(id);
        if (candidates == null) this.byShadow.set(id, [key]);
        else candidates.push(key);
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

const ringCuts = new WeakMap<NormalisedDropShadowOptions, NormalisedDropShadowOptions>();

/** The cut of an item that casts `glow`, which for one with a `gap` of its own also clears the ring of the gap. */
function getCut(glow: NormalisedDropShadowOptions | undefined): NormalisedDropShadowOptions {
    if (glow?.gap == null || glow.overlay === true) return CUT_ONLY_GLOW;

    let cut = ringCuts.get(glow);
    if (cut == null) {
        cut = { ...CUT_ONLY_GLOW, gap: glow.gap };
        ringCuts.set(glow, cut);
    }
    return cut;
}

/** Adds the footprint of a child to the cuts of the overlay, which a child that casts no glow of its own makes. */
function addCut(
    cuts: SlotKeys | undefined,
    child: Node,
    frame: CollectedFrame<ShadowSource>,
    glow?: NormalisedDropShadowOptions
) {
    cuts ??= new SlotKeys('glow');
    cuts.add(child as ShadowCaster, getCut(glow), frame, getShadowClip(child));
    return cuts;
}

/** The series whose glows are cut by their own shapes alone, so that their glows are keyed apart from those of the rest. */
function getOwnCutters(frames: readonly CollectedFrame<ShadowSource>[]): Set<object> | undefined {
    let owners: Set<object> | undefined;
    for (const frame of frames) {
        if (!frame.ownCuts || frame.owner == null) continue;
        owners ??= new Set();
        owners.add(frame.owner);
    }
    return owners;
}

/** The cuts of the labels and error bars of each series that has a glow in `keys` or `hoveredKeys`, keyed by series. */
function buildOwnCuts(
    frames: readonly CollectedFrame<ShadowSource>[],
    keys: readonly ShadowKey[],
    hoveredKeys: readonly ShadowKey[] | undefined
): Map<object, SlotKeys> | undefined {
    let ownCuts: Map<object, SlotKeys> | undefined;
    for (const frame of frames) {
        const { owner } = frame;
        if (owner == null) continue;
        let ownerCuts = ownCuts?.get(owner);
        if (ownerCuts == null) {
            if (!keys.some((key) => key.owner === owner) && hoveredKeys?.some((key) => key.owner === owner) !== true) {
                continue;
            }
            ownerCuts = new SlotKeys('glow');
            ownCuts ??= new Map();
            ownCuts.set(owner, ownerCuts);
        }
        addOwnCuts(ownerCuts, frame.source, frame, frame.groupedCuts);
    }
    return ownCuts;
}

/** Adds the shapes of the source to the cuts of its series, and with `grouped`, those of its child groups too. */
function addOwnCuts(ownerCuts: SlotKeys, source: ShadowSource, frame: CollectedFrame<ShadowSource>, grouped: boolean) {
    for (const child of source.children()) {
        if (!child.visible) continue;

        if (grouped && !(child instanceof Shape)) {
            addOwnCuts(ownerCuts, child as ShadowSource, frame, false);
        } else {
            ownerCuts.add(child as ShadowCaster, OWN_CUT_GLOW, frame, getShadowClip(child));
        }
    }
}

/**
 * The keys of the frames' casters: those of every shadow, or, for the overlay, every glow, see {@link withFootprintCut}.
 * The glows of the hovered item go into `hoveredKeys`, if given, and its footprint cuts every glow of the overlay.
 */
function buildKeys(frames: readonly CollectedFrame<ShadowSource>[], glows: boolean, hoveredKeys?: ShadowKey[]) {
    const keys = new SlotKeys(glows ? 'glow' : 'shadow');
    const hovered = hoveredKeys == null ? undefined : new SlotKeys('glow');
    let cuts: SlotKeys | undefined;
    let hoveredCuts: SlotKeys | undefined;
    const ownCutters = glows ? getOwnCutters(frames) : undefined;
    let ownCutFrames: CollectedFrame<ShadowSource>[] | undefined;
    for (const frame of frames) {
        // The root casts only the glows of a group that batches its shadows itself, and nothing for one that casts its own glows.
        if (!glows && (frame.glowsOnly || frame.cutsOnly)) continue;

        const { owner } = frame;
        if (frame.ownCuts && owner != null && ownCutters != null) {
            ownCutFrames ??= [];
            ownCutFrames.push(frame);
            continue;
        }
        const keyOwner = owner != null && ownCutters?.has(owner) === true ? owner : undefined;

        for (const child of frame.source.children()) {
            if (!child.visible) continue;

            // A group that casts its own glows has only its items cut out of the overlay.
            if (frame.cutsOnly) {
                if (castsCutOnly(child)) cuts = addCut(cuts, child, frame);
                continue;
            }

            // A cutout erases only its own layer, so in one it leaves the root's shadow whole; a hovered one's glow is the root's.
            const shadowOf = frame.layered || (hovered != null && frame.hovered) ? getRootShadow : getBatchedShadow;
            const cast = glows ? shadowOf(child, 'glow') : shadowOf(child);
            if (cast == null) {
                if (glows && castsCutOnly(child)) cuts = addCut(cuts, child, frame);
                continue;
            }

            // Asked once, as it allocates for a clipped caster.
            const clip = getShadowClip(child);
            const shadow = glows ? withFootprintCut(cast) : cast;
            if (hovered != null && frame.hovered) {
                hovered.add(child as ShadowCaster, shadow, frame, clip, keyOwner);
                cuts = addCut(cuts, child, frame, cast);
                // A glow cut by its own footprint before the merge doesn't add that footprint to `hoveredCuts`, which would cut it again;
                // it is still cut by the footprints in `cuts`, and by the hovered node's own footprint in `hoveredCuts`.
                if (cast.selfCut !== true) hoveredCuts = addCut(hoveredCuts, child, frame, cast);
            } else {
                keys.add(child as ShadowCaster, shadow, frame, clip, keyOwner);
            }
        }
    }
    if (hovered != null) hoveredKeys?.push(...hovered.keys, ...(hoveredCuts?.keys ?? []));
    const ownCuts = ownCutFrames == null ? undefined : buildOwnCuts(ownCutFrames, keys.keys, hovered?.keys);
    if (ownCuts == null) return cuts == null ? keys.keys : [...keys.keys, ...cuts.keys];

    const all = cuts == null ? [...keys.keys] : [...keys.keys, ...cuts.keys];
    for (const list of [keys.keys, hovered?.keys ?? []]) {
        for (const key of list) {
            const owned = key.owner == null ? undefined : ownCuts.get(key.owner)?.keys;
            if (owned != null) key.ownCuts = owned;
        }
    }
    for (const [owner, owned] of ownCuts) {
        all.push(...owned.keys);
        if (hovered?.keys.some((key) => key.owner === owner) === true) hoveredKeys?.push(...owned.keys);
    }
    return all;
}

/** The cover of a cast of nothing, which is shared, as no frame has a group to put in one. */
const NO_COVER: ReadonlyMap<never, ShadowCover> = new Map<never, ShadowCover>();

/** Frees what the root of `user` holds: the scratch canvas and cached shadows of its casts, and the keys of the last. */
export function releaseShadowRoot(scene: object | undefined, user: object) {
    memos.delete(user);
    releaseShadowScratch(scene, user);
}

/**
 * Casts the frames' shadows beneath what the root draws next. Returns the groups whose casters now draw without them, with
 * whether that includes cutouts, or undefined if the cast failed. With `glows`, groups are covered even if no shadow is cast.
 */
export function castRootShadows<TSource extends ShadowSource>(
    frames: readonly CollectedFrame<TSource>[],
    scene: object | undefined,
    user: object,
    renderCtx: RenderContext,
    glows: boolean = false
): ReadonlyMap<TSource, ShadowCover> | undefined {
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
    // The memo holds the cover of the frames that matched, which have this type of source.
    if (unchanged) return memo.cover as ReadonlyMap<TSource, ShadowCover>;

    // A group that is only cut out of the overlay draws as it did, with its own glows.
    const cover = new Map<TSource, ShadowCover>();
    for (const frame of frames) {
        if (!frame.cutsOnly) cover.set(frame.source, frame.glowsOnly ? 'glow' : frame.layered);
    }
    memos.set(user, { frames, keys, cover });
    return cover;
}

/**
 * Casts the overlay of the glows of the frames' casters onto `renderCtx.ctx`, then the hovered item's glows above it.
 * Returns false if either can't be cast, having drawn the overlay alone if only the hovered item's glows can't be.
 */
export function castGlowOverlay(
    frames: readonly CollectedFrame<ShadowSource>[],
    scene: object | undefined,
    user: object,
    renderCtx: RenderContext
): boolean {
    const memo = memos.get(user);
    const unchanged = memo != null && matchesMemo(memo, frames);
    let keys: readonly ShadowKey[];
    let hoveredKeys: ShadowKey[] | readonly ShadowKey[];
    if (unchanged) {
        keys = memo.keys;
        hoveredKeys = memo.hoveredKeys ?? [];
    } else {
        const built: ShadowKey[] = [];
        keys = buildKeys(frames, true, built);
        hoveredKeys = built;
    }
    if (keys.length === 0 && hoveredKeys.length === 0) {
        releaseShadowRoot(scene, user);
        return true;
    }

    // The glows of the hovered item lie above every other glow, cut only by its own series' labels and error bars.
    let casts = 0;
    for (const cast of [keys, hoveredKeys]) {
        if (cast.length === 0) continue;
        if (!castShadows({ scene, user, keys: cast, index: casts++, unchanged, overlay: true }, renderCtx)) {
            memos.delete(user);
            return false;
        }
    }

    endShadowCasts(user, casts);
    if (!unchanged) memos.set(user, { frames, keys, hoveredKeys, cover: NO_COVER });
    return true;
}
