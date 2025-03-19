import { _ModuleSupport } from 'ag-charts-community';
import { isFiniteNumber } from 'ag-charts-core';

import { LabelTextProperties } from '../annotationProperties';
import type { AnnotationOptionsColorPickerType, FibonacciBands } from '../annotationTypes';
import { LineTypeProperties } from '../line/lineProperties';

const { OBJECT, BOOLEAN, COLOR_STRING, COLOR_STRING_ARRAY, TempValidate, predicateWithMessage } = _ModuleSupport;

const fibonacciBands = [10, 6, 4];
const FIBONACCI_BANDS = predicateWithMessage(
    (value) => isFiniteNumber(value) && fibonacciBands.includes(value),
    'Number of fibonacci ranges, 10, 6 or 4'
);

export class FibonacciProperties extends LineTypeProperties {
    @TempValidate(OBJECT, { optional: true })
    label = new LabelTextProperties();

    @TempValidate(BOOLEAN, { optional: true })
    reverse: boolean = false;

    @TempValidate(BOOLEAN, { optional: true })
    showFill: boolean = true;

    @TempValidate(BOOLEAN, { optional: true })
    isMultiColor: boolean = true;

    @TempValidate(COLOR_STRING_ARRAY, { optional: true })
    strokes: string[] = [];

    @TempValidate(COLOR_STRING, { optional: true })
    rangeStroke?: string;

    @TempValidate(FIBONACCI_BANDS, { optional: true })
    bands?: FibonacciBands = 10;

    override getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case 'line-color':
                return this.rangeStroke ?? this.stroke;
            case 'text-color':
                return this.text.color;
        }
    }
}
