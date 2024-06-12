import {
    type AgErrorBarFormatterParams,
    type AgErrorBarOptions,
    type AgErrorBarThemeableOptions,
    type ErrorBarCapOptions,
    type Styler,
    _ModuleSupport,
} from 'ag-charts-community';

const {
    BaseProperties,
    Validate,
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
    @Validate(BOOLEAN, { optional: true })
    visible?: boolean;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;

    @Validate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @Validate(POSITIVE_NUMBER, { optional: true })
    lineDashOffset?: number;

    @Validate(NUMBER, { optional: true })
    length?: number;

    @Validate(RATIO, { optional: true })
    lengthRatio?: number;
}

export class ErrorBarProperties extends BaseProperties<AgErrorBarOptions<any>> {
    @Validate(STRING, { optional: true })
    yLowerKey?: string;

    @Validate(STRING, { optional: true })
    yLowerName?: string;

    @Validate(STRING, { optional: true })
    yUpperKey?: string;

    @Validate(STRING, { optional: true })
    yUpperName?: string;

    @Validate(STRING, { optional: true })
    xLowerKey?: string;

    @Validate(STRING, { optional: true })
    xLowerName?: string;

    @Validate(STRING, { optional: true })
    xUpperKey?: string;

    @Validate(STRING, { optional: true })
    xUpperName?: string;

    @Validate(BOOLEAN, { optional: true })
    visible?: boolean = true;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string = 'black';

    @Validate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number = 1;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number = 1;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @Validate(POSITIVE_NUMBER, { optional: true })
    lineDashOffset?: number;

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgErrorBarFormatterParams<any>, AgErrorBarThemeableOptions>;

    @Validate(OBJECT)
    cap = new ErrorBarCap();
}
