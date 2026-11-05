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
    getShadowClip,
    joinsShadowKey,
    renderShadowless,
} from './shadowEngine';

/** The children that follow one another and cast the same slots, each slot with the shadow options and clip of the run. */
interface Run {
    readonly shadow: ShadowKey | undefined;
    readonly glow: ShadowKey | undefined;
    readonly members: ShadowCaster[];
}

/** Whether `next` casts the slot as the run does: not at all, or with a shadow and clip that join the run's key. */
function joinsSlot(
    key: ShadowKey | undefined,
    next: Node,
    shadow: NormalisedDropShadowOptions | undefined,
    clip: ShadowClip | undefined,
    scope: ShadowScope
): boolean {
    if (key == null || shadow == null) return key == null && shadow == null;
    return joinsShadowKey(key, next, shadow, clip, scope);
}

/**
 * Renders the children of a group, casting the shadows and glows of each run of children that share them with one blur.
 * A run casts its shadow before its glow, so that a shadow never darkens a glow.
 */
export function renderChildrenWithShadowBatches(
    children: Iterable<Node>,
    scene: object | undefined,
    user: object,
    renderCtx: RenderContext,
    scope: ShadowScope = 'run'
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
        const clip = castsAny ? getShadowClip(child) : undefined;
        // A child that casts nothing, or one that does not continue the run in each slot, ends it.
        if (
            run != null &&
            (!castsAny ||
                !joinsSlot(run.shadow, child, shadow, clip, scope) ||
                !joinsSlot(run.glow, child, glow, clip, scope))
        ) {
            flush();
        }
        if (!castsAny) {
            child.isolatedRender(renderCtx);
            continue;
        }

        run ??= {
            shadow: shadow == null ? undefined : { slot: 'shadow', shadow, clip, casters: [] },
            glow: glow == null ? undefined : { slot: 'glow', shadow: glow, clip, casters: [] },
            members: [],
        };
        run.shadow?.casters.push(child as ShadowCaster);
        run.glow?.casters.push(child as ShadowCaster);
        run.members.push(child as ShadowCaster);
    }
    flush();
    endShadowCasts(user, casts);
}

/** Renders the children of a group whose casters cast through a shadow root, each without a shadow of its own. */
export function renderChildrenWithSuppressedShadows(
    children: Iterable<Node>,
    renderCtx: RenderContext,
    casts: (node: Node) => boolean
): void {
    const { stats } = renderCtx;
    let run: Node[] = [];

    const flush = () => {
        if (run.length === 0) return;
        renderShadowless(run, renderCtx);
        run = [];
    };

    for (const child of children) {
        if (!child.visible) {
            if (stats) {
                stats.nodesSkipped += child.childNodeCounts.nonGroups + child.childNodeCounts.groups;
                stats.opsSkipped += child.childNodeCounts.complexity;
            }
            continue;
        }

        if (casts(child)) {
            run.push(child);
            continue;
        }
        flush();
        child.isolatedRender(renderCtx);
    }
    flush();
}
