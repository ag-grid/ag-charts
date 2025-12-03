import type { Scale } from 'ag-charts-core';
import { checkDatum } from 'ag-charts-core';
import type {
    AgBaseCrossLineLabelOptions,
    AgCrossLineLabelPosition,
    AgTimeInterval,
    AgTimeIntervalUnit,
} from 'ag-charts-types';

import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import type { Group } from '../../scene/group';
import type { ChartAxisDirection } from 'ag-charts-core';

export type CrossLineType = 'line' | 'range';

interface ICrossLine {
    type: CrossLineType;
    range?: [unknown, unknown];
    value?: unknown;
}

export function getCrossLineValue(crossLine: ICrossLine) {
    switch (crossLine.type) {
        case 'line':
            return crossLine.value;
        case 'range':
            return crossLine.range;
    }
}

export function validateCrossLineValue(crossLine: ICrossLine, scale: Scale<any, number>): boolean {
    const value = getCrossLineValue(crossLine);

    if (value == null) {
        return false;
    }

    const isContinuous = ContinuousScale.is(scale) || DiscreteTimeScale.is(scale);
    const validValue = (val: unknown) =>
        checkDatum(val, isContinuous) && !Number.isNaN(scale.convert(val, { clamp: true }));

    if (crossLine.type === 'range') {
        const [start, end] = value as [unknown, unknown];
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
    scale?: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>;
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
