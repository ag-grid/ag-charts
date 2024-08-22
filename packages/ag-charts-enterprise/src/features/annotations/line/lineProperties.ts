import { type PixelSize, _ModuleSupport, _Scene } from 'ag-charts-community';

import { Annotation, Cappable, Extendable, Handle, Line, LineStyle, Stroke } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { validateDatumLine } from '../annotationUtils';

const { STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export abstract class LineTypeProperties extends Annotation(
    Line(Handle(Cappable(Extendable(Stroke(LineStyle(BaseProperties))))))
) {
    lineCap?: _Scene.ShapeLineCap = undefined;
    computedLineDash?: PixelSize[] = undefined;

    override isValidWithContext(context: AnnotationContext, warningPrefix?: string) {
        return super.isValid(warningPrefix) && validateDatumLine(context, this, warningPrefix);
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

export class ArrowProperties extends LineTypeProperties {
    static is(value: unknown): value is ArrowProperties {
        return isObject(value) && value.type === AnnotationType.Arrow;
    }

    @Validate(STRING)
    type = AnnotationType.Arrow as const;

    override endCap = 'arrow' as const;
}

export class LineProperties extends LineTypeProperties {
    static is(value: unknown): value is LineProperties {
        return isObject(value) && value.type === AnnotationType.Line;
    }

    @Validate(STRING)
    type = AnnotationType.Line as const;
}
