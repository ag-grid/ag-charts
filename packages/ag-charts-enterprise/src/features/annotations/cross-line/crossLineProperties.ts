import { _ModuleSupport } from 'ag-charts-community';

import { Annotation, AnnotationCrossLine, AnnotationHandle, Cappable, LineDash, Stroke } from '../annotationProperties';
import { AnnotationType, type ValidationContext } from '../annotationTypes';
import { validateDatumValue } from '../annotationUtils';

const { STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export class CrossLineAnnotation extends Annotation(
    AnnotationType.CrossLine,
    AnnotationCrossLine(AnnotationHandle(Cappable(Stroke(LineDash(BaseProperties)))))
) {
    static is(value: unknown): value is CrossLineAnnotation {
        return isObject(value) && value.type === AnnotationType.CrossLine;
    }

    @Validate(STRING)
    type = AnnotationType.CrossLine as const;

    override isValidWithContext(context: ValidationContext, warningPrefix: string) {
        return super.isValid(warningPrefix) && validateDatumValue(context, this, warningPrefix);
    }
}
