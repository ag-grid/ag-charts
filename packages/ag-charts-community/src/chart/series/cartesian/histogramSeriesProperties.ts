import type { InternalAgColorType, NormalisedTextOrSegments, RequireOptional } from 'ag-charts-core';
import { Property } from 'ag-charts-core';
import type {
    AgHistogramSeriesGetItemIdParams,
    AgHistogramSeriesItemStylerParams,
    AgHistogramSeriesLabelFormatterParams,
    AgHistogramSeriesOptions,
    AgHistogramSeriesStyle,
    AgHistogramSeriesStylerParams,
    AgHistogramSeriesTooltipRendererParams,
    AgNumericValue,
    Styler,
} from 'ag-charts-types';

import type { BBox } from '../../../scene/bbox';
import { DropShadow } from '../../../scene/dropShadow';
import { Label } from '../../label';
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
        readonly x: number;
        readonly y: number;
    };
    // Required for types
    readonly crisp: boolean;
    readonly opacity?: number;
    style?: RequireOptional<AgHistogramSeriesStyle>;
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
    readonly label = new Label<AgHistogramSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = makeSeriesTooltip<AgHistogramSeriesTooltipRendererParams>();

    getStyle(): RequireOptional<AgHistogramSeriesStyle> & { opacity: number } {
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
