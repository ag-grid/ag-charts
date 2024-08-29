import { type FillOptions, type FontOptions, type StrokeOptions, _Util } from 'ag-charts-community';

import type { AnnotationOptionsColorPickerType, Constructor } from '../annotationTypes';

const { Color } = _Util;

export function DefaultColor<T extends Constructor<FillOptions & StrokeOptions & FontOptions>>(Parent: T) {
    class TextWithColorInternal extends Parent {
        getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
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

        getDefaultOpacity(colorPickerType: AnnotationOptionsColorPickerType) {
            switch (colorPickerType) {
                case `fill-color`:
                    return this.fillOpacity;
                case `line-color`:
                    return this.strokeOpacity;
                case `text-color`:
                default:
                    return undefined;
            }
        }

        getPlaceholderColor() {
            const { r, g, b } = Color.fromString(this.color ?? '#888888');
            return new Color(r, g, b, 0.66).toString();
        }
    }
    return TextWithColorInternal;
}
