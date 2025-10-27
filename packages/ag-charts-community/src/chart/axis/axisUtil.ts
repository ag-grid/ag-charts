import type { Size } from 'ag-charts-core';
import { findMinMax } from 'ag-charts-core';
import type { TextOrSegments } from 'ag-charts-types';

import type { FromToFns } from '../../motion/fromToMotion';
import { NODE_UPDATE_STATE_TO_PHASE_MAPPING } from '../../motion/fromToMotion';
import type { Group, TranslatableGroup } from '../../scene/group';
import type { Line } from '../../scene/shape/line';
import type { Rect } from '../../scene/shape/rect';
import type { RotatableText } from '../../scene/shape/text';

export enum NiceMode {
    TickAndDomain,
    TicksOnly,
    Off,
}

export interface TickDatum {
    index: number;
    tickLabel: TextOrSegments | undefined;
    tick: any;
    tickId: string;
    translation: number;
    textUntruncated: string | undefined;
    isPrimary: boolean;
    textMetrics: Size;
}

export interface AxisLineDatum {
    tickId: string;
    offset: number;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    stroke: string | undefined;
    strokeWidth: number;
    lineDash: number[] | undefined;
}

export interface AxisFillDatum {
    tickId: string;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    fill: string | undefined;
    fillOpacity: number | undefined;
}

export interface AxisAnimationContext {
    visible: boolean;
    min: number;
    max: number;
}

interface AxisGroupDatum {
    rotation: number;
    rotationCenterX: number;
    rotationCenterY: number;
    translationX: number;
    translationY: number;
}

export interface AxisLabelDatum {
    tickId: string;
    x: number;
    y: number;
    rotationCenterX: number;
    rotationCenterY: number;
    rotation: number;
    range: number[];
}

export function prepareAxisAnimationContext(axis: { range: number[] }): AxisAnimationContext {
    const [requestedRangeMin, requestedRangeMax] = findMinMax(axis.range);
    const min = Math.floor(requestedRangeMin);
    const max = Math.ceil(requestedRangeMax);
    return { min, max, visible: min !== max };
}

const fullCircle = Math.PI * 2;
const halfCircle = fullCircle / 2;
function normaliseEndRotation(start: number, end: number) {
    const directDistance = Math.abs(end - start);
    if (directDistance < halfCircle) {
        return end;
    } else if (start > end) {
        return end + fullCircle;
    }
    return end - fullCircle;
}

export function prepareAxisAnimationFunctions(ctx: AxisAnimationContext) {
    const { min, max } = ctx;
    const outOfBounds = (y: number) => {
        return y < min || y > max;
    };
    const tick: FromToFns<Line, any, AxisLineDatum> = {
        fromFn(node, datum, status) {
            // Default to starting at the same position that the node is currently in.
            let { x1, x2, y1, y2 } = node;
            let opacity = node.opacity;

            if (status === 'added' || outOfBounds(datum.offset)) {
                ({ x1, x2, y1, y2 } = datum);
                opacity = 0;
            }

            return {
                x1,
                x2,
                y1,
                y2,
                opacity,
                phase: NODE_UPDATE_STATE_TO_PHASE_MAPPING[status],
            };
        },
        toFn(_node, datum, status) {
            const { x1, x2, y1, y2 } = datum;
            let opacity = 1;

            if (status === 'removed') {
                opacity = 0;
            }

            return { x1, x2, y1, y2, opacity };
        },
        applyFn(node, props) {
            node.setProperties(props);
            node.visible = !outOfBounds(node.y);
        },
    };

    const label: FromToFns<RotatableText, Partial<Omit<AxisLabelDatum, 'range'>>, AxisLabelDatum> = {
        fromFn(node, newDatum, status) {
            const datum: AxisLabelDatum = node.previousDatum ?? newDatum;

            // Default to starting at the same position that the node is currently in.
            let { x, y, rotationCenterX, rotationCenterY, rotation } = datum;
            let opacity = node.opacity;

            if (status === 'removed' || outOfBounds(datum.y)) {
                rotation = newDatum.rotation;
            } else if (status === 'added' || outOfBounds(node.datum.y)) {
                ({ x, y, rotationCenterX, rotationCenterY, rotation } = newDatum);
                opacity = 0;
            }

            return {
                x,
                y,
                rotationCenterX,
                rotationCenterY,
                rotation,
                opacity,
                phase: NODE_UPDATE_STATE_TO_PHASE_MAPPING[status],
            };
        },
        toFn(node, datum, status) {
            const { x, y, rotationCenterX, rotationCenterY } = datum;
            let rotation = 0;
            let opacity = 1;

            if (status === 'added') {
                rotation = datum.rotation;
            } else if (status === 'removed') {
                opacity = 0;
                rotation = datum.rotation;
            } else {
                rotation = normaliseEndRotation(node.previousDatum?.rotation ?? datum.rotation, datum.rotation);
            }

            return {
                x,
                y,
                rotationCenterX,
                rotationCenterY,
                rotation,
                opacity,
                finish: { rotation: datum.rotation },
            };
        },
    };
    const line: FromToFns<Line, any, AxisLineDatum> = {
        fromFn(node, datum) {
            // Default to starting at the same position that the node is currently in.
            const { x1, x2, y1, y2 } = node.previousDatum ?? datum;
            return {
                x1,
                x2,
                y1,
                y2,
                phase: NODE_UPDATE_STATE_TO_PHASE_MAPPING['updated'],
            };
        },
        toFn(_node, datum) {
            const { x1, x2, y1, y2 } = datum;
            return { x1, x2, y1, y2 };
        },
    };
    const group: FromToFns<TranslatableGroup, any, AxisGroupDatum> = {
        fromFn(node, _datum) {
            const { translationX, translationY } = node;
            return {
                translationX,
                translationY,
                phase: NODE_UPDATE_STATE_TO_PHASE_MAPPING['updated'],
            };
        },
        toFn(_node, datum) {
            const { translationX, translationY } = datum;
            return { translationX, translationY };
        },
    };

    return { tick, line, label, group };
}

export function resetAxisGroupFn() {
    return (_node: Group, datum: AxisGroupDatum) => {
        return {
            translationX: datum.translationX,
            translationY: datum.translationY,
        };
    };
}

export function resetAxisLabelSelectionFn() {
    return (_node: RotatableText, datum: AxisLabelDatum) => {
        return {
            x: datum.x,
            y: datum.y,
            rotationCenterX: datum.rotationCenterX,
            rotationCenterY: datum.rotationCenterY,
            rotation: datum.rotation,
        };
    };
}

export function resetAxisLineSelectionFn() {
    return (_node: Line, datum: AxisLineDatum) => {
        const { x1, x2, y1, y2 } = datum;
        return { x1, x2, y1, y2 };
    };
}

export function resetAxisFillSelectionFn() {
    return (_node: Rect, datum: AxisFillDatum) => {
        const { x1, x2, y1, y2 } = datum;
        return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
    };
}
