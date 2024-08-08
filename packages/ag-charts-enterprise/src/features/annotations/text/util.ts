import { type TextAlign, _ModuleSupport } from 'ag-charts-community';

const { TextWrapper, CachedTextMeasurerPool } = _ModuleSupport;

export type AnnotationTextPosition = 'top' | 'center' | 'bottom';
export type AnnotationTextAlignment = 'left' | 'center' | 'right';

export type TextOptions = _ModuleSupport.FontOptions & { textAlign: TextAlign; position: AnnotationTextPosition };

export const ANNOTATION_TEXT_LINE_HEIGHT = 1.38;

export function getTextWrapOptions(options: TextOptions): Omit<_ModuleSupport.WrapOptions, 'maxWidth'> {
    return {
        font: {
            fontFamily: options.fontFamily,
            fontSize: options.fontSize,
            fontStyle: options.fontStyle,
            fontWeight: options.fontWeight,
        },
        textAlign: options.textAlign,
        textBaseline: (options.position == 'center' ? 'middle' : options.position) as CanvasTextBaseline,
        lineHeight: ANNOTATION_TEXT_LINE_HEIGHT,
        avoidOrphans: false,
        textWrap: 'always',
    };
}

export function wrapText(options: TextOptions, text: string, width: number) {
    return width
        ? TextWrapper.wrapText(text, {
              ...getTextWrapOptions(options),
              maxWidth: width,
          })
        : text;
}

export function measureAnnotationText(options: TextOptions, text: string) {
    const textOptions = getTextWrapOptions(options);

    const { lineMetrics, width } = CachedTextMeasurerPool.measureLines(text, textOptions);
    const height = lineMetrics.length * (options.fontSize ?? 1 * ANNOTATION_TEXT_LINE_HEIGHT);

    return {
        width,
        height,
    };
}
