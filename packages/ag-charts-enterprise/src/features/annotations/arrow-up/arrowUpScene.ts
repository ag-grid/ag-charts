import { _Scene } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { ShapeScene } from '../scenes/shapeScene';
import type { ArrowUpProperties } from './arrowUpProperties';

export class ArrowUpScene extends ShapeScene<ArrowUpProperties> {
    static override is(value: unknown): value is ArrowUpScene {
        return AnnotationScene.isCheck(value, AnnotationType.ArrowUp);
    }

    override type = AnnotationType.ArrowUp;

    protected readonly shape = new _Scene.ArrowUp();

    constructor() {
        super();
        this.append([this.shape]);
    }
}
