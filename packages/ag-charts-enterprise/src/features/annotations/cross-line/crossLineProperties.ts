import { _ModuleSupport } from 'ag-charts-community';

import { Annotation, AxisLabel, Cappable, Handle, LineDash, Stroke, Value } from '../annotationProperties';
import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { validateDatumValue } from '../annotationUtils';

const { STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export class HorizontalLineProperties extends Annotation(
    Value(Handle(AxisLabel(Cappable(Stroke(LineDash(BaseProperties))))))
) {
    readonly direction = 'horizontal';

    static is(value: unknown): value is HorizontalLineProperties {
        return isObject(value) && value.type === AnnotationType.HorizontalLine;
    }

    @Validate(STRING)
    type = AnnotationType.HorizontalLine as const;

    override isValidWithContext(context: AnnotationContext, warningPrefix: string) {
        return super.isValid(warningPrefix) && validateDatumValue(context, this, warningPrefix);
    }
}

export class VerticalLineProperties extends Annotation(
    Value(Handle(AxisLabel(Cappable(Stroke(LineDash(BaseProperties))))))
) {
    readonly direction = 'vertical';

    static is(value: unknown): value is VerticalLineProperties {
        return isObject(value) && value.type === AnnotationType.VerticalLine;
    }

    @Validate(STRING)
    type = AnnotationType.VerticalLine as const;

    override isValidWithContext(context: AnnotationContext, warningPrefix: string) {
        return super.isValid(warningPrefix) && validateDatumValue(context, this, warningPrefix);
    }
}

export type CrossLineProperties = HorizontalLineProperties | VerticalLineProperties;
