import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { Fill, Stroke } from '../annotationProperties';
import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { convertPoint } from '../annotationUtils';
import { TextualPointProperties } from '../properties/textualPointProperties';

const { STRING, Validate, isObject } = _ModuleSupport;

export class CommentProperties extends Fill(Stroke(TextualPointProperties)) {
    static is(value: unknown): value is CommentProperties {
        return isObject(value) && value.type === AnnotationType.Comment;
    }

    @Validate(STRING)
    type = AnnotationType.Comment as const;

    override text = 'Comment';
    override position = 'bottom' as const;
    override alignment = 'left' as const;

    public override getTextInputCoords(context: AnnotationContext) {
        const padding = this.padding ?? 10;
        const point = convertPoint(this, context);
        return {
            x: point.x + padding,
            y: point.y - padding,
        };
    }
}
