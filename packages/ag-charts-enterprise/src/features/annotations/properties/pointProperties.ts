import { _ModuleSupport } from 'ag-charts-community';

import { Annotation, Handle, Point } from '../annotationProperties';
import { type AnnotationOptionsColorPickerType } from '../annotationTypes';



import { BaseProperties } from 'ag-charts-core';
export class PointProperties extends Annotation(Point(Handle(BaseProperties))) {
    getDefaultColor(_colorPickerType: AnnotationOptionsColorPickerType): string | undefined {
        return undefined;
    }

    getDefaultOpacity(_colorPickerType: AnnotationOptionsColorPickerType): number | undefined {
        return undefined;
    }
}
