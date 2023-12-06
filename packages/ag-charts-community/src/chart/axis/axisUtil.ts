import { FROM_TO_MIXINS } from '../../motion/fromToMotion';
import type { FromToMotionPropFn, NodeUpdateState } from '../../motion/fromToMotion';
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

type WithTranslationY = { translationY: number; range?: number[] };
export function prepareAxisAnimationFunctions<T extends AxisNodeDatum>(ctx: AxisAnimationContext) {
    const outOfBounds = (datum: WithTranslationY) => {
        const min = Math.min(...(datum.range ?? [ctx.min]));
        const max = Math.max(...(datum.range ?? [ctx.max]));
        const translationY = Math.round(datum.translationY);
        return translationY < min || translationY > max;
    };
    const calculateStatus = (
        datum: WithTranslationY,
        nodeDatum: WithTranslationY,
        status: NodeUpdateState
    ): NodeUpdateState => {
        if (status !== 'removed' && outOfBounds(datum)) {
            return 'removed';
        } else if (status !== 'added' && outOfBounds(nodeDatum)) {
            return 'added';
        }
        return status;
    };
    const fromBase = (node: Line | Text, datum: WithTranslationY, status: NodeUpdateState) => {
        // Default to starting at the same position that the node is currently in.
        const source = { translationY: Math.round(node.translationY), opacity: node.opacity };
        status = calculateStatus(datum, node.datum, status);

        if (status === 'added') {
            source.translationY = Math.round(datum.translationY);
            source.opacity = 0;
        }

        return { ...source, ...FROM_TO_MIXINS[status] };
    };
    const toBase = (_node: Line | Text, datum: WithTranslationY, status: NodeUpdateState) => {
        const target = { translationY: Math.round(datum.translationY), opacity: 1 };
        if (status === 'removed') {
            target.opacity = 0;
        }
        return target;
    };
    const tick = {
        fromFn: fromBase,
        toFn: toBase,
        intermediateFn: (node: Line | Text, _datum: T, _status: NodeUpdateState) => {
            return { visible: !outOfBounds(node) };
        },
    };

    const label = {
        fromFn: ((node: Text, newDatum: AxisLabelDatum, status: NodeUpdateState) => {
            const datum: AxisLabelDatum = node.previousDatum ?? newDatum;
            let rotation = datum.rotation;
            if (status === 'added' || status === 'removed') {
                rotation = newDatum.rotation;
            }
            return {
                ...fromBase(node, newDatum, status),
                x: datum.x,
                y: datum.y,
                rotation,
                rotationCenterX: datum.rotationCenterX,
            };
        }) as FromToMotionPropFn<Text, Partial<Omit<AxisLabelDatum, 'range'>>, AxisLabelDatum>,
        toFn: ((node: Text, datum: AxisLabelDatum, status: NodeUpdateState) => {
            let rotation;
            if (status === 'added' || status === 'removed') {
                rotation = datum.rotation;
            } else {
                rotation = normaliseEndRotation(node.previousDatum?.rotation ?? datum.rotation, datum.rotation);
            }
            return {
                ...toBase(node, datum, status),
                x: datum.x,
                y: datum.y,
                rotation,
                rotationCenterX: datum.rotationCenterX,
                finish: { rotation: datum.rotation },
            };
        }) as FromToMotionPropFn<Text, Partial<Omit<AxisLabelDatum, 'range'>>, AxisLabelDatum>,
    };
    const line = {
        fromFn: (node: Line, datum: AxisLineDatum) => {
            return {
                ...(node.previousDatum ?? datum ?? { y: node.y, x1: node.x1, x2: node.x2 }),
                ...FROM_TO_MIXINS['updated'],
            };
        },
        toFn: (_node: Line, datum: AxisLineDatum) => {
            return { ...datum };
        },
    };
    const group = {
        fromFn: (group: Group, _datum: AxisGroupDatum) => {
            const { rotation, translationX, translationY } = group;
            return {
                rotation,
                translationX,
                translationY,
                ...FROM_TO_MIXINS['updated'],
            };
        },
        toFn: (_group: Group, datum: AxisGroupDatum) => {
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
