import { _ModuleSupport, _Util } from 'ag-charts-community';

import { AnnotationType, Coords } from './annotationTypes';

const {
    BOOLEAN,
    COLOR_STRING,
    DATE,
    LINE_DASH,
    NUMBER,
    RATIO,
    STRING,
    OBJECT,
    OR,
    UNION,
    BaseProperties,
    Validate,
    isObject,
} = _ModuleSupport;

// --- Annotations ---
export type AnnotationProperties = LineAnnotation | ParallelChannelAnnotation | DisjointChannelAnnotation;

export class LineAnnotation extends Annotation(
    AnnotationType.Line,
    AnnotationLine(AnnotationHandle(Cappable(Extendable(Stroke(LineDash(BaseProperties))))))
) {
    static is(value: unknown): value is LineAnnotation {
        return isObject(value) && value.type === AnnotationType.Line;
    }

    @Validate(STRING)
    type = AnnotationType.Line as const;
}

export class ParallelChannelAnnotation extends Annotation(
    AnnotationType.ParallelChannel,
    ChannelAnnotation(AnnotationLine(AnnotationHandle(Extendable(Stroke(LineDash(BaseProperties))))))
) {
    static is(value: unknown): value is ParallelChannelAnnotation {
        return isObject(value) && value.type === AnnotationType.ParallelChannel;
    }

    @Validate(STRING)
    type = AnnotationType.ParallelChannel as const;

    @Validate(NUMBER)
    size: number = 0;

    @Validate(OBJECT, { optional: true })
    middle = new ChannelAnnotationMiddle();

    get bottom() {
        const bottom = {
            start: { x: this.start.x, y: this.start.y },
            end: { x: this.end.x, y: this.end.y },
        };

        if (typeof bottom.start.y === 'number' && typeof bottom.end.y === 'number') {
            bottom.start.y -= this.size;
            bottom.end.y -= this.size;
        } else {
            // TODO
            _Util.Logger.warnOnce(`Annotation [${this.type}] can only be used with a numeric y-axis.`);
        }

        return bottom;
    }
}

export class DisjointChannelAnnotation extends Annotation(
    AnnotationType.DisjointChannel,
    ChannelAnnotation(AnnotationLine(AnnotationHandle(Stroke(LineDash(BaseProperties)))))
) {
    static is(value: unknown): value is DisjointChannelAnnotation {
        return isObject(value) && value.type === AnnotationType.DisjointChannel;
    }

    @Validate(STRING)
    type = AnnotationType.DisjointChannel as const;

    @Validate(NUMBER)
    size: number = 0;

    get bottom() {
        const bottom = {
            start: { x: this.start.x, y: this.start.y },
            end: { x: this.end.x, y: this.end.y },
        };

        if (typeof bottom.start.y === 'number' && typeof bottom.end.y === 'number') {
            bottom.start.y -= this.size;
            bottom.end.y -= this.size;
        } else {
            // TODO
            _Util.Logger.warnOnce(`Annotation [${this.type}] can only be used with a numeric y-axis.`);
        }

        return bottom;
    }
}

// --- Components ---
export class AnnotationPoint extends BaseProperties {
    @Validate(OR(STRING, NUMBER, DATE))
    x?: string | number | Date;

    @Validate(NUMBER)
    y?: number;
}

class ChannelAnnotationBackground extends Fill(BaseProperties) {}

class ChannelAnnotationMiddle extends Stroke(LineDash(BaseProperties)) {}

class AnnotationHandleProperties extends Stroke(LineDash(Fill(BaseProperties))) {}

// --- Annotations Mixins ---
function Annotation<T extends string, U extends Constructor>(_type: T, Parent: U) {
    // class AnnotationProperties extends Type(type, Lockable(Visible(Parent))) {}
    class AnnotationProperties extends Lockable(Visible(Parent)) {}
    return AnnotationProperties;
}

function AnnotationLine<T extends Constructor>(Parent: T) {
    class AnnotationLinePoints extends Parent {
        @Validate(OBJECT)
        start = new AnnotationPoint();

        @Validate(OBJECT)
        end = new AnnotationPoint();
    }
    return AnnotationLinePoints;
}

function ChannelAnnotation<T extends Constructor>(Parent: T) {
    class ChannelAnnotationStyles extends Parent {
        @Validate(OBJECT, { optional: true })
        background = new ChannelAnnotationBackground();
    }
    return ChannelAnnotationStyles;
}

function AnnotationHandle<T extends Constructor>(Parent: T) {
    class WithAnnotationHandle extends Parent {
        @Validate(OBJECT, { optional: true })
        handle = new AnnotationHandleProperties();
    }
    return WithAnnotationHandle;
}

function Cappable<T extends Constructor>(Parent: T) {
    class CappableOptions extends Parent {
        @Validate(UNION(['arrow', 'circle']), { optional: true })
        startCap?: 'arrow' | 'circle';

        @Validate(UNION(['arrow', 'circle']), { optional: true })
        endCap?: 'arrow' | 'circle';
    }
    return CappableOptions;
}

function Extendable<T extends Constructor>(Parent: T) {
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
type Constructor<T = {}> = new (...args: any[]) => T;

// function Type<T extends string, U extends Constructor>(type: T, Parent: U) {
//     class Typed extends Parent {
//         static is(value: unknown): value is typeof Parent {
//             return isObject(value) && value.type === type;
//         }

//         type: T = type;
//     }
//     return Typed;
// }

function Visible<T extends Constructor>(Parent: T) {
    class VisibleOptions extends Parent {
        @Validate(BOOLEAN, { optional: true })
        visible?: boolean;
    }
    return VisibleOptions;
}

function Fill<T extends Constructor>(Parent: T) {
    class FillOptions extends Parent {
        @Validate(COLOR_STRING, { optional: true })
        fill?: string;

        @Validate(RATIO, { optional: true })
        fillOpacity?: number;
    }
    return FillOptions;
}

function Stroke<T extends Constructor>(Parent: T) {
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

function LineDash<T extends Constructor>(Parent: T) {
    class LineDashOptions extends Parent {
        @Validate(LINE_DASH, { optional: true })
        lineDash?: number[];

        @Validate(NUMBER, { optional: true })
        lineDashOffset?: number;
    }
    return LineDashOptions;
}
