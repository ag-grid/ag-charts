import { _Scene, _Util } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
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

    protected override getHandleCoords(datum: ArrowUpProperties, point: _Util.Vec2): _Util.Vec2 {
        const halfSize = DivariantHandle.HANDLE_SIZE / 2;
        const handleCoords = super.getHandleCoords(datum, point);
        handleCoords.y -= halfSize;
        return handleCoords;
    }
}
