import type {
    AgLineSeriesLabelFormatterParams,
    AgLineSeriesMarkerItemStylerParams,
    AgLineSeriesOptions,
    AgLineSeriesTooltipRendererParams,
} from 'ag-charts-types';

import {
    BOOLEAN,
    COLOR_STRING,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    TempValidate,
} from '../../../util/validation';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';
import { InterpolationProperties } from './interpolationProperties';

export class LineSeriesProperties extends CartesianSeriesProperties<AgLineSeriesOptions> {
    @TempValidate(STRING)
    xKey!: string;

    @TempValidate(STRING)
    yKey!: string;

    @TempValidate(STRING, { optional: true })
    xName?: string;

    @TempValidate(STRING, { optional: true })
    yName?: string;

    @TempValidate(STRING, { optional: true })
    yFilterKey: string | undefined;

    @TempValidate(STRING, { optional: true })
    stackGroup?: string;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    normalizedTo?: number;

    @TempValidate(STRING, { optional: true })
    title?: string;

    @TempValidate(COLOR_STRING)
    stroke: string = '#874349';

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 2;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(OBJECT)
    interpolation: InterpolationProperties = new InterpolationProperties();

    @TempValidate(OBJECT)
    readonly marker = new SeriesMarker<AgLineSeriesMarkerItemStylerParams>();

    @TempValidate(OBJECT)
    readonly label = new Label<AgLineSeriesLabelFormatterParams>();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgLineSeriesTooltipRendererParams>();

    @TempValidate(BOOLEAN)
    connectMissingData: boolean = false;

    @TempValidate(BOOLEAN)
    sparklineMode: boolean = false;
}
