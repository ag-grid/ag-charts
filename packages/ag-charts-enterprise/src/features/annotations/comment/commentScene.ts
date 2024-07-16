import { _Scene, _Util } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { TextualScene } from '../scenes/textualScene';
import type { CommentProperties } from './commentProperties';

export class CommentScene extends TextualScene<CommentProperties> {
    static override is(value: unknown): value is CommentScene {
        return AnnotationScene.isCheck(value, AnnotationType.Comment);
    }

    override type = AnnotationType.Comment;

    constructor() {
        super();
        this.append([this.label, this.handle]);
    }

    protected override updateShape(_datum: CommentProperties) {
        // TODO
    }
}
