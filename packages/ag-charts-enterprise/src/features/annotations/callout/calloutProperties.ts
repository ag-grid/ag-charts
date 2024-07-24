import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { TextualStartEndProperties } from '../properties/textualStartEndProperties';

const { STRING, Validate, isObject } = _ModuleSupport;

export class CalloutProperties extends TextualStartEndProperties {
    static is(value: unknown): value is CalloutProperties {
        return isObject(value) && value.type === AnnotationType.Callout;
    }

    @Validate(STRING)
    type = AnnotationType.Callout as const;

    override position = 'top' as const;
    override alignment = 'center' as const;
}
