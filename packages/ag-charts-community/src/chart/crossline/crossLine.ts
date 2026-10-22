import type {
    BBox,
    BoxBounds,
    CanvasPoint,
    ChartAxisDirection,
    Forbid,
    Group,
    NormalisedAxisCrossLineLabelOptions,
    NormalisedAxisCrossLineOptions,
    Path,
    PointLabelDatum,
    PositionedLabelCandidate,
    RequireOptional,
    Scale,
} from 'ag-charts-core';
import { callWithContext } from 'ag-charts-core';
import type {
    AgCrossLineClickEvent,
    AgCrossLineClickParams,
    AgCrossLineDoubleClickEvent,
    AgCrossLineLabelPosition,
    AgCrossLineListeners,
    AgMatchedParams,
    AgTimeInterval,
    AgTimeIntervalUnit,
} from 'ag-charts-types';

import type { SeriesAreaClickClaim } from '../../core/eventsHub';
import type { PolarAxisLayout } from '../../module/axisContext';
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
    Forbid<AgCrossLineClickEvent, 'allMatchedParams'> | Forbid<AgCrossLineDoubleClickEvent, 'allMatchedParams'>;

/** The cross-line listeners a click reaches, shared by the cross lines of every axis. */
export class PendingCrossLineCallbacks implements SeriesAreaClickClaim {
    readonly matchedParams: AgCrossLineClickParams[] = [];
    chart?: PendingCallback;
    readonly axes = new Map<string, PendingCallback>();
    readonly crossLines = new Map<string, PendingCallback>();

    constructor(private readonly hasChartListener: boolean) {}

    isHandled(): boolean {
        return (
            this.matchedParams.length > 0 && (this.axes.size > 0 || this.crossLines.size > 0 || this.hasChartListener)
        );
    }

    fire(allMatchedParams: AgMatchedParams<unknown>[]): void {
        for (const crossLine of this.crossLines.values()) {
            firePendingCrossLineCallback(allMatchedParams, crossLine);
        }
        for (const axis of this.axes.values()) {
            firePendingCrossLineCallback(allMatchedParams, axis);
        }
        if (this.chart) {
            firePendingCrossLineCallback(allMatchedParams, this.chart);
        }
    }
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

function firePendingCrossLineCallback(allMatchedParams: AgMatchedParams<unknown>[], callback: PendingCallback): void {
    const { callers, fn, params } = callback;
    callWithContext(callers, fn, { ...params, allMatchedParams });
}

export interface CrossLine<LabelType = NormalisedAxisCrossLineLabelOptions> {
    calculateLayout?(visible: boolean, reversedAxis?: boolean): void;
    calculatePadding?(padding: Partial<Record<AgCrossLineLabelPosition, number>>): void;
    /**
     * Hit-tests a canvas-space point against the cross line's rendered line, fill or label, widened
     * by a small fixed pixel tolerance. Returns `false` when the cross line is not currently visible.
     */
    containsPoint?(point: CanvasPoint): boolean;
    clippedRange: [number, number];
    enabled?: boolean;
    fill?: string;
    fillOpacity?: number;
    gridLength: number;
    gridPadding: number;
    /** The drawn label's footprint in canvas coordinates, or `undefined` when it draws no label. */
    getLabelBox?(): BoxBounds | undefined;
    /** The hit-tested region, excluding any label for a `Path`, for the keyboard focus indicator. */
    computeFocusBounds?(): BBox | Path | undefined;
    /** Whether the label is kept on collision rather than dropped. Cartesian cross lines only. */
    readonly keepsLabel?: boolean;
    /** The label as a placement candidate in `seriesRect` space. Cartesian cross lines only. */
    getLabelDatum?(seriesRect: BBox): PointLabelDatum | undefined;
    applyLabelPlacement?(hidden: boolean, candidate?: PositionedLabelCandidate): boolean;
    holdLabelPlacement?(hold: boolean): void;
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
    applyOptions(options: NormalisedAxisCrossLineOptions): void;
}

export interface PolarCrossLine<LabelType = NormalisedAxisCrossLineLabelOptions> extends CrossLine<LabelType> {
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
