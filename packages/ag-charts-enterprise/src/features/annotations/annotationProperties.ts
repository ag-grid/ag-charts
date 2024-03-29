import { _ModuleSupport } from 'ag-charts-community';

const { BaseProperties, COLOR_STRING, DATE, LINE_DASH, NUMBER, RATIO, STRING, OBJECT, OR, UNION, Validate } =
    _ModuleSupport;

const DEFAULT_COLOR = 'rgb(30, 100, 255)';

export class AnnotationProperties extends BaseProperties {
    @Validate(UNION(['line', 'crossline', 'parallel-channel', 'disjoint-channel']))
    type: 'line' | 'crossline' | 'parallel-channel' | 'disjoint-channel' = 'line';

    // Handles
    handle = new AnnotationHandleProperties();

    // Line
    @Validate(OBJECT, { optional: true })
    start = new AnnotationPointProperties();

    @Validate(OBJECT, { optional: true })
    end = new AnnotationPointProperties();

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string = DEFAULT_COLOR;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number = 1;

    @Validate(NUMBER, { optional: true })
    strokeWidth?: number = 2;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[];

    // Channel
    @Validate(OBJECT, { optional: true })
    top = new AnnotationLinePointsProperties();

    @Validate(OBJECT, { optional: true })
    bottom = new AnnotationLinePointsProperties();

    @Validate(OBJECT, { optional: true })
    middle = new AnnotationMiddleLineProperties();

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
    fill?: string = 'rgb(255, 255, 255)';

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[];
}

export class AnnotationPointProperties extends BaseProperties {
    @Validate(OR(STRING, NUMBER, DATE))
    x: string | number | Date = 0;

    @Validate(OR(STRING, NUMBER, DATE))
    y: string | number | Date = 0;
}

export class AnnotationMiddleLineProperties extends BaseProperties {
    @Validate(COLOR_STRING, { optional: true })
    stroke?: string = DEFAULT_COLOR;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number = 1;

    @Validate(NUMBER, { optional: true })
    strokeWidth?: number = 1;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[] = [6, 5];
}

export class AnnotationFillProperties extends BaseProperties {
    @Validate(COLOR_STRING, { optional: true })
    fill?: string = DEFAULT_COLOR;

    @Validate(RATIO, { optional: true })
    fillOpacity?: number = 0.2;
}
