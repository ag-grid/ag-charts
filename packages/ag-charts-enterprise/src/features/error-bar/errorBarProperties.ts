import {
    type AgErrorBarItemStylerParams,
    type AgErrorBarOptions,
    type AgErrorBarThemeableOptions,
    type ErrorBarCapOptions,
    type Styler,
    _ModuleSupport,
} from 'ag-charts-community';

const {
    BaseProperties,
    TempValidate,
    BOOLEAN,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
} = _ModuleSupport;

class ErrorBarCap extends BaseProperties<ErrorBarCapOptions> {
    @TempValidate(BOOLEAN, { optional: true })
    visible?: boolean;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number;

    @TempValidate(RATIO, { optional: true })
    strokeOpacity?: number;

    @TempValidate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    lineDashOffset?: number;

    @TempValidate(NUMBER, { optional: true })
    length?: number;

    @TempValidate(RATIO, { optional: true })
    lengthRatio?: number;
}

export class ErrorBarProperties extends BaseProperties<AgErrorBarOptions<any>> {
    @TempValidate(STRING, { optional: true })
    yLowerKey?: string;

    @TempValidate(STRING, { optional: true })
    yLowerName?: string;

    @TempValidate(STRING, { optional: true })
    yUpperKey?: string;

    @TempValidate(STRING, { optional: true })
    yUpperName?: string;

    @TempValidate(STRING, { optional: true })
    xLowerKey?: string;

    @TempValidate(STRING, { optional: true })
    xLowerName?: string;

    @TempValidate(STRING, { optional: true })
    xUpperKey?: string;

    @TempValidate(STRING, { optional: true })
    xUpperName?: string;

    @TempValidate(BOOLEAN, { optional: true })
    visible?: boolean = true;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string = 'black';

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number = 1;

    @TempValidate(RATIO, { optional: true })
    strokeOpacity?: number = 1;

    @TempValidate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    lineDashOffset?: number;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgErrorBarItemStylerParams<unknown>, AgErrorBarThemeableOptions>;

    @TempValidate(OBJECT)
    cap = new ErrorBarCap();
}
