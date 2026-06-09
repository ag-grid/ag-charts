import { type NormalisedTextOrSegments, createElement, toPlainText } from 'ag-charts-core';

let element: HTMLElement | null = null;

export function sanitizeHtml(text: NormalisedTextOrSegments): string {
    const plainText = toPlainText(text);
    if (plainText === '') return '';

    element ??= createElement('div');
    element.textContent = plainText;
    return element.innerHTML.replaceAll('\n', '<br>');
}
