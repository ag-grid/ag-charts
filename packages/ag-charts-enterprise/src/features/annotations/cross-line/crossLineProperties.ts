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

export class CrossLineAnnotation extends Annotation(
    AnnotationType.CrossLine,
    AnnotationCrossLine(AnnotationHandle(AnnotationAxisLabel(Cappable(Stroke(LineDash(BaseProperties))))))
) {
    static is(value: unknown): value is CrossLineAnnotation {
        return isObject(value) && value.type === AnnotationType.CrossLine;
    }

    @Validate(STRING)
    type = AnnotationType.CrossLine as const;

    override isValidWithContext(context: AnnotationContext, warningPrefix: string) {
        return super.isValid(warningPrefix) && validateDatumValue(context, this, warningPrefix);
    }
}
