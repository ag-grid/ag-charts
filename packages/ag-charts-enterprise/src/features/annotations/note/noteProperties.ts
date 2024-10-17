import { _ModuleSupport, _Util } from 'ag-charts-community';

import { Fill, Stroke } from '../annotationProperties';
import {
    type AnnotationContext,
    type AnnotationOptionsColorPickerType,
    AnnotationType,
    type Padding,
} from '../annotationTypes';
import { TextualPointProperties } from '../properties/textualPointProperties';
import { getBBox } from '../text/util';

const { OBJECT, STRING, BaseProperties, Validate, isObject } = _ModuleSupport;
const { clamp } = _Util;

export const DEFAULT_NOTE_PADDING = 10;
export const HANDLE_SIZE = 11;
export const ICON_HEIGHT = 20;
export const ICON_WIDTH = 22;
export const ICON_SPACING = 10;
export const LABEL_OFFSET = ICON_HEIGHT + ICON_SPACING;
export const TOOLBAR_OFFSET = 34;

class NoteBackgroundProperties extends Fill(Stroke(BaseProperties)) {}

export class NoteProperties extends Fill(Stroke(TextualPointProperties)) {
    static is(value: unknown): value is NoteProperties {
        return isObject(value) && value.type === AnnotationType.Note;
    }

    @Validate(STRING)
    type = AnnotationType.Note as const;

    @Validate(OBJECT, { optional: true })
    background = new NoteBackgroundProperties();

    override position: 'bottom' | 'top' = 'bottom' as const;
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

    public override getTextInputCoords(context: AnnotationContext, height: number) {
        const { width, text } = this;
        const { seriesRect } = context;
        const textInputCoords = super.getTextInputCoords(context, height);
        const padding = this.getPadding().top;

        const bbox = getBBox(this, text, textInputCoords);

        bbox.x = clamp(width / 2, bbox.x, seriesRect.width - width / 2);

        const topY = bbox.y - LABEL_OFFSET - padding * 2;
        const bottomY = bbox.y + HANDLE_SIZE + padding * 2;

        const textHeight = Math.max(bbox.height, height);

        if (topY - textHeight - TOOLBAR_OFFSET < seriesRect.y) {
            bbox.y = bottomY;
            this.position = 'top';
        } else {
            bbox.y = topY + padding;
            this.position = 'bottom';
        }

        return {
            x: bbox.x,
            y: bbox.y,
        };
    }
}
