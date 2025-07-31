import { type TextAlign, _ModuleSupport } from 'ag-charts-community';
import { type FontOptions, cachedTextMeasurer, calcLineHeight, wrapText } from 'ag-charts-core';

const { BBox } = _ModuleSupport;

export type AnnotationTextPosition = 'top' | 'center' | 'bottom';
export type AnnotationTextAlignment = 'left' | 'center' | 'right';

type TextOptions = _ModuleSupport.FontOptions & { textAlign: TextAlign; position: AnnotationTextPosition };

export const ANNOTATION_TEXT_LINE_HEIGHT = 1.38;

export function maybeWrapText(options: TextOptions, text: string, maxWidth: number) {
    return maxWidth ? wrapText(text, { maxWidth, font: options, textWrap: 'always', avoidOrphans: false }) : text;
}

function measureAnnotationText(options: FontOptions, text: string) {
    const { lineBounds, width } = cachedTextMeasurer(options).measureLines(text);
    const height = lineBounds.length * calcLineHeight(options.fontSize, ANNOTATION_TEXT_LINE_HEIGHT);
    return { width, height };
}

export function getBBox(
    options: TextOptions & { width?: number },
    text: string,
    coords: _ModuleSupport.Vec2,
    bbox?: _ModuleSupport.BBox
) {
    let width = bbox?.width ?? 0;
    let height = bbox?.height ?? 0;

    if (!bbox) {
        const wrappedText = options.width != null ? maybeWrapText(options, text, options.width) : text;
        ({ width, height } = measureAnnotationText(options, wrappedText));
    }

    return new BBox(coords.x, coords.y, width, height);
}

export function updateTextNode(
    node: _ModuleSupport.Text,
    text: string,
    isPlaceholder: boolean,
    config: TextOptions & { visible?: boolean; color?: string; getPlaceholderColor: () => string | undefined },
    { x, y }: _ModuleSupport.Vec2,
    textBaseline?: CanvasTextBaseline
) {
    const { visible = true, fontFamily, fontSize = 14, fontStyle, fontWeight, textAlign } = config;
    const lineHeight = calcLineHeight(fontSize, ANNOTATION_TEXT_LINE_HEIGHT);
    textBaseline ??= config.position == 'center' ? 'middle' : config.position;

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
