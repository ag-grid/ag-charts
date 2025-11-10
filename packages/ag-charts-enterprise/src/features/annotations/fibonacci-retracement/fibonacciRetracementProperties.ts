import { _ModuleSupport } from 'ag-charts-community';
import { isObject, Property } from 'ag-charts-core';

import { AnnotationType } from '../annotationTypes';
import { FibonacciProperties } from '../properties/fibonacciProperties';

export class FibonacciRetracementProperties extends FibonacciProperties {
    static is(this: void, value: unknown): value is FibonacciRetracementProperties {
        return isObject(value) && value.type === AnnotationType.FibonacciRetracement;
    }

    @Property
    type = AnnotationType.FibonacciRetracement as const;
}
