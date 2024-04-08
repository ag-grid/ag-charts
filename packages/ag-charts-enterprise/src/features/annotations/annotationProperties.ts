import { _ModuleSupport } from 'ag-charts-community';

const { BOOLEAN, COLOR_STRING, DATE, LINE_DASH, NUMBER, RATIO, STRING, OBJECT, OR, UNION, BaseProperties, Validate } =
    _ModuleSupport;

// --- Styles ---
export class LineAnnotationStylesProperties extends BaseProperties {
    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number;

    @Validate(NUMBER, { optional: true })
    strokeWidth?: number;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @Validate(NUMBER, { optional: true })
    lineDashOffset?: number;
}

export class ChannelAnnotationStylesProperties extends LineAnnotationStylesProperties {
    @Validate(OBJECT, { optional: true })
    middle = new LineAnnotationStylesProperties();

    @Validate(OBJECT, { optional: true })
    background = new AnnotationFillProperties();
}

// --- Annotations ---
export class AnnotationProperties extends LineAnnotationStylesProperties {
    @Validate(UNION(['line', 'parallel-channel']))
    type: 'line' | 'parallel-channel' = 'line';

    // Shared
    @Validate(BOOLEAN, { optional: true })
    locked?: boolean;

    @Validate(BOOLEAN, { optional: true })
    visible?: boolean;

    @Validate(OBJECT, { optional: true })
    handle = new AnnotationHandleProperties();

    // Line
    @Validate(OBJECT, { optional: true })
    start = new AnnotationPointProperties();

    @Validate(OBJECT, { optional: true })
    end = new AnnotationPointProperties();

    // Channel
    @Validate(OBJECT, { optional: true })
    top = new AnnotationLinePointsProperties();

    @Validate(OBJECT, { optional: true })
    bottom = new AnnotationLinePointsProperties();

    @Validate(OBJECT, { optional: true })
    middle = new LineAnnotationStylesProperties();

    @Validate(OBJECT, { optional: true })
    background = new AnnotationFillProperties();
}

export class AnnotationLinePointsProperties extends BaseProperties {
    @Validate(OBJECT, { optional: true })
    start = new AnnotationPointProperties();

    @Validate(OBJECT, { optional: true })
    end = new AnnotationPointProperties();
}

export class AnnotationHandleProperties extends BaseProperties {
    @Validate(COLOR_STRING, { optional: true })
    fill?: string;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @Validate(NUMBER, { optional: true })
    lineDashOffset?: number;
}

export class AnnotationPointProperties extends BaseProperties {
    @Validate(OR(STRING, NUMBER, DATE))
    x?: string | number | Date;

    @Validate(OR(STRING, NUMBER, DATE))
    y?: string | number | Date;
}

export class AnnotationFillProperties extends BaseProperties {
    @Validate(COLOR_STRING, { optional: true })
    fill?: string;

    @Validate(RATIO, { optional: true })
    fillOpacity?: number;
}
