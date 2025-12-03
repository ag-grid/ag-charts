import type {
    AgAnnotationLineStyleType,
    FontStyle,
    FontWeight,
    Formatter,
    PixelSize,
    TextAlign,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, FONT_SIZE, Property, generateUUID } from 'ag-charts-core';

import type {
    AnnotationOptionsColorPickerType,
    ChannelTextPosition,
    Constructor,
    LineTextAlignment,
    LineTextPosition,
} from './annotationTypes';
import type { PointType } from './utils/scale';

const {} = _ModuleSupport;
/**************
 * Components *
 **************/

export class PointProperties extends BaseProperties {
    @Property
    x?: PointType;

    @Property
    y?: PointType;
}

export class ChannelAnnotationMiddleProperties extends Stroke(LineStyle(Visible(BaseProperties))) {}

export class AxisLabelProperties extends Stroke(LineStyle(Fill(Label(Font(BaseProperties))))) {
    @Property
    enabled?: boolean;

    @Property
    cornerRadius: number = 2;
}

class BackgroundProperties extends Fill(BaseProperties) {}

class HandleProperties extends Stroke(LineStyle(Fill(BaseProperties))) {}

export class LineTextProperties extends Font(BaseProperties) {
    @Property
    label: string = '';

    @Property
    position?: LineTextPosition = 'top';

    @Property
    alignment?: LineTextAlignment = 'left';
}

export class LabelTextProperties extends Font(BaseProperties) {}

export class ChannelTextProperties extends Font(BaseProperties) {
    @Property
    label: string = '';

    @Property
    position?: ChannelTextPosition;

    @Property
    alignment?: LineTextAlignment;
}

export interface AxisLabelFormatterParams {
    readonly value: any;
}

/*******************************
 * Annotations specific mixins *
 *******************************/
export function Annotation<U extends Constructor<BaseProperties>>(Parent: U) {
    abstract class AnnotationInternal extends Writeable(Visible(Parent)) {
        // A uuid is required, over the usual incrementing index, as annotations can be restored from external databases
        id = generateUUID();

        abstract getDefaultColor(
            colorPickerType: AnnotationOptionsColorPickerType,
            isMultiColor?: boolean
        ): string | undefined;
    }
    return AnnotationInternal;
}

export function Line<T extends Constructor>(Parent: T) {
    class LineInternal extends Parent {
        @Property
        start = new PointProperties();

        @Property
        end = new PointProperties();
    }
    return LineInternal;
}

export function Point<T extends Constructor>(Parent: T) {
    class PointInternal extends Parent {
        @Property
        x?: PointType;

        @Property
        y?: PointType;
    }
    return PointInternal;
}

export function Value<T extends Constructor>(Parent: T) {
    class ValueInternal extends Parent {
        @Property
        value?: PointType;
    }
    return ValueInternal;
}

export function Background<T extends Constructor>(Parent: T) {
    class BackgroundInternal extends Parent {
        @Property
        background = new BackgroundProperties();
    }
    return BackgroundInternal;
}

export function Handle<T extends Constructor>(Parent: T) {
    class HandleInternal extends Parent {
        @Property
        handle = new HandleProperties();
    }
    return HandleInternal;
}

export function AxisLabel<T extends Constructor>(Parent: T) {
    class AxisLabelInternal extends Parent {
        @Property
        axisLabel = new AxisLabelProperties();
    }
    return AxisLabelInternal;
}

export function Label<T extends Constructor>(Parent: T) {
    class LabelInternal extends Parent {
        @Property
        padding?: number = undefined;

        @Property
        textAlign: TextAlign = 'center';

        @Property
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
        @Property
        extendStart?: boolean;

        @Property
        extendEnd?: boolean;
    }
    return ExtendableInternal;
}

function Writeable<T extends Constructor>(Parent: T) {
    class WriteableInternal extends Parent {
        @Property
        locked?: boolean;

        @Property
        readOnly?: boolean;

        isWriteable() {
            return !this.locked && !this.readOnly;
        }

        isHoverable() {
            return !this.readOnly;
        }
    }
    return WriteableInternal;
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
        @Property
        visible?: boolean;
    }
    return VisibleInternal;
}

export function Fill<T extends Constructor>(Parent: T) {
    class FillInternal extends Parent {
        @Property
        fill?: string;

        @Property
        fillOpacity?: number;
    }
    return FillInternal;
}

export function Stroke<T extends Constructor>(Parent: T) {
    class StrokeInternal extends Parent {
        @Property
        stroke?: string;

        @Property
        strokeOpacity?: number;

        @Property
        strokeWidth?: number;
    }
    return StrokeInternal;
}

export function LineStyle<T extends Constructor>(Parent: T) {
    class LineDashInternal extends Parent {
        lineCap?: _ModuleSupport.ShapeLineCap = undefined;
        computedLineDash?: PixelSize[] = undefined;

        @Property
        lineDash?: number[];

        @Property
        lineDashOffset?: number;

        @Property
        lineStyle?: AgAnnotationLineStyleType;
    }
    return LineDashInternal;
}

export function Font<T extends Constructor>(Parent: T) {
    class FontInternal extends Parent {
        @Property
        fontStyle?: FontStyle;

        @Property
        fontWeight?: FontWeight;

        @Property
        fontSize: number = FONT_SIZE.SMALL;

        @Property
        fontFamily: string = 'Verdana, sans-serif';

        @Property
        color?: string;
    }
    return FontInternal;
}
