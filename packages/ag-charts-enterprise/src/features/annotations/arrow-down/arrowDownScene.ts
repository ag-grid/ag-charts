import { type AgMarkerShapeFnParams, _ModuleSupport } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { arrowUpMoves } from '../arrow-up/arrowUpScene';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
import { ShapePointScene } from '../scenes/shapePointScene';
import type { ArrowDownProperties } from './arrowDownProperties';

const arrowDownMoves = arrowUpMoves.map((m) => ({ t: m.t, x: m.x * -1, y: m.y * -1 }));

function arrowDown(params: AgMarkerShapeFnParams) {
    _ModuleSupport.applyMarkerPath(params, arrowDownMoves);
}

export class ArrowDownScene extends ShapePointScene<ArrowDownProperties> {
    static override is(value: unknown): value is ArrowDownScene {
        return AnnotationScene.isCheck(value, AnnotationType.ArrowDown);
    }

    type = AnnotationType.ArrowDown;

    protected readonly shape = new _ModuleSupport.Marker({ shape: arrowDown });

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
