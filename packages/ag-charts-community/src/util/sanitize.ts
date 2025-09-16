import { createElement, toPlainText } from 'ag-charts-core';
import type { TextOrSegments } from 'ag-charts-types';

let element: HTMLElement | null = null;

export function sanitizeHtml(text: TextOrSegments): string {
    if (text === '') return '';

    element ??= createElement('div');
    element.textContent = toPlainText(text);
    return element.innerHTML.replace(/\n/g, '<br>');
}
