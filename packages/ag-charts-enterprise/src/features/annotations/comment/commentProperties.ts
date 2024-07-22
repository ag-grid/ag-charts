import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { Fill, Stroke } from '../annotationProperties';
import { AnnotationType } from '../annotationTypes';
import { TextualProperties } from '../properties/textualProperties';

const { STRING, Validate, isObject } = _ModuleSupport;

export class CommentProperties extends Fill(Stroke(TextualProperties)) {
    static is(value: unknown): value is CommentProperties {
        return isObject(value) && value.type === AnnotationType.Comment;
    }

    @Validate(STRING)
    type = AnnotationType.Comment as const;

    override text = 'Comment';
    override position = 'bottom' as const;
    override alignment = 'left' as const;
}
