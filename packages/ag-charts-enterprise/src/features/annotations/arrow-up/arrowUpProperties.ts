import { _ModuleSupport } from 'ag-charts-community';
import { isObject, Property } from 'ag-charts-core';

import { AnnotationType } from '../annotationTypes';
import { ShapePointProperties } from '../properties/shapePointProperties';

export class ArrowUpProperties extends ShapePointProperties {
    static override is(this: void, value: unknown): value is ArrowUpProperties {
        return isObject(value) && value.type === AnnotationType.ArrowUp;
    }

    @Property
    type = AnnotationType.ArrowUp as const;
}
