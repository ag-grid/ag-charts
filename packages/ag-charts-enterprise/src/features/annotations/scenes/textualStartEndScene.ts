import { type AgAnnotationHandleStyles, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { type Anchor, type AnnotationContext, type Coords, type LineCoords } from '../annotationTypes';
import { convertLine, invertCoords, validateDatumPoint } from '../annotationUtils';
import type { TextualStartEndProperties } from '../properties/textualStartEndProperties';
import { DivariantHandle } from '../scenes/handle';
import { LinearScene } from '../scenes/linearScene';
import { getBBox, updateTextNode, wrapText } from '../text/util';

const { Vec2 } = _Util;

export abstract class TextualStartEndScene<Datum extends TextualStartEndProperties> extends LinearScene<Datum> {
    override activeHandle?: 'start' | 'end';

    protected readonly label = new _Scene.Text({ zIndex: 1 });
    protected readonly start = new DivariantHandle();
    protected readonly end = new DivariantHandle();

    protected anchor: Anchor = {
        x: 0,
        y: 0,
        position: 'above-left',
    };
    protected textInputBBox?: _Scene.BBox;

    public setTextInputBBox(bbox?: _Scene.BBox) {
        this.textInputBBox = bbox;
        this.markDirty(this, _Scene.RedrawType.MINOR);
    }

    public update(datum: Datum, context: AnnotationContext) {
        const coords = convertLine(datum, context);

        if (coords == null) {
            return;
        }

        const bbox = this.getTextBBox(datum, coords);

        this.updateLabel(datum, bbox, coords);
        this.updateHandles(datum, bbox, coords);
        this.updateShape(datum, bbox, coords);

        this.anchor = this.updateAnchor(datum, bbox, context);
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
        const { activeHandle, dragState } = this;

        if (!activeHandle || !dragState) return;

        this[activeHandle].toggleDragging(true);
        const coords = Vec2.add(dragState.end, Vec2.sub(target, dragState.offset));
        const point = invertCoords(coords, context);

        if (!validateDatumPoint(context, point)) return;

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
        if (this.activeHandle == null) return 'pointer';
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

    protected getTextBBox(datum: Datum, coords: LineCoords) {
        const { text } = datum.getText();

        return getBBox(datum, text, { x: coords.x2, y: coords.y2 }, this.textInputBBox);
    }

    protected updateLabel(datum: Datum, bbox: _Scene.BBox, coords: LineCoords) {
        const { text, isPlaceholder } = datum.getText();
        const wrappedText = wrapText(datum, text, bbox.width);
        updateTextNode(this.label, wrappedText, isPlaceholder, datum, this.getLabelCoords(datum, bbox, coords));
    }

    protected updateHandles(datum: Datum, bbox: _Scene.BBox, coords: LineCoords) {
        this.start.update({
            ...this.getHandleStyles(datum, 'start'),
            ...this.getHandleCoords(datum, bbox, coords, 'start'),
        });
        this.end.update({
            ...this.getHandleStyles(datum, 'end'),
            ...this.getHandleCoords(datum, bbox, coords, 'end'),
        });

        this.start.toggleLocked(datum.locked ?? false);
        this.end.toggleLocked(datum.locked ?? false);
    }

    protected updateShape(_datum: Datum, _textBBox: _Scene.BBox, _coords: LineCoords) {
        // Shapes should be implemented by the extending annotation type class
    }

    protected updateAnchor(_datum: Datum, bbox: _Scene.BBox, context: AnnotationContext): Anchor {
        return {
            x: bbox.x + context.seriesRect.x,
            y: bbox.y + context.seriesRect.y - bbox.height,
            position: this.anchor.position,
        };
    }

    protected getLabelCoords(_datum: Datum, _bbox: _Scene.BBox, coords: LineCoords): _Util.Vec2 {
        return {
            x: coords.x2,
            y: coords.y2,
        };
    }

    protected getHandleCoords(
        _datum: Datum,
        _bbox: _Scene.BBox,
        coords: LineCoords,
        handle: 'start' | 'end'
    ): _Util.Vec2 {
        return {
            x: handle === 'start' ? coords.x1 : coords.x2,
            y: handle === 'start' ? coords.y1 : coords.y2,
        };
    }

    protected getHandleStyles(datum: Datum, _handle: 'start' | 'end'): AgAnnotationHandleStyles {
        return {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.color,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };
    }
}
