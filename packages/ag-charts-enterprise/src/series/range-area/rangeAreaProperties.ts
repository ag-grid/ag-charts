import type {
    AgRangeAreaSeriesLabelFormatterParams,
    AgRangeAreaSeriesLabelPlacement,
    AgRangeAreaSeriesOptions,
    AgRangeAreaSeriesOptionsKeys,
    AgRangeAreaSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';

export interface RangeAreaMarkerDatum extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'> {
    readonly index: number;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly yLowValue: number;
    readonly yHighValue: number;
    readonly point: Readonly<_ModuleSupport.SizedPoint>;
    readonly enabled: boolean;
}

const {
    CartesianSeriesProperties,
    FillGradientDefaults,
    FillPatternDefaults,
    InterpolationProperties,
    SeriesMarker,
    SeriesTooltip,
    TempValidate,
    BOOLEAN,
    COLOR_STRING,
    LINE_DASH,
    OBJECT,
    PLACEMENT,
    POSITIVE_NUMBER,
    COLOR_GRADIENT,
    COLOR_PATTERN,
    OR,
    RATIO,
    STRING,
    DropShadow,
    Label,
} = _ModuleSupport;

class RangeAreaSeriesLabel extends Label<AgRangeAreaSeriesLabelFormatterParams> {
    @TempValidate(PLACEMENT)
    placement: AgRangeAreaSeriesLabelPlacement = 'outside';

    @TempValidate(POSITIVE_NUMBER)
    padding: number = 6;
}

export class RangeAreaProperties extends CartesianSeriesProperties<AgRangeAreaSeriesOptions> {
    @TempValidate(STRING)
    xKey!: string;

    @TempValidate(STRING)
    yLowKey!: string;

    @TempValidate(STRING)
    yHighKey!: string;

    @TempValidate(STRING, { optional: true })
    xName?: string;

    @TempValidate(STRING, { optional: true })
    yName?: string;

    @TempValidate(STRING, { optional: true })
    yLowName?: string;

    @TempValidate(STRING, { optional: true })
    yHighName?: string;

    @TempValidate(OR(COLOR_GRADIENT, COLOR_PATTERN, COLOR_STRING))
    fill: InternalAgColorType = '#99CCFF';

    @TempValidate(OBJECT)
    readonly fillGradientDefaults = new FillGradientDefaults();

    @TempValidate(OBJECT)
    readonly fillPatternDefaults = new FillPatternDefaults();

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING)
    stroke: string = '#99CCFF';

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(OBJECT)
    interpolation: _ModuleSupport.InterpolationProperties = new InterpolationProperties();

    @TempValidate(OBJECT)
    readonly shadow = new DropShadow().set({ enabled: false });

    @TempValidate(OBJECT)
    readonly marker = new SeriesMarker<AgRangeAreaSeriesOptionsKeys>();

    @TempValidate(OBJECT)
    readonly label = new RangeAreaSeriesLabel();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgRangeAreaSeriesTooltipRendererParams>();

    @TempValidate(BOOLEAN)
    connectMissingData: boolean = false;
}
