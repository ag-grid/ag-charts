import { _ModuleSupport } from 'ag-charts-community';

import { PointProperties } from '../annotationProperties';
import { AnnotationType } from '../annotationTypes';
import { FibonacciProperties } from '../properties/fibonacciProperties';

const { STRING, OBJECT, Validate, isObject } = _ModuleSupport;

export class FibonacciRetracementTrendBasedProperties extends FibonacciProperties {
    static is(this: void, value: unknown): value is FibonacciRetracementTrendBasedProperties {
        return isObject(value) && value.type === AnnotationType.FibonacciRetracementTrendBased;
    }

    @Validate(STRING)
    type = AnnotationType.FibonacciRetracementTrendBased as const;

    @Validate(OBJECT)
    endRetracement = new PointProperties();
}
