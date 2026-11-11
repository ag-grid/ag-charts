import { Color, type Node, type SelectionInterface, easeOut } from 'ag-charts-core';

import type { AnimationManager } from '../chart/interaction/animationManager';
import type { AnimationPhase } from './animation';
import type { NodeUpdateState } from './fromToMotion';

type GroupedProps = object;

export interface GroupedFromToFns<D, N extends Node<D>, T extends GroupedProps> {
    /**
     * Properties each node starts from. Nodes returning the same object share an animation, so return shared objects
     * where nodes display the same properties. Removed nodes report `removed`; added nodes are for `fromFn` to detect.
     */
    fromFn: (node: N, datum: D, status: NodeUpdateState) => T;
    /** Properties each node ends at; shared objects, as for {@link fromFn}. */
    toFn: (node: N, datum: D, status: NodeUpdateState) => T;
    applyFn: (node: N, props: T, status: 'start' | 'update' | 'end') => void;
    /** Values that properties absent from one side take, so that they can still interpolate. */
    defaults?: Partial<Record<keyof T, number>>;
    /**
     * Properties a node takes over from another node that displayed them in its place, which it restarts from even if
     * its destination is unchanged.
     */
    takeoverFn?: (node: N, datum: D, status: NodeUpdateState) => T | undefined;
}

interface MotionGroup<N> {
    readonly id: string;
    readonly to: GroupedProps;
    readonly nodes: Set<N>;
    /** Selections whose removed nodes are in the group, to clean up once none of their removed nodes animate. */
    readonly removedFrom: SelectionInterface<unknown, Node>[];
}

/** The running group of each animating node. */
const nodeGroups = new WeakMap<Node, MotionGroup<Node>>();
let nextGroupId = 0;

/**
 * A "from/to" animation like {@link fromToMotion}, for animations of many nodes between few distinct sets of
 * properties, such as restyling nodes between highlight states. Nodes are grouped by the objects `fromFn` and `toFn`
 * return, and each group plays one animation, so the cost of starting it grows with the number of groups, not nodes.
 *
 * Numbers and colours interpolate; other properties take their final value from the start. Removed nodes play out,
 * then their selections are cleaned up, unless `cleanupRemoved` is false because another motion owns their removal.
 *
 * A node whose `toFn` result is unchanged keeps its running animation, so it arrives when it would have anyway. Other
 * nodes leave theirs without jumping to its end, so `fromFn` should report what nodes currently display.
 */
export function groupedFromToMotion<D, N extends Node<D>, T extends GroupedProps>(
    groupId: string,
    subId: string,
    animationManager: AnimationManager,
    selections: SelectionInterface<D, N>[],
    fns: GroupedFromToFns<D, N, T>,
    { phase = 'transition', cleanupRemoved = true }: { phase?: AnimationPhase; cleanupRemoved?: boolean } = {}
) {
    const { fromFn, toFn, applyFn, defaults, takeoverFn } = fns;

    const pending = new Map<T, Map<T, N[]>>();
    const removedFrom: SelectionInterface<D, N>[] = [];
    for (const selection of selections) {
        for (const node of selection.nodes()) {
            const removed = selection.isGarbage(node);
            const status: NodeUpdateState = removed ? 'removed' : 'updated';
            const datum = node.unsafeDatum as D;
            if (removed && cleanupRemoved && !removedFrom.includes(selection)) {
                removedFrom.push(selection);
            }

            const to = toFn(node, datum, status);
            const takeover = takeoverFn?.(node, datum, status);
            const current = nodeGroups.get(node);
            if (takeover == null && current?.to === to) continue;
            if (current != null) leaveGroup(current, node);

            const from = takeover ?? fromFn(node, datum, status);
            let byTo = pending.get(from);
            if (byTo == null) {
                byTo = new Map();
                pending.set(from, byTo);
            }
            let nodes = byTo.get(to);
            if (nodes == null) {
                nodes = [];
                byTo.set(to, nodes);
            }
            nodes.push(node);
        }
    }

    for (const [from, byTo] of pending) {
        for (const [to, nodes] of byTo) {
            animateGroup(from, to, nodes);
        }
    }
    for (const selection of removedFrom) {
        cleanupIfSettled(selection);
    }

    function leaveGroup(group: MotionGroup<Node>, node: Node) {
        group.nodes.delete(node);
        nodeGroups.delete(node);
        if (group.nodes.size === 0) {
            animationManager.abandonAnimation(group.id);
        }
    }

    function animateGroup(from: T, to: T, nodes: N[]) {
        const { fromProps, toProps, frame } = splitInterpolable(from, to, defaults);
        if (Object.keys(toProps).length === 0) {
            for (const node of nodes) {
                applyFn(node, to, 'end');
            }
            return;
        }

        const group: MotionGroup<N> = {
            id: `${groupId}_${subId}_${nextGroupId++}`,
            to,
            nodes: new Set(nodes),
            removedFrom: [],
        };
        for (const selection of removedFrom) {
            if (nodes.some((node) => selection.isGarbage(node))) {
                group.removedFrom.push(selection as SelectionInterface<unknown, Node>);
            }
        }
        const applyAll = (props: GroupedProps, status: 'start' | 'update' | 'end') => {
            for (const node of group.nodes) {
                applyFn(node, props as T, status);
            }
        };

        for (const node of nodes) {
            nodeGroups.set(node, group as MotionGroup<Node>);
        }
        applyAll(frame, 'start');

        animationManager.animate({
            id: group.id,
            groupId,
            phase,
            from: fromProps,
            to: toProps,
            ease: easeOut,
            collapsable: false,
            onUpdate(props) {
                Object.assign(frame, props);
                applyAll(frame, 'update');
            },
            onStop() {
                for (const node of group.nodes) {
                    nodeGroups.delete(node);
                }
                applyAll(to, 'end');
                for (const selection of group.removedFrom) {
                    cleanupIfSettled(selection);
                }
            },
        });
    }
}

/** Remove a selection's removed nodes once none of them is still animating. */
function cleanupIfSettled<D, N extends Node<D>>(selection: SelectionInterface<D, N>) {
    for (const node of selection.nodes()) {
        if (selection.isGarbage(node) && nodeGroups.has(node)) return;
    }
    selection.cleanup();
}

/**
 * The properties of `from` and `to` that interpolate, and a `frame` holding the start of the animation: `to`, with the
 * interpolating properties at their `from` values.
 */
function splitInterpolable(
    from: GroupedProps,
    to: GroupedProps,
    defaults: Partial<Record<PropertyKey, number>> | undefined
) {
    const fromRecord = from as Record<string, unknown>;
    const toRecord = to as Record<string, unknown>;
    const fromProps: Record<string, number | string> = {};
    const toProps: Record<string, number | string> = {};
    const frame: Record<string, unknown> = { ...toRecord };

    for (const key of new Set([...Object.keys(fromRecord), ...Object.keys(toRecord)])) {
        const a = fromRecord[key] ?? defaults?.[key];
        const b = toRecord[key] ?? defaults?.[key];
        if (a === b) continue;

        const interpolable =
            (typeof a === 'number' && typeof b === 'number') ||
            (typeof a === 'string' && typeof b === 'string' && Color.validColorString(a) && Color.validColorString(b));
        if (!interpolable) continue;

        fromProps[key] = a;
        toProps[key] = b;
        frame[key] = a;
    }

    return { fromProps, toProps, frame };
}
