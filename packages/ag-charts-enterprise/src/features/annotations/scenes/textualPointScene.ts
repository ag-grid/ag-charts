import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { AnnotationContext, Coords } from '../annotationTypes';
import type { TextualPointProperties } from '../properties/textualPointProperties';
import { getBBox, updateTextNode, wrapText } from '../text/util';
import { convertPoint, invertCoords } from '../utils/values';
import { AnnotationScene } from './annotationScene';
import { DivariantHandle } from './handle';

const { Vec2 } = _Util;

export abstract class TextualPointScene<Datum extends TextualPointProperties> extends AnnotationScene {
    override activeHandle?: string;

    protected readonly label = new _Scene.Text({ zIndex: 1 });
    protected readonly handle = new DivariantHandle();

    protected dragState?: {
        offset: Coords;
        handle: Coords;
    };

    private anchor: _ModuleSupport.Anchor = {
        x: 0,
        y: 0,
        position: 'above-left',
    };
    private textInputBBox?: _Scene.BBox;

    public setTextInputBBox(bbox?: _Scene.BBox) {
        this.textInputBBox = bbox;
        this.markDirty(this, _Scene.RedrawType.MINOR);
    }

    public update(datum: Datum, context: AnnotationContext) {
        const coords = convertPoint(datum, context);
        const bbox = this.getTextBBox(datum, coords, context);

        this.updateLabel(datum, bbox);
        this.updateHandle(datum, bbox, coords);
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

    override getAnchor(): _ModuleSupport.Anchor {
        return this.anchor;
    }

    override getCursor() {
        if (this.activeHandle == null) return 'pointer';
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

    protected getTextBBox(datum: Datum, coords: _Util.Vec2, _context: AnnotationContext) {
        const { text } = datum.getText();

        return getBBox(datum, text, { x: coords.x, y: coords.y }, this.textInputBBox);
    }

    protected updateLabel(datum: Datum, bbox: _Scene.BBox) {
        const { text, isPlaceholder } = datum.getText();
        const wrappedText = wrapText(datum, text, bbox.width);

        updateTextNode(this.label, wrappedText, isPlaceholder, datum, this.getLabelCoords(datum, bbox));
    }

    protected updateHandle(datum: Datum, bbox: _Scene.BBox, coords: _Util.Vec2) {
        const { x, y } = this.getHandleCoords(datum, bbox, coords);
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

    protected getHandleCoords(_datum: Datum, bbox: _Scene.BBox, _coords: _Util.Vec2): _Util.Vec2 {
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
