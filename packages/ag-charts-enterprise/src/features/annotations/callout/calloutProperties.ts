import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { Fill, Stroke } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { convertLine } from '../annotationUtils';
import { TextualStartEndProperties } from '../properties/textualStartEndProperties';

const { STRING, Validate, isObject } = _ModuleSupport;
const { Color } = _Util;

export class CalloutProperties extends Fill(Stroke(TextualStartEndProperties)) {
    static is(value: unknown): value is CalloutProperties {
        return isObject(value) && value.type === AnnotationType.Callout;
    }

    @Validate(STRING)
    type = AnnotationType.Callout as const;

    override position = 'center' as const;
    override alignment = 'left' as const;

    override getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case `fill-color`:
                return this.fill;
            case `line-color`:
                return this.stroke;
            case `text-color`:
            default:
                return this.color;
        }
    }

    override getPlaceholderColor() {
        const textColor = this.color ?? '#888888';
        return Color.mix(Color.fromString(textColor), Color.fromString(textColor), 0.66).toString();
    }

    public override getTextInputCoords(context: AnnotationContext) {
        const padding = this.padding ?? 12;
        const coords = convertLine(this, context);

        return { x: (coords?.x2 ?? 0) + padding, y: coords?.y2 ?? 0 };
    }
}
