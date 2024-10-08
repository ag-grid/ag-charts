import { type AgAnnotationHandleStyles, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { PointProperties } from '../annotationProperties';
import type { AnnotationContext } from '../annotationTypes';
import type { StartEndProperties } from '../properties/startEndProperties';
import { snapToAngle } from '../utils/coords';
import { validateDatumPoint } from '../utils/validation';
import { convertLine, convertPoint, invertCoords } from '../utils/values';
import { DivariantHandle } from './handle';
import { LinearScene } from './linearScene';

export type StartEndHandle = 'start' | 'end';

export abstract class StartEndScene<Datum extends StartEndProperties> extends LinearScene<Datum> {
    override activeHandle?: StartEndHandle;

    protected readonly start = new DivariantHandle();
    protected readonly end = new DivariantHandle();

    protected anchor: _ModuleSupport.ToolbarAnchor = {
        x: 0,
        y: 0,
        position: 'above',
    };

    public update(datum: Datum, context: AnnotationContext) {
        const coords = convertLine(datum, context);

        if (coords == null) {
            return;
        }

        this.updateHandles(datum, coords);
        this.updateAnchor(datum, coords, context);
    }

    override toggleHandles(show: boolean | Partial<Record<StartEndHandle, boolean>>) {
        if (typeof show === 'boolean') {
            this.start.visible = show;
            this.end.visible = show;
        } else {
            for (const [handle, visible] of Object.entries(show) as [StartEndHandle, boolean][]) {
                this[handle].visible = visible;
            }
        }

        this.start.toggleHovered(this.activeHandle === 'start');
        this.end.toggleHovered(this.activeHandle === 'end');
    }

    override toggleActive(active: boolean) {
        this.toggleHandles(active);
        this.start.toggleActive(active);
        this.end.toggleActive(active);
    }

    override dragHandle(datum: Datum, target: _ModuleSupport.Vec2, context: AnnotationContext, snapping: boolean) {
        const { activeHandle } = this;

        if (!activeHandle) return;

        this[activeHandle].toggleDragging(true);

        const point = snapping
            ? this.snapToAngle(datum, target, context)
            : invertCoords(this[activeHandle].drag(target).point, context);

        if (!point || !validateDatumPoint(context, point)) return;

        datum[activeHandle].x = point.x;
        datum[activeHandle].y = point.y;
    }

    snapToAngle(
        datum: Datum,
        target: _ModuleSupport.Vec2,
        context: AnnotationContext
    ): Pick<PointProperties, 'x' | 'y'> | undefined {
        const { activeHandle } = this;

        const handles: StartEndHandle[] = ['start', 'end'];
        const fixedHandle = handles.find((handle) => handle !== activeHandle);

        if (!activeHandle || !fixedHandle) return;

        this[activeHandle].toggleDragging(true);

        const fixed = convertPoint(datum[fixedHandle], context);
        const active = this[activeHandle].drag(target).point;

        return invertCoords(snapToAngle(active, fixed, datum.snapToAngle), context);
    }

    override stopDragging() {
        this.start.toggleDragging(false);
        this.end.toggleDragging(false);
    }

    override getAnchor() {
        return this.anchor;
    }

    override getCursor() {
        return 'pointer';
    }

    override containsPoint(x: number, y: number) {
        const { start, end } = this;

        this.activeHandle = undefined;

        if (start.containsPoint(x, y)) {
            this.activeHandle = 'start';
            return true;
        }

        if (end.containsPoint(x, y)) {
            this.activeHandle = 'end';
            return true;
        }

        return false;
    }

    public getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.start.containsPoint(x, y) || this.end.containsPoint(x, y)) return 'handle';
    }

    protected updateHandles(datum: Datum, coords: _ModuleSupport.Vec4, bbox?: _Scene.BBox) {
        this.start.update({
            ...this.getHandleStyles(datum, 'start'),
            ...this.getHandleCoords(datum, coords, 'start'),
        });
        this.end.update({
            ...this.getHandleStyles(datum, 'end'),
            ...this.getHandleCoords(datum, coords, 'end', bbox),
        });

        this.start.toggleLocked(datum.locked ?? false);
        this.end.toggleLocked(datum.locked ?? false);
    }

    protected updateAnchor(
        _datum: Datum,
        coords: _ModuleSupport.Vec4,
        context: AnnotationContext,
        _bbox?: _Scene.BBox
    ) {
        this.anchor = {
            x: coords.x1 + context.seriesRect.x,
            y: coords.y1 + context.seriesRect.y,
            position: this.anchor.position,
        };
    }

    protected getHandleCoords(
        _datum: Datum,
        coords: _ModuleSupport.Vec4,
        handle: StartEndHandle,
        _bbox?: _Scene.BBox
    ): _ModuleSupport.Vec2 {
        return {
            x: handle === 'start' ? coords.x1 : coords.x2,
            y: handle === 'start' ? coords.y1 : coords.y2,
        };
    }

    protected getHandleStyles(datum: Datum, _handle?: 'start' | 'end'): AgAnnotationHandleStyles {
        return {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };
    }
}
