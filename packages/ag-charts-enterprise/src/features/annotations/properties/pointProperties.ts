import { _ModuleSupport } from 'ag-charts-community';

import { Annotation, Handle, Point } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType } from '../annotationTypes';

const { BaseProperties } = _ModuleSupport;

export class PointProperties extends Annotation(Point(Handle(BaseProperties))) {
    override isValidWithContext(_context: AnnotationContext, warningPrefix?: string) {
        return super.isValid(warningPrefix);
    }

    getDefaultColor(_colorPickerType: AnnotationOptionsColorPickerType): string | undefined {
        return undefined;
    }

    getDefaultOpacity(_colorPickerType: AnnotationOptionsColorPickerType): number | undefined {
        return undefined;
    }
}
