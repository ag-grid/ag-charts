import { _ModuleSupport } from 'ag-charts-community';

import { Annotation, Font, Handle, Label, Point } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, type Padding } from '../annotationTypes';
import { convertPoint } from '../annotationUtils';

const { STRING, BaseProperties, Validate } = _ModuleSupport;

export class TextualPointProperties extends Annotation(Point(Handle(Label(Font(BaseProperties))))) {
    @Validate(STRING)
    text: string = '';

    position: 'top' | 'center' | 'bottom' = 'top';
    alignment: 'left' | 'center' | 'right' = 'left';
    placement: 'inside' | 'outside' = 'inside';
    width?: number;
    placeholderText?: string = undefined;

    override isValidWithContext(_context: AnnotationContext, warningPrefix?: string) {
        return super.isValid(warningPrefix);
    }

    getDefaultColor(_colorPickerType: AnnotationOptionsColorPickerType) {
        return this.color;
    }

    getDefaultOpacity(_colorPickerType: AnnotationOptionsColorPickerType): number | undefined {
        return undefined;
    }

    getPlaceholderColor(): string | undefined {
        return undefined;
    }

    public getTextInputCoords(context: AnnotationContext, _padding?: Padding | number) {
        return convertPoint(this, context);
    }
}
