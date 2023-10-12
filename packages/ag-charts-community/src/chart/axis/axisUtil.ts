import { FROM_TO_MIXINS, type NodeUpdateState } from '../../motion/fromToMotion';
import type { Line } from '../../scene/shape/line';
import type { Text } from '../../scene/shape/text';

type AxisAnimationContext = { visible: boolean; min: number; max: number };
type AxisNodeDatum = { translationY: number; tickId: string; visible: boolean };
export function prepareAxisAnimationContext(axis: { range: number[] }): AxisAnimationContext {
    const requestedRangeMin = Math.min(...axis.range);
    const requestedRangeMax = Math.max(...axis.range);

    const min = Math.floor(requestedRangeMin);
    const max = Math.ceil(requestedRangeMax);
    const visible = min !== max;

    return { min, max, visible };
}

export function prepareAxisAnimationFunctions<T extends AxisNodeDatum>(ctx: AxisAnimationContext) {
    const { min, max } = ctx;
    const outOfBounds = (datum: { translationY: number }) => {
        const translationY = Math.round(datum.translationY);
        return translationY < min || translationY > max;
    };
    const fromFn = (node: Line | Text, datum: T, status: NodeUpdateState) => {
        // Default to starting at the same position that the node is currently in.

        const source = { translationY: Math.round(node.translationY), opacity: node.opacity };
        if (status !== 'removed' && outOfBounds(datum)) {
            status = 'removed';
        } else if (status !== 'added' && outOfBounds(node)) {
            status = 'added';
        }

        if (status === 'added') {
            source.translationY = Math.round(datum.translationY);
            source.opacity = 0;
        }

        return { ...source, ...FROM_TO_MIXINS[status] };
    };
    const toFn = (_node: Line | Text, datum: T, status: NodeUpdateState) => {
        const target = { translationY: Math.round(datum.translationY), opacity: 1 };
        if (status === 'removed') {
            target.opacity = 0;
        }
        return target;
    };
    const intermediateFn = (node: Line | Text, _datum: T, _status: NodeUpdateState) => {
        return { visible: !outOfBounds(node) };
    };

    return { toFn, fromFn, intermediateFn };
}

export function resetAxisSelectionFn(ctx: AxisAnimationContext) {
    const { visible: rangeVisible, min, max } = ctx;

    return (_node: Line | Text, datum: AxisNodeDatum) => {
        const translationY = Math.round(datum.translationY);

        const visible = rangeVisible && translationY >= min && translationY <= max;
        return {
            translationY,
            opacity: 1,
            visible,
        };
    };
}
