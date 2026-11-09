import type { NormalisedDropShadowOptions } from '../options/normalised/normalisedCommonOptions';
import type { Node, RenderContext } from './node';
import {
    type ShadowCaster,
    type ShadowClip,
    type ShadowKey,
    type ShadowScope,
    castShadows,
    endShadowCasts,
    getBatchedShadow,
    getGroupGlow,
    getShadowClip,
    joinsShadowKey,
    renderShadowless,
} from './shadowEngine';
import { Shape } from './shape/shape';

/** The children that follow one another and cast the same slots, each slot with the shadow options and clip of the run. */
interface Run {
    shadow: ShadowKey | undefined;
    glow: ShadowKey | undefined;
    readonly members: ShadowCaster[];
}

/**
 * Whether `next` casts the slot as the run does: not at all, or with a shadow and clip that join the run's key.
 * A `lenient` run also holds a child that casts a slot that the run does not, or does not cast one that it does.
 */
function joinsSlot(
    key: ShadowKey | undefined,
    next: Node,
    shadow: NormalisedDropShadowOptions | undefined,
    clip: ShadowClip | undefined,
    scope: ShadowScope,
    lenient: boolean
): boolean {
    if (key == null || shadow == null) return lenient || (key == null && shadow == null);
    return joinsShadowKey(key, next, shadow, clip, scope);
}

/**
 * Renders the children of a group, casting the shadows and glows of each run of children that share them with one blur.
 * A run casts its shadow before its glow, so that a shadow never darkens a glow. A `lenient` run also holds the shapes
 * that cast nothing, so that a glow is never drawn over one that is in its run, wherever it is.
 */
export function renderChildrenWithShadowBatches(
    children: Iterable<Node>,
    scene: object | undefined,
    user: object,
    renderCtx: RenderContext,
    scope: ShadowScope = 'run',
    lenient: boolean = false
): void {
    const { stats } = renderCtx;
    let run: Run | undefined;
    let casts = 0;

    const flush = () => {
        if (run == null) return;

        const { shadow, glow, members } = run;
        const keys = [shadow, glow].filter((key): key is ShadowKey => key != null);
        if (castShadows({ scene, user, keys, index: casts++ }, renderCtx)) {
            renderShadowless(members, renderCtx);
        } else {
            // The shadow can't be cast (no context, an empty layer or a non-finite shadow): the casters cast for themselves.
            for (const caster of members) caster.isolatedRender(renderCtx);
        }
        run = undefined;
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
        const glow = getBatchedShadow(child, 'glow');
        const castsAny = shadow != null || glow != null;
        if (lenient && !castsAny && child instanceof Shape && child.__drawingMode !== 'cutout') {
            run ??= { shadow: undefined, glow: undefined, members: [] };
            run.members.push(child as ShadowCaster);
            continue;
        }

        const clip = castsAny ? getShadowClip(child) : undefined;
        // A child that casts nothing, or one that does not continue the run in each slot, ends it.
        if (
            run != null &&
            (!castsAny ||
                !joinsSlot(run.shadow, child, shadow, clip, scope, lenient) ||
                !joinsSlot(run.glow, child, glow, clip, scope, lenient))
        ) {
            flush();
        }
        if (!castsAny) {
            child.isolatedRender(renderCtx);
            continue;
        }

        run ??= { shadow: undefined, glow: undefined, members: [] };
        if (shadow != null) {
            run.shadow ??= { slot: 'shadow', shadow, clip, casters: [] };
            run.shadow.casters.push(child as ShadowCaster);
        }
        if (glow != null) {
            run.glow ??= { slot: 'glow', shadow: glow, clip, casters: [] };
            run.glow.casters.push(child as ShadowCaster);
        }
        run.members.push(child as ShadowCaster);
    }
    flush();
    endShadowCasts(user, casts);
}

/** Where a group casts the glows that it batches itself, though a shadow root covers it. */
export interface GroupGlowCast {
    readonly scene: object | undefined;
    readonly user: object;
}

/**
 * Renders the children of a group whose casters cast through a shadow root, each without a shadow of its own. With
 * `groupGlow`, the glows that {@link getGroupGlow} gives are not the root's: each run of children that share one is cast
 * here, beneath the run, so a glow never covers an item of the run, and is in the layer of the group. Every shape that
 * is not a cutout is in a run once the group has such a glow, as a hovered item that casts none would end it.
 */
export function renderChildrenWithSuppressedShadows(
    children: Iterable<Node>,
    renderCtx: RenderContext,
    casts: (node: Node) => boolean,
    groupGlow?: GroupGlowCast
): void {
    const { stats } = renderCtx;
    let run: Node[] = [];
    let glow: ShadowKey | undefined;
    let glowCasts = 0;

    const flush = () => {
        if (run.length === 0) return;
        // A glow that can't be cast is left out: its casters have none of their own to fall back on.
        if (glow != null && groupGlow != null) {
            castShadows({ scene: groupGlow.scene, user: groupGlow.user, keys: [glow], index: glowCasts++ }, renderCtx);
        }
        renderShadowless(run, renderCtx);
        run = [];
        glow = undefined;
    };

    for (const child of children) {
        if (!child.visible) {
            if (stats) {
                stats.nodesSkipped += child.childNodeCounts.nonGroups + child.childNodeCounts.groups;
                stats.opsSkipped += child.childNodeCounts.complexity;
            }
            continue;
        }

        const childGlow = groupGlow == null ? undefined : getGroupGlow(child);
        if (childGlow != null) {
            const clip = getShadowClip(child);
            if (glow != null && !joinsShadowKey(glow, child, childGlow, clip, 'run')) flush();
            glow ??= { slot: 'glow', shadow: childGlow, clip, casters: [] };
            glow.casters.push(child as ShadowCaster);
            run.push(child);
            continue;
        }

        if (casts(child) || (groupGlow != null && child instanceof Shape && child.__drawingMode !== 'cutout')) {
            run.push(child);
            continue;
        }
        flush();
        child.isolatedRender(renderCtx);
    }
    flush();
    if (groupGlow != null) endShadowCasts(groupGlow.user, glowCasts);
}
