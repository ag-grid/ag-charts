import {
    type FontStyle,
    type FontWeight,
    type Formatter,
    type TextAlign,
    _ModuleSupport,
    _Util,
} from 'ag-charts-community';

import type { AnnotationContext } from './annotationTypes';

const {
    BOOLEAN,
    COLOR_STRING,
    DATE,
    LINE_DASH,
    NUMBER,
    RATIO,
    STRING,
    OBJECT,
    FUNCTION,
    TEXT_ALIGN,
    FONT_STYLE,
    FONT_WEIGHT,
    POSITIVE_NUMBER,
    OR,
    UNION,
    BaseProperties,
    Validate,
} = _ModuleSupport;

type Constructor<T = {}> = new (...args: any[]) => T;

// --- Components ---
export class AnnotationPoint extends BaseProperties {
    @Validate(OR(STRING, NUMBER, DATE))
    x?: string | number | Date;

    @Validate(NUMBER)
    y?: number;
}

export class ChannelAnnotationBackground extends Fill(BaseProperties) {}

export class ChannelAnnotationMiddle extends Stroke(LineDash(Visible(BaseProperties))) {}

export class AnnotationHandleProperties extends Stroke(LineDash(Fill(BaseProperties))) {}

export class AnnotationAxisLabelProperties extends Stroke(LineDash(Fill(Label(BaseProperties)))) {
    @Validate(BOOLEAN)
    enabled?: boolean;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;
}

// --- Annotations Mixins ---
export function Annotation<T extends string, U extends Constructor<_ModuleSupport.BaseProperties>>(
    _type: T,
    Parent: U
) {
    class AnnotationProperties extends Lockable(Visible(Parent)) {
        // A uuid is required, over the usual incrementing index, as annotations can be restored from external databases
        id = _Util.uuid();

        isValidWithContext(_context: AnnotationContext, warningPrefix: string) {
            return super.isValid(warningPrefix);
        }
    }
    return AnnotationProperties;
}

export function AnnotationLine<T extends Constructor>(Parent: T) {
    class AnnotationLinePoints extends Parent {
        @Validate(OBJECT)
        start = new AnnotationPoint();

        @Validate(OBJECT)
        end = new AnnotationPoint();
    }
    return AnnotationLinePoints;
}

export function AnnotationCrossLine<T extends Constructor>(Parent: T) {
    class AnnotationCrossLineOptions extends Parent {
        @Validate(OR(STRING, NUMBER, DATE))
        value?: string | number | Date;
    }
    return AnnotationCrossLineOptions;
}

export function ChannelAnnotation<T extends Constructor>(Parent: T) {
    class ChannelAnnotationStyles extends Parent {
        @Validate(OBJECT, { optional: true })
        background = new ChannelAnnotationBackground();
    }
    return ChannelAnnotationStyles;
}

export function AnnotationHandle<T extends Constructor>(Parent: T) {
    class WithAnnotationHandle extends Parent {
        @Validate(OBJECT, { optional: true })
        handle = new AnnotationHandleProperties();
    }
    return WithAnnotationHandle;
}

export function AnnotationAxisLabel<T extends Constructor>(Parent: T) {
    class WithAxisLabel extends Parent {
        @Validate(OBJECT, { optional: true })
        axisLabel = new AnnotationAxisLabelProperties();
    }
    return WithAxisLabel;
}

export function Cappable<T extends Constructor>(Parent: T) {
    class CappableOptions extends Parent {
        @Validate(UNION(['arrow', 'circle']), { optional: true })
        startCap?: 'arrow' | 'circle';

        @Validate(UNION(['arrow', 'circle']), { optional: true })
        endCap?: 'arrow' | 'circle';
    }
    return CappableOptions;
}

export function Extendable<T extends Constructor>(Parent: T) {
    class ExtendableOptions extends Parent {
        @Validate(BOOLEAN, { optional: true })
        extendLeft?: boolean;

        @Validate(BOOLEAN, { optional: true })
        extendRight?: boolean;
    }
    return ExtendableOptions;
}

function Lockable<T extends Constructor>(Parent: T) {
    class LockableOptions extends Parent {
        @Validate(BOOLEAN, { optional: true })
        locked?: boolean;
    }
    return LockableOptions;
}

// --- Generic Mixins ---
export function Visible<T extends Constructor>(Parent: T) {
    class VisibleOptions extends Parent {
        @Validate(BOOLEAN, { optional: true })
        visible?: boolean;
    }
    return VisibleOptions;
}

export function Fill<T extends Constructor>(Parent: T) {
    class FillOptions extends Parent {
        @Validate(COLOR_STRING, { optional: true })
        fill?: string;

        @Validate(RATIO, { optional: true })
        fillOpacity?: number;
    }
    return FillOptions;
}

export function Stroke<T extends Constructor>(Parent: T) {
    class StrokeOptions extends Parent {
        @Validate(COLOR_STRING, { optional: true })
        stroke?: string;

        @Validate(RATIO, { optional: true })
        strokeOpacity?: number;

        @Validate(NUMBER, { optional: true })
        strokeWidth?: number;
    }
    return StrokeOptions;
}

export interface AnnotationAxisLabelFormatterParams {
    readonly value: any;
}

export function Label<T extends Constructor>(Parent: T) {
    class LabelOptions extends Parent {
        @Validate(POSITIVE_NUMBER)
        padding: number = 8;

        @Validate(TEXT_ALIGN, { optional: true })
        textAlign: TextAlign = 'center';

        @Validate(FONT_STYLE, { optional: true })
        fontStyle?: FontStyle;

        @Validate(FONT_WEIGHT, { optional: true })
        fontWeight?: FontWeight;

        @Validate(POSITIVE_NUMBER)
        fontSize: number = 10;

        @Validate(STRING)
        fontFamily: string = 'sans-serif';

        @Validate(COLOR_STRING, { optional: true })
        color?: string;

        @Validate(FUNCTION, { optional: true })
        formatter?: Formatter<AnnotationAxisLabelFormatterParams>;
    }
    return LabelOptions;
}

export function LineDash<T extends Constructor>(Parent: T) {
    class LineDashOptions extends Parent {
        @Validate(LINE_DASH, { optional: true })
        lineDash?: number[];

        @Validate(NUMBER, { optional: true })
        lineDashOffset?: number;
    }
    return LineDashOptions;
}
