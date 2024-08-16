import { type PixelSize, _ModuleSupport, _Scene } from 'ag-charts-community';

import { Annotation, AxisLabel, Handle, LineDash, Stroke, Value } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { validateDatumValue } from '../annotationUtils';

const { STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export class HorizontalLineProperties extends Annotation(Value(Handle(AxisLabel(Stroke(LineDash(BaseProperties)))))) {
    readonly direction = 'horizontal';

    static is(value: unknown): value is HorizontalLineProperties {
        return isObject(value) && value.type === AnnotationType.HorizontalLine;
    }

    @Validate(STRING)
    type = AnnotationType.HorizontalLine as const;

    lineCap?: _Scene.ShapeLineCap = undefined;
    computedLineDash?: PixelSize[] = undefined;

    override isValidWithContext(context: AnnotationContext, warningPrefix: string) {
        return super.isValid(warningPrefix) && validateDatumValue(context, this, warningPrefix);
    }

    getDefaultColor(_colorPickerType: AnnotationOptionsColorPickerType) {
        return this.stroke;
    }

    getDefaultOpacity(_colorPickerType: AnnotationOptionsColorPickerType) {
        return this.strokeOpacity;
    }

    getLineDash(): PixelSize[] | undefined {
        return this.lineDash ?? this.computedLineDash;
    }
}

export class VerticalLineProperties extends Annotation(Value(Handle(AxisLabel(Stroke(LineDash(BaseProperties)))))) {
    readonly direction = 'vertical';

    static is(value: unknown): value is VerticalLineProperties {
        return isObject(value) && value.type === AnnotationType.VerticalLine;
    }

    @Validate(STRING)
    type = AnnotationType.VerticalLine as const;

    lineCap?: _Scene.ShapeLineCap = undefined;
    computedLineDash?: PixelSize[] = undefined;

    override isValidWithContext(context: AnnotationContext, warningPrefix: string) {
        return super.isValid(warningPrefix) && validateDatumValue(context, this, warningPrefix);
    }

    getDefaultColor(_colorPickerType: AnnotationOptionsColorPickerType) {
        return this.stroke;
    }

    getDefaultOpacity(_colorPickerType: AnnotationOptionsColorPickerType) {
        return this.strokeOpacity;
    }

    getLineDash(): PixelSize[] | undefined {
        return this.lineDash ?? this.computedLineDash;
    }
}

export type CrossLineProperties = HorizontalLineProperties | VerticalLineProperties;
