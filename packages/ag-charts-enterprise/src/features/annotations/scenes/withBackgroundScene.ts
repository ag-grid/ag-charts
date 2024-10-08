import type { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { FillOptions } from 'ag-charts-types';

import type { AnnotationContext, LineCoords } from '../annotationTypes';
import type { AnnotationScene } from './annotationScene';

export class WithBackgroundScene {
    static updateBackground<Datum extends { background: FillOptions }>(
        this: AnnotationScene & {
            background: _Scene.Path;
            getBackgroundPoints(
                datum: Datum,
                top: LineCoords,
                bottom: LineCoords,
                bounds: LineCoords
            ): Array<_ModuleSupport.Vec2>;
        },
        datum: Datum,
        top: LineCoords,
        bottom: LineCoords,
        context: AnnotationContext
    ) {
        const { background } = this;
        const { seriesRect } = context;

        background.path.clear(true);

        const bounds = {
            x1: 0,
            y1: 0,
            x2: seriesRect.width,
            y2: seriesRect.height,
        };

        const points = this.getBackgroundPoints(datum, top, bottom, bounds);
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            if (i === 0) {
                background.path.moveTo(point.x, point.y);
            } else {
                background.path.lineTo(point.x, point.y);
            }
        }

        background.path.closePath();
        background.checkPathDirty();
        background.setProperties({
            fill: datum.background.fill,
            fillOpacity: datum.background.fillOpacity,
        });
    }
}
