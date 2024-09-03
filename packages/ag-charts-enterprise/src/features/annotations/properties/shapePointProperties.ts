import { _ModuleSupport } from 'ag-charts-community';

import { Fill } from '../annotationProperties';
import { type AnnotationOptionsColorPickerType } from '../annotationTypes';
import { PointProperties } from './pointProperties';

export class ShapePointProperties extends Fill(PointProperties) {
    static is(value: unknown): value is ShapePointProperties {
        return value instanceof ShapePointProperties;
    }

    size: number = 32;

    override getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
        return colorPickerType === `fill-color` ? this.fill : undefined;
    }

    override getDefaultOpacity(colorPickerType: AnnotationOptionsColorPickerType) {
        return colorPickerType === `fill-color` ? this.fillOpacity : undefined;
    }
}
