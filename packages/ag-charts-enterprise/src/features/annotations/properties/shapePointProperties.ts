import { _ModuleSupport } from 'ag-charts-community';

import { Fill, Stroke } from '../annotationProperties';
import { type AnnotationOptionsColorPickerType } from '../annotationTypes';
import { PointProperties } from './pointProperties';

const { Validate, POSITIVE_NUMBER } = _ModuleSupport;

export class ShapePointProperties extends Fill(Stroke(PointProperties)) {
    static is(value: unknown): value is ShapePointProperties {
        return value instanceof ShapePointProperties;
    }

    @Validate(POSITIVE_NUMBER)
    size: number = 32;

    override getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `fill-color`:
                return this.fill;
            case `line-color`:
            default:
                return this.stroke;
        }
    }

    override getDefaultOpacity(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `fill-color`:
                return this.fillOpacity;
            case `line-color`:
                return this.strokeOpacity;
            default:
                return undefined;
        }
    }
}
