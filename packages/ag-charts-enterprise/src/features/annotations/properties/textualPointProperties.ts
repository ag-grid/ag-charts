import { _ModuleSupport } from 'ag-charts-community';

import { Property, BaseProperties} from 'ag-charts-core';
import { Annotation, Font, Handle, Label, Point } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, type Padding } from '../annotationTypes';
import type { AnnotationTextAlignment, AnnotationTextPosition } from '../text/util';
import { convertPoint } from '../utils/values';


export class TextualPointProperties extends Annotation(Point(Handle(Label(Font(BaseProperties))))) {
    @Property
    text: string = '';

    position: AnnotationTextPosition = 'top';
    alignment: AnnotationTextAlignment = 'left';
    placement: 'inside' | 'outside' = 'inside';
    width?: number;
    placeholderText?: string = 'inputTextareaPlaceholder';

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
        const text = isPlaceholder ? this.placeholderText ?? '' : this.text;
        return {
            text,
            isPlaceholder,
        };
    }

    public getTextInputCoords(context: AnnotationContext, _height: number) {
        return convertPoint(this, context);
    }

    public getTextPosition() {
        return this.position;
    }
}
