import { _ModuleSupport } from 'ag-charts-community';

import { Annotation } from '../annotationProperties';
import { type AnnotationContext, AnnotationType } from '../annotationTypes';

const { STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export class TextProperties extends Annotation(BaseProperties) {
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
