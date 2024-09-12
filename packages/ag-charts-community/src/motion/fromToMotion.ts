import type { AnimationManager } from '../chart/interaction/animationManager';
import type { Node } from '../scene/node';
import type { Selection } from '../scene/selection';
import type { Interpolating } from '../util/interpolating';
import type { AnimationPhase, AnimationValue } from './animation';
import { deconstructSelectionsOrNodes } from './animation';
import * as easing from './easing';

export type NodeUpdateState = 'unknown' | 'added' | 'removed' | 'updated' | 'no-op';

export type FromToMotionPropFnContext<T> = {
    last: boolean;
    lastLive: boolean;
    prev?: T;
    prevFromProps?: Partial<T>;
    next?: T;
    prevLive?: T;
    nextLive?: T;
};
export type ExtraOpts<T> = {
    phase: AnimationPhase;
    delay?: number;
    duration?: number;
    start?: Partial<T>;
    finish?: Partial<T>;
};
export type FromToMotionPropFn<
    N extends Node,
    T extends Record<string, string | number | Interpolating | undefined> & Partial<N>,
    D,
> = (node: N, datum: D, state: NodeUpdateState, ctx: FromToMotionPropFnContext<N>) => T & Partial<ExtraOpts<N>>;

export const NODE_UPDATE_STATE_TO_PHASE_MAPPING: Record<NodeUpdateState, AnimationPhase> = {
    added: 'add',
    updated: 'update',
    removed: 'remove',
    unknown: 'initial',
    'no-op': 'none',
};

export interface FromToDiff {
    changed: boolean;
    added: Set<string> | Map<string, any>;
    removed: Set<string> | Map<string, any>;
}

export interface FromToFns<
    N extends Node,
    T extends Record<string, string | number | Interpolating | undefined> & Partial<N>,
    D,
> {
    fromFn: FromToMotionPropFn<N, T, D>;
    toFn: FromToMotionPropFn<N, T, D>;
    applyFn?: (note: N, props: T) => void;
}

/**
 * Implements a per-node "from/to" animation, with support for detecting added, moved, and removed
 * nodes. Animates nodes based on their properties and state transitions, utilizing the provided
 * callbacks to determine the properties at different stages of the animation.
 *
 * @template N Node type, typically extending the base node class.
 * @template T Type of properties to be animated. Must be a record of properties with string, number,
 *             or interpolating values and must be partially assignable to N.
 * @template D Data type associated with each node.
 *
 * @param groupId A unique identifier for the group of animations.
 * @param subId A sub-identifier for animations related to this specific invocation.
 * @param animationManager Manager responsible for handling the animations.
 * @param selectionsOrNodes Array of either selections (containing nodes) or nodes themselves, to be animated.
 * @param fns Object containing the necessary callbacks for determining 'from' and 'to' properties:
 *            - fromFn: Callback to determine starting properties per node.
 *            - toFn: Callback to determine final properties per node.
 *            - intermediateFn: (optional) Callback for intermediate steps of animation.
 *            - applyFn: (optional) Function to apply the properties to the node. Defaults to setting
 *                       node properties directly.
 * @param getDatumId (Optional) Function for generating a unique identifier for each datum, used in
 *                   conjunction with the diff parameter to detect added/moved/removed cases.
 * @param diff (Optional) Diff data model used for detecting changes in the node state (added, moved, removed).
 */
export function fromToMotion<
    N extends Node,
    T extends Record<string, string | number | Interpolating | undefined> & Partial<N>,
    D,
