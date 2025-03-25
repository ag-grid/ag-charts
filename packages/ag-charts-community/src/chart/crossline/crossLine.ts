import { isArray } from 'ag-charts-core';
import type { AgBaseCrossLineLabelOptions, AgCrossLineLabelPosition } from 'ag-charts-types';

import { ContinuousScale } from '../../scale/continuousScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale } from '../../scale/scale';
import type { Group } from '../../scene/group';
import type { TimeInterval } from '../../util/time';
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

    const isContinuous = ContinuousScale.is(scale) || OrdinalTimeScale.is(scale);
    const validValue = (val: unknown) => checkDatum(val, isContinuous) && !isNaN(scale.convert(val));

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
    direction: ChartAxisDirection;
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
    parallelFlipRotation: number;
    range?: [any, any];
    regularFlipRotation: number;
    scale?: Scale<any, number, number | TimeInterval>;
    sideFlag: 1 | -1;
    stroke?: string;
    strokeOpacity?: number;
    strokeWidth?: number;
    type: CrossLineType;
    update(visible: boolean): void;
    value?: any;
    set(properties: object): void;
}
