import { type AgAnnotationLineStyleType, _ModuleSupport, _Util } from 'ag-charts-community';

import {
    type AnnotationLineStyle,
    type AnnotationOptionsColorPickerType,
    AnnotationType,
    type ChannelAnnotationType,
    type LineAnnotationType,
    type TextualAnnotationType,
} from './annotationTypes';
import type { AnnotationProperties } from './annotationsSuperTypes';
import { hasFontSize, hasLineStyle } from './utils/has';
import { setColor, setFontSize, setLineStyle } from './utils/styles';

interface DefaultsMemento {
    colors: DefaultColors;
    fontSizes: DefaultFontSizes;
    lineStyles: DefaultLineStyles;
}

type DefaultColors = Map<AnnotationType, Map<AnnotationOptionsColorPickerType, [string, string, number] | undefined>>;
type DefaultFontSizes = Map<TextualAnnotationType, number | undefined>;
type DefaultLineStyles = Map<LineAnnotationType | ChannelAnnotationType, AnnotationLineStyle | undefined>;

export class AnnotationDefaults implements _ModuleSupport.MementoOriginator<DefaultsMemento> {
    mementoOriginatorKey = 'annotation-defaults' as const;

    private colors: DefaultColors = new Map(
        Object.values(AnnotationType).map((type) => [
            type,
            new Map([
                ['line-color', undefined],
                ['fill-color', undefined],
                ['text-color', undefined],
            ]),
        ])
    );

    private fontSizes: DefaultFontSizes = new Map([
        [AnnotationType.Callout, undefined],
        [AnnotationType.Comment, undefined],
        [AnnotationType.Note, undefined],
        [AnnotationType.Text, undefined],
    ]);

    private lineStyles: DefaultLineStyles = new Map<
        LineAnnotationType | ChannelAnnotationType,
        AnnotationLineStyle | undefined
    >([
        [AnnotationType.Line, undefined],
        [AnnotationType.HorizontalLine, undefined],
        [AnnotationType.VerticalLine, undefined],
        [AnnotationType.DisjointChannel, undefined],
        [AnnotationType.ParallelChannel, undefined],
        [AnnotationType.Arrow, undefined],
    ]);

    createMemento() {
        return {
            colors: _Util.deepClone(this.colors),
            fontSizes: _Util.deepClone(this.fontSizes),
            lineStyles: _Util.deepClone(this.lineStyles),
        };
    }

    guardMemento(_blob: unknown): _blob is DefaultsMemento {
        return true;
    }

    restoreMemento(_version: string, _mementoVersion: string, blob: DefaultsMemento): void {
        this.colors = _Util.deepClone(blob.colors);
        this.fontSizes = _Util.deepClone(blob.fontSizes);
        this.lineStyles = _Util.deepClone(blob.lineStyles);
    }

    setDefaultColor(
        type: AnnotationType,
        colorType: AnnotationOptionsColorPickerType,
        colorOpacity: string,
        color: string,
        opacity: number
    ) {
        this.colors.get(type)?.set(colorType, [colorOpacity, color, opacity]);
    }

    setDefaultFontSize(type: TextualAnnotationType, fontSize: number) {
        this.fontSizes.set(type, fontSize);
    }

    setDefaultLineStyleType(
        type: LineAnnotationType | ChannelAnnotationType,
        lineStyleType: AgAnnotationLineStyleType | undefined
    ) {
        const defaultStyle = this.lineStyles.get(type);
        if (defaultStyle) {
            defaultStyle.type = lineStyleType;
        } else {
            this.lineStyles.set(type, { type: lineStyleType });
        }
    }

    setDefaultLineStyleWidth(type: LineAnnotationType | ChannelAnnotationType, strokeWidth: number) {
        const defaultStyle = this.lineStyles.get(type);
        if (defaultStyle) {
            defaultStyle.strokeWidth = strokeWidth;
        } else {
            this.lineStyles.set(type, { strokeWidth });
        }
    }

    applyDefaults(datum: AnnotationProperties) {
        for (const [annotationType, colors] of this.colors) {
            if (datum.type !== annotationType) {
                continue;
            }

            for (const [colorPickerType, [colorOpacity, color, opacity] = []] of colors) {
                if (colorOpacity && color && opacity != null) {
                    setColor(datum, colorPickerType, colorOpacity, color, opacity);
                }
            }
        }

        if (hasFontSize(datum)) {
            for (const [annotationType, size] of this.fontSizes) {
                if (size) {
                    setFontSize(datum, annotationType, size);
                }
            }
        }

        if (hasLineStyle(datum)) {
            for (const [annotationType, style] of this.lineStyles) {
                if (style) {
                    setLineStyle(datum, annotationType, style);
                }
            }
        }
    }
}
