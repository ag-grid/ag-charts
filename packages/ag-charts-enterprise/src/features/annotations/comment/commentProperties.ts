import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { Fill, Stroke } from '../annotationProperties';
import {
    type AnnotationContext,
    type AnnotationOptionsColorPickerType,
    type Padding,
    TextualAnnotationType,
} from '../annotationTypes';
import { TextualPointProperties } from '../properties/textualPointProperties';

const { STRING, Validate, isObject } = _ModuleSupport;
const { Color } = _Util;

export class CommentProperties extends Fill(Stroke(TextualPointProperties)) {
    static is(value: unknown): value is CommentProperties {
        return isObject(value) && value.type === TextualAnnotationType.Comment;
    }

    @Validate(STRING)
    type = TextualAnnotationType.Comment as const;

    override position = 'bottom' as const;
    override alignment = 'left' as const;

    override getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `fill-color`:
                return this.fill;
            case `line-color`:
                return this.stroke;
            case `text-color`:
            default:
                return this.color;
        }
    }

    override getDefaultOpacity(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `fill-color`:
                return this.fillOpacity;
            case `line-color`:
                return this.strokeOpacity;
            case `text-color`:
            default:
                return undefined;
        }
    }

    override getPlaceholderColor() {
        const { r, g, b } = Color.fromString(this.color ?? '#888888');
        return new Color(r, g, b, 0.66).toString();
    }

    public override getTextInputCoords(context: AnnotationContext, padding?: Padding | number) {
        const coords = super.getTextInputCoords(context);

        const paddingLeft = typeof padding === 'number' ? padding : padding?.left ?? 0;
        const paddingBottom = typeof padding === 'number' ? padding : padding?.bottom ?? 0;

        return {
            x: coords.x + paddingLeft,
            y: coords.y - paddingBottom,
        };
    }
}
