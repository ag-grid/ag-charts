import { _ModuleSupport } from 'ag-charts-community';

import { LineTextProperties } from '../annotationProperties';
import type { FibonacciBands } from '../annotationTypes';
import { LineTypeProperties } from '../line/lineProperties';

const { OBJECT, BOOLEAN, COLOR_STRING_ARRAY, Validate, predicateWithMessage, isFiniteNumber } = _ModuleSupport;

const fibonacciBands = [10, 6, 4];
const FIBONACCI_BANDS = predicateWithMessage(
    (value) => isFiniteNumber(value) && fibonacciBands.includes(value),
    'Number of fibonacci ranges, 10, 6 or 4'
);

export class FibonacciProperties extends LineTypeProperties {
    @Validate(OBJECT, { optional: true })
    label = new LineTextProperties();

    @Validate(BOOLEAN, { optional: true })
    reverse: boolean = false;

    @Validate(BOOLEAN, { optional: true })
    showFill: boolean = true;

    @Validate(BOOLEAN, { optional: true })
    isMultiColor: boolean = true;

    @Validate(COLOR_STRING_ARRAY, { optional: true })
    strokes: string[] = [];

    @Validate(FIBONACCI_BANDS, { optional: true })
    bands?: FibonacciBands = 10;
}
