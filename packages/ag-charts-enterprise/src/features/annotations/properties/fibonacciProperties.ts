import { _ModuleSupport } from 'ag-charts-community';

import { Property } from 'ag-charts-core';
import { LabelTextProperties } from '../annotationProperties';
import type { AnnotationOptionsColorPickerType, FibonacciBands } from '../annotationTypes';
import { LineTypeProperties } from '../line/lineProperties';

export class FibonacciProperties extends LineTypeProperties {
    @Property
    label = new LabelTextProperties();

    @Property
    reverse: boolean = false;

    @Property
    showFill: boolean = true;

    @Property
    isMultiColor: boolean = true;

    @Property
    strokes: string[] = [];

    @Property
    rangeStroke?: string;

    @Property
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
