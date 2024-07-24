import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { AnnotationContext, Coords } from '../annotationTypes';
import { convertPoint, invertCoords } from '../annotationUtils';
import type { TextualPointProperties } from '../properties/textualPointProperties';
import { AnnotationScene } from './annotationScene';
import { DivariantHandle } from './handle';

const { Vec2 } = _Util;

export abstract class TextualPointScene<Datum extends TextualPointProperties> extends AnnotationScene {
    override activeHandle?: string | undefined;

    protected readonly label = new _Scene.Text({ zIndex: 1 });
    protected readonly handle = new DivariantHandle();

    protected dragState?: {
        offset: Coords;
        handle: Coords;
    };

    private textInputBBox?: _Scene.BBox;

    public setTextInputBBox(bbox: _Scene.BBox) {
        this.textInputBBox = bbox;
    }

    public update(datum: Datum, context: AnnotationContext) {
        const { textInputBBox } = this;

        const point = convertPoint(datum, context);
        const bbox = new _Scene.BBox(point.x, point.y, textInputBBox?.width ?? 0, textInputBBox?.height ?? 0);

        this.label.opacity = datum.visible ? 1 : 0;

        this.updateLabel(datum, bbox);
        this.updateHandle(datum, bbox);
        this.updateShape(datum, bbox);
    }

    public dragStart(datum: Datum, target: Coords, context: AnnotationContext) {
        this.dragState = {
            offset: target,
            handle: convertPoint(datum, context),
        };
    }

    public drag(datum: Datum, target: Coords, context: AnnotationContext) {
        const { dragState } = this;

        if (datum.locked || !dragState) return;

        const coords = Vec2.add(dragState.handle, Vec2.sub(target, dragState.offset));
        const point = invertCoords(coords, context);

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

    override getAnchor(): { x: number; y: number; position?: 'right' | 'above' | 'above-left' } {
        const bbox = this.getCachedBBoxWithoutHandles();
        return { x: bbox.x, y: bbox.y, position: 'above-left' as const };
    }

    override getCursor() {
        if (this.activeHandle == null) return 'pointer';
        return 'default';
    }

    override containsPoint(x: number, y: number) {
        const { handle, label } = this;

        this.activeHandle = undefined;

        if (handle.containsPoint(x, y)) {
            this.activeHandle = 'handle';
            return true;
        }

        return label.containsPoint(x, y);
    }

    protected updateLabel(datum: Datum, bbox: _Scene.BBox) {
        const { x, y } = this.getLabelCoords(datum, bbox);

        this.label.x = x;
        this.label.y = y;
        this.label.textBaseline = datum.position == 'center' ? 'middle' : datum.position;

        this.label.text = datum.text;
        this.label.fill = datum.color;
        this.label.fontFamily = datum.fontFamily;
        this.label.fontSize = datum.fontSize;
        this.label.fontStyle = datum.fontStyle;
        this.label.fontWeight = datum.fontWeight;
        this.label.textAlign = datum.alignment;
    }

    protected updateHandle(datum: Datum, bbox: _Scene.BBox) {
        const { x, y } = this.getHandleCoords(datum, bbox);

        const styles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.color,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };

        this.handle.update({ ...styles, x, y });
        this.handle.toggleLocked(datum.locked ?? false);
    }

    protected updateShape(_datum: Datum, _bbox: _Scene.BBox) {
        // Shapes should be implemented by the extending annotation type class
    }

    protected getLabelCoords(_datum: Datum, point: _Util.Vec2) {
        return point;
    }

    protected getHandleCoords(_datum: Datum, point: _Util.Vec2) {
        return point;
    }
}
