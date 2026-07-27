import type { ChartAxisDirection, Scale } from 'ag-charts-core';
import { checkDatum } from 'ag-charts-core';
import type {
    AgBaseCrossLineLabelOptions,
    AgCrossLineLabelPosition,
    AgTimeInterval,
    AgTimeIntervalUnit,
} from 'ag-charts-types';

import type { PolarAxisLayout } from '../../module/axisContext';
import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import type { Group } from '../../scene/group';

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

/**
 * Identifies a cross line hit by a pointer interaction, assembled by the cross-lines plugin from the
 * hit {@link CrossLine} instance plus its owning axis. Mirrors {@link AxisValuePick}; consumed by the
 * context-menu `crossline` scope.
 */
export interface CrossLineValuePick {
    readonly crossLineId: string;
    readonly axisId: string;
    readonly direction: ChartAxisDirection;
    readonly type: CrossLineType;
    readonly value?: unknown;
    readonly range?: [unknown, unknown];
}

export interface CrossLine<LabelType = AgBaseCrossLineLabelOptions> {
    calculateLayout?(visible: boolean, reversedAxis?: boolean): void;
    calculatePadding?(padding: Partial<Record<AgCrossLineLabelPosition, number>>): void;
    /**
     * Hit-tests a canvas-space point against the cross line's rendered line or fill, widened by a
     * small fixed pixel tolerance. Returns `false` when the cross line is not currently visible.
     */
    containsPoint?(canvasX: number, canvasY: number): boolean;
    clippedRange: [number, number];
    enabled?: boolean;
    defaultColorRange: string[];
    fill?: string;
    fillOpacity?: number;
    gridLength: number;
    gridPadding: number;
    lineGroup: Group;
    rangeGroup: Group;
    /** Internally generated, always present and unique per instance. */
    internalId: string;
    /** User-supplied identifier, when the cross line's options set one. */
    id?: string;
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
    /**
     * Applies polar-axis layout state (radius/inner-radius/shape/ticks/gridAngles) to the
     * cross-line. The plugin calls this once per update phase on polar axes.
     */
    applyPolarLayout(layout: PolarAxisLayout): void;
}
