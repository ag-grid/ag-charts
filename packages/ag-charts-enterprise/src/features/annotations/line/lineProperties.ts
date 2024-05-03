import { _ModuleSupport, _Util } from 'ag-charts-community';

import {
    Annotation,
    AnnotationHandle,
    AnnotationLine,
    Cappable,
    Extendable,
    LineDash,
    Stroke,
} from '../annotationProperties';
import { AnnotationType } from '../annotationTypes';

const { STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export class LineAnnotation extends Annotation(
    AnnotationType.Line,
    AnnotationLine(AnnotationHandle(Cappable(Extendable(Stroke(LineDash(BaseProperties))))))
) {
    static is(value: unknown): value is LineAnnotation {
        return isObject(value) && value.type === AnnotationType.Line;
    }

    @Validate(STRING)
    type = AnnotationType.Line as const;
}
