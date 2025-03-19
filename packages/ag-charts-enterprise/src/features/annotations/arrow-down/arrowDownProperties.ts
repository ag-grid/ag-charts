import { _ModuleSupport } from 'ag-charts-community';
import { isObject } from 'ag-charts-core';

import { AnnotationType } from '../annotationTypes';
import { ShapePointProperties } from '../properties/shapePointProperties';

const { STRING, TempValidate } = _ModuleSupport;

export class ArrowDownProperties extends ShapePointProperties {
    static override is(this: void, value: unknown): value is ArrowDownProperties {
        return isObject(value) && value.type === AnnotationType.ArrowDown;
    }

    @TempValidate(STRING)
    type = AnnotationType.ArrowDown as const;
}
