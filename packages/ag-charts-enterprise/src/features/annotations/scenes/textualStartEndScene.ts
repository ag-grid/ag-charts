import { type AgAnnotationHandleStyles, _ModuleSupport, _Scene } from 'ag-charts-community';

import type { AnnotationContext } from '../annotationTypes';
import type { TextualStartEndProperties } from '../properties/textualStartEndProperties';
import { StartEndScene } from '../scenes/startEndScene';
import { getBBox, updateTextNode } from '../text/util';
import { validateDatumPoint } from '../utils/validation';
import { convertLine, invertCoords } from '../utils/values';

const { Vec2, Vec4 } = _ModuleSupport;

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
        this.markDirty(_Scene.RedrawType.MINOR);
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
        this.updateAnchor(datum, coords, context, bbox);
    }

    override dragHandle(datum: Datum, target: _ModuleSupport.Vec2, context: AnnotationContext, snapping: boolean) {
        const { activeHandle, dragState } = this;

        if (!activeHandle || !dragState) return;

        this[activeHandle].toggleDragging(true);
        const coords = Vec2.add(dragState.end, Vec2.sub(target, dragState.offset));
        const point = snapping ? this.snapToAngle(datum, coords, context) : invertCoords(coords, context);

        if (!point || !validateDatumPoint(context, point)) return;

        datum[activeHandle].x = point.x;
        datum[activeHandle].y = point.y;
    }

    override containsPoint(x: number, y: number) {
        const { label } = this;

        return super.containsPoint(x, y) || label.containsPoint(x, y);
    }

    public override getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.label.containsPoint(x, y)) return 'text';

        return super.getNodeAtCoords(x, y);
    }

    protected getTextBBox(datum: Datum, coords: _ModuleSupport.Vec4) {
        const { text } = datum.getText();

        return getBBox(datum, text, Vec4.end(coords), this.textInputBBox);
    }

    protected updateLabel(datum: Datum, bbox: _Scene.BBox, coords: _ModuleSupport.Vec4) {
        const { text, isPlaceholder } = datum.getText();

        updateTextNode(this.label, text, isPlaceholder, datum, this.getLabelCoords(datum, bbox, coords));
    }

    protected updateShape(_datum: Datum, _textBBox: _Scene.BBox, _coords: _ModuleSupport.Vec4) {
        // Shapes should be implemented by the extending annotation type class
    }

    protected getLabelCoords(_datum: Datum, _bbox: _Scene.BBox, coords: _ModuleSupport.Vec4): _ModuleSupport.Vec2 {
        return Vec4.end(coords);
    }

    protected override getHandleStyles(datum: Datum, handle?: 'start' | 'end'): AgAnnotationHandleStyles {
        return {
            ...super.getHandleStyles(datum, handle),
            stroke: datum.handle.stroke ?? datum.color,
        };
    }
}
