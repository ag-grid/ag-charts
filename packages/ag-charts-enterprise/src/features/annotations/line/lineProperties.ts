import { _ModuleSupport } from 'ag-charts-community';

import { Annotation, Cappable, Extendable, Handle, Line, LineDash, Stroke } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { validateDatumLine } from '../annotationUtils';

const { STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

export class LineProperties extends Annotation(Line(Handle(Cappable(Extendable(Stroke(LineDash(BaseProperties))))))) {
    static is(value: unknown): value is LineProperties {
        return isObject(value) && value.type === AnnotationType.Line;
    }

    @Validate(STRING)
    type = AnnotationType.Line as const;

    override isValidWithContext(context: AnnotationContext, warningPrefix?: string) {
        return super.isValid(warningPrefix) && validateDatumLine(context, this, warningPrefix);
    }

    getDefaultColor(_colorPickerType: AnnotationOptionsColorPickerType) {
        return this.stroke;
    }
}
