import { type AgAnnotationLineStyleType, _ModuleSupport, _Util } from 'ag-charts-community';

import {
    type AnnotationLineStyle,
    type AnnotationOptionsColorPickerType,
    AnnotationType,
        type ChannelTextPosition,
    type HasColorAnnotationType,
    type HasFontSizeAnnotationType,
    type HasLineStyleAnnotationType,
    type HasLineTextAnnotationType,
        type LineTextAlignment,
    type LineTextPosition,
} from './annotationTypes';
import type { AnnotationProperties } from './annotationsSuperTypes';
import { setColor, setFontSize, setLineStyle } from './utils/styles';

interface DefaultsMemento {
    colors: DefaultColors;
    fontSizes: DefaultFontSizes;
    lineStyles: DefaultLineStyles;
    lineTextAlignments: DefaultLineTextAlignments;
    lineTextPositions: DefaultLineTextPositions;
}

type DefaultColors = Map<AnnotationType, Map<AnnotationOptionsColorPickerType, [string, string, number] | undefined>>;
type DefaultFontSizes = Map<HasFontSizeAnnotationType, number | undefined>;
type DefaultLineStyles = Map<HasLineStyleAnnotationType, AnnotationLineStyle | undefined>;
type DefaultLineTextAlignments = Map<HasLineTextAnnotationType, LineTextAlignment | undefined>;
type DefaultLineTextPositions = Map<HasLineTextAnnotationType, LineTextPosition | ChannelTextPosition | undefined>;

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
        [AnnotationType.Text, undefined],
        [AnnotationType.Arrow, undefined],
        [AnnotationType.Line, undefined],
        [AnnotationType.DisjointChannel, undefined],
        [AnnotationType.ParallelChannel, undefined],
    ]);

    private lineStyles: DefaultLineStyles = new Map([
        [AnnotationType.Line, undefined],
        [AnnotationType.HorizontalLine, undefined],
        [AnnotationType.VerticalLine, undefined],
        [AnnotationType.DisjointChannel, undefined],
        [AnnotationType.ParallelChannel, undefined],
        [AnnotationType.Arrow, undefined],
    ]);

    private lineTextAlignments: DefaultLineTextAlignments = new Map([
        [AnnotationType.Line, undefined],
        [AnnotationType.HorizontalLine, undefined],
        [AnnotationType.VerticalLine, undefined],
        [AnnotationType.DisjointChannel, undefined],
        [AnnotationType.ParallelChannel, undefined],
        [AnnotationType.Arrow, undefined],
    ]);

    private lineTextPositions: DefaultLineTextPositions = new Map([
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
            lineTextAlignments: _Util.deepClone(this.lineTextAlignments),
            lineTextPositions: _Util.deepClone(this.lineTextPositions),
        };
    }

    guardMemento(_blob: unknown): _blob is DefaultsMemento {
        return true;
    }

    restoreMemento(_version: string, _mementoVersion: string, blob: DefaultsMemento): void {
        this.colors = _Util.deepClone(blob.colors);
        this.fontSizes = _Util.deepClone(blob.fontSizes);
        this.lineStyles = _Util.deepClone(blob.lineStyles);
        this.lineTextAlignments = _Util.deepClone(blob.lineTextAlignments);
        this.lineTextPositions = _Util.deepClone(blob.lineTextPositions);
    }

    setDefaultColor(
        type: HasColorAnnotationType,
        colorType: AnnotationOptionsColorPickerType,
        colorOpacity: string,
        color: string,
        opacity: number
    ) {
        this.colors.get(type)?.set(colorType, [colorOpacity, color, opacity]);
    }

    setDefaultFontSize(type: HasFontSizeAnnotationType, fontSize: number) {
        this.fontSizes.set(type, fontSize);
    }

    setDefaultLineStyleType(type: HasLineStyleAnnotationType, lineStyleType: AgAnnotationLineStyleType | undefined) {
        const defaultStyle = this.lineStyles.get(type);
        if (defaultStyle) {
            defaultStyle.type = lineStyleType;
        } else {
            this.lineStyles.set(type, { type: lineStyleType });
        }
    }

    setDefaultLineStyleWidth(type: HasLineStyleAnnotationType, strokeWidth: number) {
        const defaultStyle = this.lineStyles.get(type);
        if (defaultStyle) {
            defaultStyle.strokeWidth = strokeWidth;
        } else {
            this.lineStyles.set(type, { strokeWidth });
        }
    }

    setDefaultLineTextAlignment(type: HasLineTextAnnotationType, alignment: LineTextAlignment) {
        this.lineTextAlignments.set(type, alignment);
    }

    setDefaultLineTextPosition(type: HasLineTextAnnotationType, position: LineTextPosition | ChannelTextPosition) {
        this.lineTextPositions.set(type, position);
    }

    applyDefaults(datum: AnnotationProperties) {
        for (const [annotationType, colors] of this.colors) {
            if (datum.type !== annotationType) continue;

            for (const [colorPickerType, [colorOpacity, color, opacity] = []] of colors) {
                if (colorOpacity && color && opacity != null) {
                    setColor(datum, colorPickerType, colorOpacity, color, opacity);
                }
            }
        }

        for (const [annotationType, size] of this.fontSizes) {
            if (datum.type !== annotationType || size == null) continue;
            setFontSize(datum, size);
        }

        for (const [annotationType, style] of this.lineStyles) {
            if (datum.type !== annotationType || style == null) continue;
            setLineStyle(datum, style);
        }

        for (const [annotationType, position] of this.lineTextPositions) {
            if (datum.type !== annotationType || position == null) continue;
            datum.text.position = position;
        }

        for (const [annotationType, alignment] of this.lineTextAlignments) {
            if (datum.type !== annotationType || alignment == null) continue;
            datum.text.alignment = alignment;
        }
    }
}
