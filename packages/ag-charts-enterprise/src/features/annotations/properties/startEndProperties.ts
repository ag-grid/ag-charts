import { _ModuleSupport } from 'ag-charts-community';

import { Annotation, Handle, Line } from '../annotationProperties';
import { type AnnotationOptionsColorPickerType } from '../annotationTypes';



import { BaseProperties } from 'ag-charts-core';
export class StartEndProperties extends Annotation(Line(Handle(BaseProperties))) {
    snapToAngle: number = 45;

    getDefaultColor(_colorPickerType: AnnotationOptionsColorPickerType): string | undefined {
        return undefined;
    }

    getDefaultOpacity(_colorPickerType: AnnotationOptionsColorPickerType): number | undefined {
        return undefined;
    }
}
