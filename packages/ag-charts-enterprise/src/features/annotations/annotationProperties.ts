import type {
    AgAnnotationLineStyleType,
    FontStyle,
    FontWeight,
    Formatter,
    PixelSize,
    TextAlign,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { isObject } from 'ag-charts-core';

import type {
    AnnotationContext,
    AnnotationOptionsColorPickerType,
    ChannelTextPosition,
    Constructor,
    LineTextAlignment,
    LineTextPosition,
} from './annotationTypes';
import type { PointType } from './utils/scale';

const {
    BOOLEAN,
    COLOR_STRING,
    DATE,
    FONT_STYLE,
    FONT_WEIGHT,
    FUNCTION,
    LINE_DASH,
    LINE_STYLE,
    NUMBER,
    OBJECT,
    OR,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    TEXT_ALIGN,
    UNION,
    BaseProperties,
    TempValidate,
    predicateWithMessage,
    generateUUID,
} = _ModuleSupport;

/**************
 * Components *
 **************/

const GROUPING_VALUE_KEYS = ['value', 'groupPercentage'];
const GROUPING_VALUE = predicateWithMessage(
    (value) => isObject(value) && Object.keys(value).every((key) => GROUPING_VALUE_KEYS.includes(key)),
    "objects with grouping value properties such as 'value' or 'groupPercentage'"
);

export class PointProperties extends BaseProperties {
    @TempValidate(OR(STRING, NUMBER, DATE, GROUPING_VALUE))
    x?: PointType;

    @TempValidate(OR(STRING, NUMBER, DATE, GROUPING_VALUE))
    y?: PointType;
}

export class ChannelAnnotationMiddleProperties extends Stroke(LineStyle(Visible(BaseProperties))) {}

export class AxisLabelProperties extends Stroke(LineStyle(Fill(Label(Font(BaseProperties))))) {
    @TempValidate(BOOLEAN)
    enabled?: boolean;

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 2;
}

class BackgroundProperties extends Fill(BaseProperties) {}

class HandleProperties extends Stroke(LineStyle(Fill(BaseProperties))) {}

export class LineTextProperties extends Font(BaseProperties) {
    @TempValidate(STRING)
    label: string = '';

    @TempValidate(UNION(['top', 'center', 'bottom']), { optional: true })
    position?: LineTextPosition = 'top';

    @TempValidate(UNION(['left', 'center', 'right']), { optional: true })
    alignment?: LineTextAlignment = 'left';
}

export class LabelTextProperties extends Font(BaseProperties) {}

export class ChannelTextProperties extends Font(BaseProperties) {
    @TempValidate(STRING)
    label: string = '';

    @TempValidate(UNION(['top', 'inside', 'bottom']), { optional: true })
    position?: ChannelTextPosition;

    @TempValidate(UNION(['left', 'center', 'right']), { optional: true })
    alignment?: LineTextAlignment;
}

export interface AxisLabelFormatterParams {
    readonly value: any;
}

/*******************************
 * Annotations specific mixins *
 *******************************/
export function Annotation<U extends Constructor<_ModuleSupport.BaseProperties>>(Parent: U) {
    abstract class AnnotationInternal extends Lockable(Visible(Parent)) {
        // A uuid is required, over the usual incrementing index, as annotations can be restored from external databases
        id = generateUUID();

        isValidWithContext(_context: AnnotationContext, warningPrefix?: string) {
            return super.isValid(warningPrefix);
        }

        abstract getDefaultColor(
            colorPickerType: AnnotationOptionsColorPickerType,
            isMultiColor?: boolean
        ): string | undefined;
    }
    return AnnotationInternal;
}

export function Line<T extends Constructor>(Parent: T) {
    class LineInternal extends Parent {
        @TempValidate(OBJECT)
        start = new PointProperties();

        @TempValidate(OBJECT)
        end = new PointProperties();
    }
    return LineInternal;
}

export function Point<T extends Constructor>(Parent: T) {
    class PointInternal extends Parent {
        @TempValidate(OR(STRING, NUMBER, DATE, GROUPING_VALUE))
        x?: PointType;

        @TempValidate(OR(STRING, NUMBER, DATE, GROUPING_VALUE))
        y?: PointType;
    }
    return PointInternal;
}

export function Value<T extends Constructor>(Parent: T) {
    class ValueInternal extends Parent {
        @TempValidate(OR(STRING, NUMBER, DATE, GROUPING_VALUE))
        value?: PointType;
    }
    return ValueInternal;
}

export function Background<T extends Constructor>(Parent: T) {
    class BackgroundInternal extends Parent {
        @TempValidate(OBJECT, { optional: true })
        background = new BackgroundProperties();
    }
    return BackgroundInternal;
}

export function Handle<T extends Constructor>(Parent: T) {
    class HandleInternal extends Parent {
        @TempValidate(OBJECT, { optional: true })
        handle = new HandleProperties();
    }
    return HandleInternal;
}

export function AxisLabel<T extends Constructor>(Parent: T) {
    class AxisLabelInternal extends Parent {
        @TempValidate(OBJECT, { optional: true })
        axisLabel = new AxisLabelProperties();
    }
    return AxisLabelInternal;
}

export function Label<T extends Constructor>(Parent: T) {
    class LabelInternal extends Parent {
        @TempValidate(POSITIVE_NUMBER, { optional: true })
        padding?: number = undefined;

        @TempValidate(TEXT_ALIGN, { optional: true })
        textAlign: TextAlign = 'center';

        @TempValidate(FUNCTION, { optional: true })
        formatter?: Formatter<AxisLabelFormatterParams> = undefined; // TODO: making this generic causes issues with mixins sequence
    }
    return LabelInternal;
}

export function Cappable<T extends Constructor>(Parent: T) {
    class CappableInternal extends Parent {
        startCap?: 'arrow';
        endCap?: 'arrow';
    }
    return CappableInternal;
}

export function Extendable<T extends Constructor>(Parent: T) {
    class ExtendableInternal extends Parent {
        @TempValidate(BOOLEAN, { optional: true })
        extendStart?: boolean;

        @TempValidate(BOOLEAN, { optional: true })
        extendEnd?: boolean;
    }
    return ExtendableInternal;
}

function Lockable<T extends Constructor>(Parent: T) {
    class LockableInternal extends Parent {
        @TempValidate(BOOLEAN, { optional: true })
        locked?: boolean;
    }
    return LockableInternal;
}

export function Localisable<T extends Constructor>(Parent: T) {
    class LocalisableInternal extends Parent {
        localeManager?: _ModuleSupport.ModuleContext['localeManager'];

        setLocaleManager(localeManager: _ModuleSupport.ModuleContext['localeManager']) {
            this.localeManager ??= localeManager;
        }
    }
    return LocalisableInternal;
}

/******************
 * Generic mixins *
 ******************/
function Visible<T extends Constructor>(Parent: T) {
    class VisibleInternal extends Parent {
        @TempValidate(BOOLEAN, { optional: true })
        visible?: boolean;
    }
    return VisibleInternal;
}

export function Fill<T extends Constructor>(Parent: T) {
    class FillInternal extends Parent {
        @TempValidate(COLOR_STRING, { optional: true })
        fill?: string;

        @TempValidate(RATIO, { optional: true })
        fillOpacity?: number;
    }
    return FillInternal;
}

export function Stroke<T extends Constructor>(Parent: T) {
    class StrokeInternal extends Parent {
        @TempValidate(COLOR_STRING, { optional: true })
        stroke?: string;

        @TempValidate(RATIO, { optional: true })
        strokeOpacity?: number;

        @TempValidate(NUMBER, { optional: true })
        strokeWidth?: number;
    }
    return StrokeInternal;
}

export function LineStyle<T extends Constructor>(Parent: T) {
    class LineDashInternal extends Parent {
        lineCap?: _ModuleSupport.ShapeLineCap = undefined;
        computedLineDash?: PixelSize[] = undefined;

        @TempValidate(LINE_DASH, { optional: true })
        lineDash?: number[];

        @TempValidate(NUMBER, { optional: true })
        lineDashOffset?: number;

        @TempValidate(LINE_STYLE, { optional: true })
        lineStyle?: AgAnnotationLineStyleType;
    }
    return LineDashInternal;
}

export function Font<T extends Constructor>(Parent: T) {
    class FontInternal extends Parent {
        @TempValidate(FONT_STYLE, { optional: true })
        fontStyle?: FontStyle;

        @TempValidate(FONT_WEIGHT, { optional: true })
        fontWeight?: FontWeight;

        @TempValidate(POSITIVE_NUMBER)
        fontSize: number = 12;

        @TempValidate(STRING)
        fontFamily: string = 'Verdana, sans-serif';

        @TempValidate(COLOR_STRING, { optional: true })
        color?: string;
    }
    return FontInternal;
}
