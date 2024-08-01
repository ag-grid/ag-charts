import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { TextualAnnotationType } from '../annotationTypes';
import { TextualPointProperties } from '../properties/textualPointProperties';

const { STRING, Validate, isObject } = _ModuleSupport;

export class TextProperties extends TextualPointProperties {
    static is(value: unknown): value is TextProperties {
        return isObject(value) && value.type === TextualAnnotationType.Text;
    }

    @Validate(STRING)
    type = TextualAnnotationType.Text as const;

    override position = 'bottom' as const;
}
