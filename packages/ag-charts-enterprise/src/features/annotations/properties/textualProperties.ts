import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { Annotation, Fill, Font, Handle, Label, PointProperties, Stroke } from '../annotationProperties';
import { type AnnotationContext } from '../annotationTypes';
import { convertPoint } from '../annotationUtils';

const { STRING, Validate } = _ModuleSupport;

export class TextualProperties extends Annotation(Handle(Fill(Stroke(Label(Font(PointProperties)))))) {
    @Validate(STRING)
    text: string = '';

    position: 'top' | 'center' | 'bottom' = 'top';
    alignment: 'left' | 'center' | 'right' = 'left';
    placement: 'inside' | 'outside' = 'inside';

    override isValidWithContext(_context: AnnotationContext, warningPrefix?: string) {
        return super.isValid(warningPrefix);
    }

    override getDefaultColor() {
        return this.color;
    }

    public getTextBBox(context: AnnotationContext) {
        const coords = convertPoint(this, context);
        return new _Scene.BBox(coords.x, coords.y, 0, 0);
    }
}
