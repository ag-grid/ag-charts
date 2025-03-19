import type {
    AgColorType,
    AgPyramidSeriesItemStylerParams,
    AgPyramidSeriesLabelFormatterParams,
    AgPyramidSeriesOptions,
    AgPyramidSeriesStyle,
    AgPyramidSeriesTooltipRendererParams,
    Direction,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

const {
    SeriesProperties,
    FillGradientDefaults,
    SeriesTooltip,
    TempValidate,
    UNION,
    OR,
    ARRAY_OF,
    COLOR_GRADIENT,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    DIRECTION,
    BOOLEAN,
    LINE_DASH,
    OBJECT,
    NUMBER,
    POSITIVE_NUMBER,
    COLOR_PATTERN,
    RATIO,
    STRING,
    Label,
    DropShadow,
} = _ModuleSupport;

class PyramidSeriesLabel extends Label<AgPyramidSeriesLabelFormatterParams> {}

class PyramidSeriesStageLabel extends Label<AgPyramidSeriesLabelFormatterParams> {
    @TempValidate(NUMBER)
    spacing: number = 0;

    @TempValidate(UNION(['before', 'after'], 'a placement'))
    placement?: string;
}

export class PyramidProperties extends SeriesProperties<AgPyramidSeriesOptions> {
    @TempValidate(STRING)
    stageKey!: string;

    @TempValidate(STRING)
    valueKey!: string;

    @TempValidate(ARRAY_OF(OR(COLOR_GRADIENT, COLOR_PATTERN, COLOR_STRING)))
    fills: AgColorType[] = [];

    @TempValidate(OBJECT)
    readonly fillGradientDefaults = new FillGradientDefaults();

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING_ARRAY)
    strokes: string[] = [];

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(DIRECTION)
    direction: Direction = 'vertical';

    @TempValidate(BOOLEAN, { optional: true })
    reverse?: boolean = undefined;

    @TempValidate(POSITIVE_NUMBER)
    spacing: number = 0;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    aspectRatio?: number = undefined;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgPyramidSeriesItemStylerParams<unknown>, AgPyramidSeriesStyle>;

    @TempValidate(OBJECT)
    readonly shadow = new DropShadow().set({ enabled: false });

    @TempValidate(OBJECT)
    readonly label = new PyramidSeriesLabel();

    @TempValidate(OBJECT)
    readonly stageLabel = new PyramidSeriesStageLabel();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgPyramidSeriesTooltipRendererParams<unknown>>();
}
