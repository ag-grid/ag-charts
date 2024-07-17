import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { Annotation, Font, Handle, Label, PointProperties } from '../annotationProperties';
import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { convertPoint } from '../annotationUtils';

const { STRING, Validate, isObject } = _ModuleSupport;

export class TextProperties extends Annotation(Handle(Label(Font(PointProperties)))) {
    static is(value: unknown): value is TextProperties {
        return isObject(value) && value.type === AnnotationType.Text;
    }

    @Validate(STRING)
    type = AnnotationType.Text as const;

    @Validate(STRING)
    text!: string;

    position: 'top' | 'center' | 'bottom' = 'top';
    alignment: 'left' | 'center' | 'right' = 'left';

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
