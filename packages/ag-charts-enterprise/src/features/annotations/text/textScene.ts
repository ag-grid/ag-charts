import { _Scene, _Util } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
import { type AnchoredLayout, TextualPointScene } from '../scenes/textualPointScene';
import type { TextProperties } from './textProperties';

export class TextScene extends TextualPointScene<TextProperties> {
    static override is(value: unknown): value is TextScene {
        return AnnotationScene.isCheck(value, AnnotationType.Text);
    }

    override type = AnnotationType.Text;

    override handleLayout: AnchoredLayout = {
        position: 'bottom',
        alignment: 'left',
        placement: 'outside',
        spacing: {
            x: -DivariantHandle.HANDLE_SIZE / 2,
            y: 2 + DivariantHandle.HANDLE_SIZE / 2,
        },
    };

    constructor() {
        super();
        this.append([this.label, this.handle]);
    }
}
