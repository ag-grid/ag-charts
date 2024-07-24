import { _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext, type Coords } from '../annotationTypes';
import { convertLine, invertCoords, validateDatumPoint } from '../annotationUtils';
import type { TextualStartEndProperties } from '../properties/textualStartEndProperties';
import { DivariantHandle } from '../scenes/handle';
import { LinearScene } from '../scenes/linearScene';

interface AnchoredLayout {
    alignment: 'left' | 'center' | 'right';
    placement: 'inside' | 'outside';
    position: 'top' | 'center' | 'bottom';
    spacing: number | _Util.Vec2;
}

export abstract class TextualStartEndScene<Datum extends TextualStartEndProperties> extends LinearScene<Datum> {
    override activeHandle?: 'start' | 'end';

    public readonly labelLayout: AnchoredLayout = {
        position: 'bottom',
        alignment: 'left',
        placement: 'inside',
        spacing: 0,
    };

    public readonly handleLayout: AnchoredLayout = {
        position: 'bottom',
        alignment: 'left',
        placement: 'outside',
        spacing: 0,
    };

    protected readonly label = new _Scene.Text({ zIndex: 1 });
    protected readonly start = new DivariantHandle();
    protected readonly end = new DivariantHandle();

    protected textInputBBox?: _Scene.BBox;

    public setTextInputBBox(bbox: _Scene.BBox) {
        this.textInputBBox = bbox;
    }

    public update(datum: Datum, context: AnnotationContext) {
        const { textInputBBox } = this;

        const coords = convertLine(datum, context);

        if (coords == null) {
            return;
        }

        const { x2, y2 } = coords;
        const bbox = new _Scene.BBox(x2, y2, textInputBBox?.width ?? 0, textInputBBox?.height ?? 0);

        this.label.opacity = datum.visible ? 1 : 0;

        this.updateLabel(datum, bbox);
        this.updateHandles(datum, coords);
        this.updateShape(datum, bbox);
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

    override dragHandle(datum: Datum, target: Coords, context: AnnotationContext) {
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
        return { x: bbox.x, y: bbox.y, position: 'above-left' as const };
    }

    override getCursor() {
        if (this.activeHandle == null) return 'pointer';
        return 'default';
    }

    override containsPoint(x: number, y: number) {
        const { start, end, label } = this;

        this.activeHandle = undefined;

        if (start.containsPoint(x, y)) {
            this.activeHandle = 'start';
            return true;
        }

        if (end.containsPoint(x, y)) {
            this.activeHandle = 'end';
            return true;
        }

        return label.containsPoint(x, y);
    }

    protected updateLabel(datum: Datum, bbox: _Scene.BBox) {
        const { labelLayout } = this;
        const { x, y } = this.getCoordsFromAnchoredLayout(labelLayout, bbox);

        this.label.x = x;
        this.label.y = y;
        this.label.textBaseline = labelLayout.position == 'center' ? 'middle' : labelLayout.position;

        this.label.text = datum.text;
        this.label.fill = datum.color;
        this.label.fontFamily = datum.fontFamily;
        this.label.fontSize = datum.fontSize;
        this.label.fontStyle = datum.fontStyle;
        this.label.fontWeight = datum.fontWeight;
        this.label.textAlign = labelLayout.alignment;
    }

    protected updateHandles(datum: Datum, coords: { x1: number; y1: number; x2: number; y2: number }) {
        const { x1, y1, x2, y2 } = coords;

        const styles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.color,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };

        this.start.update({ ...styles, x: x1, y: y1 });
        this.end.update({ ...styles, x: x2, y: y2 });

        this.start.toggleLocked(datum.locked ?? false);
        this.end.toggleLocked(datum.locked ?? false);
    }

    protected updateShape(_datum: Datum, _textBBox: _Scene.BBox) {
        // Shapes should be implemented by the extending annotation type class
    }

    protected getCoordsFromAnchoredLayout(layout: AnchoredLayout, bbox: _Scene.BBox) {
        const { alignment, placement, position, spacing } = layout;

        let x = bbox.x;
        let y = bbox.y;

        const placementModifier = placement === 'inside' ? 1 : -1;
        const spacingX = (typeof spacing === 'object' ? spacing.x : spacing) * placementModifier;
        const spacingY = (typeof spacing === 'object' ? spacing.y : spacing) * placementModifier;

        switch (alignment) {
            case 'left':
                x = bbox.x + spacingX;
                break;
            case 'center':
                x = bbox.x + bbox.width / 2;
                break;
            case 'right':
                x = bbox.x + bbox.width - spacingX;
                break;
        }

        switch (position) {
            case 'top':
                y = bbox.y + spacingY;
                break;
            case 'center':
                y = bbox.y + bbox.height / 2;
                break;
            case 'bottom':
                y = bbox.y + bbox.height - spacingY;
                break;
        }

        return { x, y };
    }
}
