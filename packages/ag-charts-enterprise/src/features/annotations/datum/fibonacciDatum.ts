import { type LabelTextDatum, createLabelTextDatum } from '../annotationDatum';
import type { AnnotationOptionsColorPickerType, FibonacciBands } from '../annotationTypes';
import { type LineTypeDatum, createLineTypeDatum } from '../line/lineDatum';

export interface FibonacciDatum extends LineTypeDatum {
    label: LabelTextDatum;
    reverse: boolean;
    showFill: boolean;
    isMultiColor: boolean;
    strokes: string[];
    rangeStroke?: string;
    bands?: FibonacciBands;
}

export function createFibonacciDatum(): Omit<FibonacciDatum, 'type'> {
    return {
        ...createLineTypeDatum(),
        label: createLabelTextDatum(),
        reverse: false,
        showFill: true,
        isMultiColor: true,
        strokes: [],
        bands: 10,
    };
}

export function getFibonacciDefaultColor(datum: FibonacciDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    switch (colorPickerType) {
        case 'line-color':
            return datum.rangeStroke ?? datum.stroke;
        case 'text-color':
            return datum.text.color;
    }
}
