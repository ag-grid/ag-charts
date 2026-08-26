import type { AxisID, BoxBounds, CanvasPoint, ChartAxisDirection, Forbid, RequireOptional, Scale } from 'ag-charts-core';
import { callWithContext } from 'ag-charts-core';
import type {
    AgBaseCrossLineLabelOptions,
    AgCrossLineClickEvent,
    AgCrossLineClickParams,
    AgCrossLineDoubleClickEvent,
    AgCrossLineLabelPosition,
    AgCrossLineListeners,
    AgTimeInterval,
    AgTimeIntervalUnit,
} from 'ag-charts-types';

import type { PolarAxisLayout } from '../../module/axisContext';
import type { Group } from '../../scene/group';
import { isValidScaleValue } from '../scaleValue';

type Caller = { context?: unknown };
export type CrossLineType = 'line' | 'range';
export type CrossLineValuePick = RequireOptional<AgCrossLineClickParams>;

interface ICrossLine {
    type: CrossLineType;
    range?: [unknown, unknown];
    value?: unknown;
}

interface PendingCallback {
    callers: Caller[];
    fn: (params: any) => void;
    params: PendingCrossLineCallbackParam;
}

export type PendingCrossLineCallbackParam =
    | Forbid<AgCrossLineClickEvent, 'allClickParams'>
    | Forbid<AgCrossLineDoubleClickEvent, 'allClickParams'>;

export interface PendingCrossLineCallbacks {
    allClickParams: AgCrossLineClickParams[];
    chart?: PendingCallback;
    axes: Map<string, PendingCallback>;
    crossLines: Map<string, PendingCallback>;
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

    if (crossLine.type === 'range') {
        const [start, end] = value as [unknown, unknown];
        return isValidScaleValue(start, scale) && isValidScaleValue(end, scale);
    } else {
        return isValidScaleValue(value, scale);
    }
}

function firePendingCrossLineCallback(allClickParams: AgCrossLineClickParams[], callback: PendingCallback): void {
    const { callers, fn, params } = callback;
    callWithContext(callers, fn, { ...params, allClickParams });
}

export function fireAllPendingCrossLineCallbacks(pending: PendingCrossLineCallbacks): void {
    const { allClickParams } = pending;
    for (const crossLine of pending.crossLines.values()) {
        firePendingCrossLineCallback(allClickParams, crossLine);
    }
    for (const axis of pending.axes.values()) {
        firePendingCrossLineCallback(allClickParams, axis);
    }
    if (pending.chart) {
        firePendingCrossLineCallback(allClickParams, pending.chart);
    }
}

export interface CrossLine<LabelType = AgBaseCrossLineLabelOptions> {
    calculateLayout?(visible: boolean, reversedAxis?: boolean): void;
    calculatePadding?(padding: Partial<Record<AgCrossLineLabelPosition, number>>): void;
    /**
     * Hit-tests a canvas-space point against the cross line's rendered line, fill or label, widened
     * by a small fixed pixel tolerance. Returns `false` when the cross line is not currently visible.
     */
    containsPoint?(point: CanvasPoint): boolean;
    clippedRange: [number, number];
    enabled?: boolean;
    defaultColorRange: string[];
    fill?: string;
    fillOpacity?: number;
    gridLength: number;
    gridPadding: number;
    /**
     * Chart container in canvas coordinates, bounding where a `'clip-text'` label may draw. Set on every
     * update, since the canvas can resize without the axis relaying out.
     */
    containerBox?: BoxBounds;
    lineGroup: Group;
    rangeGroup: Group;
    /** Internally generated, always present and unique per instance. */
    internalId: string;
    /** User-supplied identifier, when the cross line's options set one. */
    id?: string;
    label: LabelType;
    labelGroup: Group;
    /** User-supplied pointer listeners, when the cross line's options set any. */
    listeners?: AgCrossLineListeners<unknown>;
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
