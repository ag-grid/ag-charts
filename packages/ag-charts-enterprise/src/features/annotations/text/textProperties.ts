import { _ModuleSupport } from 'ag-charts-community';

import { Annotation, Font, Handle, Label, PointProperties } from '../annotationProperties';
import { type AnnotationContext, AnnotationType } from '../annotationTypes';

const { STRING, Validate, isObject } = _ModuleSupport;

export class TextProperties extends Annotation(Handle(Label(Font(PointProperties)))) {
    static is(value: unknown): value is TextProperties {
        return isObject(value) && value.type === AnnotationType.Text;
    }

    @Validate(STRING)
    type = AnnotationType.Text as const;

    override isValidWithContext(_context: AnnotationContext, warningPrefix?: string) {
        return super.isValid(warningPrefix);
    }

    override getDefaultColor() {
        return 'black';
    }
}
