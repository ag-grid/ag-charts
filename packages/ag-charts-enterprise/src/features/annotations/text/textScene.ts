import { _Scene, _Util } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { TextualScene } from '../scenes/textualScene';
import type { TextProperties } from './textProperties';

export class TextScene extends TextualScene<TextProperties> {
    static override is(value: unknown): value is TextScene {
        return AnnotationScene.isCheck(value, AnnotationType.Text);
    }

    override type = AnnotationType.Text;

    constructor() {
        super();
        this.append([this.label, this.handle]);
    }
}
