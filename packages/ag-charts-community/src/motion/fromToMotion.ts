import type { ProcessedOutputDiff } from '../chart/data/dataModel';
import type { AnimationManager } from '../chart/interaction/animationManager';
import type { Node } from '../scene/node';
import type { Selection } from '../scene/selection';
import type { Interpolating } from '../util/interpolating';
import { zipObject } from '../util/zip';
import { deconstructSelectionsOrNodes } from './animation';
import type { AnimationPhase, AnimationValue } from './animation';
import * as easing from './easing';

export type NodeUpdateState = 'unknown' | 'added' | 'removed' | 'updated';
export const NODE_UPDATE_PHASES: NodeUpdateState[] = ['removed', 'updated', 'added'];

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
type IntermediateFn<N extends Node, D> = (
    node: N,
    datum: D,
    state: NodeUpdateState,
    ctx: FromToMotionPropFnContext<N>
) => Partial<N>;

export const NODE_UPDATE_STATE_TO_PHASE_MAPPING: Record<NodeUpdateState, AnimationPhase> = {
    added: 'add',
    updated: 'update',
    removed: 'remove',
    unknown: 'initial',
};

export type FromToDiff = Pick<ProcessedOutputDiff, 'added' | 'removed'>;

export interface FromToFns<
    N extends Node,
    T extends Record<string, string | number | Interpolating | undefined> & Partial<N>,
    D,
> {
    fromFn: FromToMotionPropFn<N, T, D>;
    toFn: FromToMotionPropFn<N, T, D>;
    intermediateFn?: IntermediateFn<N, D>;
}

/**
 * Implements a per-node "to/from" animation, with support for detection of added/moved/removed
 * nodes.
 *
 * @param id prefix for all animation ids generated by this call
 * @param animationManager used to schedule generated animations
 * @param selections contains nodes to be animated
 * @param fromFn callback to determine per-node starting properties
 * @param toFn callback to determine per-node final properties
 * @param extraOpts optional additional animation properties to pass to AnimationManager#animate.
 * @param getDatumId optional per-datum 'id' generation function for diff calculation - must be
 *                   specified iff diff is specified
 * @param diff optional diff from a DataModel to use to detect added/moved/removed cases
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
    const { fromFn, toFn, intermediateFn } = fns;
    const { nodes, selections } = deconstructSelectionsOrNodes(selectionsOrNodes);

    // Dynamic case with varying add/update/remove behavior.
    const ids = { added: {}, removed: {} };
    if (getDatumId && diff) {
        ids.added = zipObject(diff.added, true);
        ids.removed = zipObject(diff.removed, true);
    }

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
                status = calculateStatus(node, node.datum, getDatumId, ids);
            }

            const { phase, start, finish, delay, duration, ...from } = fromFn(node, node.datum, status, ctx);
            const {
                phase: toPhase,
                start: toStart,
                finish: toFinish,
                delay: toDelay,
                duration: toDuration,
                ...to
            } = toFn(node, node.datum, status, ctx);

            const collapsable = finish == null && toFinish == null;
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
                    node.setProperties({ ...start, ...toStart } as unknown as T);
                },
                onUpdate(props) {
                    node.setProperties(props);
                    if (intermediateFn) {
                        node.setProperties(intermediateFn(node, node.datum, status, ctx));
                    }
                },
                onStop: () => {
                    node.setProperties({ ...to, ...finish, ...toFinish } as unknown as T);
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
 * Implements a batch "to/from" animation.
 *
 * @param id prefix for all animation ids generated by this call
 * @param animationManager used to schedule generated animations
 * @param selectionsOrNodes contains nodes to be animated
 * @param from node starting properties
 * @param to node final properties
 * @param extraOpts optional additional animation properties to pass to AnimationManager#animate.
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
    const collapsable = finish == null;
    animationManager.animate({
        id: `${groupId}_${subId}`,
        groupId,
        phase: phase ?? 'update',
        from,
        to,
        ease: easing.easeOut,
        collapsable,
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
            }
        },
    });
}

function calculateStatus<N extends Node, D>(
    node: N,
    datum: D,
    getDatumId: (node: N, datum: D) => string,
    ids: {
        added: Record<string, true>;
        removed: Record<string, true>;
    }
): NodeUpdateState {
    const id = getDatumId(node, datum);

    if (ids.added[id]) {
        return 'added';
    }

    // NOTE: This function is only called for LIVE scene graph nodes, so returning a status of
    // 'removed' is nonsensical and incorrect.
    return 'updated';
}
