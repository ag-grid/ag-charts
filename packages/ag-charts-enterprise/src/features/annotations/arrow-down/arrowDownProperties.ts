import { _ModuleSupport } from 'ag-charts-community';

import { Annotation, Fill, Handle, Point, Stroke } from '../annotationProperties';
import { AnnotationType } from '../annotationTypes';
import { DefaultColorFillLine } from '../properties/mixins';

const { POSITIVE_NUMBER, STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export class ArrowDownProperties extends DefaultColorFillLine(Annotation(Fill(Stroke(Point(Handle(BaseProperties)))))) {
    static is(value: unknown): value is ArrowDownProperties {
        return isObject(value) && value.type === AnnotationType.ArrowDown;
    }

    @Validate(STRING)
    type = AnnotationType.ArrowDown as const;

    @Validate(POSITIVE_NUMBER)
    size: number = 32;
}
