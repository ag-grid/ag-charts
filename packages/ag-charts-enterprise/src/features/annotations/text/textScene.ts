import type { _Util } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
import { TextualPointScene } from '../scenes/textualPointScene';
import type { TextProperties } from './textProperties';

export class TextScene extends TextualPointScene<TextProperties> {
    static override is(value: unknown): value is TextScene {
        return AnnotationScene.isCheck(value, AnnotationType.Text);
    }

    type = AnnotationType.Text;

    constructor() {
        super();
        this.append([this.label, this.handle]);
    }

    protected override getHandleCoords(_datum: TextProperties, point: _Util.Vec2): _Util.Vec2 {
        const halfSize = DivariantHandle.HANDLE_SIZE / 2;
        return {
            x: point.x + halfSize,
            y: point.y + 2 + halfSize,
        };
    }
}
