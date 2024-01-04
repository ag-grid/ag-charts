import { FROM_TO_MIXINS } from '../../motion/fromToMotion';
import type { FromToFns } from '../../motion/fromToMotion';
import type { Group } from '../../scene/group';
import type { Line } from '../../scene/shape/line';
import type { Text } from '../../scene/shape/text';

export type AxisLineDatum = { x: number; y1: number; y2: number };
export type AxisDatum = {
    translationY: number;
    translationX?: number;
};

type AxisAnimationContext = { visible: boolean; min: number; max: number };
type AxisGroupDatum = {
    rotation: number;
    rotationCenterX: number;
    rotationCenterY: number;
    translationX: number;
    translationY: number;
};
type AxisNodeDatum = {
    translationY: number;
    tickId: string;
    visible: boolean;
};
type AxisLabelDatum = {
    tickId: string;
    x: number;
    y: number;
    rotation: number;
    rotationCenterX: number;
    translationY: number;
    range: number[];
};

export function prepareAxisAnimationContext(axis: { range: number[] }): AxisAnimationContext {
    const requestedRangeMin = Math.min(...axis.range);
    const requestedRangeMax = Math.max(...axis.range);

    const min = Math.floor(requestedRangeMin);
    const max = Math.ceil(requestedRangeMax);
    const visible = min !== max;

    return { min, max, visible };
}

const fullCircle = Math.PI * 2;
const halfCircle = fullCircle / 2;
function normaliseEndRotation(start: number, end: number) {
    const directDistance = Math.abs(end - start);

    if (directDistance < halfCircle) return end;

    if (start > end) return end + fullCircle;
    return end - fullCircle;
}

export function prepareAxisAnimationFunctions(ctx: AxisAnimationContext) {
    const outOfBounds = (y: number, range?: number[]) => {
        const min = range != null ? Math.min(...range) : ctx.min;
        const max = range != null ? Math.max(...range) : ctx.max;
        return y < min || y > max;
    };

    const tick: FromToFns<Line, any, AxisNodeDatum> = {
        fromFn(node, datum, status) {
            // Default to starting at the same position that the node is currently in.
            let y = node.y1 + node.translationY;
            let opacity = node.opacity;

            if (status === 'added' || outOfBounds(node.datum.translationY, node.datum.range)) {
                y = datum.translationY;
                opacity = 0;
            }

            // Animate translationY so we don't constantly regenerate the line path data
            return { y: 0, translationY: y, opacity, ...FROM_TO_MIXINS[status] };
        },
        toFn(_node, datum, status) {
            const y = datum.translationY;
            let opacity = 1;

            if (status === 'removed') {
                opacity = 0;
            }

            return {
                y: 0,
                translationY: y,
                opacity,
                finish: {
                    // Set explicit y after animation so it's pixel aligned
                    y: y,
                    translationY: 0,
                },
            };
        },
        intermediateFn(node, _datum, _status) {
            return { visible: !outOfBounds(node.y) };
        },
    };

    const label: FromToFns<Text, Partial<Omit<AxisLabelDatum, 'range'>>, AxisLabelDatum> = {
        fromFn(node, newDatum, status) {
            const datum: AxisLabelDatum = node.previousDatum ?? newDatum;

            // Default to starting at the same position that the node is currently in.
            const x = datum.x;
            const y = datum.y;
            const rotationCenterX = datum.rotationCenterX;
            let translationY = Math.round(node.translationY);
            let rotation = datum.rotation;
            let opacity = node.opacity;

            if (status === 'removed' || outOfBounds(datum.y, datum.range)) {
                rotation = newDatum.rotation;
            } else if (status === 'added' || outOfBounds(node.datum.y, node.datum.range)) {
                translationY = Math.round(datum.translationY);
                opacity = 0;
                rotation = newDatum.rotation;
            }

            return { x, y, rotationCenterX, translationY, rotation, opacity, ...FROM_TO_MIXINS[status] };
        },
        toFn(node, datum, status) {
            const x = datum.x;
            const y = datum.y;
            const rotationCenterX = datum.rotationCenterX;
            const translationY = Math.round(datum.translationY);
            let rotation = 0;
            const opacity = 1;

            if (status === 'added' || status === 'removed') {
                rotation = datum.rotation;
            } else {
                rotation = normaliseEndRotation(node.previousDatum?.rotation ?? datum.rotation, datum.rotation);
            }

            return { x, y, rotationCenterX, translationY, rotation, opacity, finish: { rotation: datum.rotation } };
        },
    };
    const line: FromToFns<Line, any, AxisLineDatum> = {
        fromFn(node, datum) {
            return {
                ...(node.previousDatum ?? datum),
                ...FROM_TO_MIXINS['updated'],
            };
        },
        toFn(_node, datum) {
            return { ...datum };
        },
    };
    const group: FromToFns<Group, any, AxisGroupDatum> = {
        fromFn(group, _datum) {
            const { rotation, translationX, translationY } = group;
            return {
                rotation,
                translationX,
                translationY,
                ...FROM_TO_MIXINS['updated'],
            };
        },
        toFn(_group, datum) {
            const { rotation, translationX, translationY } = datum;
            return {
                rotation,
                translationX,
                translationY,
            };
        },
    };

    return { tick, line, label, group };
}

export function resetAxisGroupFn() {
    return (_node: Group, datum: AxisGroupDatum) => {
        return {
            rotation: datum.rotation,
            rotationCenterX: datum.rotationCenterX,
            rotationCenterY: datum.rotationCenterY,
            translationX: datum.translationX,
            translationY: datum.translationY,
        };
    };
}

export function resetAxisSelectionFn(ctx: AxisAnimationContext) {
    const { visible: rangeVisible, min, max } = ctx;

    return (_node: Line, datum: AxisNodeDatum) => {
        const y = datum.translationY;

        const visible = rangeVisible && y >= min && y <= max;
        return {
            y,
            translationY: 0,
            opacity: 1,
            visible,
        };
    };
}

export function resetAxisLabelSelectionFn() {
    return (_node: Text, datum: AxisLabelDatum) => {
        return {
            x: datum.x,
            y: datum.y,
            translationY: datum.translationY,
            rotation: datum.rotation,
            rotationCenterX: datum.rotationCenterX,
        };
    };
}

export function resetAxisLineSelectionFn() {
    return (_node: Line, datum: AxisLineDatum) => {
        return { ...datum };
    };
}
