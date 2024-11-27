import { _ModuleSupport } from 'ag-charts-community';

import { LineTextProperties } from '../annotationProperties';
import { LineTypeProperties } from '../line/lineProperties';

const { OBJECT, BOOLEAN, COLOR_STRING_ARRAY, Validate } = _ModuleSupport;

export class FibonacciProperties extends LineTypeProperties {
    @Validate(OBJECT, { optional: true })
    label = new LineTextProperties();

    @Validate(BOOLEAN, { optional: true })
    reverse: boolean = false;

    @Validate(BOOLEAN, { optional: true })
    showFill: boolean = true;

    @Validate(COLOR_STRING_ARRAY)
    strokes: string[] = [];
}
