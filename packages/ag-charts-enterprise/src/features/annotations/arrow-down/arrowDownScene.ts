import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
import { ShapePointScene } from '../scenes/shapePointScene';
import type { ArrowDownProperties } from './arrowDownProperties';

export class ArrowDownScene extends ShapePointScene<ArrowDownProperties> {
    static override is(value: unknown): value is ArrowDownScene {
        return AnnotationScene.isCheck(value, AnnotationType.ArrowDown);
    }

    type = AnnotationType.ArrowDown;

    protected readonly shape = new _Scene.ArrowDown();

    constructor() {
        super();
        this.append([this.shape]);
    }

    override updateAnchor(datum: ArrowDownProperties, point: _ModuleSupport.Vec2, context: AnnotationContext) {
        const anchor = super.updateAnchor(datum, point, context);
        anchor.y -= datum.size;
        return anchor;
    }

    protected override getHandleCoords(datum: ArrowDownProperties, point: _ModuleSupport.Vec2): _ModuleSupport.Vec2 {
        const halfSize = DivariantHandle.HANDLE_SIZE / 2;
        const handleCoords = super.getHandleCoords(datum, point);
        handleCoords.y += halfSize;
        return handleCoords;
    }
}
