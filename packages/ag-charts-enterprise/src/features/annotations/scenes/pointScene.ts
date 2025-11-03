import type { _ModuleSupport } from 'ag-charts-community';
import { type Point, Vec2 } from 'ag-charts-core';

import type { AnnotationContext } from '../annotationTypes';
import type { PointProperties } from '../properties/pointProperties';
import { getDragStartState, translate } from '../utils/coords';
import { convertPoint, invertCoords } from '../utils/values';
import { AnnotationScene } from './annotationScene';
import { DivariantHandle } from './handle';

export abstract class PointScene<Datum extends PointProperties> extends AnnotationScene {
    override activeHandle?: string;

    protected readonly handle = new DivariantHandle();

    protected dragState?: {
        offset: Point;
        handle: Point;
    };

    protected anchor: _ModuleSupport.FloatingToolbarAnchor = {
        x: 0,
        y: 0,
        position: 'above',
    };

    public update(datum: Datum, context: AnnotationContext) {
        const coords = convertPoint(datum, context);

        this.updateHandle(datum, coords);
        this.anchor = this.updateAnchor(datum, coords, context);
    }

    public dragStart(datum: Datum, target: Point, context: AnnotationContext) {
        this.dragState = {
            offset: target,
            ...getDragStartState({ handle: datum }, context),
        };
    }

    public drag(datum: Datum, target: Point, context: AnnotationContext) {
        const { dragState } = this;
        if (!datum.isWriteable() || !dragState) return;

        const { point } = translate({ point: dragState.handle }, Vec2.sub(target, dragState.offset), context);
        datum.x = point.x;
        datum.y = point.y;
    }

    public translate(datum: Datum, translation: Point, context: AnnotationContext) {
        if (!datum.isWriteable()) return;

        const { point } = translate({ point: convertPoint(datum, context) }, translation, context);
        datum.x = point.x;
        datum.y = point.y;
    }

    override toggleHandles(show: boolean | Partial<Record<'handle', boolean>>) {
        this.handle.visible = Boolean(show);
        this.handle.toggleHovered(this.activeHandle === 'handle');
    }

    override toggleActive(active: boolean) {
        this.toggleHandles(active);
        this.handle.toggleActive(active);
    }

    override stopDragging() {
        this.handle.toggleDragging(false);
    }

    public copy(datum: Datum, copiedDatum: Datum, context: AnnotationContext) {
        const coords = convertPoint(datum, context);

        const point = invertCoords({ x: coords.x - 30, y: coords.y - 30 }, context);

        copiedDatum.x = point.x;
        copiedDatum.y = point.y;

        return copiedDatum;
    }

    override getAnchor(): _ModuleSupport.FloatingToolbarAnchor {
        return this.anchor;
    }

    override getCursor() {
        return 'pointer';
    }

    override containsPoint(x: number, y: number) {
        const { handle } = this;

        this.activeHandle = undefined;

        if (handle.containsPoint(x, y)) {
            this.activeHandle = 'handle';
            return true;
        }

        return false;
    }

    override getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.handle.containsPoint(x, y)) return 'handle';
    }

    protected updateHandle(datum: Datum, point: Point, bbox?: _ModuleSupport.BBox) {
        const { x, y } = this.getHandleCoords(datum, point, bbox);
        const styles = this.getHandleStyles(datum);

        this.handle.update({ ...styles, x, y });
        this.handle.toggleLocked(datum.locked ?? false);
    }

    protected updateAnchor(datum: Datum, point: Point, context: AnnotationContext) {
        const coords = this.getHandleCoords(datum, point);
        return {
            x: coords.x + context.seriesRect.x,
            y: coords.y + context.seriesRect.y,
            position: this.anchor.position,
        };
    }

    protected getHandleCoords(_datum: Datum, point: Point, _bbox?: _ModuleSupport.BBox): Point {
        return {
            x: point.x,
            y: point.y,
        };
    }

    protected getHandleStyles(datum: Datum) {
        return {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };
    }
}
