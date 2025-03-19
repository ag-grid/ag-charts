import { _ModuleSupport } from 'ag-charts-community';
import { isObject } from 'ag-charts-core';

import { AnnotationType } from '../annotationTypes';
import { TextualPointProperties } from '../properties/textualPointProperties';

const { STRING, TempValidate } = _ModuleSupport;

export class TextProperties extends TextualPointProperties {
    static is(this: void, value: unknown): value is TextProperties {
        return isObject(value) && value.type === AnnotationType.Text;
    }

    @TempValidate(STRING)
    type = AnnotationType.Text as const;

    override position = 'bottom' as const;
}
