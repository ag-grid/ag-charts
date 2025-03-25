import type { InternalAgColorType } from 'ag-charts-core';
import type {
    AgHistogramSeriesLabelFormatterParams,
    AgHistogramSeriesOptions,
    AgHistogramSeriesTooltipRendererParams,
} from 'ag-charts-types';

import type { BBox } from '../../../scene/bbox';
import { DropShadow } from '../../../scene/dropShadow';
import { Property } from '../../../util/properties';
import { Label } from '../../label';
import { FillGradientDefaults, FillPatternDefaults } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';
import { type CartesianSeriesNodeDatum, CartesianSeriesProperties } from './cartesianSeries';

export interface HistogramNodeDatum extends CartesianSeriesNodeDatum {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly topLeftCornerRadius: boolean;
    readonly topRightCornerRadius: boolean;
    readonly bottomRightCornerRadius: boolean;
    readonly bottomLeftCornerRadius: boolean;
    readonly clipBBox?: BBox;
    readonly aggregatedValue: number;
    readonly frequency: number;
    readonly domain: [number, number];
    readonly label?: {
        readonly text: string;
        readonly x: number;
        readonly y: number;
    };
    // Required for types
    readonly crisp: boolean;
    readonly opacity?: number;
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
    readonly fillGradientDefaults = new FillGradientDefaults();

    @Property
    readonly fillPatternDefaults = new FillPatternDefaults();

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
    areaPlot: boolean = false;

    @Property
    bins?: [number, number][];

    @Property
    aggregation: NonNullable<AgHistogramSeriesOptions['aggregation']> = 'sum';

    @Property
    binCount?: number;

    @Property
    readonly shadow = new DropShadow();

    @Property
    readonly label = new Label<AgHistogramSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = new SeriesTooltip<AgHistogramSeriesTooltipRendererParams<HistogramNodeDatum>>();
}
