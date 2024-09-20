import { type AgAnnotationHandleStyles, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { AnnotationContext, LineCoords } from '../annotationTypes';
import type { TextualStartEndProperties } from '../properties/textualStartEndProperties';
import { StartEndScene } from '../scenes/startEndScene';
import { getBBox, updateTextNode, wrapText } from '../text/util';
import { convertLine } from '../utils/values';

export abstract class TextualStartEndScene<Datum extends TextualStartEndProperties> extends StartEndScene<Datum> {
    override activeHandle?: 'start' | 'end';

    protected readonly label = new _Scene.Text({ zIndex: 1 });

    protected override anchor: _ModuleSupport.ToolbarAnchor = {
        x: 0,
        y: 0,
        position: 'above-left',
    };
    protected textInputBBox?: _Scene.BBox;

    public setTextInputBBox(bbox?: _Scene.BBox) {
        this.textInputBBox = bbox;
        this.markDirty(this, _Scene.RedrawType.MINOR);
    }

    public override update(datum: Datum, context: AnnotationContext) {
        const coords = convertLine(datum, context);

        if (coords == null) {
            return;
        }

        const bbox = this.getTextBBox(datum, coords);

        this.updateLabel(datum, bbox, coords);
        this.updateHandles(datum, coords, bbox);
        this.updateShape(datum, bbox, coords);

        this.anchor = this.updateAnchor(datum, coords, context, bbox);
    }

    override containsPoint(x: number, y: number) {
        const { label } = this;

        return super.containsPoint(x, y) || label.containsPoint(x, y);
    }

    protected getTextBBox(datum: Datum, coords: LineCoords) {
        const { text } = datum.getText();

        return getBBox(datum, text, { x: coords.x2, y: coords.y2 }, this.textInputBBox);
    }

    protected updateLabel(datum: Datum, bbox: _Scene.BBox, coords: LineCoords) {
        const { text, isPlaceholder } = datum.getText();
        const wrappedText = wrapText(datum, text, bbox.width);

        if (!isPlaceholder) {
            datum.set({ text: wrappedText });
        }

        updateTextNode(this.label, wrappedText, isPlaceholder, datum, this.getLabelCoords(datum, bbox, coords));
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

    protected override getHandleStyles(datum: Datum, handle?: 'start' | 'end'): AgAnnotationHandleStyles {
        return {
            ...super.getHandleStyles(datum, handle),
            stroke: datum.handle.stroke ?? datum.color,
        };
    }
}
