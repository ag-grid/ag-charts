import { _ModuleSupport } from 'ag-charts-community';
import { isObject } from 'ag-charts-core';

import { AnnotationType } from '../annotationTypes';
import { FibonacciProperties } from '../properties/fibonacciProperties';

const { Property } = _ModuleSupport;

export class FibonacciRetracementProperties extends FibonacciProperties {
    static is(this: void, value: unknown): value is FibonacciRetracementProperties {
        return isObject(value) && value.type === AnnotationType.FibonacciRetracement;
    }

    @Property
    override type = AnnotationType.FibonacciRetracement as const;
}
