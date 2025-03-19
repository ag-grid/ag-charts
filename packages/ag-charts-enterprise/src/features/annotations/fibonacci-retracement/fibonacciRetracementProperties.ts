import { _ModuleSupport } from 'ag-charts-community';
import { isObject } from 'ag-charts-core';

import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { FibonacciProperties } from '../properties/fibonacciProperties';
import { validateDatumLine } from '../utils/validation';

const { STRING, TempValidate } = _ModuleSupport;

export class FibonacciRetracementProperties extends FibonacciProperties {
    static is(this: void, value: unknown): value is FibonacciRetracementProperties {
        return isObject(value) && value.type === AnnotationType.FibonacciRetracement;
    }

    override isValidWithContext(context: AnnotationContext, warningPrefix?: string) {
        return validateDatumLine(context, this, { overflowContinuous: true }, warningPrefix);
    }

    @TempValidate(STRING)
    type = AnnotationType.FibonacciRetracement as const;
}
