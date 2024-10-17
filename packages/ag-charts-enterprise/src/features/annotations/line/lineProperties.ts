import { type PixelSize, _ModuleSupport, type _Scene } from 'ag-charts-community';

import { Cappable, Extendable, LineStyle, LineTextProperties, Localisable, Stroke } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { StartEndProperties } from '../properties/startEndProperties';
import { getLineCap, getLineDash } from '../utils/line';
import { validateDatumLine } from '../utils/validation';

const { OBJECT, STRING, Validate, isObject } = _ModuleSupport;

export abstract class LineTypeProperties extends Localisable(
    Cappable(Extendable(Stroke(LineStyle(StartEndProperties))))
) {
    @Validate(OBJECT, { optional: true })
    text = new LineTextProperties();

    override isValidWithContext(context: AnnotationContext, warningPrefix?: string) {
        return super.isValid(warningPrefix) && validateDatumLine(context, this, warningPrefix);
    }

    override getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case 'line-color':
                return this.stroke;
            case 'text-color':
                return this.text.color;
        }
    }

    override getDefaultOpacity(_colorPickerType: AnnotationOptionsColorPickerType) {
        return this.strokeOpacity;
    }

    getLineDash(): PixelSize[] | undefined {
        return getLineDash(this.lineDash, this.computedLineDash, this.lineStyle, this.strokeWidth);
    }

    getLineCap(): _Scene.ShapeLineCap | undefined {
        return getLineCap(this.lineCap, this.lineDash, this.lineStyle);
    }
}

export class ArrowProperties extends LineTypeProperties {
    static is(value: unknown): value is ArrowProperties {
        return isObject(value) && value.type === AnnotationType.Arrow;
    }

    @Validate(STRING)
    type = AnnotationType.Arrow as const;

    override endCap = 'arrow' as const;
}

export class LineProperties extends LineTypeProperties {
    static is(value: unknown): value is LineProperties {
        return isObject(value) && value.type === AnnotationType.Line;
    }

    @Validate(STRING)
    type = AnnotationType.Line as const;
}
