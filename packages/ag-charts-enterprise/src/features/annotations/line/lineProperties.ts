import { type PixelSize, _ModuleSupport } from 'ag-charts-community';
import { Property, isObject } from 'ag-charts-core';

import { Cappable, Extendable, LineStyle, LineTextProperties, Localisable, Stroke } from '../annotationProperties';
import { type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { StartEndProperties } from '../properties/startEndProperties';
import { getLineCap, getLineDash } from '../utils/line';

export abstract class LineTypeProperties extends Localisable(
    Cappable(Extendable(Stroke(LineStyle(StartEndProperties))))
) {
    @Property
    text = new LineTextProperties();

    override getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
        switch (colorPickerType) {
            case 'line-color':
                return this.stroke;
            case 'text-color':
                return this.text.color;
        }
    }

    override getDefaultOpacity() {
        return this.strokeOpacity;
    }

    getLineDash(): PixelSize[] | undefined {
        return getLineDash(this.lineDash, this.computedLineDash, this.lineStyle, this.strokeWidth);
    }

    getLineCap(): _ModuleSupport.ShapeLineCap | undefined {
        return getLineCap(this.lineCap, this.lineDash, this.lineStyle);
    }
}

export class ArrowProperties extends LineTypeProperties {
    static is(this: void, value: unknown): value is ArrowProperties {
        return isObject(value) && value.type === AnnotationType.Arrow;
    }

    @Property
    type = AnnotationType.Arrow as const;

    override endCap = 'arrow' as const;
}

export class LineProperties extends LineTypeProperties {
    static is(this: void, value: unknown): value is LineProperties {
        return isObject(value) && value.type === AnnotationType.Line;
    }

    @Property
    type = AnnotationType.Line as const;
}
