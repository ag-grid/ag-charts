import { type AgMarkerShapeFnParams, _ModuleSupport } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
import { ShapePointScene } from '../scenes/shapePointScene';
import type { ArrowUpProperties } from './arrowUpProperties';

export const arrowUpMoves: _ModuleSupport.MarkerPathMove[] = [
    { x: 0, y: 0, t: 'move' },
    { x: 1, y: 1.2 },
    { x: -0.5, y: 0 },
    { x: 0, y: 0.8 },
    { x: -1, y: 0 },
    { x: 0, y: -0.8 },
    { x: -0.5, y: 0 },
];

function arrowUp(params: AgMarkerShapeFnParams) {
    _ModuleSupport.applyMarkerPath(params, arrowUpMoves);
}

export class ArrowUpScene extends ShapePointScene<ArrowUpProperties> {
    static override is(value: unknown): value is ArrowUpScene {
        return AnnotationScene.isCheck(value, AnnotationType.ArrowUp);
    }

    type = AnnotationType.ArrowUp;

    protected readonly shape = new _ModuleSupport.Marker({ shape: arrowUp });

    constructor() {
        super();
        this.append([this.shape]);
    }

    protected override getHandleCoords(datum: ArrowUpProperties, point: _ModuleSupport.Vec2): _ModuleSupport.Vec2 {
        const halfSize = DivariantHandle.HANDLE_SIZE / 2;
        const handleCoords = super.getHandleCoords(datum, point);
        handleCoords.y -= halfSize;
        return handleCoords;
    }
}
