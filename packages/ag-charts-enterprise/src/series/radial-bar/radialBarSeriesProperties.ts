import type {
    AgRadialBarSeriesOptions,
    AgRadialSeriesItemStylerParams,
    AgRadialSeriesLabelFormatterParams,
    AgRadialSeriesStyle,
    AgRadialSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';

const {
    SeriesProperties,
    FillGradientDefaults,
    SeriesTooltip,
    TempValidate,
    COLOR_STRING,
    NUMBER,
    FUNCTION,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Label,
    COLOR_GRADIENT,
    COLOR_PATTERN,
    OR,
} = _ModuleSupport;

export class RadialBarSeriesProperties<T extends AgRadialBarSeriesOptions> extends SeriesProperties<T> {
    @TempValidate(STRING)
    angleKey!: string;

    @TempValidate(STRING)
    radiusKey!: string;

    @TempValidate(STRING, { optional: true })
    angleName?: string;

    @TempValidate(STRING, { optional: true })
    radiusName?: string;

    @TempValidate(OR(COLOR_GRADIENT, COLOR_PATTERN, COLOR_STRING))
    fill: InternalAgColorType = 'black';

    @TempValidate(OBJECT)
    readonly fillGradientDefaults = new FillGradientDefaults();

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING)
    stroke: string = 'black';

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgRadialSeriesItemStylerParams<unknown>, AgRadialSeriesStyle>;

    @TempValidate(NUMBER)
    rotation: number = 0;

    @TempValidate(STRING, { optional: true })
    stackGroup?: string;

    @TempValidate(NUMBER, { optional: true })
    normalizedTo?: number;

    @TempValidate(OBJECT)
    readonly label = new Label<AgRadialSeriesLabelFormatterParams>();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgRadialSeriesTooltipRendererParams<any>>();
}
