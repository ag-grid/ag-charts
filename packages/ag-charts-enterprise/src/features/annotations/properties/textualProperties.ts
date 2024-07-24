import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { Annotation, Font, Handle, Label } from '../annotationProperties';
import { type AnnotationContext } from '../annotationTypes';

const { STRING, BaseProperties, Validate } = _ModuleSupport;

export class TextualProperties extends Annotation(Handle(Label(Font(BaseProperties)))) {
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

    public getTextInputCoords(_context: AnnotationContext): { x: number; y: number } {
        return { x: 0, y: 0 };
    }
}
