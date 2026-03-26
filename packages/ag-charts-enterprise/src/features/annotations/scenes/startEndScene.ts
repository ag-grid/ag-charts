import type { AgAnnotationHandleStyles, _ModuleSupport } from 'ag-charts-community';
import { type Bounds4, type BoxBounds, type Point, Vec2, Vec4, entries } from 'ag-charts-core';

import type { AnnotationContext } from '../annotationTypes';
import type { StartEndProperties } from '../properties/startEndProperties';
import { translate } from '../utils/coords';
import { convertLine, convertPoint } from '../utils/values';
import { DivariantHandle } from './handle';
import { LinearScene } from './linearScene';

export type StartEndHandle = 'start' | 'end';

export abstract class StartEndScene<Datum extends StartEndProperties> extends LinearScene<Datum> {
    override activeHandle?: StartEndHandle;

    protected readonly start = new DivariantHandle();
    protected readonly end = new DivariantHandle();

    protected anchor: _ModuleSupport.FloatingToolbarAnchor = {
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
            for (const [handle, visible] of entries(show)) {
                this[handle].visible = visible!;
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

    override dragHandle(datum: Datum, target: Point, context: AnnotationContext, snapping: boolean) {
        const { activeHandle, dragState } = this;

        if (!activeHandle || !dragState) return;

        this[activeHandle].toggleDragging(true);

        const snapHandle = activeHandle === 'start' ? 'end' : 'start';
        const snap = snapping
            ? { vectors: { [activeHandle]: convertPoint(datum[snapHandle], context) }, angle: datum.snapToAngle }
            : undefined;

        const { [activeHandle]: point } = translate(
            { [activeHandle]: dragState[activeHandle] },
            Vec2.sub(target, dragState.offset),
            context,
            { overflowContinuous: 0, snap }
        );

        datum[activeHandle].x = point.x;
        datum[activeHandle].y = point.y;
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

    protected updateHandles(datum: Datum, coords: Bounds4, bbox?: _ModuleSupport.BBox) {
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

    protected updateAnchor(_datum: Datum, coords: Bounds4, context: AnnotationContext, _bbox?: BoxBounds) {
        this.anchor = {
            x: coords.x1 + context.seriesRect.x,
            y: coords.y1 + context.seriesRect.y,
            position: this.anchor.position,
        };
    }

    protected getHandleCoords(
        _datum: Datum,
        coords: Bounds4,
        handle: StartEndHandle,
        _bbox?: _ModuleSupport.BBox
    ): Point {
        return handle === 'start' ? Vec4.start(coords) : Vec4.end(coords);
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
