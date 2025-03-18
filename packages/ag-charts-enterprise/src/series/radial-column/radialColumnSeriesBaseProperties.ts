import type {
    AgBaseRadialColumnSeriesOptions,
    AgColorType,
    AgRadialSeriesItemStylerParams,
    AgRadialSeriesLabelFormatterParams,
    AgRadialSeriesStyle,
    AgRadialSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

const {
    SeriesProperties,
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
    OR,
    COLOR_GRADIENT,
    COLOR_STRING_ARRAY,
    COLOR_PATTERN,
} = _ModuleSupport;

export class RadialColumnSeriesBaseProperties<T extends AgBaseRadialColumnSeriesOptions> extends SeriesProperties<T> {
    @TempValidate(STRING)
    angleKey!: string;

    @TempValidate(STRING, { optional: true })
    angleName?: string;

    @TempValidate(STRING)
    radiusKey!: string;

    @TempValidate(STRING, { optional: true })
    radiusName?: string;

    @TempValidate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING, COLOR_PATTERN))
    fill: AgColorType = 'black';

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
