import type {
    AgRangeBarSeriesItemStylerParams,
    AgRangeBarSeriesLabelFormatterParams,
    AgRangeBarSeriesLabelPlacement,
    AgRangeBarSeriesOptions,
    AgRangeBarSeriesStyle,
    AgRangeBarSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';

const {
    AbstractBarSeriesProperties,
    FillGradientDefaults,
    SeriesTooltip,
    TempValidate,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    OBJECT,
    PLACEMENT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    BOOLEAN,
    COLOR_GRADIENT,
    COLOR_PATTERN,
    OR,
    DropShadow,
    Label,
} = _ModuleSupport;

class RangeBarSeriesLabel extends Label<AgRangeBarSeriesLabelFormatterParams> {
    @TempValidate(PLACEMENT)
    placement: AgRangeBarSeriesLabelPlacement = 'inside';

    @TempValidate(POSITIVE_NUMBER)
    padding: number = 6;
}

export class RangeBarProperties extends AbstractBarSeriesProperties<AgRangeBarSeriesOptions> {
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

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgRangeBarSeriesItemStylerParams<unknown>, AgRangeBarSeriesStyle>;

    @TempValidate(OBJECT)
    readonly shadow = new DropShadow().set({ enabled: false });

    @TempValidate(OBJECT)
    readonly label = new RangeBarSeriesLabel();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgRangeBarSeriesTooltipRendererParams<unknown>>();

    @TempValidate(BOOLEAN)
    fastDataProcessing: boolean = false;
}
