import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { Fill, Stroke } from '../annotationProperties';
import {
    type AnnotationContext,
    type AnnotationOptionsColorPickerType,
    type Padding,
    TextualAnnotationType,
} from '../annotationTypes';
import { TextualPointProperties } from '../properties/textualPointProperties';
import { LABEL_OFFSET } from './noteScene';

const { OBJECT, STRING, BaseProperties, Validate, isObject } = _ModuleSupport;
const { clamp } = _Util;

const DEFAULT_NOTE_PADDING = 10;

class NoteBackgroundProperties extends Fill(Stroke(BaseProperties)) {}

export class NoteProperties extends Fill(Stroke(TextualPointProperties)) {
    static is(value: unknown): value is NoteProperties {
        return isObject(value) && value.type === TextualAnnotationType.Note;
    }

    @Validate(STRING)
    type = TextualAnnotationType.Note as const;

    @Validate(OBJECT, { optional: true })
    background = new NoteBackgroundProperties();

    override position = 'bottom' as const;
    override alignment = 'center' as const;
    override width = 200;

    override getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `line-color`:
                return this.fill;
            case `text-color`:
                return this.color;
        }
    }

    override getDefaultOpacity(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `line-color`:
                return this.fillOpacity;
            case `text-color`:
                return undefined;
        }
    }

    override getPadding(): Padding {
        const padding = this.padding ?? DEFAULT_NOTE_PADDING;
        return {
            top: padding,
            right: padding,
            bottom: padding,
            left: padding,
        };
    }

    public override getTextInputCoords(context: AnnotationContext) {
        const { width } = this;
        const { seriesRect } = context;
        const coords = super.getTextInputCoords(context);
        const padding = this.getPadding();

        coords.x = clamp(width / 2, coords.x, seriesRect.width - width / 2);
        coords.y = coords.y - padding.top - LABEL_OFFSET;

        return coords;
    }
}
