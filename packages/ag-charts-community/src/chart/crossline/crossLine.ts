import { isArray } from 'ag-charts-core';
import type {
    AgBaseCrossLineLabelOptions,
    AgCrossLineLabelPosition,
    TimeInterval,
    TimeIntervalUnit,
} from 'ag-charts-types';

import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import type { Scale } from '../../scale/scale';
import type { Group } from '../../scene/group';
import { checkDatum } from '../../util/value';
import type { ChartAxisDirection } from '../chartAxisDirection';

export type CrossLineType = 'line' | 'range';

export function getCrossLineValue(crossLine: {
    type: CrossLineType;
    value?: unknown;
    range?: [unknown, unknown];
}): unknown {
    switch (crossLine.type) {
        case 'line':
            return crossLine.value;
        case 'range':
            return crossLine.range;
    }
}

export function validateCrossLineValue(value: unknown, scale: Scale<any, number>): boolean {
    if (value == null) {
        return false;
    }

    const isContinuous = ContinuousScale.is(scale) || DiscreteTimeScale.is(scale);
    const validValue = (val: unknown) => checkDatum(val, isContinuous) && !isNaN(scale.convert(val, { clamp: true }));

    if (isArray(value)) {
        const [start, end] = value;
        return validValue(start) && validValue(end);
    } else {
        return validValue(value);
    }
}

export interface CrossLine<LabelType = AgBaseCrossLineLabelOptions> {
    calculateLayout?(visible: boolean, reversedAxis?: boolean): void;
    calculatePadding?(padding: Partial<Record<AgCrossLineLabelPosition, number>>): void;
    clippedRange: [number, number];
    enabled?: boolean;
    defaultColorRange: string[];
    fill?: string;
    fillOpacity?: number;
    gridLength: number;
    lineGroup: Group;
    rangeGroup: Group;
    id: string;
    label: LabelType;
    labelGroup: Group;
    lineDash?: number[];
    range?: [any, any];
    scale?: Scale<any, number, number | TimeInterval | TimeIntervalUnit>;
    stroke?: string;
    strokeOpacity?: number;
    strokeWidth?: number;
    type: CrossLineType;
    update(visible: boolean): void;
    value?: any;
    set(properties: object): void;
}

export interface PolarCrossLine<LabelType = AgBaseCrossLineLabelOptions> extends CrossLine<LabelType> {
    direction: ChartAxisDirection;
    parallelFlipRotation: number;
    regularFlipRotation: number;
    sideFlag: 1 | -1;
}
