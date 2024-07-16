import { _Scene } from 'ag-charts-community';

import type { AnnotationContext, Coords } from '../annotationTypes';
import { convertLine, invertCoords, validateDatumPoint } from '../annotationUtils';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
import { LinearScene } from '../scenes/linearScene';
import { CollidableLine } from '../scenes/shapes';
import type { LineProperties } from './lineProperties';

export class LineScene extends LinearScene<LineProperties> {
    static override is(value: unknown): value is LineScene {
        return AnnotationScene.isCheck(value, 'line');
    }

    type = 'line';

    override activeHandle?: 'start' | 'end';

    private readonly line = new CollidableLine();
    private readonly start = new DivariantHandle();
    private readonly end = new DivariantHandle();

    private seriesRect?: _Scene.BBox;

    constructor() {
        super();
        this.append([this.line, this.start, this.end]);
    }

    public update(datum: LineProperties, context: AnnotationContext) {
        const { line, start, end } = this;
        const { locked, visible, lineDash, lineDashOffset, stroke, strokeWidth, strokeOpacity } = datum;

        this.locked = locked ?? false;
        this.seriesRect = context.seriesRect;

        const coords = convertLine(datum, context);

        if (coords == null) {
            this.visible = false;
            return;
        } else {
            this.visible = visible ?? true;
        }

        const { x1, y1, x2, y2 } = coords;

        line.setProperties({
            x1,
            y1,
            x2,
            y2,
            lineDash,
            lineDashOffset,
            stroke,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
        });
        line.updateCollisionBBox();

        const handleStyles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? stroke,
            strokeOpacity: datum.handle.strokeOpacity ?? strokeOpacity,
            strokeWidth: datum.handle.strokeWidth ?? strokeWidth,
        };

        start.update({ ...handleStyles, x: x1, y: y1 });
        end.update({ ...handleStyles, x: x2, y: y2 });

        start.toggleLocked(this.locked);
        end.toggleLocked(this.locked);
    }

    override toggleHandles(show: boolean | Partial<Record<'start' | 'end', boolean>>) {
        if (typeof show === 'boolean') {
            show = { start: show, end: show };
        }

        this.start.visible = show.start ?? true;
        this.end.visible = show.end ?? true;

        this.start.toggleHovered(this.activeHandle === 'start');
        this.end.toggleHovered(this.activeHandle === 'end');
    }

    override toggleActive(active: boolean) {
        this.toggleHandles(active);
        this.start.toggleActive(active);
        this.end.toggleActive(active);
    }

    override dragHandle(datum: LineProperties, target: Coords, context: AnnotationContext) {
        const { activeHandle } = this;

        if (!activeHandle) return;

        this[activeHandle].toggleDragging(true);
        const point = invertCoords(this[activeHandle].drag(target).point, context);

        if (!validateDatumPoint(context, point)) return;

        datum[activeHandle].x = point.x;
        datum[activeHandle].y = point.y;
    }

    override stopDragging() {
        this.start.toggleDragging(false);
        this.end.toggleDragging(false);
    }

    override getAnchor() {
        const bbox = this.getCachedBBoxWithoutHandles();
        return { x: bbox.x + bbox.width / 2, y: bbox.y };
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