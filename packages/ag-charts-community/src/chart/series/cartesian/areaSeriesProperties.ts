import type {
    AgAreaSeriesLabelFormatterParams,
    AgAreaSeriesMarkerItemStylerParams,
    AgAreaSeriesTooltipRendererParams,
    AgColorType,
    AgGradientColor,
    AgSeriesAreaOptions,
} from 'ag-charts-types';

import { DropShadow } from '../../../scene/dropShadow';
import {
    BOOLEAN,
    COLOR_GRADIENT,
    COLOR_STRING,
    LINE_DASH,
    OBJECT,
    OR,
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

export class AreaSeriesProperties extends CartesianSeriesProperties<AgSeriesAreaOptions> {
    @TempValidate(STRING)
    xKey!: string;

    @TempValidate(STRING, { optional: true })
    xName?: string = undefined;

    @TempValidate(STRING)
    yKey!: string;

    @TempValidate(STRING, { optional: true })
    yName?: string;

    @TempValidate(STRING, { optional: true })
    yFilterKey: string | undefined;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    normalizedTo?: number;

    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING))
    fill: AgColorType = '#c16068';

    @TempValidate(COLOR_GRADIENT)
    fillGradientDefaults!: Required<AgGradientColor>;

    @TempValidate(RATIO)
    fillOpacity = 1;

    @TempValidate(COLOR_STRING)
    stroke: string = '#874349';

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth = 2;

    @TempValidate(RATIO)
    strokeOpacity = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(OBJECT)
    interpolation: InterpolationProperties = new InterpolationProperties();

    @TempValidate(OBJECT)
    readonly shadow = new DropShadow();

    @TempValidate(OBJECT)
    readonly marker = new SeriesMarker<AgAreaSeriesMarkerItemStylerParams>();

    @TempValidate(OBJECT)
    readonly label = new Label<AgAreaSeriesLabelFormatterParams>();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgAreaSeriesTooltipRendererParams<any>>();

    @TempValidate(BOOLEAN)
    connectMissingData: boolean = false;
}
