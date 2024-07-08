import { _ModuleSupport } from 'ag-charts-community';

import {
    Annotation,
    AnnotationAxisLabel,
    AnnotationCrossLine,
    AnnotationHandle,
    Cappable,
    LineDash,
    Stroke,
} from '../annotationProperties';
import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { validateDatumValue } from '../annotationUtils';

const { STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export class HorizontalLineAnnotation extends Annotation(
    AnnotationType.HorizontalLine,
    AnnotationCrossLine(AnnotationHandle(AnnotationAxisLabel(Cappable(Stroke(LineDash(BaseProperties))))))
) {
    readonly direction = 'horizontal';

    static is(value: unknown): value is HorizontalLineAnnotation {
        return isObject(value) && value.type === AnnotationType.HorizontalLine;
    }

    @Validate(STRING)
    type = AnnotationType.HorizontalLine as const;

    override isValidWithContext(context: AnnotationContext, warningPrefix: string) {
        return super.isValid(warningPrefix) && validateDatumValue(context, this, warningPrefix);
    }
}

export class VerticalLineAnnotation extends Annotation(
    AnnotationType.VerticalLine,
    AnnotationCrossLine(AnnotationHandle(AnnotationAxisLabel(Cappable(Stroke(LineDash(BaseProperties))))))
) {
    readonly direction = 'vertical';

    static is(value: unknown): value is VerticalLineAnnotation {
        return isObject(value) && value.type === AnnotationType.VerticalLine;
    }

    @Validate(STRING)
    type = AnnotationType.VerticalLine as const;

    override isValidWithContext(context: AnnotationContext, warningPrefix: string) {
        return super.isValid(warningPrefix) && validateDatumValue(context, this, warningPrefix);
    }
}

export type CrossLineAnnotation = HorizontalLineAnnotation | VerticalLineAnnotation;
