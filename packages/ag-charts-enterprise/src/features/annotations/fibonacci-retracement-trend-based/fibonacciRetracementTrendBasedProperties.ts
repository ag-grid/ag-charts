import { _ModuleSupport } from 'ag-charts-community';
import { isObject } from 'ag-charts-core';

import { PointProperties } from '../annotationProperties';
import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { FibonacciProperties } from '../properties/fibonacciProperties';
import { validateDatumLine } from '../utils/validation';

const { STRING, OBJECT, TempValidate } = _ModuleSupport;

export class FibonacciRetracementTrendBasedProperties extends FibonacciProperties {
    static is(this: void, value: unknown): value is FibonacciRetracementTrendBasedProperties {
        return isObject(value) && value.type === AnnotationType.FibonacciRetracementTrendBased;
    }

    override isValidWithContext(context: AnnotationContext, warningPrefix?: string) {
        return validateDatumLine(context, this, { overflowContinuous: true }, warningPrefix);
    }

    @TempValidate(STRING)
    type = AnnotationType.FibonacciRetracementTrendBased as const;

    @TempValidate(OBJECT)
    endRetracement = new PointProperties();
}
