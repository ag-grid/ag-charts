import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { TextualProperties } from '../properties/textualProperties';

const { STRING, Validate, isObject } = _ModuleSupport;

export class NoteProperties extends TextualProperties {
    static is(value: unknown): value is NoteProperties {
        return isObject(value) && value.type === AnnotationType.Note;
    }

    @Validate(STRING)
    type = AnnotationType.Note as const;

    override position = 'top' as const;
    override alignment = 'left' as const;
}
