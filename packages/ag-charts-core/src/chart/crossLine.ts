import type {
    AgCrossLineLabelPosition,
    AgCrossLineListeners,
    AgTimeInterval,
    AgTimeIntervalUnit,
} from 'ag-charts-types';

import type { BoxBounds } from '../geometry/boxBounds';
import type { PointLabelDatum, PositionedLabelCandidate } from '../geometry/labelPlacement';
import type {
    NormalisedAxisCrossLineLabelOptions,
    NormalisedAxisCrossLineOptions,
} from '../options/normalised/normalisedAxisOptions';
import type { BBox } from '../scene/bbox';
import type { Group } from '../scene/group';
import type { Path } from '../scene/shape/path';
import type { ChartAxisDirection } from '../types/axisDirection';
import type { Scale } from '../types/scales';
import type { CanvasPoint } from '../types/scene';
import type { PolarAxisLayout } from './polarAxisLayout';
import { isValidScaleValue } from './scale/scaleValue';

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

    if (crossLine.type === 'range') {
        const [start, end] = value as [unknown, unknown];
        return isValidScaleValue(start, scale) && isValidScaleValue(end, scale);
    } else {
        return isValidScaleValue(value, scale);
    }
}

const CROSS_LINE_MIN_HIT_TOLERANCE = 5;

/** Pointer hit tolerance in pixels: half the stroke, floored so thin `line` cross lines remain targetable. */
export function crossLineHitTolerance(strokeWidth: number | undefined): number {
    return Math.max(CROSS_LINE_MIN_HIT_TOLERANCE, (strokeWidth ?? 1) / 2);
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
