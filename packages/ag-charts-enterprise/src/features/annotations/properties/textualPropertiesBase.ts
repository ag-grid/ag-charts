import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { Annotation, Fill, Font, Handle, Label, Stroke } from '../annotationProperties';
import { type AnnotationContext } from '../annotationTypes';

const { STRING, Validate, BaseProperties } = _ModuleSupport;

export class TextualPropertiesBase extends Annotation(Handle(Fill(Stroke(Label(Font(BaseProperties)))))) {
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

    public getTextBBox(_context: AnnotationContext) {
        return new _Scene.BBox(0, 0, 0, 0);
    }
}
