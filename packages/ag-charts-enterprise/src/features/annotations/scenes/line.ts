import type { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { AnnotationProperties } from '../annotationProperties';
import type { Coords, LineCoords } from '../annotationTypes';
import { Annotation } from './annotation';
import { DivariantHandle } from './handle';
import { CollidableLine } from './shapes';

export class Line extends Annotation {
    type = 'line';

    override activeHandle?: 'start' | 'end';

    private line = new CollidableLine();
    private start = new DivariantHandle();
    private end = new DivariantHandle();

    private seriesRect?: _Scene.BBox;

    constructor() {
        super();
        this.append([this.line, this.start, this.end]);
    }

    public update(datum: AnnotationProperties, seriesRect: _Scene.BBox, coords?: LineCoords) {
        const { line, start, end } = this;
        const { lineDash, locked, stroke, strokeWidth, strokeOpacity, visible } = datum;

        this.locked = locked ?? false;
        this.seriesRect = seriesRect;

        if (coords == null) {
            this.visible = false;
            return;
        } else {
            this.visible = visible ?? true;
        }

        const { x1, y1, x2, y2 } = coords;

        line.setProperties({ x1, y1, x2, y2, lineDash, stroke, strokeWidth, strokeOpacity, fillOpacity: 0 });
        line.updateCollisionBBox();

        const handleStyles = datum.handle.toJson();

        start.update({ ...handleStyles, x: x1, y: y1, stroke, strokeOpacity });
        end.update({ ...handleStyles, x: x2, y: y2, stroke, strokeOpacity });
    }

    public toggleHandles(show: boolean) {
        this.start.visible = show;
        this.end.visible = show;

        this.start.toggleHovered(this.activeHandle === 'start');
        this.end.toggleHovered(this.activeHandle === 'end');
    }

    public toggleActive(active: boolean) {
        this.toggleHandles(active);
        this.start.toggleActive(active);
        this.end.toggleActive(active);
    }

    override dragHandle(datum: AnnotationProperties, target: Coords, invertPoint: (point: Coords) => Coords) {
        const { activeHandle, start, end } = this;

        if (datum.start == null || datum.end == null) return;

        if (activeHandle === 'start') {
            start.toggleDragging(true);
            const point = invertPoint(start.drag(target).point);
            datum.start.x = point.x;
            datum.start.y = point.y;
        } else {
            end.toggleDragging(true);
            const point = invertPoint(end.drag(target).point);
            datum.end.x = point.x;
            datum.end.y = point.y;
        }
    }

    override stopDragging() {
        this.start.toggleDragging(false);
        this.end.toggleDragging(false);
    }

    override getCursor() {
        if (this.activeHandle == null) return 'pointer';
        return 'default';
    }

    override containsPoint(x: number, y: number) {
        const { start, end, seriesRect, line } = this;

        this.activeHandle = undefined;

        if (start.containsPoint(x, y)) {
            this.activeHandle = 'start';
            return true;
        }

        if (end.containsPoint(x, y)) {
            this.activeHandle = 'end';
            return true;
        }

        x -= seriesRect?.x ?? 0;
        y -= seriesRect?.y ?? 0;

        return line.isPointInPath(x, y);
    }
}
