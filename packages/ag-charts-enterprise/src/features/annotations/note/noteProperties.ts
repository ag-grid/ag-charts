import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { Fill, Stroke } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { TextualPointProperties } from '../properties/textualPointProperties';
import { DEFAULT_PADDING, LABEL_OFFSET } from './noteScene';

const { OBJECT, STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

class NoteBackgroundProperties extends Fill(Stroke(BaseProperties)) {}

export class NoteProperties extends Fill(Stroke(TextualPointProperties)) {
    static is(value: unknown): value is NoteProperties {
        return isObject(value) && value.type === AnnotationType.Note;
    }

    @Validate(STRING)
    type = AnnotationType.Note as const;

    @Validate(OBJECT, { optional: true })
    background = new NoteBackgroundProperties();

    override position = 'bottom' as const;
    override alignment = 'center' as const;
    override width = 200;

    public override getTextInputCoords(context: AnnotationContext) {
        const coords = super.getTextInputCoords(context);
        const padding = this.padding ?? DEFAULT_PADDING;
        return {
            x: coords.x,
            y: coords.y - padding - LABEL_OFFSET,
        };
    }

    override getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `line-color`:
                return this.fill;
            case `text-color`:
                return this.color;
        }
    }
}
