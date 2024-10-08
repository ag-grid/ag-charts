import { _ModuleSupport, type _Scene } from 'ag-charts-community';
import type { FillOptions } from 'ag-charts-types';

import type { AnnotationContext } from '../annotationTypes';
import type { AnnotationScene } from './annotationScene';

const { Vec4 } = _ModuleSupport;

export class WithBackgroundScene {
    static updateBackground<Datum extends { background: FillOptions }>(
        this: AnnotationScene & {
            background: _Scene.Path;
            getBackgroundPoints(
                datum: Datum,
                top: _ModuleSupport.Vec4,
                bottom: _ModuleSupport.Vec4,
                bounds: _ModuleSupport.Vec4
            ): Array<_ModuleSupport.Vec2>;
        },
        datum: Datum,
        top: _ModuleSupport.Vec4,
        bottom: _ModuleSupport.Vec4,
        context: AnnotationContext
    ) {
        const { background } = this;
        const { seriesRect } = context;

        background.path.clear(true);

        const bounds = Vec4.from(0, 0, seriesRect.width, seriesRect.height);

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
