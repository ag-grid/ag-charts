import { _ModuleSupport } from 'ag-charts-community';

import { Annotation, Font, Handle, Label, Line } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, type Padding } from '../annotationTypes';
import { convertPoint } from '../annotationUtils';
import type { AnnotationTextAlignment, AnnotationTextPosition } from '../text/util';

const { STRING, BaseProperties, Validate } = _ModuleSupport;

export class TextualStartEndProperties extends Annotation(Line(Handle(Label(Font(BaseProperties))))) {
    @Validate(STRING)
    text: string = '';

    position: AnnotationTextPosition = 'top';
    alignment: AnnotationTextAlignment = 'left';
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

    getPadding(): Padding {
        const { padding = 0 } = this;
        return {
            top: padding,
            right: padding,
            bottom: padding,
            left: padding,
        };
    }

    getText() {
        const isPlaceholder = this.text.length == 0;
        const text = !isPlaceholder ? this.text : this.placeholderText ?? '';
        return {
            text,
            isPlaceholder,
        };
    }

    public getTextInputCoords(context: AnnotationContext): { x: number; y: number } {
        return convertPoint(this.end, context);
    }
}
