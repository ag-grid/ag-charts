import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { Fill, Stroke } from '../annotationProperties';
import {
    type AnnotationContext,
    type AnnotationOptionsColorPickerType,
    AnnotationType,
    type Padding,
} from '../annotationTypes';
import { TextualStartEndProperties } from '../properties/textualStartEndProperties';

const { STRING, Validate, isObject } = _ModuleSupport;
const { Color } = _Util;

export class CalloutProperties extends Fill(Stroke(TextualStartEndProperties)) {
    static is(value: unknown): value is CalloutProperties {
        return isObject(value) && value.type === AnnotationType.Callout;
    }

    @Validate(STRING)
    type = AnnotationType.Callout as const;

    override position = 'bottom' as const;
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
        const { r, g, b } = Color.fromString(this.color ?? '#888888');
        return new Color(r, g, b, 0.66).toString();
    }

    override getTextInputCoords(context: AnnotationContext, padding?: Padding | number) {
        const coords = super.getTextInputCoords(context);

        const paddingLeft = typeof padding === 'number' ? padding : padding?.left ?? 0;
        const paddingBottom = typeof padding === 'number' ? padding : padding?.bottom ?? 0;

        return {
            x: coords.x + paddingLeft,
            y: coords.y - paddingBottom,
        };
    }
}
