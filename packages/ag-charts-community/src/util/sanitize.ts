import { createElement } from 'ag-charts-core';

let element: HTMLElement | null = null;

export function sanitizeHtml(text: string): string {
    if (text === '') {
        return '';
    }
    element ??= createElement('div');
    element.textContent = String(text);
    return element.innerHTML.replace(/\n/g, '<br>');
}
