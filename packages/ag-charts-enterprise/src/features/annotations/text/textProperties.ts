import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { TextualProperties } from '../properties/textualProperties';

const { STRING, Validate, isObject } = _ModuleSupport;

export class TextProperties extends TextualProperties {
    static is(value: unknown): value is TextProperties {
        return isObject(value) && value.type === AnnotationType.Text;
    }

    @Validate(STRING)
    type = AnnotationType.Text as const;
}
