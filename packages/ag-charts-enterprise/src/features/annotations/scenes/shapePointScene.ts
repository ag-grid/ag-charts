import type { Point } from 'ag-charts-core';

import { type AnnotationContext } from '../annotationTypes';
import type { ShapePointProperties } from '../properties/shapePointProperties';
import { convertPoint } from '../utils/values';
import type { AnnotationShape } from './annotationShape';
import { PointScene } from './pointScene';

export abstract class ShapePointScene<Datum extends ShapePointProperties> extends PointScene<Datum> {
    protected abstract shape: AnnotationShape;

    constructor() {
        super();
        this.append([this.handle]);
    }

    override update(datum: Datum, context: AnnotationContext) {
        super.update(datum, context);

        const coords = convertPoint(datum, context);
        this.updateShape(datum, coords);
    }

    private updateShape(datum: Datum, point: Point) {
        this.updateShapeStyles(datum);
        this.updateShapePath(datum, point);
    }

    protected updateShapeStyles(datum: Datum) {
        const { shape } = this;

        shape.fill = datum.fill;
        shape.fillOpacity = datum.fillOpacity ?? 1;
    }

    protected updateShapePath(datum: Datum, point: Point) {
        const { shape } = this;
        shape.x = point.x;
        shape.y = point.y;
        shape.size = datum.size;
    }

    override containsPoint(x: number, y: number) {
        return super.containsPoint(x, y) || this.shape.containsPoint(x, y);
    }

    override getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.shape.containsPoint(x, y)) return 'shape';

        return super.getNodeAtCoords(x, y);
    }
}
