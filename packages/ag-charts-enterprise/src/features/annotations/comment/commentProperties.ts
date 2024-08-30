import { _ModuleSupport, _Util } from 'ag-charts-community';

import { Fill, Stroke } from '../annotationProperties';
import {
    type AnnotationContext,
    type AnnotationOptionsColorPickerType,
    AnnotationType,
    type Padding,
} from '../annotationTypes';
import { TextualPointProperties } from '../properties/textualPointProperties';

const { STRING, Validate, isObject } = _ModuleSupport;
const { Color } = _Util;

const DEFAULT_COMMENT_PADDING = {
    top: 8,
    right: 14,
    bottom: 8,
    left: 14,
};

export class CommentProperties extends Fill(Stroke(TextualPointProperties)) {
    static is(value: unknown): value is CommentProperties {
        return isObject(value) && value.type === AnnotationType.Comment;
    }

    @Validate(STRING)
    type = AnnotationType.Comment as const;

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

    override getPadding(): Padding {
        const { padding, fontSize } = this;
        if (padding == null) {
            return {
                top: Math.max(fontSize * 0.4, DEFAULT_COMMENT_PADDING.top),
                bottom: Math.max(fontSize * 0.4, DEFAULT_COMMENT_PADDING.bottom),
                left: Math.max(fontSize * 0.8, DEFAULT_COMMENT_PADDING.left),
                right: Math.max(fontSize * 0.8, DEFAULT_COMMENT_PADDING.right),
            };
        }
        return {
            top: padding,
            right: padding,
            bottom: padding,
            left: padding,
        };
    }

    public override getTextInputCoords(context: AnnotationContext) {
        const coords = super.getTextInputCoords(context);

        const padding = this.getPadding();

        return {
            x: coords.x + padding.left,
            y: coords.y - padding.bottom,
        };
    }
}
