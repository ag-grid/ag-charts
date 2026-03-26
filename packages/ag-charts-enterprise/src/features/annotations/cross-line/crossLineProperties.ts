import { type PixelSize, _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, Property, isObject } from 'ag-charts-core';

import { Annotation, AxisLabel, Handle, LineStyle, LineTextProperties, Stroke, Value } from '../annotationProperties';
import { AnnotationType } from '../annotationTypes';
import { getLineCap, getLineDash } from '../utils/line';

export class HorizontalLineProperties extends Annotation(Value(Handle(AxisLabel(Stroke(LineStyle(BaseProperties)))))) {
    readonly direction = 'horizontal';

    static is(this: void, value: unknown): value is HorizontalLineProperties {
        return isObject(value) && value.type === AnnotationType.HorizontalLine;
    }

    @Property
    type = AnnotationType.HorizontalLine as const;

    @Property
    text = new LineTextProperties();

    getDefaultColor() {
        return this.stroke;
    }

    getDefaultOpacity() {
        return this.strokeOpacity;
    }

    getLineDash(): PixelSize[] | undefined {
        return getLineDash(this.lineDash, this.computedLineDash, this.lineStyle, this.strokeWidth);
    }

    getLineCap(): _ModuleSupport.ShapeLineCap | undefined {
        return getLineCap(this.lineCap, this.lineDash, this.lineStyle);
    }
}

export class VerticalLineProperties extends Annotation(Value(Handle(AxisLabel(Stroke(LineStyle(BaseProperties)))))) {
    readonly direction = 'vertical';

    static is(this: void, value: unknown): value is VerticalLineProperties {
        return isObject(value) && value.type === AnnotationType.VerticalLine;
    }

    @Property
    type = AnnotationType.VerticalLine as const;

    @Property
    text = new LineTextProperties();

    getDefaultColor() {
        return this.stroke;
    }

    getDefaultOpacity() {
        return this.strokeOpacity;
    }

    getLineDash(): PixelSize[] | undefined {
        return getLineDash(this.lineDash, this.computedLineDash, this.lineStyle, this.strokeWidth);
    }

    getLineCap(): _ModuleSupport.ShapeLineCap | undefined {
        return getLineCap(this.lineCap, this.lineDash, this.lineStyle);
    }
}

export type CrossLineProperties = HorizontalLineProperties | VerticalLineProperties;
