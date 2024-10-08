import type { _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext } from '../annotationTypes';
import type { ShapePointProperties } from '../properties/shapePointProperties';
import { convertPoint } from '../utils/values';
import { PointScene } from './pointScene';

export abstract class ShapePointScene<Datum extends ShapePointProperties> extends PointScene<Datum> {
    protected abstract shape: _Scene.Marker;

    constructor() {
        super();
        this.append([this.handle]);
    }

    override update(datum: Datum, context: AnnotationContext) {
        super.update(datum, context);

        const coords = convertPoint(datum, context);
        this.updateShape(datum, coords);
    }

    private updateShape(datum: Datum, point: _Util.Vec2) {
        this.updateShapeStyles(datum);
        this.updateShapePath(datum, point);
    }

    protected updateShapeStyles(datum: Datum) {
        const { shape } = this;

        shape.fill = datum.fill;
        shape.fillOpacity = datum.fillOpacity ?? 1;
    }

    protected updateShapePath(datum: Datum, point: _Util.Vec2) {
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
