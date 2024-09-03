import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { ShapeScene } from '../scenes/shapeScene';
import type { ArrowDownProperties } from './arrowDownProperties';

export class ArrowDownScene extends ShapeScene<ArrowDownProperties> {
    static override is(value: unknown): value is ArrowDownScene {
        return AnnotationScene.isCheck(value, AnnotationType.ArrowDown);
    }

    override type = AnnotationType.ArrowDown;

    override anchor: _ModuleSupport.ToolbarAnchor = {
        x: 0,
        y: 0,
        position: 'below',
    };

    protected readonly shape = new _Scene.ArrowDown();

    constructor() {
        super();
        this.append([this.shape]);
    }
}
