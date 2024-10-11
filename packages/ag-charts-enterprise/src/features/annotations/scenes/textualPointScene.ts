import { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { AnnotationContext } from '../annotationTypes';
import type { TextualPointProperties } from '../properties/textualPointProperties';
import { getBBox, updateTextNode } from '../text/util';
import { convertPoint, invertCoords } from '../utils/values';
import { PointScene } from './pointScene';

export abstract class TextualPointScene<Datum extends TextualPointProperties> extends PointScene<Datum> {
    override activeHandle?: string;

    protected readonly label = new _Scene.Text({ zIndex: 1 });

    protected override anchor: _ModuleSupport.ToolbarAnchor = {
        x: 0,
        y: 0,
        position: 'above-left',
    };

    private textInputBBox?: _Scene.BBox;

    public setTextInputBBox(bbox?: _Scene.BBox) {
        this.textInputBBox = bbox;
        this.markDirty(_Scene.RedrawType.MINOR);
    }

    public override update(datum: Datum, context: AnnotationContext) {
        const coords = convertPoint(datum, context);
        const bbox = this.getTextBBox(datum, coords, context);

        this.updateLabel(datum, bbox);
        this.updateHandle(datum, coords, bbox);
        this.updateShape(datum, bbox);

        this.anchor = this.updateAnchor(datum, bbox, context);
    }

    public override copy(datum: Datum, copiedDatum: Datum, context: AnnotationContext) {
        const coords = convertPoint(datum, context);
        const bbox = this.getTextBBox(datum, coords, context);

        const padding = datum.getPadding();
        const horizontalPadding = padding.left + padding.right;
        const verticalPadding = padding.top + padding.bottom;

        const xOffset = (bbox.width + horizontalPadding) / 2;
        const yOffset = bbox.height + verticalPadding;

        const point = invertCoords({ x: coords.x - xOffset, y: coords.y - yOffset }, context);

        copiedDatum.x = point.x;
        copiedDatum.y = point.y;

        return copiedDatum;
    }

    override containsPoint(x: number, y: number) {
        const { label } = this;
        return super.containsPoint(x, y) || (label.visible && label.containsPoint(x, y));
    }

    override getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.label.visible && this.label.containsPoint(x, y)) return 'text';

        return super.getNodeAtCoords(x, y);
    }

    protected getTextBBox(datum: Datum, coords: _ModuleSupport.Vec2, _context: AnnotationContext) {
        const { text } = datum.getText();

        return getBBox(datum, text, { x: coords.x, y: coords.y }, this.textInputBBox);
    }

    protected updateLabel(datum: Datum, bbox: _Scene.BBox) {
        const { text, isPlaceholder } = datum.getText();

        updateTextNode(this.label, text, isPlaceholder, datum, this.getLabelCoords(datum, bbox));
    }

    protected updateShape(_datum: Datum, _bbox: _Scene.BBox) {
        // Shapes should be implemented by the extending annotation type class
    }

    protected override updateAnchor(_datum: Datum, bbox: _Scene.BBox, context: AnnotationContext) {
        return {
            x: bbox.x + context.seriesRect.x,
            y: bbox.y + context.seriesRect.y - bbox.height,
            position: this.anchor.position,
        };
    }

    protected getLabelCoords(_datum: Datum, bbox: _Scene.BBox): _ModuleSupport.Vec2 {
        return bbox;
    }

    protected override getHandleCoords(
        _datum: Datum,
        _coords: _ModuleSupport.Vec2,
        bbox: _Scene.BBox
    ): _ModuleSupport.Vec2 {
        return bbox;
    }

    protected override getHandleStyles(datum: Datum) {
        const styles = super.getHandleStyles(datum);
        styles.stroke = datum.handle.stroke ?? datum.color;
        return styles;
    }
}
