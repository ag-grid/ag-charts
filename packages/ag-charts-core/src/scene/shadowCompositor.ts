import type { Node, RenderContext } from './node';
import {
    type ShadowCaster,
    type ShadowKey,
    type ShadowScope,
    castShadows,
    endShadowCasts,
    getBatchedShadow,
    getShadowClip,
    joinsShadowKey,
    renderShadowless,
} from './shadowEngine';

/**
 * Layer shadow compositor.
 *
 * Draws the children of a group as the shadow engine needs them: each run of consecutive children that share their shadow
 * options is cast as one key, beneath all of the run's items, and then drawn without a shadow. Runs end at a node that
 * casts no batched shadow, at a `cutout` node, and at a change of shadow options, of the clip of a path and, in a group
 * that batches by layer, of `zIndex`. A series gives its items a `zIndex` where one layer paints over another, like the
 * depths of a treemap, so the shadow of an upper layer still lands on the lower one.
 */

/**
 * Renders the children of a group, casting the shadows of each run of children that share a shadow with one blur.
 */
export function renderChildrenWithShadowBatches(
    children: Iterable<Node>,
    scene: object | undefined,
    user: object,
    renderCtx: RenderContext,
    scope: ShadowScope = 'run'
): void {
    const { stats } = renderCtx;
    let run: ShadowKey | undefined;
    let casts = 0;

    const flush = () => {
        if (run == null) return;

        const { casters } = run;
        if (castShadows({ scene, user, keys: [run], index: casts++ }, renderCtx)) {
            renderShadowless(casters, renderCtx);
        } else {
            // The shadow can't be cast (no context, an empty layer or a non-finite shadow): the casters cast for themselves.
            for (const caster of casters) caster.isolatedRender(renderCtx);
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
        const clip = shadow == null ? undefined : getShadowClip(child);
        // A child that casts no shadow, or one that does not continue the run, ends it.
        if (run != null && (shadow == null || !joinsShadowKey(run, child, shadow, clip, scope))) flush();
        if (shadow == null) {
            child.isolatedRender(renderCtx);
            continue;
        }

        run ??= { shadow, clip, casters: [] };
        run.casters.push(child as ShadowCaster);
    }
    flush();
    endShadowCasts(user, casts);
}
