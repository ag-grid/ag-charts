import { type FillOptions, type FontOptions, type StrokeOptions, _Util } from 'ag-charts-community';

import type { AnnotationOptionsColorPickerType, Constructor } from '../annotationTypes';

const { Color } = _Util;

export function DefaultColorFillLine<T extends Constructor<FillOptions & StrokeOptions & FontOptions>>(Parent: T) {
    class DefaultColorFillLineInternal extends Parent {
        getDefaultColor(colorPickerType: AnnotationOptionsColorPickerType) {
            switch (colorPickerType) {
                case `fill-color`:
                    return this.fill;
                case `line-color`:
                    return this.stroke;
            }
        }

        getDefaultOpacity(colorPickerType: AnnotationOptionsColorPickerType) {
            switch (colorPickerType) {
                case `fill-color`:
                    return this.fillOpacity;
                case `line-color`:
                    return this.strokeOpacity;
            }
        }
    }
    return DefaultColorFillLineInternal;
}

export function DefaultColorFillLineText<T extends Constructor<FillOptions & StrokeOptions & FontOptions>>(Parent: T) {
    class DefaultColorFillLineTextInternal extends Parent {
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
    }
    return DefaultColorFillLineTextInternal;
}

export interface PlaceholderTextInterface {
    placeholderText?: string;
    getText(): { text: string; isPlaceholder: boolean };
    getPlaceholderColor(): string;
}
export function PlaceholderText<T extends Constructor<FontOptions>>(Parent: T) {
    abstract class PlaceholderTextInternal extends Parent {
        placeholderText?: string;

        abstract getText(): { text: string; isPlaceholder: boolean };

        getPlaceholderColor() {
            const { r, g, b } = Color.fromString(this.color ?? '#888888');
            return new Color(r, g, b, 0.66).toString();
        }
    }
    return PlaceholderTextInternal;
}
