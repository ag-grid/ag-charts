import { _Scene, _Util } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import type { ShapePointProperties } from '../properties/shapePointProperties';
import { PointScene } from './pointScene';

export abstract class ShapeScene<Datum extends ShapePointProperties> extends PointScene<Datum> {
    override type = AnnotationType.ArrowUp;

    protected abstract shape: _Scene.Marker;

    constructor() {
        super();
        this.append([this.handle]);
    }

    protected override updateShape(datum: Datum, point: _Util.Vec2) {
        const { shape } = this;

        shape.x = point.x;
        shape.y = point.y;
        shape.size = datum.size;

        shape.fill = datum.fill;
        shape.fillOpacity = datum.fillOpacity ?? 1;
        shape.stroke = datum.stroke;
        shape.strokeWidth = datum.strokeWidth ?? 1;
        shape.strokeOpacity = datum.strokeOpacity ?? 1;
    }

    override containsPoint(x: number, y: number) {
        return super.containsPoint(x, y) || this.shape.containsPoint(x, y);
    }
}
