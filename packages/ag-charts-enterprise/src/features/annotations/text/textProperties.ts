import { Property, isObject } from 'ag-charts-core';

import { AnnotationType } from '../annotationTypes';
import { TextualPointProperties } from '../properties/textualPointProperties';

export class TextProperties extends TextualPointProperties {
    static is(this: void, value: unknown): value is TextProperties {
        return isObject(value) && value.type === AnnotationType.Text;
    }

    @Property
    type = AnnotationType.Text as const;

    override position = 'bottom' as const;
}
