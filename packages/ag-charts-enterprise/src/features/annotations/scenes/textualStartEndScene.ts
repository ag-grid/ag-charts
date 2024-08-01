import { type AgAnnotationHandleStyles, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext, type Coords, type LineCoords } from '../annotationTypes';
import { convertLine, invertCoords, validateDatumPoint } from '../annotationUtils';
import type { TextualStartEndProperties } from '../properties/textualStartEndProperties';
import { DivariantHandle } from '../scenes/handle';
import { LinearScene } from '../scenes/linearScene';

const { CachedTextMeasurerPool } = _ModuleSupport;
const { BBox } = _Scene;

export abstract class TextualStartEndScene<Datum extends TextualStartEndProperties> extends LinearScene<Datum> {
    override activeHandle?: 'start' | 'end';

    protected readonly label = new _Scene.Text({ zIndex: 1 });
    protected readonly start = new DivariantHandle();
    protected readonly end = new DivariantHandle();

    protected anchor: { x: number; y: number; position: 'above' | 'above-left' | 'right' } = {
        x: 0,
        y: 0,
        position: 'above-left',
    };
    protected textInputBBox?: _Scene.BBox;

    public setTextInputBBox(bbox: _Scene.BBox) {
        this.textInputBBox = bbox;
        this.markDirty(this, _Scene.RedrawType.MINOR);
    }

    public invalidateTextInputBBox() {
        this.textInputBBox = undefined;
    }

    public update(datum: Datum, context: AnnotationContext) {
        const coords = convertLine(datum, context);

        if (coords == null) {
            return;
        }

        const bbox = this.getTextBBox(datum, coords);

        this.label.opacity = datum.visible ? 1 : 0;

        this.updateLabel(datum, bbox, coords);
        this.updateHandles(datum, bbox, coords);
        this.updateShape(datum, bbox, coords);

        this.anchor = this.updateAnchor(datum, bbox, context);
    }

    protected getTextBBox(datum: Datum, coords: LineCoords) {
        const { textInputBBox } = this;
        const { x2, y2 } = coords;

        if (textInputBBox) {
            return new BBox(x2, y2, textInputBBox.width, textInputBBox.height);
        }

        const { lineMetrics, width } = CachedTextMeasurerPool.measureLines(datum.text, {
            font: {
                fontFamily: datum.fontFamily,
                fontSize: datum.fontSize,
                fontStyle: datum.fontStyle,
                fontWeight: datum.fontWeight,
                lineHeight: 1.38,
            },
        });

        const height = lineMetrics.reduce((sum, curr) => sum + curr.lineHeight, 0);

        return new BBox(x2, y2, width, height);
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

    override getAnchor(): { x: number; y: number; position?: 'right' | 'above' | 'above-left' } {
        return this.anchor;
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

    protected updateLabel(datum: Datum, bbox: _Scene.BBox, coords: LineCoords) {
        const { x, y } = this.getLabelCoords(datum, bbox, coords);

        this.label.x = x;
        this.label.y = y;
        this.label.textBaseline = datum.position == 'center' ? 'middle' : datum.position;

        this.label.text = datum.text;
        this.label.fill = datum.color;
        this.label.fontFamily = datum.fontFamily;
        this.label.fontSize = datum.fontSize;
        this.label.fontStyle = datum.fontStyle;
        this.label.fontWeight = datum.fontWeight;
        this.label.textAlign = datum.textAlign;
        this.label.lineHeight = datum.fontSize * 1.38;
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

    protected updateAnchor(_datum: Datum, bbox: _Scene.BBox, context: AnnotationContext) {
        return {
            x: bbox.x + context.seriesRect.x,
            y: bbox.y + context.seriesRect.y - bbox.height,
            position: this.anchor.position,
        };
    }

    protected updateShape(_datum: Datum, _textBBox: _Scene.BBox, _coords: LineCoords) {
        // Shapes should be implemented by the extending annotation type class
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
