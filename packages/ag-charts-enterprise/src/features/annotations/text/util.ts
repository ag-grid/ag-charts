import { type TextAlign, _ModuleSupport, _Scene } from 'ag-charts-community';

const { TextWrapper, CachedTextMeasurerPool } = _ModuleSupport;
const { BBox } = _Scene;

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
    const height = lineMetrics.length * (options.fontSize ?? 14) * ANNOTATION_TEXT_LINE_HEIGHT;

    return {
        width,
        height,
    };
}

export function getBBox(
    options: TextOptions & { width?: number },
    text: string,
    coords: _ModuleSupport.Vec2,
    bbox?: _Scene.BBox
) {
    let width = bbox?.width ?? 0;
    let height = bbox?.height ?? 0;

    if (!bbox) {
        const wrappedText = options.width != null ? wrapText(options, text, options.width) : text;
        ({ width, height } = measureAnnotationText(options, wrappedText));
    }

    return new BBox(coords.x, coords.y, width, height);
}

export function updateTextNode(
    node: _Scene.Text,
    text: string,
    isPlaceholder: boolean,
    config: TextOptions & { visible?: boolean; color?: string; getPlaceholderColor: () => string | undefined },
    { x, y }: _ModuleSupport.Vec2
) {
    const { visible = true, fontFamily, fontSize = 14, fontStyle, fontWeight, textAlign } = config;
    const lineHeight = fontSize * ANNOTATION_TEXT_LINE_HEIGHT;
    const textBaseline = config.position == 'center' ? 'middle' : config.position;
    const fill = isPlaceholder ? config.getPlaceholderColor() : config.color;

    node.setProperties({
        x,
        y,
        visible,
        text,
        fill,
        fontFamily,
        fontSize,
        fontStyle,
        fontWeight,
        textAlign,
        lineHeight,
        textBaseline,
    });
}
