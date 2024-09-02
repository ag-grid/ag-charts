import { type PixelSize, _ModuleSupport, type _Scene } from 'ag-charts-community';

import {
    Annotation,
    Cappable,
    Extendable,
    Handle,
    Line,
    LineStyle,
    LineTextProperties,
    Stroke,
} from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { getComputedLineDash, getLineStyle } from '../utils/styles';
import { validateDatumLine } from '../utils/validation';

const { OBJECT, STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export abstract class LineTypeProperties extends Annotation(
    Line(Handle(Cappable(Extendable(Stroke(LineStyle(BaseProperties))))))
) {
    @Validate(OBJECT, { optional: true })
    text = new LineTextProperties();

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
        const styleType = getLineStyle(this.lineDash, this.lineStyle);
        return this.lineDash ?? this.computedLineDash ?? getComputedLineDash(this.strokeWidth ?? 1, styleType);
    }

    getLineCap(): _Scene.ShapeLineCap | undefined {
        const styleType = getLineStyle(this.lineDash, this.lineStyle);
        return this.lineCap ?? styleType === 'dotted' ? 'round' : undefined;
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
