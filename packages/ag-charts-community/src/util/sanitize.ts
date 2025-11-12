import { createElement, toPlainText } from 'ag-charts-core';
import type { TextOrSegments } from 'ag-charts-types';

let element: HTMLElement | null = null;

export function sanitizeHtml(text: TextOrSegments): string {
    const plainText = toPlainText(text);
    if (plainText === '') return '';

    element ??= createElement('div');
    element.textContent = plainText;
    return element.innerHTML.replaceAll('\n', '<br>');
}
