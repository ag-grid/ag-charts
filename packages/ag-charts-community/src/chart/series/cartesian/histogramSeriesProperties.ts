import type {
    BoxBounds,
    InternalAgColorType,
    NormalisedHistogramSeriesStyle,
    NormalisedTextOrSegments,
    RequireOptional,
} from 'ag-charts-core';
import { Property } from 'ag-charts-core';
import type {
    AgHistogramSeriesGetItemIdParams,
    AgHistogramSeriesItemStylerParams,
    AgHistogramSeriesLabelFormatterParams,
    AgHistogramSeriesLabelPlacement,
    AgHistogramSeriesOptions,
    AgHistogramSeriesStyle,
    AgHistogramSeriesStylerParams,
    AgHistogramSeriesTooltipRendererParams,
    AgNumericValue,
    PixelSize,
    Styler,
} from 'ag-charts-types';

import type { BBox } from '../../../scene/bbox';
import { DropShadow } from '../../../scene/dropShadow';
import { Label, LabelPlacementStyle } from '../../label';
import type { BarLabelPlacement, BarPositionedCandidate } from '../../labelUtil';
import { makeSeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';
import type { CartesianSeriesNodeDatum } from './cartesianSeriesTypes';

export interface HistogramNodeDatum extends CartesianSeriesNodeDatum {
    // Bins aggregate many datums, so they carry an explicit stable id rather than the 1:1-series datumIndex match.
    readonly itemId: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly topLeftCornerRadius: boolean;
    readonly topRightCornerRadius: boolean;
    readonly bottomRightCornerRadius: boolean;
    readonly bottomLeftCornerRadius: boolean;
    readonly clipBBox?: BBox;
    readonly binIndex: number;
    readonly binRange: [AgNumericValue, AgNumericValue];
    readonly aggregatedValue: AgNumericValue;
    // Plotted bar height the crosshair snaps to (area-adjusted); the raw value is `aggregatedValue`.
    readonly cumulativeValue: number;
    readonly frequency: number;
    readonly label?: {
        readonly text: NormalisedTextOrSegments;
        // Mutable so the placement engine can retarget the label to a chosen candidate's anchor.
        x: number;
        y: number;
        textAlign: CanvasTextAlign;
        textBaseline: CanvasTextBaseline;
        rotation: number;
        /** Bar rect an orientation candidate must fit within; unset for outside placements. */
        readonly region?: BoxBounds;
        /** Flush offset written by the placement engine to keep a rotated label inside its region. */
        offsetX?: number;
        offsetY?: number;
        /** Granular resolved placement, coarsened to select placement styles. */
        placement?: BarLabelPlacement;
        /** Pre-positioned cascade candidates, present only when the label routes through the engine. */
        candidates?: BarPositionedCandidate[];
        /** Engine-routed label the placement engine dropped (no candidate fit); rendered invisible. */
        hidden?: boolean;
    };
    // Required for types
    readonly crisp: boolean;
    readonly opacity?: number;
    style?: RequireOptional<NormalisedHistogramSeriesStyle>;
}

class HistogramSeriesLabel extends Label<AgHistogramSeriesLabelFormatterParams> {
    @Property
    placement: AgHistogramSeriesLabelPlacement = 'inside-center';

    @Property
    spacing: PixelSize = 0;

    @Property
    insideStyle = new LabelPlacementStyle();

    @Property
    outsideStyle = new LabelPlacementStyle();
}

export class HistogramSeriesProperties extends CartesianSeriesProperties<AgHistogramSeriesOptions> {
    @Property
    xKey!: string;

    @Property
    yKey?: string;

    @Property
    xName?: string;

    @Property
    yName?: string;

    @Property
    fill?: InternalAgColorType;

    @Property
    fillOpacity = 1;

    @Property
    stroke?: string;

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    cornerRadius: number = 0;

    @Property
    styler?: Styler<AgHistogramSeriesStylerParams<unknown, unknown>, AgHistogramSeriesStyle>;

    @Property
    itemStyler?: Styler<AgHistogramSeriesItemStylerParams<unknown>, AgHistogramSeriesStyle>;

    @Property
    areaPlot: boolean = false;

    @Property
    bins?: [number, number][];

    @Property
    aggregation: NonNullable<AgHistogramSeriesOptions['aggregation']> = 'sum';

    @Property
    binCount?: number;

    @Property
    getItemId?: (params: AgHistogramSeriesGetItemIdParams) => string = undefined;

    @Property
    readonly shadow = new DropShadow();

    @Property
    readonly label = new HistogramSeriesLabel();

    @Property
    readonly tooltip = makeSeriesTooltip<AgHistogramSeriesTooltipRendererParams>();

    getStyle(): RequireOptional<NormalisedHistogramSeriesStyle> & { opacity: number } {
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cornerRadius } = this;
        return {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cornerRadius,
            opacity: 1,
        };
    }
}
