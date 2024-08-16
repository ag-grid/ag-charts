import { type PixelSize, _ModuleSupport, _Scene } from 'ag-charts-community';

import { Annotation, AxisLabel, Handle, LineDash, LineStyle, Stroke, Value } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, LineAnnotationType } from '../annotationTypes';
import { validateDatumValue } from '../annotationUtils';

const { STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export class HorizontalLineProperties extends Annotation(
    Value(Handle(AxisLabel(Stroke(LineDash(LineStyle(BaseProperties))))))
) {
    readonly direction = 'horizontal';

    static is(value: unknown): value is HorizontalLineProperties {
        return isObject(value) && value.type === LineAnnotationType.HorizontalLine;
    }

    @Validate(STRING)
    type = LineAnnotationType.HorizontalLine as const;

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
        return isObject(value) && value.type === LineAnnotationType.VerticalLine;
    }

    @Validate(STRING)
    type = LineAnnotationType.VerticalLine as const;

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
