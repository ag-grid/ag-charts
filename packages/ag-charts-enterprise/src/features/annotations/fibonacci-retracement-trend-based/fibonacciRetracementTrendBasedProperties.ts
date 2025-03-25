import { _ModuleSupport } from 'ag-charts-community';
import { isObject } from 'ag-charts-core';

import { PointProperties } from '../annotationProperties';
import { AnnotationType } from '../annotationTypes';
import { FibonacciProperties } from '../properties/fibonacciProperties';

const { Property } = _ModuleSupport;

export class FibonacciRetracementTrendBasedProperties extends FibonacciProperties {
    static is(this: void, value: unknown): value is FibonacciRetracementTrendBasedProperties {
        return isObject(value) && value.type === AnnotationType.FibonacciRetracementTrendBased;
    }

    @Property
    type = AnnotationType.FibonacciRetracementTrendBased as const;

    @Property
    endRetracement = new PointProperties();
}
