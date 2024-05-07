import { _ModuleSupport } from 'ag-charts-community';

const { BOOLEAN, COLOR_STRING, DATE, LINE_DASH, NUMBER, RATIO, STRING, OBJECT, OR, UNION, BaseProperties, Validate } =
    _ModuleSupport;

type Constructor<T = {}> = new (...args: any[]) => T;

// --- Components ---
export class AnnotationPoint extends BaseProperties {
    @Validate(OR(STRING, NUMBER, DATE))
    x?: string | number | Date;

    @Validate(NUMBER)
    y?: number;
}

export class ChannelAnnotationBackground extends Fill(BaseProperties) {}

export class ChannelAnnotationMiddle extends Stroke(LineDash(BaseProperties)) {}

export class AnnotationHandleProperties extends Stroke(LineDash(Fill(BaseProperties))) {}

// --- Annotations Mixins ---
export function Annotation<T extends string, U extends Constructor>(_type: T, Parent: U) {
    class AnnotationProperties extends Lockable(Visible(Parent)) {}
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

export function LineDash<T extends Constructor>(Parent: T) {
    class LineDashOptions extends Parent {
        @Validate(LINE_DASH, { optional: true })
        lineDash?: number[];

        @Validate(NUMBER, { optional: true })
        lineDashOffset?: number;
    }
    return LineDashOptions;
}
