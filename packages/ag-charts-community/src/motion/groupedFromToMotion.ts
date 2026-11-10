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
}

interface MotionGroup<N> {
    readonly from: GroupedProps;
    readonly to: GroupedProps;
    readonly nodes: N[];
}

/**
 * A "from/to" animation like {@link fromToMotion}, for animations of many nodes between few distinct sets of
 * properties, such as restyling nodes between highlight states. Nodes are grouped by the objects `fromFn` and `toFn`
 * return, and each group plays one animation, so the cost of starting it grows with the number of groups, not nodes.
 *
 * Numbers and colours interpolate; other properties take their final value from the start. Removed nodes play out,
 * then their selections are cleaned up, unless `cleanupRemoved` is false because another motion owns their removal.
 *
 * In the `transition` phase, the motion supersedes the previous one with the same ids without jumping it to its end,
 * so `fromFn` should report what nodes currently display.
 */
export function groupedFromToMotion<D, N extends Node<D>, T extends GroupedProps>(
    groupId: string,
    subId: string,
    animationManager: AnimationManager,
    selections: SelectionInterface<D, N>[],
    fns: GroupedFromToFns<D, N, T>,
    { phase = 'transition', cleanupRemoved = true }: { phase?: AnimationPhase; cleanupRemoved?: boolean } = {}
) {
    const { fromFn, toFn, applyFn, defaults } = fns;
    const idPrefix = `${groupId}_${subId}_`;

    if (phase === 'transition') {
        animationManager.abandonTransitions(idPrefix);
    }

    const groups = new Map<T, Map<T, MotionGroup<N>>>();
    const cleanupSelections: SelectionInterface<D, N>[] = [];
    for (const selection of selections) {
        for (const node of selection.nodes()) {
            const removed = selection.isGarbage(node);
            const status: NodeUpdateState = removed ? 'removed' : 'updated';
            const datum = node.unsafeDatum as D;
            const from = fromFn(node, datum, status);
            const to = toFn(node, datum, status);

            let byTo = groups.get(from);
            if (byTo == null) {
                byTo = new Map();
                groups.set(from, byTo);
            }
            let group = byTo.get(to);
            if (group == null) {
                group = { from, to, nodes: [] };
                byTo.set(to, group);
            }
            group.nodes.push(node);

            if (removed && cleanupRemoved && !cleanupSelections.includes(selection)) {
                cleanupSelections.push(selection);
            }
        }
    }

    let remaining = 0;
    const groupStopped = () => {
        remaining--;
        if (remaining > 0) return;
        for (const selection of cleanupSelections) {
            selection.cleanup();
        }
    };

    let groupIndex = 0;
    for (const byTo of groups.values()) {
        for (const group of byTo.values()) {
            remaining++;
            animateGroup(group, `${idPrefix}${groupIndex++}`);
        }
    }
    if (remaining === 0) {
        remaining = 1;
        groupStopped();
    }

    function animateGroup({ from, to, nodes }: MotionGroup<N>, id: string) {
        const applyAll = (props: GroupedProps, status: 'start' | 'update' | 'end') => {
            for (const node of nodes) {
                applyFn(node, props as T, status);
            }
        };

        const { fromProps, toProps, frame } = splitInterpolable(from, to, defaults);
        if (Object.keys(toProps).length === 0) {
            applyAll(to, 'end');
            groupStopped();
            return;
        }
        applyAll(frame, 'start');

        animationManager.animate({
            id,
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
                applyAll(to, 'end');
                groupStopped();
            },
        });
    }
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
