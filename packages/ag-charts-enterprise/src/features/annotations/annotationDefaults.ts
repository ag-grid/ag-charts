import { type AgAnnotationLineStyleType, _ModuleSupport } from 'ag-charts-community';
import { deepClone } from 'ag-charts-core';

import {
    type AnnotationLineStyle,
    type AnnotationOptionsColorPickerType,
    AnnotationType,
    type ChannelTextPosition,
    type FibonacciAnnotationToolbarOptionsType,
    type FibonacciAnnotationType,
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
    fibonacciOptions: DefaultFibonacciOptions;
}

type DefaultColors = Map<
    AnnotationType,
    Map<AnnotationOptionsColorPickerType, [string, string, number, boolean] | undefined>
>;
type DefaultFontSizes = Map<HasFontSizeAnnotationType, number | undefined>;
type DefaultLineStyles = Map<HasLineStyleAnnotationType, AnnotationLineStyle | undefined>;
type DefaultLineTextAlignments = Map<HasLineTextAnnotationType, LineTextAlignment | undefined>;
type DefaultLineTextPositions = Map<HasLineTextAnnotationType, LineTextPosition | ChannelTextPosition | undefined>;
type DefaultFibonacciOptions = Map<FibonacciAnnotationType, FibonacciAnnotationToolbarOptionsType>;

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
        [AnnotationType.DateRange, undefined],
        [AnnotationType.PriceRange, undefined],
        [AnnotationType.DatePriceRange, undefined],
    ]);

    private lineStyles: DefaultLineStyles = new Map([
        [AnnotationType.Line, undefined],
        [AnnotationType.HorizontalLine, undefined],
        [AnnotationType.VerticalLine, undefined],
        [AnnotationType.DisjointChannel, undefined],
        [AnnotationType.ParallelChannel, undefined],
        [AnnotationType.Arrow, undefined],
        [AnnotationType.DateRange, undefined],
        [AnnotationType.PriceRange, undefined],
        [AnnotationType.DatePriceRange, undefined],
    ]);

    private lineTextAlignments: DefaultLineTextAlignments = new Map([
        [AnnotationType.Line, undefined],
        [AnnotationType.HorizontalLine, undefined],
        [AnnotationType.VerticalLine, undefined],
        [AnnotationType.DisjointChannel, undefined],
        [AnnotationType.ParallelChannel, undefined],
        [AnnotationType.Arrow, undefined],
        [AnnotationType.DateRange, undefined],
        [AnnotationType.PriceRange, undefined],
        [AnnotationType.DatePriceRange, undefined],
    ]);

    private lineTextPositions: DefaultLineTextPositions = new Map([
        [AnnotationType.Line, undefined],
        [AnnotationType.HorizontalLine, undefined],
        [AnnotationType.VerticalLine, undefined],
        [AnnotationType.DisjointChannel, undefined],
        [AnnotationType.ParallelChannel, undefined],
        [AnnotationType.Arrow, undefined],
        [AnnotationType.DateRange, undefined],
        [AnnotationType.PriceRange, undefined],
        [AnnotationType.DatePriceRange, undefined],
    ]);

    private fibonacciOptions: DefaultFibonacciOptions = new Map([
        [
            AnnotationType.FibonacciRetracement,
            {
                bands: undefined,
                reverse: undefined,
                showFill: undefined,
            },
        ],
        [
            AnnotationType.FibonacciRetracementTrendBased,
            {
                bands: undefined,
                reverse: undefined,
                showFill: undefined,
            },
        ],
    ]);

    createMemento() {
        return {
            colors: deepClone(this.colors),
            fontSizes: deepClone(this.fontSizes),
            lineStyles: deepClone(this.lineStyles),
            lineTextAlignments: deepClone(this.lineTextAlignments),
            lineTextPositions: deepClone(this.lineTextPositions),
            fibonacciOptions: deepClone(this.fibonacciOptions),
        };
    }

    guardMemento(_blob: unknown): _blob is DefaultsMemento {
        return true;
    }

    restoreMemento(_version: string, _mementoVersion: string, blob: DefaultsMemento): void {
        this.colors = deepClone(blob.colors);
        this.fontSizes = deepClone(blob.fontSizes);
        this.lineStyles = deepClone(blob.lineStyles);
        this.lineTextAlignments = deepClone(blob.lineTextAlignments);
        this.lineTextPositions = deepClone(blob.lineTextPositions);
        this.fibonacciOptions = deepClone(blob.fibonacciOptions);
    }

    setDefaultColor(
        type: HasColorAnnotationType,
        colorType: AnnotationOptionsColorPickerType,
        colorOpacity: string,
        color: string,
        opacity: number,
        isMultiColor: boolean
    ) {
        this.colors.get(type)?.set(colorType, [colorOpacity, color, opacity, isMultiColor]);
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

    setDefaultFibonacciOptions<K extends keyof FibonacciAnnotationToolbarOptionsType>(
        type: FibonacciAnnotationType | HasLineStyleAnnotationType,
        key: K,
        value: FibonacciAnnotationToolbarOptionsType[K]
    ) {
        if (type != AnnotationType.FibonacciRetracement && type != AnnotationType.FibonacciRetracementTrendBased)
            return;

        const options = this.fibonacciOptions.get(type)!;
        options[key] = value;
        this.fibonacciOptions.set(type, options);
    }

    applyDefaults(datum: AnnotationProperties) {
        for (const [annotationType, colors] of this.colors) {
            if (datum.type !== annotationType) continue;

            for (const [colorPickerType, [colorOpacity, color, opacity, isMultiColor] = []] of colors) {
                if (colorOpacity && color && opacity != null && isMultiColor != null) {
                    setColor(datum, colorPickerType, colorOpacity, color, opacity, isMultiColor);
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

        for (const [annotationType, options] of this.fibonacciOptions) {
            if (datum.type !== annotationType || options == null) continue;

            for (const option of Object.keys(options)) {
                const value = (options as any)[option];
                if (value == null) {
                    continue;
                }
                datum.set({ [option]: value });
            }
        }
    }
}
