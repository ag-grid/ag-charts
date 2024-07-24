import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { Point } from '../annotationProperties';
import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { convertPoint } from '../annotationUtils';
import { TextualProperties } from '../properties/textualProperties';

const { STRING, Validate, isObject } = _ModuleSupport;

export class TextProperties extends Point(TextualProperties) {
    static is(value: unknown): value is TextProperties {
        return isObject(value) && value.type === AnnotationType.Text;
    }

    @Validate(STRING)
    type = AnnotationType.Text as const;

    override position: 'top' | 'center' | 'bottom' = 'bottom';

    public override getTextInputCoords(context: AnnotationContext) {
        return convertPoint(this, context);
    }
}
