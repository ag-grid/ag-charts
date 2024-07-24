import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { Annotation, Font, Handle, Label, Line } from '../annotationProperties';
import { type AnnotationContext } from '../annotationTypes';
import { convertLine } from '../annotationUtils';

const { STRING, BaseProperties, Validate } = _ModuleSupport;

export class TextualStartEndProperties extends Annotation(Line(Handle(Label(Font(BaseProperties))))) {
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

    public getTextInputCoords(context: AnnotationContext): { x: number; y: number } {
        const coords = convertLine(this, context);
        return { x: coords?.x2 ?? 0, y: coords?.y2 ?? 0 };
    }
}
