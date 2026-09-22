import type { Point } from 'ag-charts-core';

import { AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
import { TextualPointScene } from '../scenes/textualPointScene';
import type { TextDatum } from './textDatum';

export class TextScene extends TextualPointScene<TextDatum> {
    static override is(value: unknown): value is TextScene {
        return AnnotationScene.isCheck(value, AnnotationType.Text);
    }

    type = AnnotationType.Text;

    protected override textPosition = 'bottom' as const;
    protected override readonly textAlignment = 'left' as const;

    constructor() {
        super();
        this.append([this.label, this.handle]);
    }

    protected override getHandleCoords(_datum: TextDatum, point: Point): Point {
        const halfSize = DivariantHandle.HANDLE_SIZE / 2;
        return {
            x: point.x + halfSize,
            y: point.y + 2 + halfSize,
        };
    }
}
