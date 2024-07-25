import { _ModuleSupport } from 'ag-charts-community';

import { Annotation, Font, Handle, Label, Point } from '../annotationProperties';
import { type AnnotationContext } from '../annotationTypes';
import { convertPoint } from '../annotationUtils';

const { STRING, BaseProperties, Validate } = _ModuleSupport;

export class TextualPointProperties extends Annotation(Point(Handle(Label(Font(BaseProperties))))) {
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

    public getTextInputCoords(context: AnnotationContext) {
        return convertPoint(this, context);
    }
}
