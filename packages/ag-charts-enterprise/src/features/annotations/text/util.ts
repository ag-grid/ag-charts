import { type TextAlign, _ModuleSupport } from 'ag-charts-community';
import { type FontOptions, type Point, cachedTextMeasurer, calcLineHeight, wrapText } from 'ag-charts-core';

import type { Padding } from '../annotationTypes';

const { BBox } = _ModuleSupport;

export type AnnotationTextPosition = 'top' | 'center' | 'bottom';
export type AnnotationTextAlignment = 'left' | 'center' | 'right';

export type TextOptions = FontOptions & { textAlign: TextAlign; position: AnnotationTextPosition };

export const ANNOTATION_TEXT_LINE_HEIGHT = 1.38;

export function getAnnotationText(text: string, localeManager: _ModuleSupport.LocaleManager) {
    const isPlaceholder = text.length === 0;
    return { text: isPlaceholder ? localeManager.t('inputTextareaPlaceholder') : text, isPlaceholder };
}

export function uniformPadding(padding: number): Padding {
    return { top: padding, right: padding, bottom: padding, left: padding };
}

export function maybeWrapText(options: FontOptions, text: string, maxWidth: number) {
    return maxWidth === 0 ? text : wrapText(text, { maxWidth, font: options, textWrap: 'always', avoidOrphans: false });
}

function measureAnnotationText(options: FontOptions, text: string) {
    const { lineMetrics, width } = cachedTextMeasurer(options).measureLines(text);
    const height = lineMetrics.length * calcLineHeight(options.fontSize, ANNOTATION_TEXT_LINE_HEIGHT);
    return { width, height };
}

export function getBBox(
    options: TextOptions & { width?: number },
    text: string,
    coords: Point,
    bbox?: _ModuleSupport.BBox
) {
    let width = bbox?.width ?? 0;
    let height = bbox?.height ?? 0;

    if (!bbox) {
        const wrappedText = options.width == null ? text : maybeWrapText(options, text, options.width);
        ({ width, height } = measureAnnotationText(options, wrappedText));
    }

    return new BBox(coords.x, coords.y, width, height);
}

export function updateTextNode(
    node: _ModuleSupport.Text,
    text: string,
    isPlaceholder: boolean,
    config: TextOptions & { visible?: boolean; color?: string; placeholderColor?: string },
    { x, y }: Point,
    textBaseline?: CanvasTextBaseline
) {
    const { visible = true, fontFamily, fontSize = 14, fontStyle, fontWeight, textAlign } = config;
    const lineHeight = calcLineHeight(fontSize, ANNOTATION_TEXT_LINE_HEIGHT);
    textBaseline ??= config.position == 'center' ? 'middle' : config.position;

    const fill = isPlaceholder ? config.placeholderColor : config.color;

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
