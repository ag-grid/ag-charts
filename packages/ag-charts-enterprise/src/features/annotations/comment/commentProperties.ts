import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { Fill, Stroke } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { convertPoint } from '../annotationUtils';
import { TextualPointProperties } from '../properties/textualPointProperties';

const { STRING, Validate, isObject } = _ModuleSupport;
const { Color } = _Util;

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

    override getPlaceholderColor() {
        const textColor = this.color ?? '#888888';
        return Color.mix(Color.fromString(textColor), Color.fromString(textColor), 0.66).toString();
    }

    public override getTextInputCoords(context: AnnotationContext) {
        const padding = this.padding ?? 10;
        const point = convertPoint(this, context);
        return {
            x: point.x + padding,
            y: point.y - padding,
        };
    }
}
