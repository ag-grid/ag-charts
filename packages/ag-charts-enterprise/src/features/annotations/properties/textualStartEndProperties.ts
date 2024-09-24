import { _ModuleSupport } from 'ag-charts-community';

import { Font, Label } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, type Padding } from '../annotationTypes';
import type { AnnotationTextAlignment, AnnotationTextPosition } from '../text/util';
import { convertPoint } from '../utils/values';
import { StartEndProperties } from './startEndProperties';

const { STRING, Validate } = _ModuleSupport;

export class TextualStartEndProperties extends Label(Font(StartEndProperties)) {
    @Validate(STRING)
    text: string = '';

    position: AnnotationTextPosition = 'top';
    alignment: AnnotationTextAlignment = 'left';
    placement: 'inside' | 'outside' = 'inside';
    width?: number;
    placeholderText?: string = 'inputTextareaPlaceholder';

    override isValidWithContext(_context: AnnotationContext, warningPrefix?: string) {
        return super.isValid(warningPrefix);
    }

    override getDefaultColor(_colorPickerType: AnnotationOptionsColorPickerType) {
        return this.color;
    }

    override getDefaultOpacity(_colorPickerType: AnnotationOptionsColorPickerType): number | undefined {
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
        let text = this.text;

        if (isPlaceholder) {
            text = this.placeholderText ?? '';
            if (this.localeManager) text = this.localeManager.t(text);
        }

        return {
            text,
            isPlaceholder,
        };
    }

    public getTextInputCoords(context: AnnotationContext, _height: number): { x: number; y: number } {
        return convertPoint(this.end, context);
    }

    public getTextPosition() {
        return this.position;
    }
}