>(
    groupId: string,
    subId: string,
    animationManager: AnimationManager,
    selectionsOrNodes: Selection<N, D>[] | N[],
    fns: FromToFns<N, T, D>,
    getDatumId?: (node: N, datum: D) => string,
    diff?: FromToDiff
) {
    const { fromFn, toFn, applyFn = (node, props) => node.setProperties(props) } = fns;
    const { nodes, selections } = deconstructSelectionsOrNodes(selectionsOrNodes);

    const processNodes = (liveNodes: N[], subNodes: N[]) => {
        let prevFromProps: T | undefined;
        let liveNodeIndex = 0;
        let nodeIndex = 0;
        for (const node of subNodes) {
            const isLive = liveNodes[liveNodeIndex] === node;
            const ctx: FromToMotionPropFnContext<N> = {
                last: nodeIndex >= subNodes.length - 1,
                lastLive: liveNodeIndex >= liveNodes.length - 1,
                prev: subNodes[nodeIndex - 1],
                prevFromProps,
                prevLive: liveNodes[liveNodeIndex - 1],
                next: subNodes[nodeIndex + 1],
                nextLive: liveNodes[liveNodeIndex + (isLive ? 1 : 0)],
            };
            const animationId = `${groupId}_${subId}_${node.id}`;

            animationManager.stopByAnimationId(animationId);

            let status: NodeUpdateState = 'unknown';
            if (!isLive) {
                status = 'removed';
            } else if (getDatumId && diff) {
                status = calculateStatus(node, node.datum, getDatumId, diff);
            }

            node.datum.fadeOut = status === 'removed';

            const { phase, start, finish, delay, duration, ...from } = fromFn(node, node.datum, status, ctx);
            const {
                phase: toPhase,
                start: toStart,
                finish: toFinish,
                delay: toDelay,
                duration: toDuration,
                ...to
            } = toFn(node, node.datum, status, ctx);

            const collapsable = finish == null;
            animationManager.animate({
                id: animationId,
                groupId,
                phase: phase ?? toPhase ?? 'update',
                duration: duration ?? toDuration,
                delay: delay ?? toDelay,
                from: from as unknown as T,
                to: to as unknown as T,
                ease: easing.easeOut,
                collapsable,
                onPlay: () => {
                    applyFn(node, { ...start, ...toStart, ...from } as unknown as T);
                },
                onUpdate(props) {
                    applyFn(node, props);
                },
                onStop: () => {
                    applyFn(node, {
                        ...start,
                        ...toStart,
                        ...from,
                        ...to,
                        ...finish,
                        ...toFinish,
                    } as unknown as T);
                },
            });

            if (isLive) {
                liveNodeIndex++;
            }
            nodeIndex++;
            prevFromProps = from as unknown as T;
        }
    };

    let selectionIndex = 0;
    for (const selection of selections) {
        const selectionNodes = selection.nodes();
        const liveNodes = selectionNodes.filter((n) => !selection.isGarbage(n));
        processNodes(liveNodes, selectionNodes);

        // Only perform selection cleanup once.
        animationManager.animate({
            id: `${groupId}_${subId}_selection_${selectionIndex}`,
            groupId,
            phase: 'end',
            from: 0,
            to: 1,
            ease: easing.easeOut,
            onStop() {
                selection.cleanup();
            },
        });
        selectionIndex++;
    }

    processNodes(nodes, nodes);
}

/**
 * Implements a batch "from/to" animation, where all nodes transition uniformly between a starting
 * and final set of properties. This is useful for static animations where the same properties
 * apply to all nodes in the batch.
 *
 * @template N Node type, typically extending the base node class.
 * @template T Type of properties to be animated. Must extend `AnimationValue` and be partially assignable to `N`.
 * @template D Data type associated with each node.
 *
 * @param groupId A unique identifier for the group of animations.
 * @param subId A sub-identifier for animations related to this specific invocation.
 * @param animationManager Manager responsible for handling the animations.
 * @param selectionsOrNodes Array of either selections (containing nodes) or nodes themselves, to be animated.
 * @param from Initial properties for the nodes at the start of the animation.
 * @param to Final properties for the nodes at the end of the animation.
 * @param extraOpts Optional additional animation properties, such as:
 *                  - start: Properties to apply when the animation starts.
 *                  - finish: Properties to apply when the animation ends.
 *                  - phase: Animation phase (e.g., 'update', 'enter', 'exit').
 */
export function staticFromToMotion<N extends Node, T extends AnimationValue & Partial<N> & object, D>(
    groupId: string,
    subId: string,
    animationManager: AnimationManager,
    selectionsOrNodes: Selection<N, D>[] | N[],
    from: T,
    to: T,
    extraOpts: ExtraOpts<N>
) {
    const { nodes, selections } = deconstructSelectionsOrNodes(selectionsOrNodes);
    const { start, finish, phase } = extraOpts;

    // Simple static to/from case, we can batch updates.
    animationManager.animate({
        id: `${groupId}_${subId}`,
        groupId,
        phase: phase ?? 'update',
        from,
        to,
        ease: easing.easeOut,
        onPlay: () => {
            if (!start) return;

            for (const node of nodes) {
                node.setProperties(start);
            }
            for (const selection of selections) {
                for (const node of selection.nodes()) {
                    node.setProperties(start);
                }
            }
        },
        onUpdate(props) {
            for (const node of nodes) {
                node.setProperties(props);
            }
            for (const selection of selections) {
                for (const node of selection.nodes()) {
                    node.setProperties(props);
                }
            }
        },
        onStop: () => {
            for (const node of nodes) {
                node.setProperties({ ...to, ...finish });
            }
            for (const selection of selections) {
                for (const node of selection.nodes()) {
                    node.setProperties({ ...to, ...finish });
                }
                selection.cleanup();
            }
        },
    });
}

function calculateStatus<N extends Node, D>(
    node: N,
    datum: D,
    getDatumId: (node: N, datum: D) => string,
    diff: FromToDiff
): NodeUpdateState {
    const id = getDatumId(node, datum);

    if (diff.added.has(id)) {
        return 'added';
    }

    if (diff.removed.has(id)) {
        return 'removed';
    }

    // NOTE: This function is only called for LIVE scene graph nodes, so returning a status of
    // 'removed' is nonsensical and incorrect.
    return 'updated';
}
