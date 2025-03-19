import type {
    AgHistogramSeriesLabelFormatterParams,
    AgHistogramSeriesOptions,
    AgHistogramSeriesTooltipRendererParams,
} from 'ag-charts-types';

import type { BBox } from '../../../scene/bbox';
import { DropShadow } from '../../../scene/dropShadow';
import type { InternalAgColorType } from '../../../scene/util/fill';
import {
    ARRAY,
    BOOLEAN,
    COLOR_GRADIENT,
    COLOR_PATTERN,
    COLOR_STRING,
    LINE_DASH,
    OBJECT,
    OR,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    TempValidate,
    UNION,
} from '../../../util/validation';
import { Label } from '../../label';
import { FillGradientDefaults } from '../seriesProperties';
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
    @TempValidate(STRING)
    xKey!: string;

    @TempValidate(STRING, { optional: true })
    yKey?: string;

    @TempValidate(STRING, { optional: true })
    xName?: string;

    @TempValidate(STRING, { optional: true })
    yName?: string;

    @TempValidate(OR(COLOR_GRADIENT, COLOR_PATTERN, COLOR_STRING))
    fill?: InternalAgColorType;

    @TempValidate(OBJECT)
    readonly fillGradientDefaults = new FillGradientDefaults();

    @TempValidate(RATIO)
    fillOpacity = 1;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    strokeOpacity = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @TempValidate(BOOLEAN)
    areaPlot: boolean = false;

    @TempValidate(ARRAY, { optional: true })
    bins?: [number, number][];

    @TempValidate(UNION(['count', 'sum', 'mean'], 'a histogram aggregation'))
    aggregation: NonNullable<AgHistogramSeriesOptions['aggregation']> = 'sum';

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    binCount?: number;

    @TempValidate(OBJECT)
    readonly shadow = new DropShadow();

    @TempValidate(OBJECT)
    readonly label = new Label<AgHistogramSeriesLabelFormatterParams>();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgHistogramSeriesTooltipRendererParams<HistogramNodeDatum>>();
}
