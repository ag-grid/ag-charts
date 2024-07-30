import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { Fill } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { convertPoint } from '../annotationUtils';
import { TextualPointProperties } from '../properties/textualPointProperties';

const { STRING, Validate, isObject } = _ModuleSupport;

export class CommentProperties extends Fill(TextualPointProperties) {
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
            case `text-color`:
            default:
                return this.color;
        }
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
