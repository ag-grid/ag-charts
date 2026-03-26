import { type AgAnnotationHandleStyles, _ModuleSupport } from 'ag-charts-community';
import { type Bounds4, type Point, Vec4 } from 'ag-charts-core';

import type { AnnotationContext } from '../annotationTypes';
import type { TextualStartEndProperties } from '../properties/textualStartEndProperties';
import { getBBox, updateTextNode } from '../text/util';
import { convertLine } from '../utils/values';
import { StartEndScene } from './startEndScene';

export abstract class TextualStartEndScene<Datum extends TextualStartEndProperties> extends StartEndScene<Datum> {
    override activeHandle?: 'start' | 'end';

    protected readonly label = new _ModuleSupport.Text({ zIndex: 1 });

    protected override anchor: _ModuleSupport.FloatingToolbarAnchor = {
        x: 0,
        y: 0,
        position: 'above-left',
    };
    protected textInputBBox?: _ModuleSupport.BBox;

    public setTextInputBBox(bbox?: _ModuleSupport.BBox) {
        this.textInputBBox = bbox;
        this.markDirty('TextualStartEndScene');
    }

    public override update(datum: Datum, context: AnnotationContext) {
        const coords = convertLine(datum, context);
        if (coords == null) return;

        const bbox = this.getTextBBox(datum, coords);

        this.updateLabel(datum, bbox, coords, context);
        this.updateHandles(datum, coords, bbox);
        this.updateShape(datum, bbox, coords);
        this.updateAnchor(datum, coords, context, bbox);
    }

    override containsPoint(x: number, y: number) {
        return super.containsPoint(x, y) || this.label.containsPoint(x, y);
    }

    public override getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.label.containsPoint(x, y)) return 'text';

        return super.getNodeAtCoords(x, y);
    }

    protected getTextBBox(datum: Datum, coords: Bounds4) {
        const { text } = datum.getText();

        return getBBox(datum, text, Vec4.end(coords), this.textInputBBox);
    }

    protected updateLabel(datum: Datum, bbox: _ModuleSupport.BBox, coords: Bounds4, context: AnnotationContext) {
        const { text, isPlaceholder } = datum.getText();
        const labelCoords = this.getLabelCoords(datum, bbox, coords);

        if (context.isRtl) {
            labelCoords.x += bbox.width;
        }

        updateTextNode(this.label, text, isPlaceholder, datum, labelCoords);
    }

    protected updateShape(_datum: Datum, _textBBox: _ModuleSupport.BBox, _coords: Bounds4) {
        // Shapes should be implemented by the extending annotation type class
    }

    protected getLabelCoords(_datum: Datum, _bbox: _ModuleSupport.BBox, coords: Bounds4): Point {
        return Vec4.end(coords);
    }

    protected override getHandleStyles(datum: Datum, handle?: 'start' | 'end'): AgAnnotationHandleStyles {
        return {
            ...super.getHandleStyles(datum, handle),
            stroke: datum.handle.stroke ?? datum.color,
        };
    }
}
