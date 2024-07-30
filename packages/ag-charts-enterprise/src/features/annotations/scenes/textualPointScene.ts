import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { AnnotationContext, Coords } from '../annotationTypes';
import { convertPoint, invertCoords } from '../annotationUtils';
import type { TextualPointProperties } from '../properties/textualPointProperties';
import { AnnotationScene } from './annotationScene';
import { DivariantHandle } from './handle';

const { CachedTextMeasurerPool, TextWrapper } = _ModuleSupport;
const { Vec2 } = _Util;

export abstract class TextualPointScene<Datum extends TextualPointProperties> extends AnnotationScene {
    override activeHandle?: string;

    protected readonly label = new _Scene.Text({ zIndex: 1 });
    protected readonly handle = new DivariantHandle();

    protected dragState?: {
        offset: Coords;
        handle: Coords;
    };

    private anchor: { x: number; y: number; position: 'above' | 'above-left' | 'right' } = {
        x: 0,
        y: 0,
        position: 'above-left',
    };
    private textInputBBox?: _Scene.BBox;

    public setTextInputBBox(bbox: _Scene.BBox) {
        this.textInputBBox = bbox;
        this.markDirty(this, _Scene.RedrawType.MINOR);
    }

    public invalidateTextInputBBox() {
        this.textInputBBox = undefined;
    }

    public update(datum: Datum, context: AnnotationContext) {
        const bbox = this.getTextBBox(datum, context);

        this.updateLabel(datum, bbox);
        this.updateHandle(datum, bbox);
        this.updateShape(datum, bbox);

        this.anchor = this.updateAnchor(datum, bbox, context);
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
        return this.anchor;
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

        return label.visible && label.containsPoint(x, y);
    }

    protected getTextBBox(datum: Datum, context: AnnotationContext) {
        const { textInputBBox } = this;

        const point = convertPoint(datum, context);

        if (textInputBBox) {
            return new _Scene.BBox(point.x, point.y, textInputBBox.width, textInputBBox.height);
        }

        const options = {
            font: {
                fontFamily: datum.fontFamily,
                fontSize: datum.fontSize,
                fontStyle: datum.fontStyle,
                fontWeight: datum.fontWeight,
            },
            textAlign: datum.textAlign,
        };

        let text = datum.text;
        if (datum.width) {
            text = TextWrapper.wrapLines(datum.text, {
                ...options,
                maxWidth: datum.width,
                lineHeight: 1.38,
            }).join('\n');
        }

        const { lineMetrics, width } = CachedTextMeasurerPool.measureLines(text, options);
        const height = lineMetrics.reduce((sum, curr) => sum + curr.lineHeight, 0);

        return new _Scene.BBox(point.x, point.y, width, height);
    }

    protected updateLabel(datum: Datum, bbox: _Scene.BBox) {
        const { x, y } = this.getLabelCoords(datum, bbox);

        this.label.visible = datum.visible ?? true;

        this.label.x = x;
        this.label.y = y;
        this.label.textBaseline = datum.position == 'center' ? 'middle' : datum.position;

        this.label.text = datum.text;
        this.label.fill = datum.color;
        this.label.fontFamily = datum.fontFamily;
        this.label.fontSize = datum.fontSize;
        this.label.fontStyle = datum.fontStyle;
        this.label.fontWeight = datum.fontWeight;
        this.label.textAlign = datum.textAlign ?? datum.alignment;
        this.label.lineHeight = Math.floor(datum.fontSize * 1.38);
    }

    protected updateHandle(datum: Datum, bbox: _Scene.BBox) {
        const { x, y } = this.getHandleCoords(datum, bbox);
        const styles = this.getHandleStyles(datum);

        this.handle.update({ ...styles, x, y });
        this.handle.toggleLocked(datum.locked ?? false);
    }

    protected updateShape(_datum: Datum, _bbox: _Scene.BBox) {
        // Shapes should be implemented by the extending annotation type class
    }

    protected updateAnchor(_datum: Datum, bbox: _Scene.BBox, context: AnnotationContext) {
        return {
            x: bbox.x + context.seriesRect.x,
            y: bbox.y + context.seriesRect.y - bbox.height,
            position: this.anchor.position,
        };
    }

    protected getLabelCoords(_datum: Datum, bbox: _Scene.BBox): _Util.Vec2 {
        return bbox;
    }

    protected getHandleCoords(_datum: Datum, bbox: _Scene.BBox): _Util.Vec2 {
        return bbox;
    }

    protected getHandleStyles(datum: Datum) {
        return {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.color,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };
    }
}
