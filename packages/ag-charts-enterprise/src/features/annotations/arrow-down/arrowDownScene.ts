import { type AgMarkerShapeFnParams, _ModuleSupport } from 'ag-charts-community';
import type { Point } from 'ag-charts-core';

import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { arrowUpPoints } from '../arrow-up/arrowUpScene';
import { AnnotationScene } from '../scenes/annotationScene';
import { AnnotationShape } from '../scenes/annotationShape';
import { DivariantHandle } from '../scenes/handle';
import { SHAPE_SIZE, ShapePointScene } from '../scenes/shapePointScene';
import type { ArrowDownDatum } from './arrowDownDatum';

const arrowDownPoints = arrowUpPoints.map(([x, y]) => [x, 1 - y] as const);

function arrowDown(params: AgMarkerShapeFnParams) {
    _ModuleSupport.drawMarkerUnitPolygon(params, arrowDownPoints);
}

arrowDown.anchor = { x: 0.5, y: 1 };

export class ArrowDownScene extends ShapePointScene<ArrowDownDatum> {
    static override is(value: unknown): value is ArrowDownScene {
        return AnnotationScene.isCheck(value, AnnotationType.ArrowDown);
    }

    type = AnnotationType.ArrowDown;

    protected readonly shape = new AnnotationShape({ shape: arrowDown });

    constructor() {
        super();
        this.append([this.shape]);
    }

    override updateAnchor(datum: ArrowDownDatum, point: Point, context: AnnotationContext) {
        const anchor = super.updateAnchor(datum, point, context);
        anchor.y -= SHAPE_SIZE;
        return anchor;
    }

    protected override getHandleCoords(datum: ArrowDownDatum, point: Point): Point {
        const halfSize = DivariantHandle.HANDLE_SIZE / 2;
        const handleCoords = super.getHandleCoords(datum, point);
        handleCoords.y += halfSize;
        return handleCoords;
    }
}
