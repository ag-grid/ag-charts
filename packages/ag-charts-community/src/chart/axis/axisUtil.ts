import { FROM_TO_MIXINS, type NodeUpdateState } from '../../motion/fromToMotion';
import type { Line } from '../../scene/shape/line';
import type { Text } from '../../scene/shape/text';

type AxisAnimationContext = { visible: boolean; min: number; max: number };
type AxisNodeDatum = { translationY: number; tickId: string };
export function prepareAxisAnimationContext(axis: { range: number[] }): AxisAnimationContext {
    const requestedRangeMin = Math.min(...axis.range);
    const requestedRangeMax = Math.max(...axis.range);

    const min = Math.floor(requestedRangeMin);
    const max = Math.ceil(requestedRangeMax);
    const visible = min !== max;

    return { min, max, visible };
}

export function prepareAxisAnimationFunctions<T extends AxisNodeDatum>(_ctx: AxisAnimationContext) {
    const fromFn = (node: Line | Text, datum: T, status: NodeUpdateState) => {
        // Default to starting at the same position that the node is currently in.
        const source = { translationY: node.translationY, opacity: node.opacity, ...FROM_TO_MIXINS[status] };

        if (status === 'added') {
            source.translationY = Math.round(datum.translationY);
            source.opacity = 0;
        }

        return source;
    };
    const toFn = (_node: Line | Text, datum: T, status: NodeUpdateState) => {
        const target = { translationY: Math.round(datum.translationY), opacity: 1 };
        if (status === 'removed') {
            target.opacity = 0;
        }
        return target;
    };

    return { toFn, fromFn };
}

export function resetAxisSelectionFn(ctx: AxisAnimationContext) {
    const { visible: rangeVisible, min, max } = ctx;

    return (_node: Line | Text, datum: AxisNodeDatum) => {
        let translationY = Math.round(datum.translationY);

        if (translationY < min) {
            translationY = min;
        }
        if (translationY > max) {
            translationY = max;
        }

        const visible = rangeVisible && translationY >= min && translationY <= max;
        return {
            translationY,
            opacity: 1,
            visible,
        };
    };
}
