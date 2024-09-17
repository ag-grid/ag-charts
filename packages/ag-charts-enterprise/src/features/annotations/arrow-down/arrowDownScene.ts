import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
import { ShapeScene } from '../scenes/shapeScene';
import type { ArrowDownProperties } from './arrowDownProperties';

export class ArrowDownScene extends ShapeScene<ArrowDownProperties> {
    static override is(value: unknown): value is ArrowDownScene {
        return AnnotationScene.isCheck(value, AnnotationType.ArrowDown);
    }

    override type = AnnotationType.ArrowDown;

    protected readonly shape = new _Scene.ArrowDown();

    constructor() {
        super();
        this.append([this.shape]);
    }

    override updateAnchor(datum: ArrowDownProperties, point: _Util.Vec2, context: AnnotationContext) {
        const anchor = super.updateAnchor(datum, point, context);
        anchor.y -= datum.size;
        return anchor;
    }

    protected override getHandleCoords(datum: ArrowDownProperties, point: _Util.Vec2): _Util.Vec2 {
        const halfSize = DivariantHandle.HANDLE_SIZE / 2;
        const handleCoords = super.getHandleCoords(datum, point);
        handleCoords.y += halfSize;
        return handleCoords;
    }
}
