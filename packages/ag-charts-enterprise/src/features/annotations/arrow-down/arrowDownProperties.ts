import { _ModuleSupport } from 'ag-charts-community';
import { isObject, Property } from 'ag-charts-core';

import { AnnotationType } from '../annotationTypes';
import { ShapePointProperties } from '../properties/shapePointProperties';

export class ArrowDownProperties extends ShapePointProperties {
    static override is(this: void, value: unknown): value is ArrowDownProperties {
        return isObject(value) && value.type === AnnotationType.ArrowDown;
    }

    @Property
    type = AnnotationType.ArrowDown as const;
}
